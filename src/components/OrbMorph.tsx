import { useEffect, useRef } from 'react'

/**
 * Esfera de IA que se forma NÍTIDA en un concepto (orbe, Instagram, cámara,
 * Meta, TikTok), se mantiene un momento, y luego se deshace en purpurina de
 * partículas que viajan y se recomponen en la siguiente. Combina una figura
 * vectorial limpia con una capa de partículas de luz encima. Color de marca.
 * Respeta prefers-reduced-motion (se queda en una figura nítida y quieta).
 */
const FORMAS = ['orbe', 'instagram', 'camara', 'meta', 'tiktok'] as const
const N = 520

// Fases del ciclo (ms): formar -> mantener nítido -> estallar en purpurina.
// Tiempos generosos de formar/estallar => morphing más fluido entre conceptos.
const FORM = 1050
const HOLD = 1000
const SHATTER = 900
const TOTAL = FORM + HOLD + SHATTER

export function OrbMorph({ size = 264 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const S = 220
    const cx = 110
    const cy = 110
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
    const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

    // --- Dibuja una forma (para muestrear su silueta y para la figura nítida) --
    const dibujarForma = (c: CanvasRenderingContext2D, forma: string, estilo: string | CanvasGradient) => {
      c.strokeStyle = estilo
      c.fillStyle = estilo
      c.lineJoin = 'round'
      c.lineCap = 'round'
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
      if (forma === 'camara') {
        c.lineWidth = 11
        rr(c, 54, 86, 112, 68, 14) // cuerpo
        c.stroke()
        rr(c, 92, 72, 34, 16, 5) // visor superior
        c.stroke()
        c.beginPath()
        c.arc(cx, 122, 19, 0, Math.PI * 2) // objetivo
        c.stroke()
        c.beginPath()
        c.arc(146, 100, 3.5, 0, Math.PI * 2) // flash
        c.fill()
        return
      }
      if (forma === 'meta') {
        c.lineWidth = 16
        c.stroke(new Path2D('M66 110 C66 80 94 80 110 110 C126 140 154 140 154 110 C154 80 126 80 110 110 C94 140 66 140 66 110 Z'))
        return
      }
      if (forma === 'tiktok') {
        c.lineWidth = 15
        c.stroke(new Path2D('M124 58 L124 130 A22 22 0 1 1 102 108'))
        c.stroke(new Path2D('M124 58 C124 74 136 86 154 86'))
      }
    }

    // --- Nube de puntos por forma (muestreo de píxeles) -----------------------
    const off = document.createElement('canvas')
    off.width = S
    off.height = S
    const octx = off.getContext('2d', { willReadFrequently: true })!
    const nube = (forma: string): Array<[number, number]> => {
      octx.clearRect(0, 0, S, S)
      dibujarForma(octx, forma, '#fff')
      const data = octx.getImageData(0, 0, S, S).data
      const pts: Array<[number, number]> = []
      for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) if (data[(y * S + x) * 4 + 3] > 60) pts.push([x, y])
      return pts
    }
    const rnd = (a: Array<[number, number]>) => a[(Math.random() * a.length) | 0]
    const destinos = FORMAS.map((f) => {
      const cloud = nube(f)
      return Array.from({ length: N }, () => rnd(cloud))
    })

    // Sprites de brillo pre-dibujados.
    const sprite = (col: number[]) => {
      const s = document.createElement('canvas')
      s.width = s.height = 32
      const g = s.getContext('2d')!
      const rg = g.createRadialGradient(16, 16, 0, 16, 16, 16)
      rg.addColorStop(0, rgba(col, 0.95))
      rg.addColorStop(1, rgba(col, 0))
      g.fillStyle = rg
      g.fillRect(0, 0, 32, 32)
      return s
    }
    const sprBlue = sprite(acento2)
    const sprWhite = sprite([255, 255, 255])

    // --- Partículas: destino en la figura + desvío de dispersión --------------
    type P = { tx: number; ty: number; ox: number; oy: number; s: number; sparkle: boolean; ph: number }
    const nuevoDesvio = () => {
      const ang = Math.random() * Math.PI * 2
      const dist = 26 + Math.random() * 66
      return [Math.cos(ang) * dist, Math.sin(ang) * dist]
    }
    const parts: P[] = destinos[0].map(([tx, ty]) => {
      const [ox, oy] = nuevoDesvio()
      return { tx, ty, ox, oy, s: 0.9 + Math.random() * 1.1, sparkle: Math.random() < 0.14, ph: Math.random() * 6.28 }
    })

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let idx = 0
    let ultimo = 0
    const ease = (t: number) => t * t * (3 - 2 * t) // smoothstep

    const nuevaForma = (n: number) => {
      const d = destinos[n]
      const orden = parts.map((_, i) => i).sort(() => Math.random() - 0.5)
      parts.forEach((p, i) => {
        const [tx, ty] = d[orden[i]]
        p.tx = tx
        p.ty = ty
        const [ox, oy] = nuevoDesvio()
        p.ox = ox
        p.oy = oy
      })
    }

    const dibujar = (ms: number) => {
      if (!ultimo) ultimo = ms
      let e = ms - ultimo
      if (!reduce && e >= TOTAL) {
        idx = (idx + 1) % FORMAS.length
        nuevaForma(idx)
        ultimo = ms
        e = 0
      }
      // formado: 0 = disperso (purpurina), 1 = figura nítida.
      let formado: number
      if (reduce) formado = 1
      else if (e < FORM) formado = ease(e / FORM)
      else if (e < FORM + HOLD) formado = 1
      else formado = 1 - ease((e - FORM - HOLD) / SHATTER)

      const t = ms / 1000
      ctx.clearRect(0, 0, S, S)

      // Halo suave.
      const halo = ctx.createRadialGradient(cx, cy, 20, cx, cy, 92)
      halo.addColorStop(0, rgba(acento, 0.18))
      halo.addColorStop(1, rgba(acento, 0))
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, S, S)

      // Figura nítida (aparece cuando las partículas ya casi han aterrizado).
      const nitidez = formado * formado
      if (nitidez > 0.02) {
        const grad = ctx.createRadialGradient(cx - 20, cy - 24, 8, cx, cy, 74)
        grad.addColorStop(0, rgba([Math.min(acento2[0] + 30, 255), Math.min(acento2[1] + 30, 255), 255], 1))
        grad.addColorStop(1, rgba(acento, 1))
        ctx.save()
        ctx.globalAlpha = nitidez
        dibujarForma(ctx, FORMAS[idx], grad)
        if (FORMAS[idx] === 'orbe') {
          ctx.beginPath()
          ctx.ellipse(cx - 20, cy - 26, 22, 15, 0, 0, Math.PI * 2)
          ctx.fillStyle = rgba([255, 255, 255], 0.4 * nitidez)
          ctx.fill()
        }
        ctx.restore()
      }

      // Purpurina: partículas sobre la figura, cada vez más dispersas cuanto
      // menos formada está.
      const disp = 1 - formado
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]
        const wob = reduce ? 0 : Math.sin(t * 2.4 + p.ph) * (0.4 + disp * 1.6)
        const x = p.tx + p.ox * disp
        const y = p.ty + p.oy * disp + wob
        // Más grandes y brillantes cuando son purpurina suelta; sutiles al formar.
        const d = p.s * (1.4 + disp * 2.6)
        ctx.globalAlpha = p.sparkle ? 0.9 : 0.5 + disp * 0.4
        ctx.drawImage(p.sparkle ? sprWhite : sprBlue, x - d / 2, y - d / 2, d, d)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'

      raf = requestAnimationFrame(dibujar)
    }

    let raf = requestAnimationFrame(dibujar)
    return () => cancelAnimationFrame(raf)
  }, [size])

  return <canvas ref={ref} style={{ width: size, height: size, display: 'block' }} aria-hidden="true" />
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

