import { CLIENTE } from './cliente'
import { marcaActiva } from './brand'
import type { Pieza } from './types'

/**
 * Compositor de la pieza final.
 *
 * La imagen que produce la IA es una foto limpia; la marca (logo de Ribera y
 * copy) se dibuja aquí ENCIMA sobre un canvas y se funde en un único PNG
 * descargable, listo para publicar en redes. Es lo que convierte lo que se ve
 * en pantalla en un archivo que el equipo puede sacar de Claudia.
 */

/** Resolución de salida por proporción (px), pensada para redes sociales. */
const RESOLUCION: Record<string, [number, number]> = {
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
  '9:16': [1080, 1920],
  '16:9': [1920, 1080],
}

function cargarImagen(src: string, crossOrigin?: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen de fondo.'))
    img.src = src
  })
}

/**
 * Carga el fondo evitando el «canvas contaminado»: se descarga como blob (con
 * CORS) para poder exportar el PNG. Si el servidor no permite CORS, se intenta
 * como respaldo con `crossOrigin`.
 */
async function cargarFondo(url: string): Promise<HTMLImageElement> {
  try {
    const resp = await fetch(url, { mode: 'cors' })
    if (!resp.ok) throw new Error('descarga fallida')
    const objeto = URL.createObjectURL(await resp.blob())
    const img = await cargarImagen(objeto)
    URL.revokeObjectURL(objeto)
    return img
  } catch {
    return cargarImagen(url, true)
  }
}

function envolver(ctx: CanvasRenderingContext2D, texto: string, maxAncho: number): string[] {
  const lineas: string[] = []
  let actual = ''
  for (const palabra of texto.trim().split(/\s+/)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra
    if (actual && ctx.measureText(prueba).width > maxAncho) {
      lineas.push(actual)
      actual = palabra
    } else {
      actual = prueba
    }
  }
  if (actual) lineas.push(actual)
  return lineas
}

function rectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

async function cargarFuente(spec: string) {
  try {
    await (document as unknown as { fonts?: { load: (f: string) => Promise<unknown> } }).fonts?.load(spec)
  } catch {
    /* si la fuente no carga, se usa la de sistema */
  }
}

interface OpcAnuncio {
  copy?: string | null
  subtitulo?: string | null
  cta?: string | null
  mostrarSubtitulo?: boolean
  mostrarCta?: boolean
  mostrarLogo?: boolean
  /** Variante de color de la maqueta «anuncio»: claro (defecto), oscuro o marca. */
  variante?: 'claro' | 'oscuro' | 'marca'
}

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Colores de la maqueta «anuncio» según la variante. `fadeStop` es el color
 * (hex) al que funde la foto hacia el panel; se usa IGUAL en PNG y SVG. */
function esquemaAnuncio(variante: OpcAnuncio['variante']) {
  const acento = CLIENTE.tema.acento
  const acento2 = CLIENTE.tema.acento2
  if (variante === 'oscuro')
    return { pA: '#1b1e26', pB: '#0f1218', tit: '#ffffff', sub: 'rgba(255,255,255,0.78)', fadeStop: '#0f1218', ctaSolid: '', ctaText: '#ffffff', chip: true }
  if (variante === 'marca')
    return { pA: acento, pB: acento2, tit: '#ffffff', sub: 'rgba(255,255,255,0.9)', fadeStop: acento, ctaSolid: '#ffffff', ctaText: acento, chip: true }
  return { pA: '#ffffff', pB: '#e9f0fb', tit: '#141821', sub: 'rgba(23,25,31,0.58)', fadeStop: '#e9f0fb', ctaSolid: '', ctaText: '#ffffff', chip: false }
}

