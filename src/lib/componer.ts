import ribera from '../assets/logo-ribera-cropped.png'
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
}): Promise<Blob> {
  const { url, copy, ratio, mostrarLogo = true } = opciones
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

  // Medidas del logo (para reservar su hueco y pintarlo luego).
  let logo: HTMLImageElement | null = null
  let chipW = 0
  let chipH = 0
  let logoH = 0
  let logoW = 0
  let margenChip = 0
  if (mostrarLogo) {
    logo = await cargarImagen(ribera)
    logoH = Math.round(W * 0.05)
    logoW = Math.round(logoH * (logo.width / logo.height))
    margenChip = Math.round(logoH * 0.5)
    chipW = logoW + margenChip * 2
    chipH = logoH + margenChip * 2
  }

  if (hayCopy) {
    // Degradado inferior para que el texto blanco se lea sobre cualquier foto.
    const grad = ctx.createLinearGradient(0, H, 0, H * 0.36)
    grad.addColorStop(0, 'rgba(14,14,16,0.86)')
    grad.addColorStop(1, 'rgba(14,14,16,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, Math.round(H * 0.36), W, H - Math.round(H * 0.36))

    const fs = Math.round(W * 0.052)
    try {
      await (document as unknown as { fonts?: { load: (f: string) => Promise<unknown> } }).fonts?.load(`800 ${fs}px Mulish`)
    } catch {
      /* si la fuente no carga, se usa la de sistema */
    }
    ctx.font = `800 ${fs}px Mulish, system-ui, sans-serif`
    ctx.textBaseline = 'alphabetic'

    const maxAncho = W - pad * 2 - (mostrarLogo ? chipW + pad * 0.5 : 0)
    const lineas = envolver(ctx, copy!.trim(), maxAncho)
    const lh = Math.round(fs * 1.2)
    const baseY = H - pad
    const alturaBloque = (lineas.length - 1) * lh

    // Acento rojo de marca sobre el texto.
    const accentH = Math.max(3, Math.round(W * 0.008))
    ctx.fillStyle = '#D71029'
    ctx.fillRect(pad, baseY - alturaBloque - fs - Math.round(W * 0.03), Math.round(W * 0.08), accentH)

    // Copy.
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = Math.round(W * 0.018)
    ctx.shadowOffsetY = 2
    lineas.forEach((linea, i) => {
      ctx.fillText(linea, pad, baseY - (lineas.length - 1 - i) * lh)
    })
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }

  // Logo real de Ribera sobre un chip blanco, abajo a la derecha.
  if (logo) {
    const x = W - pad - chipW
    const y = H - pad - chipH
    ctx.fillStyle = '#ffffff'
    rectRedondeado(ctx, x, y, chipW, chipH, Math.round(chipH * 0.28))
    ctx.fill()
    ctx.drawImage(logo, x + margenChip, y + margenChip, logoW, logoH)
  }

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar el PNG.'))), 'image/png'),
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
  const ratio = pieza.brief?.ratio ?? '1:1'
  const blob = await componerPiezaPNG({ url: pieza.imagen_url, copy: copy ?? pieza.brief?.copy, ratio })
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(blob)
  enlace.download = `${slug(pieza.titulo)}.png`
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000)
}
