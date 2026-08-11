import { useMemo } from 'react'
import { sx } from '../lib/sx'
import { colorEstado, pill } from '../lib/ui'
import { ESTADO_LABEL, ESTADOS, type Pieza } from '../lib/types'
import { useApp } from '../store'

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function rejillaMes(anio: number, mes: number): (Date | null)[][] {
  const primero = new Date(anio, mes, 1)
  const desplazamiento = (primero.getDay() + 6) % 7 // semana europea: lunes primero
  const dias = new Date(anio, mes + 1, 0).getDate()
  const celdas: (Date | null)[] = Array(desplazamiento).fill(null)
  for (let d = 1; d <= dias; d++) celdas.push(new Date(anio, mes, d))
  while (celdas.length % 7 !== 0) celdas.push(null)
  const semanas: (Date | null)[][] = []
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7))
  return semanas
}

export function Calendario() {
  const app = useApp()

  const centroScope = app.centros.find((c) => String(c.id) === String(app.calCentroScope)) ?? null
  const hubScope = app.hubs.find((h) => String(h.id) === String(app.calHubScope)) ?? null

  const centroDe = (p: Pieza) => app.centros.find((c) => String(c.id) === String(p.centro_id)) ?? null

  const filtradas = useMemo(
    () =>
      app.piezas.filter((p) => {
        if (p.descartada) return false
        if (!p.fecha_publicacion) return false
        if (app.calEstado !== 'Todas' && p.estado !== app.calEstado) return false
        if (centroScope) return String(p.centro_id) === String(centroScope.id)
        const centro = app.centros.find((c) => String(c.id) === String(p.centro_id))
        if (hubScope) return String(centro?.hub_id) === String(hubScope.id)
        if (app.calHub != null) return String(centro?.hub_id) === String(app.calHub)
        return true
      }),
    [app.piezas, app.centros, app.calEstado, app.calHub, centroScope, hubScope],
  )

  const porFecha = useMemo(() => {
    const mapa: Record<string, Pieza[]> = {}
    for (const p of filtradas) {
      const k = p.fecha_publicacion as string
      ;(mapa[k] ??= []).push(p)
    }
    for (const k of Object.keys(mapa)) mapa[k].sort((a, b) => a.titulo.localeCompare(b.titulo))
    return mapa
  }, [filtradas])

  const semanas = rejillaMes(app.calAnio, app.calMes)
  const hoy = iso(new Date())

  const titulo = centroScope
    ? `Calendario · ${centroScope.nombre}`
    : hubScope
      ? `Calendario · ${hubScope.nombre}`
      : 'Calendario · Todos los centros'

  const volver = () => {
    if (centroScope) app.set({ pantalla: 'centro', centroTab: 'carpetas' })
    else app.set({ pantalla: 'dashboard' })
  }

  const prev = () =>
    app.set((p) => (p.calMes === 0 ? { calMes: 11, calAnio: p.calAnio - 1 } : { calMes: p.calMes - 1 }))
  const next = () =>
    app.set((p) => (p.calMes === 11 ? { calMes: 0, calAnio: p.calAnio + 1 } : { calMes: p.calMes + 1 }))

  return (
    <section className="fade" style={sx('padding:28px 32px 60px')}>
      {(centroScope || hubScope) && (
        <button
          onClick={volver}
          style={sx(
            "display:flex;align-items:center;gap:6px;background:#fff;border:1px solid rgba(23,25,31,.1);border-radius:9px;padding:8px 12px;font-family:'Mulish';font-weight:600;font-size:12.5px;cursor:pointer;color:#17191f;margin-bottom:14px",
          )}
        >
          {centroScope ? '← Volver al centro' : '← Volver al hub'}
        </button>
      )}

      <div style={sx('font-size:15px;font-weight:700;margin-bottom:14px')}>{titulo}</div>

      <div style={sx('display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:16px')}>
        <div style={sx('display:flex;align-items:center;gap:12px')}>
          <button
            onClick={prev}
            style={sx('width:32px;height:32px;border-radius:9px;border:1px solid rgba(23,25,31,.14);background:#fff;color:#17191f;font-size:14px;cursor:pointer')}
          >
            ←
          </button>
          <div style={sx('font-size:16px;font-weight:700;min-width:150px;text-align:center')}>
            {MESES[app.calMes]} {app.calAnio}
          </div>
          <button
            onClick={next}
            style={sx('width:32px;height:32px;border-radius:9px;border:1px solid rgba(23,25,31,.14);background:#fff;color:#17191f;font-size:14px;cursor:pointer')}
          >
            →
          </button>
        </div>
        <div style={sx('display:flex;gap:14px;flex-wrap:wrap')}>
          {!centroScope && !hubScope && (
            <div style={sx('display:flex;gap:5px;flex-wrap:wrap')}>
              <button onClick={() => app.set({ calHub: null })} style={sx(pill(app.calHub == null))}>
                Todos
              </button>
              {app.hubs.map((h) => (
                <button
                  key={String(h.id)}
                  onClick={() => app.set({ calHub: h.id })}
                  style={sx(pill(String(app.calHub) === String(h.id)))}
                >
                  {h.nombre}
                </button>
              ))}
            </div>
          )}
          <div style={sx('display:flex;gap:5px;flex-wrap:wrap')}>
            {(['Todas', ...ESTADOS] as const).map((e) => (
              <button key={e} onClick={() => app.set({ calEstado: e })} style={sx(pill(app.calEstado === e))}>
                {e === 'Todas' ? 'Todas' : ESTADO_LABEL[e]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={sx('display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:14px')}>
        {ESTADOS.map((e) => (
          <div key={e} style={sx('display:flex;align-items:center;gap:6px;font-size:11.5px;color:rgba(23,25,31,.6)')}>
            <span style={sx(`width:9px;height:9px;border-radius:50%;background:${colorEstado(e)}`)} />
            {ESTADO_LABEL[e]}
          </div>
        ))}
      </div>

      <div style={sx('display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px')}>
        {DIAS.map((d, i) => (
          <div
            key={d + i}
            style={sx(
              "text-align:center;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.06em;color:rgba(23,25,31,.4);padding:4px 0",
            )}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={sx('display:flex;flex-direction:column;gap:6px')}>
        {semanas.map((semana, wi) => (
          <div key={wi} style={sx('display:grid;grid-template-columns:repeat(7,1fr);gap:6px')}>
            {semana.map((dia, di) => {
              if (!dia)
                return (
                  <div key={di} style={sx('border-radius:10px;min-height:96px;padding:6px;background:transparent')} />
                )
              const clave = iso(dia)
              const items = porFecha[clave] ?? []
              const visibles = items.slice(0, 3)
              const extra = items.length - visibles.length
              return (
                <div
                  key={di}
                  style={sx(
                    'background:#fff;border:1px solid rgba(23,25,31,.08);border-radius:10px;min-height:96px;padding:6px;display:flex;flex-direction:column',
                    clave === hoy && 'box-shadow:inset 0 0 0 1.5px #17191f',
                  )}
                >
                  <span
                    style={sx("font-family:'IBM Plex Mono',monospace;font-size:10px;color:rgba(23,25,31,.45);margin-bottom:4px")}
                  >
                    {dia.getDate()}
                  </span>
                  {visibles.map((p) => {
                    const centro = centroDe(p)
                    const sub = `${centro?.nombre ?? '—'} · ${p.canal ?? '—'}`
                    return (
                      <div
                        key={p.id}
                        title={`${p.titulo} — ${sub}`}
                        onClick={() => app.abrirPieza(p.id)}
                        style={sx(
                          `background:${colorEstado(p.estado)};color:#fff;border-radius:5px;padding:3px 6px;margin-bottom:3px;cursor:pointer;overflow:hidden`,
                        )}
                      >
                        <div
                          style={sx(
                            'font-size:9.5px;font-weight:600;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis',
                          )}
                        >
                          {p.titulo}
                        </div>
                        <div style={sx('font-size:8px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>
                          {sub}
                        </div>
                      </div>
                    )
                  })}
                  {extra > 0 && (
                    <div style={sx('font-size:9px;color:rgba(23,25,31,.45);margin-top:1px')}>+{extra} más</div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {filtradas.length === 0 && (
        <div
          style={sx(
            'margin-top:18px;background:#fff;border:1px dashed rgba(23,25,31,.18);border-radius:14px;padding:28px;text-align:center;color:rgba(23,25,31,.5);font-size:12.5px;line-height:1.55',
          )}
        >
          Ninguna pieza tiene fecha de publicación en este alcance. Asígnala desde la tarjeta de cada creatividad.
        </div>
      )}
    </section>
  )
}