/** Dibuja la plantilla ANUNCIO sobre el canvas: foto arriba + panel de marca. */
async function dibujarAnuncioPNG(ctx: CanvasRenderingContext2D, url: string, W: number, H: number, o: OpcAnuncio) {
  const acento = CLIENTE.tema.acento
  const acento2 = CLIENTE.tema.acento2
  const esq = esquemaAnuncio(o.variante)
  const fotoH = Math.round(H * 0.6)
  const pad = Math.round(W * 0.06)

  // Panel (fondo con degradado según variante).
  const gp = ctx.createLinearGradient(0, fotoH, 0, H)
  gp.addColorStop(0, esq.pA)
  gp.addColorStop(1, esq.pB)
  ctx.fillStyle = gp
  ctx.fillRect(0, fotoH, W, H - fotoH)

  // Foto a «cover» en la mitad superior.
  try {
    const fondo = await cargarFondo(url)
    const escala = Math.max(W / fondo.width, fotoH / fondo.height)
    const dw = fondo.width * escala
    const dh = fondo.height * escala
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, W, fotoH)
    ctx.clip()
    ctx.drawImage(fondo, (W - dw) / 2, (fotoH - dh) / 2, dw, dh)
    ctx.restore()
  } catch {
    /* sin foto: el panel queda igualmente */
  }
  // Fundido de la foto al color del panel (mismo color que el SVG).
  const [fr, fg, fb] = hexRgb(esq.fadeStop)
  const fade = ctx.createLinearGradient(0, fotoH * 0.82, 0, fotoH)
  fade.addColorStop(0, `rgba(${fr},${fg},${fb},0)`)
  fade.addColorStop(1, `rgba(${fr},${fg},${fb},0.95)`)
  ctx.fillStyle = fade
  ctx.fillRect(0, Math.round(fotoH * 0.82), W, Math.round(fotoH * 0.18))

  // Barra de acento entre foto y panel.
  const barH = Math.max(4, Math.round(W * 0.006))
  const gb = ctx.createLinearGradient(0, 0, W, 0)
  gb.addColorStop(0, acento)
  gb.addColorStop(1, acento2)
  ctx.fillStyle = gb
  ctx.fillRect(0, fotoH - Math.round(barH / 2), W, barH)

  ctx.textBaseline = 'alphabetic'
  let y = fotoH + Math.round((H - fotoH) * 0.17)

  // Titular.
  const fsT = Math.round(W * 0.056)
  const lhT = Math.round(fsT * 1.08)
  await cargarFuente(`800 ${fsT}px Mulish`)
  ctx.font = `800 ${fsT}px Poppins, Mulish, system-ui, sans-serif`
  ctx.fillStyle = esq.tit
  const lineasT = envolver(ctx, (o.copy || 'Titular del anuncio').trim(), W - pad * 2).slice(0, 3)
  y += fsT
  lineasT.forEach((l, i) => ctx.fillText(l, pad, y + i * lhT))
  y += (lineasT.length - 1) * lhT

  // Subtítulo.
  if (o.mostrarSubtitulo !== false && o.subtitulo && o.subtitulo.trim()) {
    const fsS = Math.round(W * 0.032)
    const lhS = Math.round(fsS * 1.4)
    await cargarFuente(`600 ${fsS}px Mulish`)
    ctx.font = `600 ${fsS}px Mulish, system-ui, sans-serif`
    ctx.fillStyle = esq.sub
    const lineasS = envolver(ctx, o.subtitulo.trim(), Math.round((W - pad * 2) * 0.94)).slice(0, 2)
    y += Math.round(fsS * 1.7)
    lineasS.forEach((l, i) => ctx.fillText(l, pad, y + i * lhS))
  }

  const bottomY = H - pad

  // Botón CTA (píldora con degradado + flecha).
  if (o.mostrarCta !== false && o.cta && o.cta.trim()) {
    const fsC = Math.round(W * 0.032)
    await cargarFuente(`700 ${fsC}px Mulish`)
    ctx.font = `700 ${fsC}px Mulish, system-ui, sans-serif`
    const txt = `${o.cta.trim()}   →`
    const tw = ctx.measureText(txt).width
    const px = Math.round(W * 0.05)
    const py = Math.round(W * 0.033)
    const pillW = tw + px * 2
    const pillH = fsC + py * 2
    const pillX = pad
    const pillY = bottomY - pillH
    if (esq.ctaSolid) {
      ctx.fillStyle = esq.ctaSolid
    } else {
      const gc = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY + pillH)
      gc.addColorStop(0, acento)
      gc.addColorStop(1, acento2)
      ctx.fillStyle = gc
    }
    rectRedondeado(ctx, pillX, pillY, pillW, pillH, pillH / 2)
    ctx.fill()
    ctx.fillStyle = esq.ctaText
    ctx.fillText(txt, pillX + px, pillY + pillH / 2 + fsC * 0.35)
  }

  // Logo abajo a la derecha (con chip blanco en variantes oscuras/marca).
  if (o.mostrarLogo !== false) {
    const logoUrl = marcaActiva().logoUrl
    if (logoUrl) {
      try {
        const logo = await cargarImagen(logoUrl, /^https?:/.test(logoUrl))
        const lh = Math.round(W * 0.042)
        const lw = Math.round(lh * (logo.width / logo.height))
        if (esq.chip) {
          const cpad = Math.round(lh * 0.42)
          const cw = lw + cpad * 2
          const ch = lh + cpad * 2
          ctx.fillStyle = '#ffffff'
          rectRedondeado(ctx, W - pad - cw, bottomY - ch, cw, ch, Math.round(ch * 0.24))
          ctx.fill()
          ctx.drawImage(logo, W - pad - cw + cpad, bottomY - ch + cpad, lw, lh)
        } else {
          ctx.globalAlpha = 0.9
          ctx.drawImage(logo, W - pad - lw, bottomY - lh, lw, lh)
          ctx.globalAlpha = 1
        }
      } catch {
        /* sin logo */
      }
    }
  }
}

