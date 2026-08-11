import type { MarcaColor } from './types'

/**
 * Dirección de arte (heurística, en la app). Convierte la INTENCIÓN del usuario
 * en un prompt de imagen con criterio: fotografía, composición según el formato,
 * paleta y territorio del Brand Kit, y espacio para superponer la marca. No manda
 * la frase pelada al modelo. Cuando conectemos el cerebro con IA, esta función se
 * sustituye por el prompt que redacte la IA; el contrato de salida es el mismo.
 */
export interface DireccionOpts {
  intencion: string
  tipoPost: string
  ajuste: string
  ratio: string
  territorio: string
  tono: string
  paleta: MarcaColor[]
  reglas: string[]
}

const COMPOSICION: Record<string, string> = {
  '9:16': 'Composición vertical a sangre para Story/Reel: sujeto centrado, con aire arriba y abajo.',
  '4:5': 'Composición vertical para feed, equilibrada, con algo de aire en los bordes.',
  '1:1': 'Composición cuadrada y centrada, equilibrada.',
  '16:9': 'Composición horizontal amplia, con espacio libre a un lado.',
}

const TIPO_DIR: Record<string, string> = {
  Novedad: 'Presenta con claridad algo nuevo; el protagonista de la noticia manda.',
  Promoción: 'Energía comercial y aspiracional; el producto o servicio es el protagonista.',
  Efeméride: 'Tono celebrativo y emotivo, acorde a la fecha.',
  Consejo: 'Escena didáctica, cercana y cotidiana.',
  Testimonio: 'Una persona real, cercana y digna; mirada humana y auténtica.',
  'Detrás de cámaras': 'Momento espontáneo y natural del día a día del equipo.',
}

export function construirPromptImagen(o: DireccionOpts): string {
  const colores = o.paleta
    .slice(0, 4)
    .map((c) => `${c.nombre} (${c.hex})`)
    .join(', ')

  const partes = [
    'Fotografía editorial profesional y realista, no aspecto de banco de imágenes.',
    o.intencion ? `Objetivo del post: ${o.intencion}.` : '',
    o.tipoPost ? TIPO_DIR[o.tipoPost] ?? `${o.tipoPost}.` : '',
    COMPOSICION[o.ratio] ?? '',
    'Luz natural suave, color cuidado, buena profundidad de campo, aspecto premium.',
    colores ? `Que la escena respire la paleta de marca: ${colores}.` : '',
    o.territorio ? `Coherente con el territorio de marca «${o.territorio}».` : '',
    o.tono.trim() ? `Sensación acorde a un tono ${o.tono.trim()}.` : '',
    o.reglas.length ? `Respeta estas reglas de marca: ${o.reglas.join(' ')}` : '',
    o.ajuste.trim() ? `Ajuste pedido: ${o.ajuste.trim()}.` : '',
    'Deja las esquinas y un margen despejados (espacio negativo) para superponer el logo y un titular después.',
    'MUY IMPORTANTE: la imagen no debe contener ningún texto, palabra, letra, número, logotipo, emblema ni marca de agua.',
  ]
  return partes.filter(Boolean).join(' ')
}
