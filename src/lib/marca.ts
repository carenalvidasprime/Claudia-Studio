import type { MarcaColor, MarcaRegla } from './types'

/**
 * Constantes de marca tomadas del brandbook de Ribera
 * (`project/uploads/Brandbook2020_Ribera_v1_7.pdf`).
 *
 * Sirven de respaldo cuando las tablas opcionales `marca_paleta` / `marca_reglas`
 * no están creadas: en ese caso la pantalla Marca Ribera se muestra en modo
 * lectura en vez de fallar.
 */
export const TERRITORIO = 'Salud Responsable'
export const TERRITORIO_DESC =
  'Ética, transformación, cuidado y compromiso: los cuatro valores que debe respetar cualquier pieza, en cualquier centro del grupo.'
export const TIPOGRAFIA = 'Mulish'

export const PALETA_POR_DEFECTO: MarcaColor[] = [
  { id: 'd1', hex: '#D71029', nombre: 'Rojo', orden: 1 },
  { id: 'd2', hex: '#1D1D1B', nombre: 'Negro', orden: 2 },
  { id: 'd3', hex: '#706F6F', nombre: 'Gris oscuro', orden: 3 },
  { id: 'd4', hex: '#DEDEDE', nombre: 'Gris claro', orden: 4 },
  { id: 'd5', hex: '#FDE8DE', nombre: 'Naranja claro', orden: 5 },
  { id: 'd6', hex: '#FAFAFA', nombre: 'Blanco', orden: 6 },
]

export const REGLAS_POR_DEFECTO: MarcaRegla[] = [
  { id: 'r1', texto: 'Nunca prometer resultados clínicos, curas o porcentajes de éxito no verificados.', orden: 1 },
  {
    id: 'r2',
    texto:
      'Fotos de pacientes solo con consentimiento firmado, representados siempre con dignidad y respeto, evitando el dramatismo y la victimización.',
    orden: 2,
  },
  {
    id: 'r3',
    texto: 'Evitar aspecto de banco de imágenes: fotos propias, fondos planos, colores suaves, sin colores estridentes.',
    orden: 3,
  },
  {
    id: 'r4',
    texto: 'Todo contenido debe respetar el territorio Salud Responsable: ética, transformación, cuidado y compromiso.',
    orden: 4,
  },
]

/** Normaliza un hex con o sin «#», de 3 o 6 dígitos. Devuelve null si no es válido. */
export function normalizarHex(input: string): string | null {
  if (!input) return null
  const h = String(input).trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(h))
    return (
      '#' +
      h
        .split('')
        .map((c) => c + c)
        .join('')
        .toUpperCase()
    )
  if (/^[0-9a-fA-F]{6}$/.test(h)) return '#' + h.toUpperCase()
  return null
}

/**
 * Presentación de cada situación: icono, color de acento y descripción.
 *
 * El contenido canónico (nombre, si requiere consentimiento) viene de la tabla
 * `situaciones`; esto solo añade la capa visual, indexada por `clave`. Una clave
 * desconocida cae en `PRESENTACION_NEUTRA`, así que añadir situaciones en
 * Supabase no rompe la pantalla.
 */
export interface PresentacionSituacion {
  color: string
  tinte: string
  icono: string
  desc: string
  /** Tiene flujo por pasos propio antes del estudio. */
  pasos: 'testimonio' | 'colaboracion' | 'hito' | null
  briefPorDefecto: string
  objetivo: 'Orgánico' | 'Promoción'
  canal: string
  ratio: '1:1' | '4:5' | '9:16' | '16:9'
}

export const PRESENTACION_NEUTRA: PresentacionSituacion = {
  color: '#706F6F',
  tinte: '#f2f2f2',
  icono: '<circle cx="16" cy="16" r="9"/><path d="M16 12V17M16 20.5V20.6" stroke-linecap="round"/>',
  desc: 'Situación de contenido definida en Supabase.',
  pasos: null,
  briefPorDefecto: '',
  objetivo: 'Orgánico',
  canal: 'Instagram',
  ratio: '4:5',
}

