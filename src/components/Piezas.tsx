import { sx } from '../lib/sx'
import { ratioToCss } from '../lib/ui'
import ribera from '../assets/logo-ribera-cropped.png'

/**
 * Capa de marca sobre la imagen generada.
 *
 * La IA produce solo la fotografía de fondo (limpia, sin texto ni logos). Aquí,
 * en el frontend y con los assets reales, se compone la identidad de Ribera
 * ENCIMA: logo real, mensaje/copy en Mulish y un acento de color corporativo.
 * Así el logo nunca es inventado y el texto es siempre legible y correcto.
 */
export function MarcaOverlay({
  url,
  ratio,
  copy,
  radio = '13px',
  grande,
  mostrarLogo = true,
  extra,
}: {
  url: string | null | undefined
  ratio: string | null | undefined
  copy?: string | null
  radio?: string
  /** Vista ampliada (detalle): tipografía y logo mayores. */
  grande?: boolean
  mostrarLogo?: boolean
  extra?: React.ReactNode
}) {
  const base = `aspect-ratio:${ratioToCss(ratio)};border-radius:${radio};position:relative;overflow:hidden;background:#eef0f1`
  const hayCopy = !!copy && copy.trim().length > 0

  return (
    <div style={sx(base)}>
      {url ? (
        <img src={url} alt={copy ?? 'Creatividad'} loading="lazy" style={sx('width:100%;height:100%;object-fit:cover;display:block')} />
      ) : (
        <div style={sx('width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f4f5f6;color:rgba(23,25,31,.35);font-size:11px')}>
          Sin imagen todavía
        </div>
      )}

      {url && hayCopy && (
        <div
          style={sx(
            'position:absolute;left:0;right:0;bottom:0;height:64%;background:linear-gradient(to top,rgba(14,14,16,.86) 6%,rgba(14,14,16,.42) 42%,rgba(14,14,16,0) 100%);pointer-events:none',
          )}
        />
      )}

      {url && mostrarLogo && (
        <div
          style={sx(
            `position:absolute;bottom:${grande ? '16px' : '9px'};right:${grande ? '16px' : '9px'};background:#fff;border-radius:${grande ? '9px' : '6px'};padding:${grande ? '6px 10px' : '4px 6px'};display:flex;align-items:center;box-shadow:0 3px 12px rgba(0,0,0,.25)`,
          )}
        >
          <img src={ribera} alt="Ribera" style={sx(`height:${grande ? '20px' : '12px'};width:auto;display:block`)} />
        </div>
      )}

      {url && hayCopy && (
        <div
          style={sx(
            `position:absolute;left:${grande ? '20px' : '13px'};right:${mostrarLogo ? (grande ? '96px' : '54px') : grande ? '20px' : '13px'};bottom:${grande ? '18px' : '12px'}`,
          )}
        >
          <div style={sx(`width:${grande ? '34px' : '24px'};height:${grande ? '4px' : '3px'};border-radius:2px;background:#D71029;margin-bottom:${grande ? '10px' : '7px'}`)} />
          <div
            style={sx(
              `font-family:'Mulish';font-weight:800;font-size:${grande ? '23px' : '14px'};line-height:1.2;color:#fff;letter-spacing:-.01em;text-shadow:0 1px 12px rgba(0,0,0,.35)`,
            )}
          >
            {copy}
          </div>
        </div>
      )}

      {extra}
    </div>
  )
}

/**
 * Representación visual de una pieza.
 *
 * Muestra exclusivamente la imagen real producida por n8n (`piezas.imagen_url`).
 * Cuando todavía no hay imagen se pinta un marcador neutro: la app no inventa
 * titulares, colores de campaña ni composiciones atribuibles a Ribera.
 */
export function VistaPieza({
  url,
  ratio,
  radio = '13px',
  titulo,
  cargando,
  compacto,
  extra,
}: {
  url: string | null | undefined
  ratio: string | null | undefined
  radio?: string
  titulo?: string
  cargando?: boolean
  /** En miniaturas pequeñas se omite el texto del marcador para no competir con el título. */
  compacto?: boolean
  extra?: React.ReactNode
}) {
  const base = `aspect-ratio:${ratioToCss(ratio)};border-radius:${radio};position:relative;overflow:hidden;background:#eef0f1`

  if (cargando) {
    return (
      <div
        style={sx(
          base,
          'background:linear-gradient(100deg,#e9ebed 30%,#f4f5f6 50%,#e9ebed 70%);background-size:820px 100%;animation:shimmer 1.3s infinite linear',
        )}
      />
    )
  }

  return (
    <div style={sx(base)}>
      {url ? (
        <img
          src={url}
          alt={titulo ?? 'Creatividad'}
          loading="lazy"
          style={sx('width:100%;height:100%;object-fit:cover;display:block')}
        />
      ) : (
        <div
          style={sx(
            'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;background:#f4f5f6;color:rgba(23,25,31,.38);text-align:center;padding:14px',
          )}
        >
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="5" y="7" width="22" height="18" rx="2.5" />
            <circle cx="12" cy="14" r="2" />
            <path d="M5 21L12 16L18 20L22.5 17L27 20" strokeLinejoin="round" />
          </svg>
          {!compacto && <span style={sx('font-size:10.5px;line-height:1.4')}>Sin imagen todavía</span>}
        </div>
      )}
      {extra}
    </div>
  )
}

/** Etiqueta de proporción sobre la miniatura, arriba a la izquierda. */
export function EtiquetaRatio({ ratio }: { ratio: string | null | undefined }) {
  return (
    <span
      style={sx(
        "position:absolute;top:9px;left:9px;background:rgba(255,255,255,.9);color:#17191f;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.04em;padding:3px 7px;border-radius:5px",
      )}
    >
      {ratio ?? '4:5'}
    </span>
  )
}

export function IconoAnimacion({ tam = 24 }: { tam?: number }) {
  return (
    <span
      style={sx(
        `position:absolute;bottom:9px;right:9px;width:${tam}px;height:${tam}px;border-radius:50%;background:rgba(23,25,31,.72);color:#fff;display:grid;place-items:center;font-size:${Math.round(tam * 0.42)}px`,
      )}
    >
      ▶
    </span>
  )
}
