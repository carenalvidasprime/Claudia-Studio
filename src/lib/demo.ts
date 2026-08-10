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

/**
 * Los hubs (agrupaciones de centros) son opcionales. Un proyecto genérico no
 * los usa, así que la demo no incluye ninguno y los centros salen sin agrupar.
 */
export const DEMO_HUBS: Hub[] = []

export const DEMO_CENTROS: Centro[] = [
  { id: 'c1', nombre: 'Hospital Demo', ciudad: 'Bilbao', hub_id: null, tipo: 'Hospital' },
  { id: 'c2', nombre: 'Clínica Demo', ciudad: 'Madrid', hub_id: null, tipo: 'Clínica' },
  { id: 'c3', nombre: 'Centro Médico Demo', ciudad: 'Valencia', hub_id: null, tipo: 'Centro médico' },
  { id: 'c4', nombre: 'Consulta Demo', ciudad: 'Sevilla', hub_id: null, tipo: 'Consulta' },
]

export const DEMO_LINEAS: Linea[] = [
  { id: 'l1', clave: 'novedades', nombre: 'Novedades y lanzamientos', descripcion: 'Nuevos productos, servicios o anuncios.' },
  { id: 'l2', clave: 'promociones', nombre: 'Promociones y ofertas', descripcion: 'Campañas comerciales y ofertas.' },
  { id: 'l3', clave: 'marca', nombre: 'Marca y valores', descripcion: 'Identidad, propósito y cultura.' },
  { id: 'l4', clave: 'comunidad', nombre: 'Comunidad', descripcion: 'Vínculo con la audiencia y el entorno.' },
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
