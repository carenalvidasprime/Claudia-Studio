import { supabase, esEsquemaIncompleto } from './supabase'
import type { MarcaConfigRow } from './brand'
import type {
  Carpeta,
  Centro,
  Estado,
  Hub,
  Id,
  Linea,
  MarcaColor,
  MarcaRegla,
  Pieza,
  Situacion,
} from './types'

/** Catálogos: se leen de Supabase, nunca se escriben a mano en el código. */
export async function cargarCatalogos(): Promise<{
  hubs: Hub[]
  centros: Centro[]
  lineas: Linea[]
  situaciones: Situacion[]
}> {
  const [hubs, centros, lineas, situaciones] = await Promise.all([
    supabase.from('hubs').select('*').order('nombre'),
    supabase.from('centros').select('*').order('nombre'),
    supabase.from('lineas').select('*').order('nombre'),
    supabase.from('situaciones').select('*').order('nombre'),
  ])
  const fallo = hubs.error || centros.error || lineas.error || situaciones.error
  if (fallo) throw fallo
  return {
    hubs: (hubs.data ?? []) as Hub[],
    centros: (centros.data ?? []) as Centro[],
    lineas: (lineas.data ?? []) as Linea[],
    situaciones: (situaciones.data ?? []) as Situacion[],
  }
}

export async function cargarCarpetas(): Promise<Carpeta[]> {
  const { data, error } = await supabase.from('carpetas').select('*').order('id')
  if (error) throw error
  return (data ?? []) as Carpeta[]
}

export async function cargarPiezas(): Promise<Pieza[]> {
  const { data, error } = await supabase
    .from('piezas')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Pieza[]
}

export async function crearCarpeta(centroId: Id, nombre: string): Promise<Carpeta> {
  const { data, error } = await supabase
    .from('carpetas')
    .insert({ centro_id: centroId, nombre })
    .select()
    .single()
  if (error) throw error
  return data as Carpeta
}

export async function renombrarCarpeta(id: Id, nombre: string): Promise<void> {
  const { error } = await supabase.from('carpetas').update({ nombre }).eq('id', id)
  if (error) throw error
}

export async function borrarCarpeta(id: Id): Promise<void> {
  const { error } = await supabase.from('carpetas').delete().eq('id', id)
  if (error) throw error
}

export async function actualizarPieza(id: string, cambios: Partial<Pieza>): Promise<void> {
  const { error } = await supabase.from('piezas').update(cambios).eq('id', id)
  if (error) throw error
}

export async function cambiarEstado(id: string, estado: Estado): Promise<void> {
  return actualizarPieza(id, { estado })
}

export async function borrarPieza(id: string): Promise<void> {
  const { error } = await supabase.from('piezas').delete().eq('id', id)
  if (error) throw error
}

export async function duplicarPieza(pieza: Pieza): Promise<Pieza> {
  const { id: _id, created_at: _created, ...resto } = pieza
  void _id
  void _created
  const { data, error } = await supabase
    .from('piezas')
    .insert({ ...resto, titulo: `${pieza.titulo} (copia)`, estado: 'borrador' as Estado })
    .select()
    .single()
  if (error) throw error
  return data as Pieza
}

/**
 * Sube material de referencia al bucket público «piezas», bajo `material/`.
 * Devuelve la URL pública para adjuntarla al brief que recibe n8n.
 */
export async function subirMaterial(archivo: File): Promise<{ url: string; nombre: string }> {
  const limpio = archivo.name.replace(/[^a-zA-Z0-9._-]+/g, '-')
  const ruta = `material/${Date.now()}-${limpio}`
  const { error } = await supabase.storage.from('piezas').upload(ruta, archivo, {
    cacheControl: '3600',
    upsert: false,
    contentType: archivo.type || undefined,
  })
  if (error) throw error
  const { data } = supabase.storage.from('piezas').getPublicUrl(ruta)
  return { url: data.publicUrl, nombre: archivo.name }
}

/**
 * Descarga una imagen y la devuelve en base64 (+ su mime). Se usa para remezclar
 * (imagen-a-imagen): la referencia viaja a n8n como base64. El bucket de Supabase
 * es público con CORS abierto, así que el fetch funciona desde el navegador.
 */
