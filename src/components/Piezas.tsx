import { sx } from '../lib/sx'
import { ratioToCss } from '../lib/ui'

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