/** Dibuja la plantilla SOBRE FOTO: imagen a sangre + velo + textos/CTA encima. */
async function dibujarSobreFotoPNG(ctx: CanvasRenderingContext2D, url: string, W: number, H: number, o: OpcAnuncio) {
  const acento = CLIENTE.tema.acento
  const acento2 = CLIENTE.tema.acento2
  const pad = Math.round(W * 0.06)
  ctx.fillStyle = '#14161c'
  ctx.fillRect(0, 0, W, H)
  try {
    const fondo = await cargarFondo(url)
    const escala = Math.max(W / fondo.width, H / fondo.height)
    const dw = fondo.width * escala
    const dh = fondo.height * escala
    ctx.drawImage(fondo, (W - dw) / 2, (H - dh) / 2, dw, dh)
  } catch {
    /* sin foto */
  }
  const sc = ctx.createLinearGradient(0, H, 0, Math.round(H * 0.42))
  sc.addColorStop(0, 'rgba(10,12,16,0.92)')
  sc.addColorStop(1, 'rgba(10,12,16,0)')
  ctx.fillStyle = sc
  ctx.fillRect(0, Math.round(H * 0.42), W, H - Math.round(H * 0.42))

  ctx.textBaseline = 'alphabetic'
  const maxW = W - pad * 2

  const fsT = Math.round(W * 0.056)
  const lhT = Math.round(fsT * 1.12)
  await cargarFuente(`800 ${fsT}px Mulish`)
  ctx.font = `800 ${fsT}px Poppins, Mulish, system-ui, sans-serif`
  const lineasT = envolver(ctx, (o.copy || 'Titular del anuncio').trim(), maxW).slice(0, 3)

  const fsS = Math.round(W * 0.032)
  const lhS = Math.round(fsS * 1.4)
  let lineasS: string[] = []
  if (o.mostrarSubtitulo !== false && o.subtitulo && o.subtitulo.trim()) {
    ctx.font = `600 ${fsS}px Mulish, system-ui, sans-serif`
    lineasS = envolver(ctx, o.subtitulo.trim(), Math.round(maxW * 0.94)).slice(0, 2)
  }

  const fsC = Math.round(W * 0.032)
  const pxC = Math.round(W * 0.05)
  const pyC = Math.round(W * 0.033)
  const conCta = o.mostrarCta !== false && !!o.cta && o.cta.trim().length > 0
  let ctaTxt = ''
  let pillW = 0
  let pillH = 0
  if (conCta) {
    ctaTxt = `${o.cta!.trim()}   →`
    ctx.font = `700 ${fsC}px Mulish, system-ui, sans-serif`
    pillW = ctx.measureText(ctaTxt).width + pxC * 2
    pillH = fsC + pyC * 2
  }
  let logo: HTMLImageElement | null = null
  let lw = 0
  let lh = 0
  let chipPad = 0
  let chipW = 0
  let chipH = 0
  if (o.mostrarLogo !== false) {
    const lu = marcaActiva().logoUrl
    if (lu) {
      try {
        logo = await cargarImagen(lu, /^https?:/.test(lu))
        lh = Math.round(W * 0.038)
        lw = Math.round(lh * (logo.width / logo.height))
        chipPad = Math.round(lh * 0.45)
        chipW = lw + chipPad * 2
        chipH = lh + chipPad * 2
      } catch {
        /* sin logo */
      }
    }
  }

  const rowH = Math.max(pillH, chipH)
  const ruleH = Math.max(4, Math.round(W * 0.009))
  const gRule = Math.round(W * 0.03)
  const gTitSub = lineasS.length ? Math.round(W * 0.028) : 0
  const gSubRow = rowH ? Math.round(W * 0.045) : 0
  const contentH = ruleH + gRule + lineasT.length * lhT + gTitSub + lineasS.length * lhS + gSubRow + rowH
  let y = H - pad - contentH

  // Filete de acento.
  ctx.fillStyle = acento
  ctx.fillRect(pad, y, Math.round(W * 0.075), ruleH)
  y += ruleH + gRule

  // Titular.
  ctx.font = `800 ${fsT}px Poppins, Mulish, system-ui, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = Math.round(W * 0.02)
  ctx.shadowOffsetY = 2
  lineasT.forEach((l, i) => ctx.fillText(l, pad, y + fsT + i * lhT))
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  y += lineasT.length * lhT + gTitSub

  // Subtítulo.
  if (lineasS.length) {
    ctx.font = `600 ${fsS}px Mulish, system-ui, sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    lineasS.forEach((l, i) => ctx.fillText(l, pad, y + fsS + i * lhS))
    y += lineasS.length * lhS
  }
  y += gSubRow

  // Fila CTA + logo.
  if (conCta) {
    const pillY = y + (rowH - pillH) / 2
    const gc = ctx.createLinearGradient(pad, pillY, pad + pillW, pillY + pillH)
    gc.addColorStop(0, acento)
    gc.addColorStop(1, acento2)
    ctx.fillStyle = gc
    rectRedondeado(ctx, pad, pillY, pillW, pillH, pillH / 2)
    ctx.fill()
    ctx.font = `700 ${fsC}px Mulish, system-ui, sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.fillText(ctaTxt, pad + pxC, pillY + pillH / 2 + fsC * 0.35)
  }
  if (logo) {
    const chipX = W - pad - chipW
    const chipY = y + (rowH - chipH) / 2
    ctx.fillStyle = '#ffffff'
    rectRedondeado(ctx, chipX, chipY, chipW, chipH, Math.round(chipH * 0.24))
    ctx.fill()
    ctx.drawImage(logo, chipX + chipPad, chipY + chipPad, lw, lh)
  }
}

/** Versión SVG (editable) de la plantilla ANUNCIO: capas de foto, panel y texto. */
async function anuncioSVG(url: string, W: number, H: number, o: OpcAnuncio): Promise<string> {
  const acento = CLIENTE.tema.acento
  const acento2 = CLIENTE.tema.acento2
  const esq = esquemaAnuncio(o.variante)
  const subFill = o.variante === 'oscuro' || o.variante === 'marca' ? '#ffffff' : '#17191f'
  const subOp = o.variante === 'marca' ? '0.9' : o.variante === 'oscuro' ? '0.78' : '0.58'
  const fotoH = Math.round(H * 0.6)
  const pad = Math.round(W * 0.06)
  const fondoData = await comoDataURL(url)
  const medidor = document.createElement('canvas').getContext('2d')!

  const capas: string[] = []
  capas.push(`<rect x="0" y="${fotoH}" width="${W}" height="${H - fotoH}" fill="url(#panel)"/>`)
  capas.push(`<clipPath id="cfoto"><rect x="0" y="0" width="${W}" height="${fotoH}"/></clipPath>`)
  capas.push(
    `<image x="0" y="0" width="${W}" height="${fotoH}" preserveAspectRatio="xMidYMid slice" href="${fondoData}" clip-path="url(#cfoto)"/>`,
  )
  capas.push(`<rect x="0" y="${Math.round(fotoH * 0.82)}" width="${W}" height="${Math.round(fotoH * 0.18)}" fill="url(#fade)"/>`)
  const barH = Math.max(4, Math.round(W * 0.006))
  capas.push(`<rect x="0" y="${fotoH - Math.round(barH / 2)}" width="${W}" height="${barH}" fill="url(#bar)"/>`)

  const fsT = Math.round(W * 0.056)
  const lhT = Math.round(fsT * 1.08)
  medidor.font = `800 ${fsT}px Mulish, sans-serif`
  const lineasT = envolver(medidor, (o.copy || 'Titular del anuncio').trim(), W - pad * 2).slice(0, 3)
  let y = fotoH + Math.round((H - fotoH) * 0.17) + fsT
  const tsT = lineasT
    .map((l, i) => `<tspan x="${pad}" ${i === 0 ? `y="${y}"` : `dy="${lhT}"`}>${escaparXML(l)}</tspan>`)
    .join('')
  capas.push(`<text font-family="Poppins, Mulish, sans-serif" font-weight="800" font-size="${fsT}" fill="${esq.tit}">${tsT}</text>`)
  y += (lineasT.length - 1) * lhT

  if (o.mostrarSubtitulo !== false && o.subtitulo && o.subtitulo.trim()) {
    const fsS = Math.round(W * 0.032)
    const lhS = Math.round(fsS * 1.4)
    medidor.font = `600 ${fsS}px Mulish, sans-serif`
    const lineasS = envolver(medidor, o.subtitulo.trim(), Math.round((W - pad * 2) * 0.94)).slice(0, 2)
    const ys = y + Math.round(fsS * 1.7)
    const tsS = lineasS
      .map((l, i) => `<tspan x="${pad}" ${i === 0 ? `y="${ys}"` : `dy="${lhS}"`}>${escaparXML(l)}</tspan>`)
      .join('')
    capas.push(
      `<text font-family="Mulish, sans-serif" font-weight="600" font-size="${fsS}" fill="${subFill}" fill-opacity="${subOp}">${tsS}</text>`,
    )
  }

  const bottomY = H - pad
  if (o.mostrarCta !== false && o.cta && o.cta.trim()) {
    const fsC = Math.round(W * 0.032)
    medidor.font = `700 ${fsC}px Mulish, sans-serif`
    const txt = `${o.cta.trim()}   →`
    const tw = medidor.measureText(txt).width
    const px = Math.round(W * 0.05)
    const py = Math.round(W * 0.033)
    const pillW = Math.round(tw + px * 2)
    const pillH = fsC + py * 2
    const pillX = pad
    const pillY = bottomY - pillH
    const pillFill = esq.ctaSolid ? esq.ctaSolid : 'url(#cta)'
    capas.push(`<rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="${pillFill}"/>`)
    capas.push(
      `<text x="${pillX + px}" y="${pillY + Math.round(pillH / 2 + fsC * 0.35)}" font-family="Mulish, sans-serif" font-weight="700" font-size="${fsC}" fill="${esq.ctaText}">${escaparXML(txt)}</text>`,
    )
  }

  const logoUrl = marcaActiva().logoUrl
  if (o.mostrarLogo !== false && logoUrl) {
    const img = await cargarImagen(logoUrl, /^https?:/.test(logoUrl))
    const logoData = await comoDataURL(logoUrl)
    const lh = Math.round(W * 0.042)
    const lw = Math.round(lh * (img.width / img.height))
    if (esq.chip) {
      const cpad = Math.round(lh * 0.42)
      const cw = lw + cpad * 2
      const ch = lh + cpad * 2
      capas.push(`<rect x="${W - pad - cw}" y="${bottomY - ch}" width="${cw}" height="${ch}" rx="${Math.round(ch * 0.24)}" fill="#ffffff"/>`)
      capas.push(`<image x="${W - pad - cw + cpad}" y="${bottomY - ch + cpad}" width="${lw}" height="${lh}" href="${logoData}"/>`)
    } else {
      capas.push(`<image x="${W - pad - lw}" y="${bottomY - lh}" width="${lw}" height="${lh}" href="${logoData}" opacity="0.9"/>`)
    }
  }

  const defs =
    `<defs>` +
    `<linearGradient id="panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${esq.pA}"/><stop offset="1" stop-color="${esq.pB}"/></linearGradient>` +
    `<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${esq.fadeStop}" stop-opacity="0"/><stop offset="1" stop-color="${esq.fadeStop}" stop-opacity="0.95"/></linearGradient>` +
    `<linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${acento}"/><stop offset="1" stop-color="${acento2}"/></linearGradient>` +
    `<linearGradient id="cta" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${acento}"/><stop offset="1" stop-color="${acento2}"/></linearGradient>` +
    `</defs>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${capas.join('')}</svg>`
}

