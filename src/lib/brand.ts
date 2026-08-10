import { CLIENTE } from './cliente'

/**
 * Brand Kit del cliente activo. Es la identidad editable de la marca (logo,
 * territorio, tono de voz, tipografía) que gobierna tanto la generación como la
 * composición de las piezas. Vive en Supabase (tabla `marca_config`) y se puede
 * editar desde la app; si aún no está, se cae a los valores del cliente.
 */
export interface MarcaConfig {
  logoUrl: string | null
  territorio: string
  tonoVoz: string
  tipografia: string
}

/** Fila tal cual llega de Supabase (`marca_config`). */
export interface MarcaConfigRow {
  logo_url: string | null
  territorio: string | null
  tono_voz: string | null
  tipografia: string | null
}

export const MARCA_POR_DEFECTO: MarcaConfig = {
  logoUrl: CLIENTE.logoPiezas,
  territorio: CLIENTE.territorio,
  tonoVoz: '',
  tipografia: CLIENTE.tipografia,
}

export function desdeFila(row: MarcaConfigRow | null): MarcaConfig {
  if (!row) return { ...MARCA_POR_DEFECTO }
  return {
    logoUrl: row.logo_url ?? MARCA_POR_DEFECTO.logoUrl,
    territorio: row.territorio?.trim() || MARCA_POR_DEFECTO.territorio,
    tonoVoz: row.tono_voz ?? '',
    tipografia: row.tipografia?.trim() || MARCA_POR_DEFECTO.tipografia,
  }
}

// La composición de piezas (canvas/SVG) vive en módulos puros, sin acceso al
// store de React. Este singleton les da la marca activa; el store lo fija al
// cargar los datos.
let actual: MarcaConfig = { ...MARCA_POR_DEFECTO }

export function fijarMarca(m: MarcaConfig): void {
  actual = m
}

export function marcaActiva(): MarcaConfig {
  return actual
}
