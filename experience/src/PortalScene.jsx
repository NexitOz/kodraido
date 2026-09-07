import { useEffect, useRef } from 'react'

export default function PortalScene({ enabled, intensityRef }) {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!enabled || !mountRef.current) return
    let disposed = false
    let frame = 0
    let visible = true
    const mount = mountRef.current
    const mouse = { x: 0, y: 0 }
    let cleanup = () => {}

    import('three').then(THREE => {
      if (disposed) return
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, innerWidth < 700 ? 1.25 : 1.8))
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, .1, 100)
      camera.position.set(0, 0, 8.2)
      const group = new THREE.Group()
      scene.add(group)

      const ringMat = new THREE.MeshPhysicalMaterial({ color: 0x111827, metalness: .82, roughness: .19, emissive: 0x0a3b69, emissiveIntensity: .55, clearcoat: 1 })
      const arcGeometry = new THREE.TorusGeometry(2.18, .22, 32, 150, Math.PI * 1.34)
      const arcA = new THREE.Mesh(arcGeometry, ringMat)
      arcA.rotation.z = -.45
      const arcB = new THREE.Mesh(arcGeometry, ringMat.clone())
      arcB.rotation.z = Math.PI + .34
      arcB.scale.setScalar(.94)
      group.add(arcA, arcB)

      const coreMat = new THREE.MeshPhysicalMaterial({ color: 0xcaf1ff, emissive: 0x44aaff, emissiveIntensity: 3.1, transmission: .45, transparent: true, opacity: .92, roughness: 0 })
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 5), coreMat)
      group.add(core)

      const trailMatA = new THREE.MeshBasicMaterial({ color: 0x79caff, transparent: true, opacity: .65 })
      const trailMatB = new THREE.MeshBasicMaterial({ color: 0xff9d57, transparent: true, opacity: .58 })
      const trailA = new THREE.Mesh(new THREE.TorusGeometry(2.65, .025, 8, 200, Math.PI * 1.6), trailMatA)
      const trailB = new THREE.Mesh(new THREE.TorusGeometry(2.92, .018, 8, 200, Math.PI * 1.35), trailMatB)
      trailA.rotation.set(.75, .2, .2); trailB.rotation.set(-.6, .45, -1.2)
      group.add(trailA, trailB)

      const count = innerWidth < 700 ? 220 : 520
      const positions = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const r = 2.8 + Math.random() * 3.8
        const a = Math.random() * Math.PI * 2
        positions[i * 3] = Math.cos(a) * r
        positions[i * 3 + 1] = (Math.random() - .5) * 6
        positions[i * 3 + 2] = (Math.random() - .5) * 4
      }
      const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x7fcaff, size: .018, transparent: true, opacity: .72 }))
      scene.add(dust)
      scene.add(new THREE.AmbientLight(0x6688aa, 1.2))
      const key = new THREE.PointLight(0x44aaff, 60, 14); key.position.set(2, 2, 4); scene.add(key)
      const warm = new THREE.PointLight(0xff7e35, 24, 12); warm.position.set(-3, -2, 3); scene.add(warm)

      const onMove = e => { mouse.x = (e.clientX / innerWidth - .5); mouse.y = (e.clientY / innerHeight - .5) }
      const onResize = () => { if (!mount.clientWidth) return; camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight) }
      const observer = new IntersectionObserver(([entry]) => visible = entry.isIntersecting, { rootMargin: '120px' })
      observer.observe(mount)
      window.addEventListener('pointermove', onMove, { passive: true }); window.addEventListener('resize', onResize)

      const clock = new THREE.Clock()
      const animate = () => {
        if (disposed) return
        frame = requestAnimationFrame(animate)
        if (!visible || document.hidden) return
        const t = clock.getElapsedTime()
        group.rotation.y += (mouse.x * .25 - group.rotation.y) * .025
        group.rotation.x += (-mouse.y * .15 - group.rotation.x) * .025
        arcA.rotation.y = Math.sin(t * .28) * .12
        arcB.rotation.y = -Math.sin(t * .23) * .16
        trailA.rotation.z += .0014; trailB.rotation.z -= .0011; dust.rotation.y += .00025
        const audio = intensityRef.current || 0
        core.scale.setScalar(1 + Math.sin(t * 1.45) * .035 + audio * .18)
        coreMat.emissiveIntensity = 2.8 + audio * 5.4
        key.intensity = 52 + audio * 95
        renderer.render(scene, camera)
      }
      animate()
      cleanup = () => {
        cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('pointermove', onMove); window.removeEventListener('resize', onResize)
        scene.traverse(o => { o.geometry?.dispose(); if (Array.isArray(o.material)) o.material.forEach(m => m.dispose()); else o.material?.dispose() })
        renderer.dispose(); renderer.domElement.remove()
      }
    }).catch(() => mount.classList.add('scene-fallback'))

    return () => { disposed = true; cleanup() }
  }, [enabled, intensityRef])

  return <div className="portal-scene" ref={mountRef} aria-hidden="true"><div className="portal-fallback" /></div>
}