/** Versión SVG (editable) de la plantilla SOBRE FOTO. */
async function sobreFotoSVG(url: string, W: number, H: number, o: OpcAnuncio): Promise<string> {
  const acento = CLIENTE.tema.acento
  const acento2 = CLIENTE.tema.acento2
  const pad = Math.round(W * 0.06)
  const maxW = W - pad * 2
  const fondoData = await comoDataURL(url)
  const med = document.createElement('canvas').getContext('2d')!

  const fsT = Math.round(W * 0.056)
  const lhT = Math.round(fsT * 1.12)
  med.font = `800 ${fsT}px Mulish, sans-serif`
  const lineasT = envolver(med, (o.copy || 'Titular del anuncio').trim(), maxW).slice(0, 3)
  const fsS = Math.round(W * 0.032)
  const lhS = Math.round(fsS * 1.4)
  let lineasS: string[] = []
  if (o.mostrarSubtitulo !== false && o.subtitulo && o.subtitulo.trim()) {
    med.font = `600 ${fsS}px Mulish, sans-serif`
    lineasS = envolver(med, o.subtitulo.trim(), Math.round(maxW * 0.94)).slice(0, 2)
  }
  const fsC = Math.round(W * 0.032)
  const pxC = Math.round(W * 0.05)
  const pyC = Math.round(W * 0.033)
  const conCta = o.mostrarCta !== false && !!o.cta && o.cta.trim().length > 0
  const ctaTxt = conCta ? `${o.cta!.trim()}   →` : ''
  let pillW = 0
  let pillH = 0
  if (conCta) {
    med.font = `700 ${fsC}px Mulish, sans-serif`
    pillW = Math.round(med.measureText(ctaTxt).width + pxC * 2)
    pillH = fsC + pyC * 2
  }
  const logoUrl = marcaActiva().logoUrl
  let lw = 0
  let lh = 0
  let chipPad = 0
  let chipW = 0
  let chipH = 0
  let logoData = ''
  if (o.mostrarLogo !== false && logoUrl) {
    const img = await cargarImagen(logoUrl, /^https?:/.test(logoUrl))
    logoData = await comoDataURL(logoUrl)
    lh = Math.round(W * 0.038)
    lw = Math.round(lh * (img.width / img.height))
    chipPad = Math.round(lh * 0.45)
    chipW = lw + chipPad * 2
    chipH = lh + chipPad * 2
  }

  const rowH = Math.max(pillH, chipH)
  const ruleH = Math.max(4, Math.round(W * 0.009))
  const gRule = Math.round(W * 0.03)
  const gTitSub = lineasS.length ? Math.round(W * 0.028) : 0
  const gSubRow = rowH ? Math.round(W * 0.045) : 0
  const contentH = ruleH + gRule + lineasT.length * lhT + gTitSub + lineasS.length * lhS + gSubRow + rowH
  let y = H - pad - contentH

  const capas: string[] = []
  capas.push(`<image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" href="${fondoData}"/>`)
  capas.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="url(#scrim)"/>`)
  capas.push(`<rect x="${pad}" y="${y}" width="${Math.round(W * 0.075)}" height="${ruleH}" fill="${acento}"/>`)
  y += ruleH + gRule
  const tsT = lineasT
    .map((l, i) => `<tspan x="${pad}" ${i === 0 ? `y="${y + fsT}"` : `dy="${lhT}"`}>${escaparXML(l)}</tspan>`)
    .join('')
  capas.push(`<text font-family="Poppins, Mulish, sans-serif" font-weight="800" font-size="${fsT}" fill="#ffffff">${tsT}</text>`)
  y += lineasT.length * lhT + gTitSub
  if (lineasS.length) {
    const tsS = lineasS
      .map((l, i) => `<tspan x="${pad}" ${i === 0 ? `y="${y + fsS}"` : `dy="${lhS}"`}>${escaparXML(l)}</tspan>`)
      .join('')
    capas.push(`<text font-family="Mulish, sans-serif" font-weight="600" font-size="${fsS}" fill="#ffffff" fill-opacity="0.85">${tsS}</text>`)
    y += lineasS.length * lhS
  }
  y += gSubRow
  if (conCta) {
    const pillY = Math.round(y + (rowH - pillH) / 2)
    capas.push(`<rect x="${pad}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="url(#cta)"/>`)
    capas.push(
      `<text x="${pad + pxC}" y="${pillY + Math.round(pillH / 2 + fsC * 0.35)}" font-family="Mulish, sans-serif" font-weight="700" font-size="${fsC}" fill="#ffffff">${escaparXML(ctaTxt)}</text>`,
    )
  }
  if (logoData) {
    const chipX = W - pad - chipW
    const chipY = Math.round(y + (rowH - chipH) / 2)
    capas.push(`<rect x="${chipX}" y="${chipY}" width="${chipW}" height="${chipH}" rx="${Math.round(chipH * 0.24)}" fill="#ffffff"/>`)
    capas.push(`<image x="${chipX + chipPad}" y="${chipY + chipPad}" width="${lw}" height="${lh}" href="${logoData}"/>`)
  }
  const defs =
    `<defs>` +
    `<linearGradient id="scrim" x1="0" y1="1" x2="0" y2="0"><stop offset="0.02" stop-color="#0a0c10" stop-opacity="0.92"/><stop offset="0.34" stop-color="#0a0c10" stop-opacity="0.55"/><stop offset="0.62" stop-color="#0a0c10" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="cta" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${acento}"/><stop offset="1" stop-color="${acento2}"/></linearGradient>` +
    `</defs>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${capas.join('')}</svg>`
}

