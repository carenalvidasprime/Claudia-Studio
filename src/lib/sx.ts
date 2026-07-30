import type { CSSProperties } from 'react'

/**
 * Convierte una cadena CSS ("color:red;font-size:12px") en el objeto de estilos
 * que espera React.
 *
 * El prototipo de Claude Design lleva todos los estilos en línea como texto. Al
 * portarlos tal cual —en vez de reescribirlos a objetos a mano— se conservan los
 * valores exactos de la maqueta y se elimina el riesgo de erratas al transcribir.
 */
const cache = new Map<string, CSSProperties>()

const toCamel = (prop: string): string =>
  prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

export function sx(...parts: (string | false | null | undefined)[]): CSSProperties {
  const css = parts.filter(Boolean).join(';')
  const hit = cache.get(css)
  if (hit) return hit

  const out: Record<string, string> = {}
  let depth = 0
  let buf = ''
  const decls: string[] = []
  // Corte manual por ';' respetando paréntesis: gradientes y color-mix() los contienen.
  for (const ch of css) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ';' && depth === 0) {
      decls.push(buf)
      buf = ''
    } else buf += ch
  }
  decls.push(buf)

  for (const decl of decls) {
    const i = decl.indexOf(':')
    if (i < 1) continue
    const prop = decl.slice(0, i).trim()
    const value = decl.slice(i + 1).trim()
    if (!prop || !value) continue
    out[toCamel(prop)] = value
  }

  const style = out as CSSProperties
  cache.set(css, style)
  return style
}
