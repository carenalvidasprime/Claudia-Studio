import type { Brief, Centro, Hub, Id, Linea, Situacion } from './types'

const URL_GENERAR = import.meta.env.VITE_N8N_GENERAR_URL as string | undefined
const URL_CHAT = import.meta.env.VITE_N8N_CHAT_URL as string | undefined
const URL_COPY = import.meta.env.VITE_N8N_COPY_URL as string | undefined
const URL_DIRECTOR = import.meta.env.VITE_N8N_DIRECTOR_URL as string | undefined

export const generarConfigurado = Boolean(URL_GENERAR)
export const chatConfigurado = Boolean(URL_CHAT)

/**
 * Cuerpo que la app envía a n8n para producir una pieza.
 *
 * n8n genera la imagen, la sube al bucket `piezas` y escribe la fila en la tabla
 * `piezas` con la service_role key —que nunca sale del workflow—. La app no
 * inserta la fila: tras la respuesta recarga desde Supabase, que es la fuente de
 * verdad. Si `pieza_id` viene informado, n8n actualiza esa fila en vez de crear
 * una nueva (regenerar una pieza existente).
 *
 * El contrato completo está en `n8n/claudia-generar.md`.
 */
export interface PayloadGenerar {
  pieza_id: string | null
  pieza: {
    titulo: string
    centro_id: Id
    carpeta_id: Id | null
    situacion_id: Id | null
    linea_id: Id | null
    estado: string
    fecha_publicacion: string | null
    canal: string | null
    consentimiento_ok: boolean
    notas_compliance: string | null
    prompt: string
    brief: Brief
  }
  contexto: {
    centro: Pick<Centro, 'id' | 'nombre' | 'ciudad' | 'tipo'> & { hub: Hub | null }
    linea: Linea | null
    situacion: Situacion | null
    marca: {
      territorio: string
      tono?: string
      tipografia: string
      paleta: { hex: string; nombre: string }[]
      reglas: string[]
    }
  }
}

export interface RespuestaGenerar {
  ok: boolean
  pieza_id?: string
  imagen_url?: string
  error?: string
}

const TIEMPO_MAXIMO_MS = 120_000

async function postJson(url: string, body: unknown, timeoutMs: number): Promise<unknown> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    const texto = await res.text()
    if (!res.ok) {
      throw new Error(`n8n respondió ${res.status}. ${texto.slice(0, 200)}`)
    }
    if (!texto) return {}
    try {
      return JSON.parse(texto)
    } catch {
      // Un workflow sin nodo «Respond to Webhook» puede devolver texto plano.
      return { ok: true, raw: texto }
    }
  } catch (err) {
    const e = err as Error
    if (e.name === 'AbortError') {
      throw new Error('El workflow de n8n ha tardado demasiado en responder. Vuelve a intentarlo en un momento.')
    }
    // `fetch` lanza un TypeError genérico tanto si el host no responde como si
    // el navegador bloquea la respuesta por CORS: lo segundo es lo más habitual
    // la primera vez, así que conviene nombrarlo.
    if (e instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(e.message)) {
      throw new Error(
        `No se pudo contactar con n8n (${new URL(url).pathname}). Comprueba que el workflow está activo y que permite peticiones desde este dominio (CORS y preflight OPTIONS).`,
      )
    }
    throw e
  } finally {
    clearTimeout(t)
  }
}

export async function generarPieza(payload: PayloadGenerar): Promise<RespuestaGenerar> {
  if (!URL_GENERAR) {
    throw new Error('Falta configurar VITE_N8N_GENERAR_URL.')
  }
  const bruto = await postJson(URL_GENERAR, payload, TIEMPO_MAXIMO_MS)
  // n8n devuelve a veces un array con un elemento por ítem procesado.
  const dato = (Array.isArray(bruto) ? bruto[0] : bruto) as Record<string, unknown> | undefined
  if (!dato) return { ok: true }
  if (dato.error) return { ok: false, error: String(dato.error) }
  return {
    ok: dato.ok !== false,
    pieza_id: typeof dato.pieza_id === 'string' ? dato.pieza_id : undefined,
    imagen_url: typeof dato.imagen_url === 'string' ? dato.imagen_url : undefined,
  }
}

