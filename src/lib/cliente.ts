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
/**
 * Tokens de color del «chrome» (la interfaz, no las piezas). Se aplican como
 * variables CSS en tiempo de arranque, así un único build sirve para cualquier
 * cliente y no hay ningún color de marca incrustado en los componentes.
 */
export interface Tema {
  /** Color de marca principal (botones, acentos, banda de las piezas). */
  acento: string
  /** Componentes RGB del acento («r,g,b») para bordes/sombras translúcidos. */
  acentoRgb: string
  /** Variante clara del acento (segundo tono de los degradados sólidos). */
  acento2: string
  /** Tres tonos suaves para los degradados de fondo (hero, cabeceras). */
  suave1: string
  suave2: string
  suave3: string
}

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
  /** Colores del chrome de la interfaz. */
  tema: Tema
  /** Ruta del favicon (icono de la pestaña) de este cliente. */
  favicon: string
  /** Dominio para el placeholder del correo en el login. */
  dominioEmail: string
}

// Tema Ribera: el rojo corporativo y sus degradados cálidos (sin cambios).
const TEMA_RIBERA: Tema = {
  acento: '#D71029',
  acentoRgb: '215,16,41',
  acento2: '#f26d84',
  suave1: '#FDE8DE',
  suave2: '#f7dede',
  suave3: '#f0c3ca',
}

// Tema Claudia Studio (marca blanca): azul y degradados azules suaves.
const TEMA_VIDASPRIME: Tema = {
  acento: '#1F6FD6',
  acentoRgb: '31,111,214',
  acento2: '#6AA6EC',
  suave1: '#EAF2FB',
  suave2: '#DCEAF7',
  suave3: '#C7E0F3',
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
  tema: TEMA_RIBERA,
  favicon: '/favicon.png',
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
  territorio: 'Comunicación de marca',
  tipografia: TIPOGRAFIA,
  paleta: PALETA_POR_DEFECTO,
  reglas: REGLAS_POR_DEFECTO,
  tema: TEMA_VIDASPRIME,
  favicon: '/favicon-vidasprime.png',
  dominioEmail: 'tuempresa.com',
}

const CONFIGS: Record<string, ClienteConfig> = { ribera: RIBERA, vidasprime: VIDASPRIME }

const activo = ((import.meta.env.VITE_CLIENTE as string | undefined) || 'ribera').toLowerCase()

/** Configuración del cliente activo en este despliegue. */
export const CLIENTE: ClienteConfig = CONFIGS[activo] ?? RIBERA

/** Nombre para el sufijo de textos: « de Ribera» o «» en marca blanca. */
export const DE_CLIENTE = CLIENTE.cliente ? ` de ${CLIENTE.cliente}` : ''

/**
 * Título de la pestaña del navegador. Con cliente: «Claudia · Ribera».
 * En marca blanca (sin cliente): «Claudia Studio».
 */
export const TITULO = CLIENTE.cliente ? `${CLIENTE.producto} · ${CLIENTE.cliente}` : `${CLIENTE.producto} Studio`

/** Descripción (meta) según el cliente activo. */
export const DESCRIPCION = CLIENTE.cliente
  ? `Producción de contenido para las redes de los centros de ${CLIENTE.cliente}.`
  : 'Producción de contenido de marca para redes sociales, con criterio de dirección de arte.'

/** Tokens de color del cliente activo (para composición de piezas en JS). */
export const TEMA = CLIENTE.tema

/**
 * Vuelca el tema del cliente en variables CSS del documento, para que el chrome
 * (definido con `var(--acento)`, `var(--suave-1)`…) tome el color de marca sin
 * que ningún componente lleve el color incrustado. Se llama una vez al arrancar.
 */
export function aplicarTema(): void {
  const r = document.documentElement.style
  r.setProperty('--acento', TEMA.acento)
  r.setProperty('--acento-rgb', TEMA.acentoRgb)
  r.setProperty('--acento-2', TEMA.acento2)
  r.setProperty('--suave-1', TEMA.suave1)
  r.setProperty('--suave-2', TEMA.suave2)
  r.setProperty('--suave-3', TEMA.suave3)
  const icono = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (icono) icono.href = CLIENTE.favicon
}
