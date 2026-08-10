import { useEffect, useRef } from 'react'

/**
 * Esfera de IA animada (estilo asistente de voz): un orbe luminoso que respira
 * y cuyas luces internas se mueven suavemente. Toma el color de la marca de las
 * variables CSS del tema, así es azul en la marca blanca y rojo en Ribera.
 * Se dibuja en Canvas para un movimiento fluido; respeta prefers-reduced-motion.
 */
export function OrbIA({ size = 240 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cs = getComputedStyle(document.documentElement)
    const rgb = (v: string, fb: [number, number, number]): [number, number, number] => {
      const h = v.trim().replace('#', '')
      if (h.length !== 6) return fb
      const n = parseInt(h, 16)
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }
    const acento = rgb(cs.getPropertyValue('--acento'), [31, 111, 214])
    const acento2 = rgb(cs.getPropertyValue('--acento-2'), [106, 166, 236])
    const mezcla = (a: number[], b: number[], t: number): [number, number, number] => [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ]
    const claro = mezcla(acento2, [255, 255, 255], 0.55)

    const cx = size / 2
    const cy = size / 2
    const R = size * 0.32
    const css = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

    // Luces internas que orbitan dentro de la esfera (efecto plasma).
    const lobes = [
      { color: claro, fx: 0.5, fy: 0.7, fase: 0, r: 0.62, amp: 0.34 },
      { color: acento2, fx: 0.7, fy: 0.45, fase: 2.1, r: 0.74, amp: 0.4 },
      { color: [255, 255, 255], fx: 0.35, fy: 0.6, fase: 4.2, r: 0.42, amp: 0.28 },
    ]

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0

    const dibujar = (ms: number) => {
      const t = ms / 1000
      const respira = 1 + Math.sin(t * 1.1) * 0.03
      const r = R * respira
      ctx.clearRect(0, 0, size, size)

      // Halo exterior (brillo suave alrededor de la esfera). Se mantiene dentro
      // del canvas para no dejar un borde cuadrado.
      const halo = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.5)
      halo.addColorStop(0, css(acento, 0.2))
      halo.addColorStop(1, css(acento, 0))
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, size, size)

      // Cuerpo de la esfera (recortamos todo lo interior al círculo).
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()

      const base = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.1, cx, cy, r)
      base.addColorStop(0, css(mezcla(acento2, [255, 255, 255], 0.3), 1))
      base.addColorStop(1, css(mezcla(acento, [0, 0, 0], 0.12), 1))
      ctx.fillStyle = base
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2)

      // Luces internas en movimiento, en modo aditivo para el brillo.
      ctx.globalCompositeOperation = 'lighter'
      for (const l of lobes) {
        const ang = reduce ? l.fase : t
        const lx = cx + Math.cos(ang * l.fx + l.fase) * r * l.amp
        const ly = cy + Math.sin(ang * l.fy + l.fase) * r * l.amp
        const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * l.r)
        g.addColorStop(0, css(l.color, 0.55))
        g.addColorStop(1, css(l.color, 0))
        ctx.fillStyle = g
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
      }
      ctx.globalCompositeOperation = 'source-over'

      // Brillo especular (toque de esfera de cristal).
      const gloss = ctx.createRadialGradient(cx - r * 0.32, cy - r * 0.4, 0, cx - r * 0.32, cy - r * 0.4, r * 0.6)
      gloss.addColorStop(0, 'rgba(255,255,255,.5)')
      gloss.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = gloss
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
      ctx.restore()

      // Aro fino en el borde.
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.lineWidth = 1
      ctx.strokeStyle = css(acento, 0.18)
      ctx.stroke()

      if (!reduce) raf = requestAnimationFrame(dibujar)
    }

    raf = requestAnimationFrame(dibujar)
    return () => cancelAnimationFrame(raf)
  }, [size])

  return <canvas ref={ref} style={{ width: size, height: size, display: 'block' }} aria-hidden="true" />
}
