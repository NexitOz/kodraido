(() => {
  'use strict';
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('.portal-canvas');
  if (!hero || !canvas) return;
  const dustCanvas = document.querySelector('.portal-dust');
  const dust = dustCanvas.getContext('2d', { alpha:true });
  let cssWidth=1, cssHeight=1, paintDpr=1;
  const particles=Array.from({length:92},(_,i)=>({x:((i*0.61803398875)%1),y:((i*0.41421356237)%1),speed:.18+(i%7)*.12,size:.5+(i%5)*.25,phase:i*2.39996}));
  const card = hero.querySelector('.hero-cover');
  const header = document.querySelector('.header');
  const progress = document.querySelector('.page-progress');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const runningAnimations = new Set();
  const sceneTargets = [];
  let heroVisible = true;
  let disabled = root.classList.contains('effects-off') || reduced.matches;
  let frame = 0;
  let lastPaint = 0;
  let width = 1;
  let height = 1;
  let mobile = innerWidth <= 700;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let hovered = false;
  let lostContext = false;
  const epoch = performance.now();

  const vertex = 'attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.0,1.0);}';
  const fragment = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform vec2 u_pointer;
    uniform vec2 u_center;
    uniform float u_time;
    uniform float u_radius;
    uniform float u_quality;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0)),f.x),f.y);}
    float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<4;i++){if(i==3&&u_quality<0.5)break;s+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p+11.7;a*=0.5;}return s;}
    void main(){
      vec2 uv=gl_FragCoord.xy/u_resolution;
      float aspect=u_resolution.x/u_resolution.y;
      vec2 p=(uv-u_center)*vec2(aspect,1.0);
      p+=u_pointer*vec2(0.012,0.008);
      float t=u_time;
      float r=length(p*vec2(0.96,1.03));
      float angle=atan(p.y,p.x);
      float n=fbm(p*5.0+vec2(t*0.065,-t*0.04));
      float drift=fbm(p*2.5+vec2(-t*0.025,t*0.02));
      float radius=u_radius+(n-0.45)*0.022;
      float distanceToRing=abs(r-radius);
      float rim=exp(-distanceToRing*150.0);
      float corona=exp(-distanceToRing*25.0);
      float outer=exp(-distanceToRing*9.0);
      float thread=exp(-abs(r-radius-0.019-sin(angle*5.0+t*0.5)*0.004)*260.0);
      float sparks=pow(max(0.0,sin(angle*21.0+t*0.24+n*5.0)),12.0);
      float energy=0.65+0.25*sin(angle*3.0-t*0.6)+0.12*sin(angle*9.0+t*0.7);
      float hue=0.5+0.5*sin(angle*1.3+t*0.09);
      vec3 violet=vec3(0.42,0.20,0.80);
      vec3 gold=vec3(1.0,0.60,0.24);
      vec3 ice=vec3(0.25,0.65,0.90);
      vec3 ringColor=mix(violet,gold,smoothstep(0.25,0.85,hue));
      ringColor=mix(ringColor,ice,0.18+0.16*sin(angle+t*0.1));
      vec3 color=vec3(0.052,0.039,0.078);
      color+=ringColor*(rim*0.95+thread*0.24+corona*0.25+outer*0.15)*energy;
      color+=ringColor*sparks*corona*0.19;
      float cloud=pow(max(0.0,n*drift),1.8)*exp(-r*1.8);
      color+=mix(violet,gold,drift)*cloud*1.1;
      float beam=abs(p.y+0.16+sin(p.x*2.5+t*0.13)*0.15+(drift-0.5)*0.13);
      color+=vec3(0.23,0.14,0.42)*exp(-beam*16.0)*(0.25+drift*0.8);
      float floorLight=exp(-abs(p.y+u_radius*1.2)*28.0)*exp(-abs(p.x)*1.7);
      color+=gold*floorLight*0.14;
      vec2 starUV=(uv+vec2(t*0.0005,-t*0.003))*vec2(aspect,1.0)*55.0;
      vec2 cell=fract(starUV)-0.5;
      float dust=pow(max(0.0,1.0-length(cell)*5.8),4.0)*step(0.977,hash(floor(starUV)));
      float twinkle=0.6+0.4*sin(t*0.9+hash(floor(starUV))*30.0);
      color+=mix(vec3(0.55,0.42,0.85),vec3(1.0,0.82,0.57),hash(floor(starUV)+8.0))*dust*twinkle*0.65;
      color*=1.0-0.22*pow(length((uv-0.5)*vec2(1.0,0.75)),1.3);
      gl_FragColor=vec4(color,1.0);
    }`;

  let gl = null;
  let program = null;
  let locations = null;
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      throw new Error('Portal shader unavailable');
    }
    return s;
  }
  function setupGL() {
    try {
      gl = canvas.getContext('webgl', { alpha:false, antialias:false, depth:false, stencil:false, powerPreference:'low-power', preserveDrawingBuffer:false });
      if (!gl) { canvas.dataset.renderer='canvas2d'; return; }
      const vs = shader(gl.VERTEX_SHADER, vertex);
      const fs = shader(gl.FRAGMENT_SHADER, fragment);
      program = gl.createProgram();
      gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      gl.deleteShader(vs); gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Portal unavailable');
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      locations = {};
      ['resolution','pointer','center','time','radius','quality'].forEach(name => { locations[name]=gl.getUniformLocation(program,'u_'+name); });
      canvas.dataset.renderer='webgl';
      root.classList.add('webgl-ready');
    } catch (error) {
      canvas.dataset.renderer='canvas2d';
      canvas.dataset.fallbackReason=error.message;
      if (gl && program) gl.deleteProgram(program);
      gl = null; program = null;
      root.classList.remove('webgl-ready');
    }
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    mobile = innerWidth <= 700;
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 0.85 : 1.2);
    cssWidth=rect.width; cssHeight=rect.height; paintDpr=mobile?.85:1;
    dustCanvas.width=Math.max(1,Math.round(rect.width*paintDpr));
    dustCanvas.height=Math.max(1,Math.round(rect.height*paintDpr));
    width=Math.max(1,Math.round(rect.width*dpr)); height=Math.max(1,Math.round(rect.height*dpr));
    canvas.width=width; canvas.height=height;
    if(gl) gl.viewport(0,0,width,height);
    render((performance.now()-epoch)*0.001);
    paintParticles((performance.now()-epoch)*0.001);
  }
  function render(time) {
    if(!gl || !program || lostContext) return;
    gl.useProgram(program);
    gl.uniform2f(locations.resolution,width,height);
    gl.uniform2f(locations.pointer,currentX,currentY);
    gl.uniform2f(locations.center,mobile ? 0.5 : 0.735,mobile ? 0.34 : 0.56);
    gl.uniform1f(locations.time,time);
    gl.uniform1f(locations.radius,mobile ? 0.19 : 0.365);
    gl.uniform1f(locations.quality,mobile ? 0 : 1);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
  function paintParticles(t) {
    if(!dust)return;
    dust.setTransform(paintDpr,0,0,paintDpr,0,0);
    dust.clearRect(0,0,cssWidth,cssHeight);
    const cx=cssWidth*(mobile?.5:.735)+currentX*8;
    const cy=cssHeight*(mobile?.66:.44)-currentY*6;
    const radius=cssHeight*(mobile?.19:.365);
    if(!gl || lostContext){
      const glow=dust.createRadialGradient(cx,cy,radius*.3,cx,cy,radius*1.75);
      glow.addColorStop(0,'rgba(29,17,48,0)');
      glow.addColorStop(.3,'rgba(84,41,132,.08)');
      glow.addColorStop(.46,'rgba(135,77,218,.12)');
      glow.addColorStop(.52,'rgba(209,145,247,.22)');
      glow.addColorStop(.62,'rgba(114,57,175,.10)');
      glow.addColorStop(1,'rgba(40,17,60,0)');
      dust.fillStyle=glow;dust.fillRect(0,0,cssWidth,cssHeight);
      dust.save();dust.translate(cx,cy);dust.rotate(-.08);
      dust.globalCompositeOperation='lighter';
      for(let layer=0;layer<7;layer++){
        const a=t*(.07+layer*.008)+layer*.95;
        const r=radius*(.97+layer*.012);
        dust.beginPath();
        for(let j=0;j<=46;j++){
          const angle=a+j/46*(Math.PI*1.32);
          const rr=r+Math.sin(angle*4+t*.22+layer)*3.5;
          const x=Math.cos(angle)*rr,y=Math.sin(angle)*rr*.96;
          if(j===0)dust.moveTo(x,y);else dust.lineTo(x,y);
        }
        dust.strokeStyle=layer%3===0?'rgba(255,206,139,.38)':layer%3===1?'rgba(174,137,255,.48)':'rgba(131,200,255,.20)';
        dust.lineWidth=layer%3===0?1.7:.8;
        dust.shadowBlur=layer%3===0?18:9;
        dust.shadowColor=layer%3===0?'#eeb57a':'#b48bff';
        dust.stroke();
      }
      dust.restore();
    }
    dust.save();dust.globalCompositeOperation='lighter';
    const count=mobile?46:particles.length;
    for(let i=0;i<count;i++){
      const p=particles[i];
      const x=((p.x+t*.0018*p.speed)%1)*cssWidth;
      const y=((p.y-t*.004*p.speed)%1+1)%1*cssHeight;
      const alpha=(.25+.2*Math.sin(t*.6+p.phase))*(mobile?.55:.8);
      dust.beginPath();dust.fillStyle='rgba(246,209,158,'+alpha+')';
      dust.arc(x,y,p.size,0,Math.PI*2);dust.fill();
      if(i%7===0){dust.fillStyle='rgba(198,164,255,'+(alpha*.13)+')';dust.beginPath();dust.arc(x,y,p.size*3.5,0,Math.PI*2);dust.fill();}
    }
    for(let i=0;i<(mobile?12:22);i++){
      const a=i*2.39996+t*(.055+i*.0007);
      const rr=radius*(1.02+Math.sin(i*3.1)*.08);
      const x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.96;
      const z=.5+.5*Math.sin(a);
      dust.fillStyle='rgba(255,224,180,'+(.25+z*.55)+')';
      dust.shadowBlur=10;dust.shadowColor='#f3c58a';dust.beginPath();dust.arc(x,y,.6+z*1.5,0,Math.PI*2);dust.fill();
    }
    dust.restore();
  }
  function active() { return !disabled && heroVisible && !document.hidden; }
  function tick(now) {
    frame=0;
    if(!active()) return;
    const interval=mobile ? 33 : 16;
    if(now-lastPaint>=interval){
      lastPaint=now;
      const t=(now-epoch)*0.001;
      const aimX=hovered ? targetX : Math.sin(t*0.32)*0.23;
      const aimY=hovered ? targetY : Math.cos(t*0.28)*0.18;
      currentX+=(aimX-currentX)*0.075; currentY+=(aimY-currentY)*0.075;
      card.style.setProperty('--tilt-x',(-currentY*(mobile?3:7)).toFixed(2)+'deg');
      card.style.setProperty('--tilt-y',(currentX*(mobile?3:8)).toFixed(2)+'deg');
      card.style.setProperty('--tilt-z',(1.8+currentX*0.7).toFixed(2)+'deg');
      card.style.setProperty('--glint-x',(50+currentX*38).toFixed(1)+'%');
      card.style.setProperty('--glint-y',(42+currentY*32).toFixed(1)+'%');
      render(t);
      paintParticles(t);
    }
    frame=requestAnimationFrame(tick);
  }
  function reconcile() {
    disabled=root.classList.contains('effects-off')||reduced.matches;
    if(!active() && frame){cancelAnimationFrame(frame);frame=0;}
    if(disabled){runningAnimations.forEach(a=>a.cancel());runningAnimations.clear();}
    if(active() && !frame){lastPaint=0;frame=requestAnimationFrame(tick);}
  }
  setupGL();
  resize();
  new ResizeObserver(resize).observe(hero);
  new MutationObserver(reconcile).observe(root,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',reconcile);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lostContext=true;root.classList.remove('webgl-ready');});
  canvas.addEventListener('webglcontextrestored',()=>{lostContext=false;setupGL();resize();reconcile();});
  hero.addEventListener('pointermove',event=>{
    if(!finePointer.matches || disabled)return;
    const r=hero.getBoundingClientRect();
    targetX=Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1));
    targetY=Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1));
    hovered=true;
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{hovered=false;});
  document.addEventListener('visibilitychange',()=>{
    root.classList.toggle('fx-suspended',document.hidden);
    runningAnimations.forEach(a=>{if(document.hidden)a.pause();else a.play();});
    reconcile();
  });

  function animate(element,keyframes,options={}) {
    if(disabled || !element.animate)return;
    const a=element.animate(keyframes,{duration:1000,easing:'cubic-bezier(.22,1,.36,1)',...options});
    runningAnimations.add(a);
    a.finished.catch(()=>{}).finally(()=>runningAnimations.delete(a));
  }
  const sceneObserver = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      entry.target.classList.toggle('fx-in-view',entry.isIntersecting);
      if(entry.target===hero){heroVisible=entry.isIntersecting;reconcile();}
      if(entry.isIntersecting && entry.target.matches('.about-section,.work-feature') && !sceneTargets.includes(entry.target))sceneTargets.push(entry.target);
    });
  },{rootMargin:'80px 0px',threshold:0});
  document.querySelectorAll('.hero,.manifest-strip,.video-section,.about-section,.work-feature,.community,.support').forEach(e=>{e.classList.add('fx-watch');sceneObserver.observe(e);});
  const revealObserver = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const e=entry.target;
      animate(e,[{opacity:0,transform:'translate3d(0,36px,0)',filter:'blur(5px)'},{opacity:1,transform:'translate3d(0,0,0)',filter:'blur(0)'}],{delay:Number(e.dataset.fxDelay||0),duration:950});
      revealObserver.unobserve(e);
    });
  },{threshold:0.08,rootMargin:'0px 0px -25px 0px'});
  document.querySelectorAll('.section-top,.release-card,.work-item,.video-story,.platform,.support,.community').forEach(e=>{
    if(e.matches('.release-card,.work-item,.platform'))e.dataset.fxDelay=String([...e.parentElement.children].indexOf(e)%3*85);
    revealObserver.observe(e);
  });
  hero.querySelectorAll('.hero-copy > *').forEach((e,i)=>{
    animate(e,[{opacity:0,transform:'translate3d(0,25px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:1100,delay:120+i*110});
  });
  animate(hero.querySelector('.hero-art'),[{opacity:0,transform:'translateY(24px) scale(.94)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:1500,delay:200});

  let scrollFrame=0;
  function scrollPaint(){
    scrollFrame=0;
    const range=root.scrollHeight-innerHeight;
    progress.style.transform='scaleX('+(range>0?Math.min(1,scrollY/range):0)+')';
    header.classList.toggle('fx-scrolled',scrollY>30);
    if(!disabled){
      if(heroVisible && !mobile)hero.style.setProperty('--hero-shift',Math.min(26,scrollY*0.045).toFixed(1)+'px');
      sceneTargets.forEach(e=>{
        const r=e.getBoundingClientRect();
        if(r.bottom>0&&r.top<innerHeight)e.style.setProperty('--art-shift',Math.max(-24,Math.min(24,(innerHeight*.5-r.top-r.height*.5)*.055)).toFixed(1)+'px');
      });
    }
  }
  addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(scrollPaint);},{passive:true});
  scrollPaint();

  document.querySelectorAll('.release-card').forEach(e=>{
    const c=e.querySelector('.release-cover');
    e.addEventListener('pointermove',event=>{
      if(disabled||!finePointer.matches)return;
      const r=c.getBoundingClientRect();const x=(event.clientX-r.left)/r.width;const y=(event.clientY-r.top)/r.height;
      c.style.setProperty('--card-x',((.5-y)*7).toFixed(2)+'deg');c.style.setProperty('--card-y',((x-.5)*9).toFixed(2)+'deg');
      c.style.setProperty('--card-light-x',(x*100).toFixed(1)+'%');c.style.setProperty('--card-light-y',(y*100).toFixed(1)+'%');
    },{passive:true});
    e.addEventListener('pointerleave',()=>{c.style.setProperty('--card-x','0deg');c.style.setProperty('--card-y','0deg');});
  });
  document.querySelectorAll('.platform,.community,.support').forEach(e=>{
    e.addEventListener('pointermove',event=>{
      if(disabled||!finePointer.matches)return;
      const r=e.getBoundingClientRect();e.style.setProperty('--mx',((event.clientX-r.left)/r.width*100).toFixed(1)+'%');e.style.setProperty('--my',((event.clientY-r.top)/r.height*100).toFixed(1)+'%');
    },{passive:true});
  });
  reconcile();
})();
