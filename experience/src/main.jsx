import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import PortalScene from './PortalScene'
import { content } from './content'
import './styles.css'

const Arrow = () => <span aria-hidden="true">↗</span>

function MusicDialog({ open, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    if (open && ref.current && !ref.current.open) ref.current.showModal()
    if (!open && ref.current?.open) ref.current.close()
  }, [open])
  return <dialog ref={ref} className="dialog" onClose={onClose}>
    <button className="dialog-close" onClick={onClose} aria-label="Закрыть">×</button>
    <p className="kicker">ВЫБЕРИ ПЛОЩАДКУ</p>
    <h2>Где слушаем?</h2>
    <div className="platform-list">{content.platforms.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer"><span>{label}</span><Arrow /></a>)}</div>
  </dialog>
}

function VideoDialog({ open, onClose, intensityRef }) {
  const dialog = useRef(null); const video = useRef(null); const audio = useRef(null)
  useEffect(() => {
    if (open && dialog.current && !dialog.current.open) dialog.current.showModal()
    if (!open && dialog.current?.open) dialog.current.close()
  }, [open])
  const close = () => { video.current?.pause(); intensityRef.current = 0; onClose() }
  const connectAudio = async () => {
    if (!audio.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx(); const source = ctx.createMediaElementSource(video.current); const analyser = ctx.createAnalyser()
      analyser.fftSize = 64; source.connect(analyser); analyser.connect(ctx.destination)
      const data = new Uint8Array(analyser.frequencyBinCount); audio.current = { ctx, analyser, data }
      const measure = () => { if (!video.current || video.current.paused) { intensityRef.current = 0; return } analyser.getByteFrequencyData(data); intensityRef.current = data.reduce((a,b)=>a+b,0)/data.length/255; requestAnimationFrame(measure) }; measure()
    }
    if (audio.current.ctx.state === 'suspended') await audio.current.ctx.resume()
  }
  return <dialog ref={dialog} className="dialog video-dialog" onClose={close}>
    <button className="dialog-close" onClick={close} aria-label="Закрыть видео">×</button>
    <video ref={video} src={content.video.src} poster={content.video.poster} controls playsInline onPlay={connectAudio} onError={e=>e.currentTarget.closest('dialog')?.classList.add('media-error')} />
    <div className="media-error-message">Видео временно недоступно. Попробуй открыть его позже.</div>
    <div className="video-meta"><span>ВИДЕОШОТ · 01</span><h2>{content.video.title}</h2></div>
  </dialog>
}

function App() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [effects, setEffects] = useState(!reduced)
  const [musicOpen, setMusicOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [active, setActive] = useState(0)
  const intensityRef = useRef(0)
  const release = content.releases[active]

  return <div className={effects ? 'app effects-on' : 'app effects-off'} style={{'--accent': release.color}}>
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="Код Райдо — начало">КР<span>·</span></a>
      <nav aria-label="Основная навигация"><a href="#music">Музыка</a><a href="#media">Медиа</a><a href="#about">О нас</a><a href="#community">Сообщество</a></nav>
      <button className="effects-toggle" onClick={()=>setEffects(v=>!v)} aria-pressed={effects}><span className="toggle-dot" />Эффекты</button>
    </header>

    <main>
      <section className="hero" id="top">
        <PortalScene enabled={effects} intensityRef={intensityRef} />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="kicker">МУЗЫКАЛЬНЫЙ ДУЭТ · 2026</p>
          <h1><span>КОД</span><span className="outline">РАЙДО</span></h1>
          <div className="hero-bottom"><p>{content.intro}</p><div className="hero-actions"><button className="btn primary" onClick={()=>setMusicOpen(true)}>Слушать <Arrow /></button><a className="btn ghost" href="#media">Смотреть ↓</a></div></div>
        </div>
        <div className="side-note"><span>ДВА ГОЛОСА</span><i /><span>ОДИН ПУТЬ</span></div>
        <a className="scroll-cue" href="#music"><span>SCROLL</span><i /></a>
      </section>

      <section className="featured section" id="music">
        <div className="section-index">01 — ГЛАВНЫЙ РЕЛИЗ</div>
        <div className="featured-art"><div className="cover-halo" /><img src={content.featured.image} alt={`Обложка «${content.featured.title}»`} /></div>
        <div className="featured-copy"><p className="kicker">{content.featured.eyebrow}</p><h2>{content.featured.title}</h2><p>{content.featured.copy}</p><a className="text-link" href={content.featured.href} target="_blank" rel="noreferrer">Открыть релиз <Arrow /></a></div>
      </section>

      <section className="catalog section">
        <div className="section-head"><div><p className="section-index">02 — КАТАЛОГ</p><h2>РАЗНЫЕ МИРЫ.<br/><em>ОДИН ГОЛОС.</em></h2></div><p>Выбери историю — свет пространства изменится вместе с ней.</p></div>
        <div className="release-grid">{content.releases.map((item, i) => <article className={i===active?'release-card active':'release-card'} key={item.title}>
          <button onClick={()=>setActive(i)} aria-label={`Выбрать релиз «${item.title}»`}><span className="card-index">{item.index}</span><img src={item.image} alt="" loading="lazy"/><span className="card-title">{item.title}</span></button>
          <a href={item.href} target="_blank" rel="noreferrer" aria-label={`Открыть релиз «${item.title}»`}><Arrow /></a>
        </article>)}</div>
      </section>

      <section className="duet section" id="about">
        <div className="duet-visual"><div className="voice voice-a"><span>01</span></div><div className="voice voice-b"><span>02</span></div><div className="orbit" /></div>
        <div className="duet-copy"><p className="section-index">03 — ДУЭТ</p><h2>ДВА ГОЛОСА.<br/><em>ОДНА ТРАЕКТОРИЯ.</em></h2><p>Брат и сестра. Два характера, соединённые музыкой. Мы превращаем истории из аниме и игр в песни — и проживаем каждую вместе с вами.</p><blockquote>«Нас ведёт не жанр.<br/>Нас ведёт история.»</blockquote></div>
      </section>

      <section className="media section" id="media">
        <div className="media-poster" onClick={()=>setVideoOpen(true)} role="button" tabIndex="0" onKeyDown={e=>(e.key==='Enter'||e.key===' ')&&setVideoOpen(true)} aria-label={`Смотреть видеошот «${content.video.title}»`}>
          <img src={content.video.poster} alt="" loading="lazy"/><div className="media-shade"/><span className="play" aria-hidden="true">▶</span><span className="media-number">04 / MEDIA</span><div><p>ВИДЕОШОТ</p><h2>{content.video.title}</h2></div>
        </div>
      </section>

      <section className="community section" id="community">
        <div className="community-glow"/><p className="section-index">05 — СООБЩЕСТВО</p><h2>ПРОДОЛЖИМ<br/><span>ЭТОТ ПУТЬ</span><br/>ВМЕСТЕ.</h2><div className="socials">{content.socials.map(([label,href])=><a key={label} href={href} target="_blank" rel="noreferrer">{label}<Arrow/></a>)}</div>
      </section>
    </main>
    <footer><a className="wordmark" href="#top">КР<span>·</span></a><span>© 2026 КОД РАЙДО</span><span>{content.statement}</span></footer>
    <MusicDialog open={musicOpen} onClose={()=>setMusicOpen(false)} />
    <VideoDialog open={videoOpen} onClose={()=>setVideoOpen(false)} intensityRef={intensityRef} />
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