/** Compone la pieza (foto + logo + copy) y devuelve un PNG como Blob. */
export async function componerPiezaPNG(opciones: {
  url: string
  copy?: string | null
  subtitulo?: string | null
  cta?: string | null
  mostrarSubtitulo?: boolean
  mostrarCta?: boolean
  ratio?: string | null
  mostrarLogo?: boolean
  plantilla?: 'editorial' | 'franja' | 'anuncio' | 'anuncioOscuro' | 'anuncioMarca' | 'sobrefoto'
}): Promise<Blob> {
  const { url, copy, ratio, mostrarLogo = true, plantilla = 'editorial' } = opciones
  const [W, H] = RESOLUCION[ratio ?? '1:1'] ?? RESOLUCION['1:1']

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Tu navegador no permite componer la imagen.')

  if (plantilla === 'anuncio' || plantilla === 'anuncioOscuro' || plantilla === 'anuncioMarca' || plantilla === 'sobrefoto') {
    const variante = plantilla === 'anuncioOscuro' ? 'oscuro' : plantilla === 'anuncioMarca' ? 'marca' : 'claro'
    if (plantilla === 'sobrefoto') await dibujarSobreFotoPNG(ctx, url, W, H, opciones)
    else await dibujarAnuncioPNG(ctx, url, W, H, { ...opciones, variante })
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar el PNG.'))), 'image/png'),
    )
  }

  // Fondo a «cover» (rellena el lienzo sin deformar).
  const fondo = await cargarFondo(url)
  const escala = Math.max(W / fondo.width, H / fondo.height)
  const dw = fondo.width * escala
  const dh = fondo.height * escala
  ctx.drawImage(fondo, (W - dw) / 2, (H - dh) / 2, dw, dh)

  const pad = Math.round(W * 0.055)
  const hayCopy = !!copy && copy.trim().length > 0
  const fs = Math.round(W * 0.052)
  const lh = Math.round(fs * 1.2)
  try {
    await (document as unknown as { fonts?: { load: (f: string) => Promise<unknown> } }).fonts?.load(`800 ${fs}px Mulish`)
  } catch {
    /* si la fuente no carga, se usa la de sistema */
  }
  ctx.font = `800 ${fs}px Mulish, system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'

  // Medidas del logo (para reservar su hueco y pintarlo luego).
  let logo: HTMLImageElement | null = null
  let chipW = 0
  let chipH = 0
  let logoH = 0
  let logoW = 0
  let margenChip = 0
  const logoUrl = marcaActiva().logoUrl
  if (mostrarLogo && logoUrl) {
    logo = await cargarImagen(logoUrl, /^https?:/.test(logoUrl))
    logoH = Math.round(W * 0.05)
    logoW = Math.round(logoH * (logo.width / logo.height))
    margenChip = Math.round(logoH * 0.5)
    chipW = logoW + margenChip * 2
    chipH = logoH + margenChip * 2
  }

  if (plantilla === 'franja') {
    // Banda de color corporativo con el copy (izquierda) y el logo (derecha).
    const maxAncho = W - pad * 2 - (logo ? chipW + pad : 0)
    const lineas = hayCopy ? envolver(ctx, copy!.trim(), maxAncho) : []
    const alturaTexto = lineas.length * lh
    const bandaH = Math.max(alturaTexto, chipH) + pad * 2
    const bandaY = H - bandaH
    ctx.fillStyle = CLIENTE.tema.acento
    ctx.fillRect(0, bandaY, W, bandaH)
    if (lineas.length) {
      ctx.fillStyle = '#ffffff'
      const bloqueTop = bandaY + (bandaH - alturaTexto) / 2
      lineas.forEach((linea, i) => ctx.fillText(linea, pad, bloqueTop + i * lh + fs * 0.82))
    }
    if (logo) {
      const x = W - pad - chipW
      const y = bandaY + (bandaH - chipH) / 2
      ctx.fillStyle = '#ffffff'
      rectRedondeado(ctx, x, y, chipW, chipH, Math.round(chipH * 0.28))
      ctx.fill()
      ctx.drawImage(logo, x + margenChip, y + margenChip, logoW, logoH)
    }
  } else {
    // EDITORIAL: degradado + acento + copy + logo en esquina.
    if (hayCopy) {
      const grad = ctx.createLinearGradient(0, H, 0, H * 0.36)
      grad.addColorStop(0, 'rgba(14,14,16,0.86)')
      grad.addColorStop(1, 'rgba(14,14,16,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, Math.round(H * 0.36), W, H - Math.round(H * 0.36))

      const maxAncho = W - pad * 2 - (logo ? chipW + pad * 0.5 : 0)
      const lineas = envolver(ctx, copy!.trim(), maxAncho)
      const baseY = H - pad
      const alturaBloque = (lineas.length - 1) * lh

      const accentH = Math.max(3, Math.round(W * 0.008))
      ctx.fillStyle = CLIENTE.tema.acento
      ctx.fillRect(pad, baseY - alturaBloque - fs - Math.round(W * 0.03), Math.round(W * 0.08), accentH)

      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(0,0,0,0.35)'
      ctx.shadowBlur = Math.round(W * 0.018)
      ctx.shadowOffsetY = 2
      lineas.forEach((linea, i) => ctx.fillText(linea, pad, baseY - (lineas.length - 1 - i) * lh))
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
    }
    if (logo) {
      const x = W - pad - chipW
      const y = H - pad - chipH
      ctx.fillStyle = '#ffffff'
      rectRedondeado(ctx, x, y, chipW, chipH, Math.round(chipH * 0.28))
      ctx.fill()
      ctx.drawImage(logo, x + margenChip, y + margenChip, logoW, logoH)
    }
  }

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar el PNG.'))), 'image/png'),
  )
}

async function comoDataURL(url: string): Promise<string> {
  const resp = await fetch(url, { mode: 'cors' })
  if (!resp.ok) throw new Error('No se pudo descargar la imagen de fondo.')
  const blob = await resp.blob()
  return await new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result as string)
    fr.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    fr.readAsDataURL(blob)
  })
}

function escaparXML(t: string): string {
  return t.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!)
}

/**
 * Versión EDITABLE de la pieza: un SVG con la foto, el logo y el copy como
 * capas independientes. El texto sigue siendo texto (reescribible) y todo se
 * puede mover en Figma, Illustrator o Inkscape. Complementa al PNG cerrado.
 */
export async function componerPiezaSVG(opciones: {
  url: string
  copy?: string | null
  subtitulo?: string | null
  cta?: string | null
  mostrarSubtitulo?: boolean
  mostrarCta?: boolean
  ratio?: string | null
  mostrarLogo?: boolean
  plantilla?: 'editorial' | 'franja' | 'anuncio' | 'anuncioOscuro' | 'anuncioMarca' | 'sobrefoto'
}): Promise<string> {
  const { url, copy, ratio, mostrarLogo = true, plantilla = 'editorial' } = opciones
  const [W, H] = RESOLUCION[ratio ?? '1:1'] ?? RESOLUCION['1:1']
  if (plantilla === 'anuncio' || plantilla === 'anuncioOscuro' || plantilla === 'anuncioMarca') {
    const variante = plantilla === 'anuncioOscuro' ? 'oscuro' : plantilla === 'anuncioMarca' ? 'marca' : 'claro'
    return await anuncioSVG(url, W, H, { ...opciones, variante })
  }
  if (plantilla === 'sobrefoto') return await sobreFotoSVG(url, W, H, opciones)
  const pad = Math.round(W * 0.055)
  const fondoData = await comoDataURL(url)
  const logoUrl = marcaActiva().logoUrl
  const conLogo = !!(mostrarLogo && logoUrl)
  const logoData = conLogo ? await comoDataURL(logoUrl!) : ''
  const hayCopy = !!copy && copy.trim().length > 0

  // Medir para envolver el copy con la misma tipografía y tamaño que el PNG.
  const fs = Math.round(W * 0.052)
  const lh = Math.round(fs * 1.2)
  const medidor = document.createElement('canvas').getContext('2d')!
  medidor.font = `800 ${fs}px Mulish, sans-serif`

  // Dimensiones del logo (para reservar hueco).
  let chipW = 0
  let chipH = 0
  let logoH = 0
  let logoW = 0
  let margenChip = 0
  if (conLogo) {
    const img = await cargarImagen(logoUrl!, /^https?:/.test(logoUrl!))
    logoH = Math.round(W * 0.05)
    logoW = Math.round(logoH * (img.width / img.height))
    margenChip = Math.round(logoH * 0.5)
    chipW = logoW + margenChip * 2
    chipH = logoH + margenChip * 2
  }

  const chip = (x: number, y: number) =>
    `<g><rect x="${x}" y="${y}" width="${chipW}" height="${chipH}" rx="${Math.round(chipH * 0.28)}" fill="#ffffff"/>` +
    `<image x="${x + margenChip}" y="${y + margenChip}" width="${logoW}" height="${logoH}" href="${logoData}"/></g>`

  const capas: string[] = []
  capas.push(
    `<image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" href="${fondoData}"/>`,
  )

  if (plantilla === 'franja') {
    const maxAncho = W - pad * 2 - (conLogo ? chipW + pad : 0)
    const lineas = hayCopy ? envolver(medidor, copy!.trim(), maxAncho) : []
    const alturaTexto = lineas.length * lh
    const bandaH = Math.max(alturaTexto, chipH) + pad * 2
    const bandaY = H - bandaH
    capas.push(`<rect x="0" y="${bandaY}" width="${W}" height="${bandaH}" fill="${CLIENTE.tema.acento}"/>`)
    if (lineas.length) {
      const primeraY = Math.round(bandaY + (bandaH - alturaTexto) / 2 + fs * 0.82)
      const tspans = lineas
        .map((l, i) => `<tspan x="${pad}" ${i === 0 ? `y="${primeraY}"` : `dy="${lh}"`}>${escaparXML(l)}</tspan>`)
        .join('')
      capas.push(`<text font-family="Mulish, sans-serif" font-weight="800" font-size="${fs}" fill="#ffffff">${tspans}</text>`)
    }
    if (conLogo) capas.push(chip(W - pad - chipW, Math.round(bandaY + (bandaH - chipH) / 2)))
  } else {
    if (hayCopy) {
      capas.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="url(#scrim)"/>`)
      const maxAncho = W - pad * 2 - (conLogo ? chipW + pad * 0.5 : 0)
      const lineas = envolver(medidor, copy!.trim(), maxAncho)
      const baseY = H - pad
      const primeraY = baseY - (lineas.length - 1) * lh
      const accentY = primeraY - fs - Math.round(W * 0.03)
      capas.push(
        `<rect x="${pad}" y="${accentY}" width="${Math.round(W * 0.08)}" height="${Math.max(3, Math.round(W * 0.008))}" fill="${CLIENTE.tema.acento}"/>`,
      )
      const tspans = lineas
        .map((l, i) => `<tspan x="${pad}" ${i === 0 ? `y="${primeraY}"` : `dy="${lh}"`}>${escaparXML(l)}</tspan>`)
        .join('')
      capas.push(`<text font-family="Mulish, sans-serif" font-weight="800" font-size="${fs}" fill="#ffffff">${tspans}</text>`)
    }
    if (conLogo) capas.push(chip(W - pad - chipW, H - pad - chipH))
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0.36" stop-color="#0e0e10" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="#0e0e10" stop-opacity="0.86"/></linearGradient></defs>` +
    capas.join('') +
    `</svg>`
  )
}

