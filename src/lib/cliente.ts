import { PALETA_POR_DEFECTO, REGLAS_POR_DEFECTO, TERRITORIO, TIPOGRAFIA } from './marca'
import type { MarcaColor, MarcaRegla } from './types'
import logoRibera from '../assets/logo-ribera-cropped.png'

/**
 * Configuración de cliente. Claudia Studio es un producto de VidasPrime que se
 * despliega una vez por cliente; lo que cambia entre despliegues (marca, textos,
 * logo de las piezas) vive aquí, no incrustado en el código.
 *
 * El cliente activo se elige con la variable de entorno `VITE_CLIENTE`
 * (por defecto `ribera`, para que el despliegue actual de Ribera no cambie).
 */
export interface ClienteConfig {
  id: string
  /** Marca del producto (chrome): «Claudia by VidasPrime». */
  producto: string
  proveedor: string
  /** Texto de la «cuenta» en la barra lateral. */
  cuenta: string
  /** Nombre del cliente final. `null` en la base de marca blanca. */
  cliente: string | null
  /** Logo que se compone SOBRE las piezas. `null` = sin logo (lo pone cada cliente). */
  logoPiezas: string | null
  territorio: string
  tipografia: string
  paleta: MarcaColor[]
  reglas: MarcaRegla[]
  /** Dominio para el placeholder del correo en el login. */
  dominioEmail: string
}

const RIBERA: ClienteConfig = {
  id: 'ribera',
  producto: 'Claudia',
  proveedor: 'VidasPrime',
  cuenta: 'Grupo Ribera',
  cliente: 'Ribera',
  logoPiezas: logoRibera,
  territorio: TERRITORIO,
  tipografia: TIPOGRAFIA,
  paleta: PALETA_POR_DEFECTO,
  reglas: REGLAS_POR_DEFECTO,
  dominioEmail: 'riberasalud.es',
}

// Marca blanca de VidasPrime: mismo diseño y estilos, sin identidad de cliente.
const VIDASPRIME: ClienteConfig = {
  id: 'vidasprime',
  producto: 'Claudia',
  proveedor: 'VidasPrime',
  cuenta: 'Claudia Studio',
  cliente: null,
  logoPiezas: null,
  territorio: TERRITORIO,
  tipografia: TIPOGRAFIA,
  paleta: PALETA_POR_DEFECTO,
  reglas: REGLAS_POR_DEFECTO,
  dominioEmail: 'tuempresa.com',
}

const CONFIGS: Record<string, ClienteConfig> = { ribera: RIBERA, vidasprime: VIDASPRIME }

const activo = ((import.meta.env.VITE_CLIENTE as string | undefined) || 'ribera').toLowerCase()

/** Configuración del cliente activo en este despliegue. */
export const CLIENTE: ClienteConfig = CONFIGS[activo] ?? RIBERA

/** Nombre para el sufijo de textos: « de Ribera» o «» en marca blanca. */
export const DE_CLIENTE = CLIENTE.cliente ? ` de ${CLIENTE.cliente}` : ''
