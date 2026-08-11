import { sx } from '../lib/sx'
import { VistaPieza } from '../components/Piezas'
import { ESTADOS, ESTADO_LABEL, type Estado } from '../lib/types'
import { useApp } from '../store'

// Color del chip por estado (semántico, no es el acento de marca).
const TONO_ESTADO: Record<Estado, string> = {
  borrador: 'background:#eef0f1;color:#5b6674',
  en_revision: 'background:#FBEFD8;color:#9A6B1B',
  aprobado: 'background:#E4F4EC;color:#1C7A4E',
  programado: 'background:#E7F0FB;color:#1F5FB0',
  publicado: 'background:#1D1D1B;color:#fff',
}

export function Contenido() {
  const app = useApp()
  const q = app.busquedaPiezas.trim().toLowerCase()

  // Ámbito por centro: si hay un centro seleccionado, solo su contenido.
  const enCentro = (p: (typeof app.piezas)[number]) =>
    app.contenidoCentro == null || String(p.centro_id) === String(app.contenidoCentro)

  const cuenta = (e: Estado | 'Todas') =>
    app.piezas.filter(enCentro).filter((p) => e === 'Todas' || p.estado === e).length

  const piezas = app.piezas
    .filter(enCentro)
    .filter((p) => app.filtroEstado === 'Todas' || p.estado === app.filtroEstado)
    .filter((p) => {
      if (!q) return true
      const centro = app.centros.find((c) => String(c.id) === String(p.centro_id))
      return p.titulo.toLowerCase().includes(q) || (centro?.nombre ?? '').toLowerCase().includes(q)
    })

  const pestañas: Array<Estado | 'Todas'> = ['Todas', ...ESTADOS]

  return (
    <section className="fade" style={sx('padding:28px 32px 60px')}>
      <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px')}>
        <div style={sx('font-size:22px;font-weight:600;letter-spacing:-.02em')}>Contenido</div>
        <select
          value={app.contenidoCentro == null ? '' : String(app.contenidoCentro)}
          onChange={(e) => app.set({ contenidoCentro: e.target.value === '' ? null : e.target.value })}
          style={sx(
            "border:1px solid rgba(23,25,31,.14);border-radius:10px;padding:9px 12px;font-family:'Mulish';font-size:12.5px;font-weight:600;background:#fff;color:#17191f;cursor:pointer",
          )}
        >
          <option value="">Todos los centros</option>
          {app.centros.map((c) => (
            <option key={String(c.id)} value={String(c.id)}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Pestañas por estado (el ciclo de vida) */}
      <div style={sx('display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px')}>
        {pestañas.map((e) => {
          const activa = app.filtroEstado === e
          const n = cuenta(e)
          return (
            <button
              key={e}
              onClick={() => app.set({ filtroEstado: e })}
              style={sx(
                "display:inline-flex;align-items:center;gap:7px;border-radius:9px;padding:8px 12px;cursor:pointer;font-family:'Mulish';font-size:12.5px;font-weight:600",
                activa
                  ? 'background:#17191f;color:#fff;border:1px solid #17191f'
                  : 'background:#fff;color:#17191f;border:1px solid rgba(23,25,31,.12)',
              )}
            >
              {e === 'Todas' ? 'Todas' : ESTADO_LABEL[e]}
              <span style={sx(`font-size:10.5px;${activa ? 'color:rgba(255,255,255,.6)' : 'color:rgba(23,25,31,.4)'}`)}>{n}</span>
            </button>
          )
        })}
      </div>

      <input
        value={app.busquedaPiezas}
        onChange={(e) => app.set({ busquedaPiezas: e.target.value })}
        placeholder="Buscar por título o centro…"
        style={sx(
          "width:100%;max-width:360px;border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:9px 12px;font-family:'Mulish';font-size:12.5px;background:#fff;color:#17191f;margin-bottom:20px",
        )}
      />

      {piezas.length === 0 ? (
        <div style={sx('background:#fff;border:1px dashed rgba(23,25,31,.18);border-radius:14px;padding:44px;text-align:center;color:rgba(23,25,31,.5);font-size:12.5px;line-height:1.6')}>
          {app.piezas.length === 0
            ? 'Aún no hay piezas. Pulsa «+ Nueva creatividad» para crear la primera.'
            : app.filtroEstado === 'Todas'
              ? 'Ninguna pieza coincide con la búsqueda.'
              : `No hay piezas en «${ESTADO_LABEL[app.filtroEstado as Estado]}».`}
        </div>
      ) : (
        <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px')}>
          {piezas.map((p) => {
            const centro = app.centros.find((c) => String(c.id) === String(p.centro_id))
            return (
              <button
                key={p.id}
                onClick={() => app.abrirPieza(p.id)}
                className="hv-card"
                style={sx('text-align:left;background:#fff;border:1px solid rgba(23,25,31,.08);border-radius:14px;overflow:hidden;cursor:pointer;padding:0;transition:box-shadow .16s')}
              >
                <VistaPieza url={p.imagen_url} ratio={p.brief?.ratio ?? '4:5'} radio="0" titulo={p.titulo} compacto />
                <div style={sx('padding:11px 12px 12px')}>
                  <div style={sx('font-size:12.5px;font-weight:600;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>
                    {p.titulo}
                  </div>
                  <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:7px')}>
                    <span style={sx('font-size:10.5px;color:rgba(23,25,31,.5);overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>
                      {centro?.nombre ?? 'Sin centro'}
                    </span>
                    <span style={sx(`flex:none;font-size:9.5px;font-weight:700;padding:3px 7px;border-radius:999px;${TONO_ESTADO[p.estado]}`)}>
                      {ESTADO_LABEL[p.estado]}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
