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

/** Compone la pieza (foto + logo + copy) y devuelve un PNG como Blob. */
export async function componerPiezaPNG(opciones: {
  url: string
  copy?: string | null
  ratio?: string | null
  mostrarLogo?: boolean
  plantilla?: 'editorial' | 'franja' | 'anuncio'
}): Promise<Blob> {
  const { url, copy, ratio, mostrarLogo = true, plantilla = 'editorial' } = opciones
  const [W, H] = RESOLUCION[ratio ?? '1:1'] ?? RESOLUCION['1:1']

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Tu navegador no permite componer la imagen.')

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
  ratio?: string | null
  mostrarLogo?: boolean
  plantilla?: 'editorial' | 'franja' | 'anuncio'
}): Promise<string> {
  const { url, copy, ratio, mostrarLogo = true, plantilla = 'editorial' } = opciones
  const [W, H] = RESOLUCION[ratio ?? '1:1'] ?? RESOLUCION['1:1']
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
  const blob = await componerPiezaPNG({
    url: pieza.imagen_url,
    copy: marca ? copy ?? pieza.brief?.copy : null,
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
  const svg = await componerPiezaSVG({
    url: pieza.imagen_url,
    copy: marca ? copy ?? pieza.brief?.copy : null,
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