function slug(texto: string): string {
  return (
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'pieza'
  )
}

/** Compone la pieza y lanza la descarga del PNG en el navegador. */
export async function descargarPieza(pieza: Pieza, copy?: string | null): Promise<void> {
  if (!pieza.imagen_url) throw new Error('Esta pieza todavía no tiene imagen.')
  const marca = pieza.brief?.marca !== false
  const m = pieza.brief?.maqueta
  const blob = await componerPiezaPNG({
    url: pieza.imagen_url,
    copy: marca ? copy ?? pieza.brief?.copy : null,
    subtitulo: m?.subtitulo,
    cta: m?.cta,
    mostrarSubtitulo: m?.mostrarSubtitulo,
    mostrarCta: m?.mostrarCta,
    ratio: pieza.brief?.ratio ?? '1:1',
    plantilla: pieza.brief?.plantilla ?? 'editorial',
    mostrarLogo: marca,
  })
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(blob)
  enlace.download = `${slug(pieza.titulo)}.png`
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000)
}

/** Compone la pieza editable y lanza la descarga del SVG en el navegador. */
export async function descargarPiezaSVG(pieza: Pieza, copy?: string | null): Promise<void> {
  if (!pieza.imagen_url) throw new Error('Esta pieza todavía no tiene imagen.')
  const marca = pieza.brief?.marca !== false
  const m = pieza.brief?.maqueta
  const svg = await componerPiezaSVG({
    url: pieza.imagen_url,
    copy: marca ? copy ?? pieza.brief?.copy : null,
    subtitulo: m?.subtitulo,
    cta: m?.cta,
    mostrarSubtitulo: m?.mostrarSubtitulo,
    mostrarCta: m?.mostrarCta,
    ratio: pieza.brief?.ratio ?? '1:1',
    plantilla: pieza.brief?.plantilla ?? 'editorial',
    mostrarLogo: marca,
  })
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(blob)
  enlace.download = `${slug(pieza.titulo)}-editable.svg`
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000)
}
