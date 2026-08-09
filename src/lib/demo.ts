import type { Session } from '@supabase/supabase-js'
import { CLIENTE } from './cliente'
import { supabaseConfigurado } from './supabase'
import type { Carpeta, Centro, Hub, Linea, Pieza, Situacion } from './types'

/**
 * Modo demo: la base de marca blanca funciona con datos genéricos incorporados,
 * sin depender de Supabase ni n8n. Sirve para enseñar el producto a cualquier
 * cliente potencial al instante. Se activa cuando NO hay Supabase configurada
 * y el cliente no es Ribera (que sí requiere sus datos reales).
 */
export const DEMO = !supabaseConfigurado && CLIENTE.id !== 'ribera'

/** Sesión ficticia para saltar el login en modo demo. */
export const DEMO_SESION = {
  user: { id: 'demo', email: 'demo@claudia.studio' },
} as unknown as Session

export const DEMO_HUBS: Hub[] = [
  { id: 'h1', clave: 'norte', nombre: 'Zona Norte' },
  { id: 'h2', clave: 'centro', nombre: 'Zona Centro' },
  { id: 'h3', clave: 'sur', nombre: 'Zona Sur' },
]

export const DEMO_CENTROS: Centro[] = [
  { id: 'c1', nombre: 'Hospital Demo Norte', ciudad: 'Bilbao', hub_id: 'h1', tipo: 'Hospital' },
  { id: 'c2', nombre: 'Clínica Demo Centro', ciudad: 'Madrid', hub_id: 'h2', tipo: 'Clínica' },
  { id: 'c3', nombre: 'Centro Médico Demo', ciudad: 'Valencia', hub_id: 'h2', tipo: 'Centro médico' },
  { id: 'c4', nombre: 'Hospital Demo Sur', ciudad: 'Sevilla', hub_id: 'h3', tipo: 'Hospital' },
]

export const DEMO_LINEAS: Linea[] = [
  { id: 'l1', clave: 'prevencion', nombre: 'Prevención y salud', descripcion: 'Consejos de prevención y hábitos saludables.' },
  { id: 'l2', clave: 'servicios', nombre: 'Servicios y especialidades', descripcion: 'Difusión de servicios, unidades y especialidades.' },
  { id: 'l3', clave: 'comunidad', nombre: 'Comunidad y compromiso', descripcion: 'Vínculo del centro con su comunidad.' },
]

export const DEMO_SITUACIONES: Situacion[] = [
  { id: 's1', clave: 'testimonio', nombre: 'Testimonio de paciente', requiere_consentimiento: true },
  { id: 's2', clave: 'hito', nombre: 'Hito clínico o nueva tecnología', requiere_consentimiento: false },
  { id: 's3', clave: 'colaboracion', nombre: 'Colaboración con la comunidad', requiere_consentimiento: false },
  { id: 's4', clave: 'efemeride', nombre: 'Día mundial / efeméride', requiere_consentimiento: false },
]

export const DEMO_CARPETAS: Carpeta[] = [
  { id: 'car1', centro_id: 'c1', nombre: 'Agosto 2026' },
  { id: 'car2', centro_id: 'c2', nombre: 'Campaña prevención' },
]

export const DEMO_PIEZAS: Pieza[] = []
