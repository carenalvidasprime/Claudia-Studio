import { sx } from '../lib/sx'
import { ratioToCss } from '../lib/ui'
import { useApp } from '../store'

/**
 * Acciones de retoque. Se muestran deshabilitadas: hoy la producción de imagen
 * la hace n8n en una sola pasada y no hay un endpoint de edición, así que
 * dejarlas activas prometería una capacidad que no existe.
 */
const RETOQUES = [
  { icono: '✦', nombre: 'Generar variaciones', sub: '4 versiones nuevas de esta toma' },
  { icono: '⤢', nombre: 'Mejorar resolución', sub: 'Reescalado a mayor tamaño' },
  { icono: '◫', nombre: 'Cambiar fondo', sub: 'Otro color de la paleta de marca' },
  { icono: '☀', nombre: 'Ajustar iluminación', sub: 'Reilumina la escena' },
  { icono: '✎', nombre: 'Corregir color', sub: 'Equilibrio y saturación naturales' },
]

export function Detalle() {
  const app = useApp()
  const pieza = app.piezaActual
  const b = app.borrador
  if (!pieza) return null

  const esAnimacion = b.formato === 'Animación'

  return (
    <section className="fade" style={sx('display:grid;grid-template-columns:1fr 296px;height:calc(100vh - 64px)')}>
      <div style={sx('display:grid;place-items:center;padding:30px;background:#eceef0;overflow-y:auto')}>
        <div
          style={sx(
            `width:min(100%,420px);aspect-ratio:${ratioToCss(b.ratio)};border-radius:16px;box-shadow:0 18px 44px rgba(23,25,31,.14);position:relative;overflow:hidden;background:#f4f5f6`,
          )}
        >
          {pieza.imagen_url ? (
            <img
              src={pieza.imagen_url}
              alt={pieza.titulo}
              style={sx('width:100%;height:100%;object-fit:cover;display:block')}
            />
          ) : (
            <div
              style={sx(
                'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;color:rgba(23,25,31,.4);text-align:center;padding:24px',
              )}
            >
              <svg width="34" height="34" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="5" y="7" width="22" height="18" rx="2.5" />
                <circle cx="12" cy="14" r="2" />
                <path d="M5 21L12 16L18 20L22.5 17L27 20" strokeLinejoin="round" />
              </svg>
              <span style={sx('font-size:12px;line-height:1.5;max-width:240px')}>
                Esta pieza todavía no tiene imagen. Genera desde el estudio para que n8n la produzca.
              </span>
            </div>
          )}
          <span
            style={sx(
              "position:absolute;bottom:13px;left:13px;background:rgba(23,25,31,.75);color:#fff;font-family:'IBM Plex Mono',monospace;font-size:9.5px;padding:4px 8px;border-radius:6px",
            )}
          >
            {b.ratio}
          </span>
          {esAnimacion && (
            <span
              style={sx(
                'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:52px;height:52px;border-radius:50%;background:rgba(23,25,31,.7);color:#fff;display:grid;place-items:center;font-size:18px',
              )}
            >
              ▶
            </span>
          )}
        </div>
      </div>

      <div style={sx('border-left:1px solid rgba(23,25,31,.08);background:#fff;padding:22px 20px;overflow-y:auto')}>
        <div style={sx('font-size:13.5px;font-weight:700;line-height:1.35;margin-bottom:4px')}>{pieza.titulo}</div>
        <div style={sx('font-size:11px;color:rgba(23,25,31,.5);margin-bottom:18px')}>
          {pieza.canal ?? '—'} · {app.lineaDe(pieza.linea_id)?.nombre ?? 'Sin línea'}
        </div>

        <div
          style={sx(
            "font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4);margin-bottom:11px",
          )}
        >
          RETOQUE IA
        </div>
        <div style={sx('display:flex;flex-direction:column;gap:7px')}>
          {RETOQUES.map((r) => (
            <button
              key={r.nombre}
              disabled
              title="Disponible cuando el workflow de n8n incorpore un paso de edición."
              className="is-pending"
              style={sx(
                "display:flex;align-items:center;gap:11px;background:#f4f4f4;border:1px solid transparent;border-radius:10px;padding:11px 12px;font-family:'Mulish';font-weight:500;font-size:12.5px;color:#17191f;text-align:left;width:100%",
              )}
            >
              <span
                style={sx(
                  'width:28px;height:28px;border-radius:8px;background:#ddf3fb;display:grid;place-items:center;font-size:13px;flex:none;color:oklch(0.45 0.09 220)',
                )}
              >
                {r.icono}
              </span>
              <span>
                {r.nombre}
                <br />
                <span style={sx('font-weight:400;font-size:10.5px;color:rgba(23,25,31,.48)')}>{r.sub}</span>
              </span>
            </button>
          ))}
        </div>
        <div style={sx('font-size:10.5px;color:rgba(23,25,31,.45);margin-top:9px;line-height:1.5')}>
          Próximamente: el retoque necesita un paso de edición en el workflow de n8n.
        </div>

        <div
          style={sx('margin-top:18px;border-top:1px solid rgba(23,25,31,.08);padding-top:16px;display:flex;flex-direction:column;gap:8px')}
        >
          <button
            onClick={() => void app.aprobarPieza(pieza.id)}
            style={sx(
              "width:100%;background:#D71029;color:#fff;border:none;border-radius:10px;padding:12px;font-family:'Mulish';font-weight:600;font-size:13px;cursor:pointer",
            )}
          >
            Aprobar y añadir a entrega
          </button>
          <button
            onClick={() => app.ir('estudio')}
            style={sx(
              "width:100%;background:#f4f4f4;border:1px solid rgba(23,25,31,.1);border-radius:10px;padding:12px;font-family:'Mulish';font-weight:500;font-size:13px;cursor:pointer;color:#17191f",
            )}
          >
            Volver a variantes
          </button>
        </div>
      </div>
    </section>
  )
}
