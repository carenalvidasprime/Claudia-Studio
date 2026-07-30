import type { Estado } from './types'

/**
 * Helpers de estilo portados uno a uno desde la clase `Component` del prototipo,
 * conservando valores exactos (colores, radios, tamaños).
 */

export const seg = (active: boolean): string =>
  active
    ? 'display:inline-flex;align-items:center;gap:6px;background:#D71029;color:#fff;border:1px solid #17191f;border-radius:8px;padding:6px 10px;font-family:Mulish;font-weight:500;font-size:11.5px;cursor:pointer'
    : 'display:inline-flex;align-items:center;gap:6px;background:#fff;color:rgba(23,25,31,.65);border:1px solid rgba(23,25,31,.12);border-radius:8px;padding:6px 10px;font-family:Mulish;font-weight:500;font-size:11.5px;cursor:pointer'

export const pill = (active: boolean): string =>
  active
    ? 'background:#D71029;color:#fff;border:1px solid #17191f;border-radius:20px;padding:6px 13px;font-family:Mulish;font-weight:500;font-size:11.5px;cursor:pointer'
    : 'background:#fff;color:rgba(23,25,31,.6);border:1px solid rgba(23,25,31,.12);border-radius:20px;padding:6px 13px;font-family:Mulish;font-weight:500;font-size:11.5px;cursor:pointer'

export const outCard = (active: boolean): string => {
  const base =
    'display:flex;flex-direction:column;width:190px;text-align:left;border-radius:11px;padding:11px 13px;font-family:Mulish;cursor:pointer;'
  return active
    ? base + 'background:#D71029;color:#fff;border:1px solid #17191f'
    : base + 'background:#fff;color:#17191f;border:1px solid rgba(23,25,31,.12)'
}

export const navBtn = (active: boolean): string => {
  const base =
    'display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:none;border:none;padding:9px 10px;border-radius:9px;font-family:Mulish;font-weight:500;font-size:13px;cursor:pointer;'
  return active ? base + 'background:#f2f3f4;color:#17191f' : base + 'color:rgba(23,25,31,.55)'
}

export const navDot = (active: boolean): string =>
  `width:5px;height:5px;border-radius:50%;background:${active ? '#17191f' : 'rgba(23,25,31,.22)'}`

export const tabBtn = (active: boolean): string =>
  'background:none;border:none;border-bottom:2px solid ' +
  (active ? '#17191f' : 'transparent') +
  ';color:' +
  (active ? '#17191f' : 'rgba(23,25,31,.5)') +
  ';padding:10px 4px 12px;margin-right:14px;font-family:Mulish;font-weight:600;font-size:13px;cursor:pointer'

export const menuItem = (danger: boolean): string =>
  'text-align:left;background:none;border:none;padding:8px 10px;border-radius:7px;font-family:Mulish;font-size:12.5px;cursor:pointer;width:100%;color:' +
  (danger ? 'oklch(0.55 0.18 25)' : '#17191f')

/** Colores de estado. `programado` es nuevo respecto al prototipo (4 estados → 5). */
export const colorEstado = (estado: Estado): string =>
  ({
    borrador: 'rgba(23,25,31,.45)',
    en_revision: 'oklch(0.68 0.15 70)',
    aprobado: 'oklch(0.6 0.1 195)',
    programado: 'oklch(0.58 0.14 275)',
    publicado: 'oklch(0.62 0.13 155)',
  })[estado]

export const badgeEstado = (estado: Estado): string => {
  const c = colorEstado(estado)
  return `font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.03em;padding:3px 7px;border-radius:20px;color:${c};background:color-mix(in oklch,${c} 13%,white)`
}

export const objInline = (obj: string): string => {
  const c = obj === 'Promoción' ? 'oklch(0.6 0.16 25)' : 'oklch(0.5 0.09 210)'
  return `font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.03em;padding:2px 6px;border-radius:5px;color:#fff;background:${c}`
}

export const outInline = (out: string): string => {
  const c = out === 'Animación' ? 'oklch(0.55 0.15 300)' : 'oklch(0.45 0.06 230)'
  return `font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.03em;padding:2px 6px;border-radius:5px;color:#fff;background:${c}`
}

/** Trama diagonal usada en las miniaturas de centro del panel. */
export const trama = (hue: number, l = 0.9, c = 0.03): string => {
  const a = `oklch(${l} ${c} ${hue})`
  const b = `oklch(${l - 0.045} ${c + 0.01} ${hue})`
  return `background:repeating-linear-gradient(135deg,${a},${a} 10px,${b} 10px,${b} 20px)`
}

/** Tono estable por centro: el mismo centro conserva su color entre sesiones. */
const HUES = [25, 258, 155, 60, 210, 300, 190, 45, 340, 130, 280, 95]
export function hueDeCentro(id: string | number): number {
  const s = String(id)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return HUES[h % HUES.length]
}
export const colorDeCentro = (id: string | number): string => `oklch(0.6 0.14 ${hueDeCentro(id)})`

export const ratioToCss = (r?: string | null): string => (r || '4:5').replace(':', '/')

export const plural = (n: number, singular: string, plural_: string): string =>
  `${n} ${n === 1 ? singular : plural_}`
