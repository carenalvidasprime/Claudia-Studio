/**
 * Modelo de datos. Refleja el esquema `public` de Supabase.
 *
 * Los identificadores se tipan como `Id = string | number` porque la app nunca
 * opera aritméticamente con ellos: así funciona igual si las tablas usan bigint
 * o uuid, sin acoplarse a una decisión del esquema.
 */
export type Id = string | number

export interface Hub {
  id: Id
  clave: string
  nombre: string
}

export interface Centro {
  id: Id
  created_at?: string
  nombre: string
  ciudad: string | null
  hub_id: Id | null
  tipo: string | null
}

export interface Linea {
  id: Id
  clave: string
  nombre: string
  descripcion: string | null
}

export interface Situacion {
  id: Id
  clave: string
  nombre: string
  requiere_consentimiento: boolean
}

/** Tabla añadida por la migración `supabase/01_carpetas.sql`. */
export interface Carpeta {
  id: Id
  created_at?: string
  centro_id: Id
  nombre: string
}

export const ESTADOS = ['borrador', 'en_revision', 'aprobado', 'programado', 'publicado'] as const
export type Estado = (typeof ESTADOS)[number]

export const ESTADO_LABEL: Record<Estado, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  programado: 'Programado',
  publicado: 'Publicado',
}

/**
 * Contenido de `piezas.brief` (jsonb). Es el sitio donde viven los datos de
 * producción que no tienen columna propia: el texto del encargo, los ajustes de
 * dirección y lo que responde el usuario en los pasos de cada situación.
 */
export interface Brief {
  texto?: string
  /** Mensaje/copy que se superpone sobre la imagen en la capa de marca. */
  copy?: string
  /** Plantilla de marca con la que se compone la pieza. */
  plantilla?: 'editorial' | 'franja' | 'anuncio' | 'sobrefoto'
  /** Contenido de la maqueta de anuncio (huecos editables). El titular reutiliza `copy`. */
  maqueta?: {
    subtitulo?: string
    cta?: string
    mostrarSubtitulo?: boolean
    mostrarCta?: boolean
  }
  /** Formato de red social elegido (id de FORMATOS). Fija proporción y canal. */
  redFormato?: string
  /** Si se aplica la capa de marca (logo + copy) o se entrega la foto limpia. */
  marca?: boolean
  objetivo?: 'Orgánico' | 'Promoción'
  ratio?: '1:1' | '4:5' | '9:16' | '16:9'
  formato?: 'Imagen' | 'Animación'
  variantes?: number
  direccion?: {
    estilo?: string
    iluminacion?: string
    encuadre?: string
    ritmo?: string
    texto?: string
    transicion?: string
  }
  /** Foto real de referencia subida por el equipo, si la hay. */
  material?: { url: string; nombre: string }
  /** Respuestas de los pasos previos, por situación. */
  situacion?: {
    exposicion?: string
    personas?: string
    menores?: boolean
    entorno?: string
    validadoPorProfesional?: boolean
    fondoLibre?: boolean
    sinPacientes?: boolean
  }
}

export interface Pieza {
  id: string
  created_at?: string
  titulo: string
  centro_id: Id
  carpeta_id: Id | null
  situacion_id: Id | null
  linea_id: Id | null
  estado: Estado
  fecha_publicacion: string | null
  canal: string | null
  brief: Brief | null
  prompt: string | null
  imagen_url: string | null
  consentimiento_ok: boolean | null
  notas_compliance: string | null
  /** Texto del post (caption) que acompaña a la imagen al publicar. */
  copy_texto?: string | null
  /** Hashtags sugeridos para el post. */
  hashtags?: string | null
  /** En la papelera (borrado recuperable). Ausente/false = activa. */
  descartada?: boolean | null
  /** Destacada por el usuario (persistente). */
  favorita?: boolean | null
}

/** Tablas opcionales de marca (`supabase/02_marca.sql`). */
export interface MarcaColor {
  id: Id
  hex: string
  nombre: string
  orden: number | null
}

export interface MarcaRegla {
  id: Id
  texto: string
  orden: number | null
}

export const CANALES = ['Instagram', 'Facebook', 'TikTok', 'Snapchat', 'LinkedIn'] as const
export const RATIOS = ['1:1', '4:5', '9:16', '16:9'] as const

/**
 * Formatos de publicación por red social. Son el eje del encargo: elegir uno
 * fija la proporción correcta de la imagen y el canal de destino, para que el
 * equipo no tenga que pensar en tamaños ni proporciones.
 */
export interface FormatoRed {
  id: string
  red: string
  nombre: string
  ratio: '1:1' | '4:5' | '9:16' | '16:9'
  descripcion: string
}

export const FORMATOS: FormatoRed[] = [
  { id: 'ig-post', red: 'Instagram', nombre: 'Publicación', ratio: '4:5', descripcion: 'Feed vertical' },
  { id: 'ig-story', red: 'Instagram', nombre: 'Story / Reel', ratio: '9:16', descripcion: 'Pantalla completa' },
  { id: 'fb-post', red: 'Facebook', nombre: 'Publicación', ratio: '1:1', descripcion: 'Cuadrado' },
  { id: 'li-post', red: 'LinkedIn', nombre: 'Publicación', ratio: '1:1', descripcion: 'Cuadrado' },
  { id: 'x-post', red: 'X', nombre: 'Publicación', ratio: '16:9', descripcion: 'Horizontal' },
]