/** Datos que la app envía a n8n para redactar el texto del post. */
export interface PayloadCopy {
  pieza_id: string
  red: string
  descripcion: string
  cliente: string
  marca: {
    territorio: string
    tono: string
    reglas: string[]
  }
  contexto: {
    centro: string
    linea: string
  }
}

export interface RespuestaCopy {
  ok: boolean
  copy_texto?: string
  hashtags?: string
  error?: string
}

export const copyConfigurado = Boolean(URL_COPY)

/**
 * Redacta el texto del post (caption + hashtags) con la IA, en el tono de voz
 * de la marca. n8n solo genera el texto y lo devuelve; la app lo guarda en la
 * pieza (así el workflow de copy no necesita credenciales de Supabase).
 * Contrato en `n8n/claudia-copy.md`.
 */
export async function generarCopy(payload: PayloadCopy): Promise<RespuestaCopy> {
  if (!URL_COPY) {
    throw new Error('Falta configurar VITE_N8N_COPY_URL para redactar el texto con IA.')
  }
  const bruto = await postJson(URL_COPY, payload, 60_000)
  const dato = (Array.isArray(bruto) ? bruto[0] : bruto) as Record<string, unknown> | undefined
  if (!dato) return { ok: false, error: 'n8n no devolvió texto.' }
  if (dato.error) return { ok: false, error: String(dato.error) }
  return {
    ok: dato.ok !== false,
    copy_texto: typeof dato.copy_texto === 'string' ? dato.copy_texto : undefined,
    hashtags: typeof dato.hashtags === 'string' ? dato.hashtags : undefined,
  }
}

/** Datos que la app envía al «director de arte» (IA) para dirigir la pieza. */
export interface PayloadDirector {
  intencion: string
  tipoPost: string
  red: string
  ratio: string
  cliente: string
  ajuste: string
  marca: {
    territorio: string
    tono: string
    paleta: { hex: string; nombre: string }[]
    reglas: string[]
  }
  contexto: { centro: string; linea: string }
}

export interface RespuestaDirector {
  ok: boolean
  /** Prompt de imagen dirigido (sustituye a la heurística de la Capa 1). */
  prompt_imagen?: string
  /** Idea creativa en una frase. */
  concepto?: string
  copy_texto?: string
  hashtags?: string
  error?: string
}

export const directorConfigurado = Boolean(URL_DIRECTOR)

/**
 * Director de arte con IA: de una intención + el Brand Kit devuelve, en UNA
 * llamada, el prompt de imagen dirigido, el concepto, el texto del post y los
 * hashtags. n8n solo genera texto; la app usa el prompt para generar la imagen
 * y guarda el copy. Contrato en `n8n/claudia-director.md`.
 */
export async function dirigirArte(payload: PayloadDirector): Promise<RespuestaDirector> {
  if (!URL_DIRECTOR) throw new Error('Falta configurar VITE_N8N_DIRECTOR_URL.')
  const bruto = await postJson(URL_DIRECTOR, payload, 60_000)
  const dato = (Array.isArray(bruto) ? bruto[0] : bruto) as Record<string, unknown> | undefined
  if (!dato) return { ok: false, error: 'El director no devolvió nada.' }
  if (dato.error) return { ok: false, error: String(dato.error) }
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
  return {
    ok: dato.ok !== false,
    prompt_imagen: str(dato.prompt_imagen),
    concepto: str(dato.concepto),
    copy_texto: str(dato.copy_texto),
    hashtags: str(dato.hashtags),
  }
}

export interface MensajeChat {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Copiloto. La clave del modelo vive en n8n, nunca en el navegador.
 * Contrato en `n8n/claudia-chat.md`.
 */
export async function preguntarACopiloto(
  mensajes: MensajeChat[],
  contexto: Record<string, unknown>,
): Promise<string> {
  if (!URL_CHAT) {
    throw new Error('El copiloto aún no está disponible: falta configurar VITE_N8N_CHAT_URL.')
  }
  const bruto = await postJson(URL_CHAT, { mensajes, contexto }, 60_000)
  const dato = (Array.isArray(bruto) ? bruto[0] : bruto) as Record<string, unknown> | undefined
  const texto = dato?.respuesta ?? dato?.output ?? dato?.text
  if (typeof texto !== 'string' || !texto.trim()) {
    throw new Error('El copiloto no devolvió ninguna respuesta.')
  }
  return texto.trim()
}
