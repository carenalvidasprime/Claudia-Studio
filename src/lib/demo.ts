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

/**
 * Piezas de ejemplo para que el modo demo muestre una biblioteca de contenido
 * con creatividades en distintos estados (y así se vean Contenido, Por revisar,
 * los contadores y el filtro por centro). Sin imagen real: se muestra el
 * marcador «Sin imagen todavía».
 */
const pieza = (
  id: string,
  titulo: string,
  centro_id: string,
  estado: Pieza['estado'],
  carpeta_id: string | null = null,
  extra: Partial<Pieza> = {},
): Pieza => ({
  id,
  titulo,
  centro_id,
  carpeta_id,
  situacion_id: null,
  linea_id: null,
  estado,
  fecha_publicacion: null,
  canal: 'Instagram',
  brief: null,
  prompt: null,
  imagen_url: null,
  consentimiento_ok: null,
  notas_compliance: null,
  descartada: false,
  favorita: false,
  ...extra,
})

export const DEMO_PIEZAS: Pieza[] = [
  pieza('p1', 'Bienvenida nueva unidad de fisioterapia', 'c1', 'borrador', 'car1'),
  pieza('p2', 'Día Mundial del Corazón', 'c1', 'en_revision', 'car1'),
  pieza('p3', 'Consejo: hidratación en verano', 'c1', 'aprobado', 'car1', { favorita: true }),
  pieza('p4', 'Nuevo equipo de diagnóstico', 'c2', 'en_revision', 'car2'),
  pieza('p5', 'Campaña de prevención', 'c2', 'programado', 'car2'),
  pieza('p6', 'Testimonio de paciente', 'c2', 'publicado', 'car2', { favorita: true }),
  pieza('p7', 'Horario especial agosto', 'c3', 'borrador'),
  pieza('p8', 'Efeméride: Día del Médico', 'c3', 'aprobado'),
  pieza('p9', 'Boceto descartado', 'c1', 'borrador', 'car1', { descartada: true }),
]
