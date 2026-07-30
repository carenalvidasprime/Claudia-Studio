import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * La clave `anon` es publicable por diseño: no es un secreto. Lo que protege los
 * datos son las políticas RLS de `supabase/03_policies.sql`, que solo conceden
 * acceso al rol `authenticated`. Ninguna credencial de servicio vive aquí: las
 * llamadas que la necesitan (generación de imagen, copiloto) pasan por n8n.
 */
export const supabaseConfigurado = Boolean(url && anonKey)

export const supabase: SupabaseClient = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true } },
)

/** Traduce los errores de PostgREST a un aviso legible en español. */
export function mensajeError(error: unknown): string {
  if (!error) return 'Error desconocido.'
  const e = error as { message?: string; code?: string; details?: string }
  const code = e.code ?? ''
  if (code === 'PGRST301' || code === '42501') {
    return 'Sin permisos para esta operación. Revisa que las políticas RLS estén aplicadas.'
  }
  if (code === '42P01') {
    return 'Falta una tabla en Supabase. Ejecuta las migraciones de la carpeta supabase/.'
  }
  if (code === '42703') {
    return 'Falta una columna en Supabase. Ejecuta la migración 01_carpetas.sql.'
  }
  if (e.message?.includes('Invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (e.message?.includes('Failed to fetch')) {
    return 'No se pudo contactar con Supabase. Revisa la conexión y la URL configurada.'
  }
  return e.message ?? 'Error desconocido.'
}

/** `true` si el error viene de una tabla o columna que aún no existe. */
export function esEsquemaIncompleto(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code ?? ''
  return code === '42P01' || code === '42703' || code === 'PGRST205'
}