export const PRESENTACION_SITUACIONES: Record<string, PresentacionSituacion> = {
  testimonio: {
    color: '#D71029',
    tinte: '#FDE8DE',
    icono:
      '<path d="M8 10.5C8 8 10 6 13 6H23C26 8 26 16 23 18H15L10 22V18H8C8 16 8 12 8 10.5Z"/><path d="M13 11.5H21M13 15H18" stroke-width="1.4"/>',
    desc: 'La experiencia de una persona real, contada con su permiso y con dignidad.',
    pasos: 'testimonio',
    briefPorDefecto:
      'Historia real de paciente: momento cálido y sonriente, humanización de la asistencia. Necesita el consentimiento del paciente.',
    objetivo: 'Orgánico',
    canal: 'Instagram',
    ratio: '4:5',
  },
  colaboracion: {
    color: 'oklch(0.58 0.14 205)',
    tinte: 'oklch(0.94 0.03 205)',
    icono: '<circle cx="13" cy="16" r="6"/><circle cx="21" cy="16" r="6"/>',
    desc: 'Una alianza con una entidad del entorno: el vínculo de Ribera con su comunidad.',
    pasos: 'colaboracion',
    briefPorDefecto:
      'Colaboración o evento junto a un club, festival o entidad deportiva o local: mostrar cercanía y presencia en la comunidad, tono enérgico y cercano.',
    objetivo: 'Orgánico',
    canal: 'Instagram',
    ratio: '4:5',
  },
  hito: {
    color: 'oklch(0.55 0.14 258)',
    tinte: 'oklch(0.94 0.025 258)',
    icono: '<path d="M6 17H11L13 12L16 21L18 17H24" stroke-linejoin="round"/>',
    desc: 'Una técnica, un equipo o un logro clínico, contado por su beneficio para el paciente.',
    pasos: 'hito',
    briefPorDefecto:
      'Presentación de una nueva unidad, tecnología o equipamiento: transmitir excelencia clínica, confianza y cercanía.',
    objetivo: 'Promoción',
    canal: 'LinkedIn',
    ratio: '1:1',
  },
  efemeride: {
    color: 'oklch(0.6 0.14 28)',
    tinte: 'oklch(0.94 0.03 28)',
    icono:
      '<rect x="7" y="8" width="18" height="17" rx="2"/><path d="M7 13H25M11 6V9M21 6V9" stroke-linecap="round"/><circle cx="16" cy="19" r="1.6" fill="currentColor" stroke="none"/>',
    desc: 'Un día señalado del calendario sanitario, con un mensaje útil.',
    pasos: null,
    briefPorDefecto:
      'Efeméride / Día Mundial relacionado con la actividad del centro: un consejo de prevención claro, tono cercano y divulgativo, dato destacado y cierre con la marca Ribera.',
    objetivo: 'Orgánico',
    canal: 'Instagram',
    ratio: '1:1',
  },
  consejo: {
    color: 'oklch(0.6 0.13 150)',
    tinte: 'oklch(0.94 0.025 150)',
    icono:
      '<path d="M16 6L25 9V16C25 21 21.5 24.5 16 26C10.5 24.5 7 21 7 16V9L16 6Z" stroke-linejoin="round"/><path d="M12.5 16L15 18.5L20 13" stroke-linecap="round" stroke-linejoin="round"/>',
    desc: 'Una recomendación práctica de salud, clara y accionable.',
    pasos: null,
    briefPorDefecto:
      'Consejo práctico para una vida saludable: visual limpio, un solo mensaje, tono divulgativo y responsable.',
    objetivo: 'Orgánico',
    canal: 'Instagram',
    ratio: '4:5',
  },
  reconocimiento: {
    color: 'oklch(0.62 0.13 45)',
    tinte: 'oklch(0.94 0.03 45)',
    icono: '<circle cx="16" cy="13" r="7"/><path d="M12 19.5L10 26L16 23L22 26L20 19.5" stroke-linejoin="round"/>',
    desc: 'Un logro del centro o del equipo, contado con sobriedad.',
    pasos: null,
    briefPorDefecto:
      'Comunicar un premio, acreditación o reconocimiento del centro: tono institucional, orgullo de equipo, sobrio y elegante.',
    objetivo: 'Orgánico',
    canal: 'LinkedIn',
    ratio: '1:1',
  },
}