export async function imagenABase64(url: string): Promise<{ base64: string; mime: string }> {
  const resp = await fetch(url, { mode: 'cors' })
  if (!resp.ok) throw new Error('No se pudo leer la imagen de referencia.')
  const blob = await resp.blob()
  const dataUrl: string = await new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(fr.result as string)
    fr.onerror = () => rej(new Error('No se pudo procesar la imagen de referencia.'))
    fr.readAsDataURL(blob)
  })
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl)
  if (!m) throw new Error('Formato de imagen de referencia no válido.')
  return { mime: m[1], base64: m[2] }
}

/**
 * Sube el logo de marca al bucket «piezas», bajo `marca/`. Devuelve la URL
 * pública para guardarla en el Brand Kit (`marca_config.logo_url`).
 */
export async function subirLogoMarca(archivo: File): Promise<string> {
  const limpio = archivo.name.replace(/[^a-zA-Z0-9._-]+/g, '-')
  const ruta = `marca/logo-${Date.now()}-${limpio}`
  const { error } = await supabase.storage.from('piezas').upload(ruta, archivo, {
    cacheControl: '3600',
    upsert: false,
    contentType: archivo.type || undefined,
  })
  if (error) throw error
  const { data } = supabase.storage.from('piezas').getPublicUrl(ruta)
  return data.publicUrl
}

/**
 * Tablas opcionales de marca (Brand Kit). Si no existen, se devuelve `null`
 * para que la pantalla caiga en los valores por defecto en modo lectura.
 */
export async function cargarMarca(): Promise<{
  paleta: MarcaColor[]
  reglas: MarcaRegla[]
  config: MarcaConfigRow | null
} | null> {
  try {
    const [paleta, reglas] = await Promise.all([
      supabase.from('marca_paleta').select('*').order('orden'),
      supabase.from('marca_reglas').select('*').order('orden'),
    ])
    if (paleta.error) throw paleta.error
    if (reglas.error) throw reglas.error
    // La tabla de identidad es aún más opcional: si no existe, seguimos con las
    // otras dos y la identidad se queda en los valores por defecto.
    let config: MarcaConfigRow | null = null
    const c = await supabase.from('marca_config').select('*').limit(1).maybeSingle()
    if (!c.error) config = (c.data as MarcaConfigRow | null) ?? null
    else if (!esEsquemaIncompleto(c.error)) throw c.error
    return {
      paleta: (paleta.data ?? []) as MarcaColor[],
      reglas: (reglas.data ?? []) as MarcaRegla[],
      config,
    }
  } catch (error) {
    if (esEsquemaIncompleto(error)) return null
    throw error
  }
}

/**
 * Guarda (crea o actualiza) la identidad de marca. La tabla es un singleton:
 * hay como mucho una fila. Si ya existe se actualiza; si no, se inserta.
 */
export async function guardarMarcaConfig(cambios: Partial<MarcaConfigRow>): Promise<void> {
  const existente = await supabase.from('marca_config').select('id').limit(1).maybeSingle()
  if (existente.error) throw existente.error
  if (existente.data) {
    const { error } = await supabase.from('marca_config').update(cambios).eq('id', (existente.data as { id: Id }).id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('marca_config').insert(cambios)
    if (error) throw error
  }
}

export async function anadirColorMarca(hex: string, nombre: string, orden: number): Promise<void> {
  const { error } = await supabase.from('marca_paleta').insert({ hex, nombre, orden })
  if (error) throw error
}

export async function actualizarColorMarca(id: Id, cambios: Partial<MarcaColor>): Promise<void> {
  const { error } = await supabase.from('marca_paleta').update(cambios).eq('id', id)
  if (error) throw error
}

export async function borrarColorMarca(id: Id): Promise<void> {
  const { error } = await supabase.from('marca_paleta').delete().eq('id', id)
  if (error) throw error
}

export async function anadirReglaMarca(texto: string, orden: number): Promise<void> {
  const { error } = await supabase.from('marca_reglas').insert({ texto, orden })
  if (error) throw error
}

export async function actualizarReglaMarca(id: Id, texto: string): Promise<void> {
  const { error } = await supabase.from('marca_reglas').update({ texto }).eq('id', id)
  if (error) throw error
}

export async function borrarReglaMarca(id: Id): Promise<void> {
  const { error } = await supabase.from('marca_reglas').delete().eq('id', id)
  if (error) throw error
}
