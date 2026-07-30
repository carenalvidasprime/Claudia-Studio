import { supabase, esEsquemaIncompleto } from './supabase'
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
 * Tablas opcionales de marca. Si no existen, se devuelve `null` para que la
 * pantalla caiga en los valores del brandbook en modo lectura.
 */
export async function cargarMarca(): Promise<{
  paleta: MarcaColor[]
  reglas: MarcaRegla[]
} | null> {
  try {
    const [paleta, reglas] = await Promise.all([
      supabase.from('marca_paleta').select('*').order('orden'),
      supabase.from('marca_reglas').select('*').order('orden'),
    ])
    if (paleta.error) throw paleta.error
    if (reglas.error) throw reglas.error
    return {
      paleta: (paleta.data ?? []) as MarcaColor[],
      reglas: (reglas.data ?? []) as MarcaRegla[],
    }
  } catch (error) {
    if (esEsquemaIncompleto(error)) return null
    throw error
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