export function presentacionDe(clave: string): PresentacionSituacion {
  return PRESENTACION_SITUACIONES[clave] ?? PRESENTACION_NEUTRA
}

/** Criterio editorial por situación, mostrado en el estudio. */
export interface Criterio {
  titulo: string
  angulo: string
  si: string
  no: string
  cumplimiento: string
}

export const CRITERIOS: Record<string, Criterio> = {
  testimonio: {
    titulo: 'CRITERIO · TESTIMONIO DE PACIENTE',
    angulo: 'la persona es protagonista, no un recurso — dignidad, no dramatismo.',
    si: 'Titular con sus palabras · tono sereno y de gratitud · sin prometer resultados.',
    no: 'Dramatizar o buscar la lágrima · prometer curación · superlativos y emojis.',
    cumplimiento:
      'consentimiento antes de publicar (revocable) · sin imágenes clínicas ni heridas · sin datos de otros pacientes visibles.',
  },
  colaboracion: {
    titulo: 'CRITERIO · COLABORACIÓN / EVENTO CON CLUB',
    angulo:
      'no promocionamos al club; mostramos el vínculo de Ribera con su comunidad y su compromiso con el entorno.',
    si: 'El gesto real (firma, saludo, apretón de manos) y momentos espontáneos · el entorno reconocible con personas dentro · traducir la colaboración a lo que aporta a la comunidad.',
    no: 'El posado rígido a cámara · el plano cerrado solo del cartel o el logo · el discurso protocolario entero · la marca del club como protagonista.',
    cumplimiento:
      'personas identificables solo con consentimiento firmado · menores solo con permiso familiar por escrito · fondo sin datos de pacientes, historiales ni rótulos con nombres.',
  },
  hito: {
    titulo: 'CRITERIO · HITO CLÍNICO O NUEVA TECNOLOGÍA',
    angulo: 'traduce siempre lo técnico a beneficio humano — no las especificaciones, sino qué gana el paciente.',
    si: 'El profesional explicando el beneficio · el equipo en uso con el equipo médico · un rótulo que traduce el dato a beneficio · solo lo que el profesional valida.',
    no: 'La lista de especificaciones técnicas · el plano frío del aparato solo · el rótulo con el dato técnico sin traducir · afirmar mejoras por tu cuenta.',
    cumplimiento:
      'ninguna pantalla con datos clínicos visible · ningún paciente identificable sin consentimiento · solo afirmaciones validadas por el profesional.',
  },
  efemeride: {
    titulo: 'CRITERIO · EFEMÉRIDE DE SALUD',
    angulo:
      'aprovechar una fecha señalada del calendario sanitario para aportar algo útil, no solo para estar presente.',
    si: 'Un mensaje concreto y accionable ligado a la efeméride · dato o consejo con respaldo · tono divulgativo y sobrio.',
    no: 'Felicitar por felicitar sin aportar nada · el mensaje genérico indistinguible de cualquier marca · superlativos.',
    cumplimiento: 'datos de salud con respaldo · sin promesas ni recomendaciones que sustituyan consulta médica.',
  },
  consejo: {
    titulo: 'CRITERIO · CONSEJO DE PREVENCIÓN',
    angulo: 'una recomendación práctica que la persona pueda aplicar hoy, explicada con claridad.',
    si: 'Un solo mensaje por pieza · lenguaje sencillo sin tecnicismos · consejo respaldado clínicamente.',
    no: 'Acumular varios consejos en una pieza · alarmismo · prometer resultados o prevención garantizada.',
    cumplimiento: 'sin afirmaciones clínicas sin respaldo · recordar que no sustituye la consulta con un profesional.',
  },
  reconocimiento: {
    titulo: 'CRITERIO · RECONOCIMIENTO / PREMIO',
    angulo: 'el logro del equipo o del centro contado con sobriedad, poniendo el foco en lo que aporta al paciente.',
    si: 'Reconocer a las personas del equipo · explicar qué significa el reconocimiento · tono de gratitud.',
    no: 'Autobombo y superlativos · el premio como fin en sí mismo · comparaciones con otros centros.',
    cumplimiento: 'sin superlativos no verificables · sin afirmaciones de superioridad no respaldadas.',
  },
}
