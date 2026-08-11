import { useEffect, useRef } from 'react'

/**
 * Esfera de IA hecha de partículas de luz que se deshacen y se RECOMPONEN en
 * conceptos (orbe, Instagram, post, Meta, Google, TikTok). En cada cambio las
 * partículas se dispersan y vuelven a organizarse, como polvo de energía que
 * toma forma. Todo en el color de la marca. Respeta prefers-reduced-motion.
 */
const FORMAS = ['orbe', 'instagram', 'post', 'meta', 'google', 'tiktok'] as const
const N = 560 // número de partículas

export function OrbMorph({ size = 264 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const S = 220 // espacio lógico de dibujo
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.setTransform((size / S) * dpr, 0, 0, (size / S) * dpr, 0, 0)

    const cs = getComputedStyle(document.documentElement)
    const hexRgb = (v: string, fb: [number, number, number]): [number, number, number] => {
      const h = v.trim().replace('#', '')
      if (h.length !== 6) return fb
      const n = parseInt(h, 16)
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }
    const acento = hexRgb(cs.getPropertyValue('--acento'), [31, 111, 214])
    const acento2 = hexRgb(cs.getPropertyValue('--acento-2'), [106, 166, 236])

    // --- Muestrea la silueta de cada forma en una nube de puntos --------------
    const off = document.createElement('canvas')
    off.width = S
    off.height = S
    const octx = off.getContext('2d', { willReadFrequently: true })!

    const dibujarForma = (c: CanvasRenderingContext2D, forma: string) => {
      c.clearRect(0, 0, S, S)
      c.strokeStyle = '#fff'
      c.fillStyle = '#fff'
      c.lineJoin = 'round'
      c.lineCap = 'round'
      const cx = 110
      const cy = 110
      if (forma === 'orbe') {
        c.beginPath()
        c.arc(cx, cy, 62, 0, Math.PI * 2)
        c.fill()
        return
      }
      if (forma === 'instagram') {
        c.lineWidth = 13
        rr(c, 58, 58, 104, 104, 30)
        c.stroke()
        c.beginPath()
        c.arc(cx, cy, 25, 0, Math.PI * 2)
        c.stroke()
        c.beginPath()
        c.arc(141, 79, 6, 0, Math.PI * 2)
        c.fill()
        return
      }
      if (forma === 'post') {
        c.lineWidth = 10
        rr(c, 58, 52, 104, 116, 15)
        c.stroke()
        c.beginPath()
        c.arc(78, 74, 8, 0, Math.PI * 2)
        c.stroke()
        rr(c, 66, 92, 88, 46, 8)
        c.stroke()
        linea(c, 66, 150, 132, 150)
        linea(c, 66, 162, 108, 162)
        return
      }
      if (forma === 'meta') {
        c.lineWidth = 16
        c.stroke(new Path2D('M66 110 C66 80 94 80 110 110 C126 140 154 140 154 110 C154 80 126 80 110 110 C94 140 66 140 66 110 Z'))
        return
      }
      if (forma === 'google') {
        c.lineWidth = 16
        c.stroke(new Path2D('M152 82 A50 50 0 1 0 160 118 L114 118'))
        return
      }
      if (forma === 'tiktok') {
        c.lineWidth = 15
        c.stroke(new Path2D('M124 58 L124 130 A22 22 0 1 1 102 108'))
        c.stroke(new Path2D('M124 58 C124 74 136 86 154 86'))
        return
      }
    }

    const nube = (forma: string): Array<[number, number]> => {
      dibujarForma(octx, forma)
      const data = octx.getImageData(0, 0, S, S).data
      const pts: Array<[number, number]> = []
      for (let y = 0; y < S; y += 2) {
        for (let x = 0; x < S; x += 2) {
          if (data[(y * S + x) * 4 + 3] > 60) pts.push([x, y])
        }
      }
      return pts
    }

    const rand = (a: Array<[number, number]>) => a[(Math.random() * a.length) | 0]
    // Para cada forma, exactamente N destinos (muestreo aleatorio de su nube).
    const destinos = FORMAS.map((f) => {
      const cloud = nube(f)
      return Array.from({ length: N }, () => rand(cloud))
    })

    // --- Partículas -----------------------------------------------------------
    type P = { x: number; y: number; vx: number; vy: number; tx: number; ty: number; s: number; sparkle: boolean }
    const parts: P[] = destinos[0].map(([tx, ty]) => ({
      x: 110 + (Math.random() - 0.5) * 40,
      y: 110 + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
      tx,
      ty,
      s: 0.9 + Math.random() * 1.1,
      sparkle: Math.random() < 0.12,
    }))

    // Sprite de brillo pre-dibujado (una vez), para no recalcular el degradado
    // de cada partícula en cada fotograma.
    const sprite = (col: [number, number, number]) => {
      const s = document.createElement('canvas')
      s.width = s.height = 32
      const g = s.getContext('2d')!
      const rg = g.createRadialGradient(16, 16, 0, 16, 16, 16)
      rg.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},.9)`)
      rg.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`)
      g.fillStyle = rg
      g.fillRect(0, 0, 32, 32)
      return s
    }
    const sprBlue = sprite(acento2)
    const sprWhite = sprite([255, 255, 255])

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let idx = 0
    let ultimo = 0 // ms del último cambio
    const INTERVALO = 2600

    const aplicarDestino = (nuevo: number) => {
      const d = destinos[nuevo]
      // Reasignación barajada -> las partículas «vuelan» cruzándose (más magia).
      const orden = parts.map((_, i) => i).sort(() => Math.random() - 0.5)
      parts.forEach((p, i) => {
        const [tx, ty] = d[orden[i]]
        p.tx = tx
        p.ty = ty
        // Estallido: pequeño impulso radial al recomponerse.
        const ang = Math.random() * Math.PI * 2
        const imp = 1.5 + Math.random() * 3.2
        p.vx += Math.cos(ang) * imp
        p.vy += Math.sin(ang) * imp
      })
    }

    const dibujar = (ms: number) => {
      if (!ultimo) ultimo = ms
      if (!reduce && ms - ultimo > INTERVALO) {
        idx = (idx + 1) % FORMAS.length
        aplicarDestino(idx)
        ultimo = ms
      }
      const t = ms / 1000

      ctx.clearRect(0, 0, S, S)

      // Halo suave detrás.
      const halo = ctx.createRadialGradient(110, 110, 20, 110, 110, 92)
      halo.addColorStop(0, `rgba(${acento[0]},${acento[1]},${acento[2]},.20)`)
      halo.addColorStop(1, `rgba(${acento[0]},${acento[1]},${acento[2]},0)`)
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, S, S)

      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]
        // Muelle hacia el destino + rozamiento (settle elástico).
        p.vx += (p.tx - p.x) * 0.026
        p.vy += (p.ty - p.y) * 0.026
        p.vx *= 0.9
        p.vy *= 0.9
        p.x += p.vx
        p.y += p.vy
        // Cintilación: leve vaivén constante.
        const wob = reduce ? 0 : Math.sin(t * 2 + i) * 0.3
        const d = (p.s + (p.sparkle ? 0.4 : 0)) * 4.8
        ctx.drawImage(p.sparkle ? sprWhite : sprBlue, p.x - d / 2, p.y + wob - d / 2, d, d)
      }
      ctx.globalCompositeOperation = 'source-over'

      raf = requestAnimationFrame(dibujar)
    }

    let raf = requestAnimationFrame(dibujar)
    return () => cancelAnimationFrame(raf)
  }, [size])

  return <canvas ref={ref} style={{ width: size, height: size, display: 'block' }} aria-hidden="true" />
}

// Rectángulo redondeado (compatibilidad amplia, sin depender de ctx.roundRect).
function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

function linea(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  c.beginPath()
  c.moveTo(x1, y1)
  c.lineTo(x2, y2)
  c.stroke()
}
