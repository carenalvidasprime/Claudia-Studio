import { useMemo } from 'react'
import { sx } from '../lib/sx'
import { colorDeCentro, hueDeCentro, pill, plural, trama } from '../lib/ui'
import { Flecha } from '../components/Logos'
import { CLIENTE, DE_CLIENTE } from '../lib/cliente'
import { DEMO } from '../lib/demo'
import { useApp } from '../store'
import type { Centro, Hub } from '../lib/types'

export function Dashboard() {
  const app = useApp()

  const centrosFiltrados = useMemo(() => {
    const q = app.busquedaCentros.trim().toLowerCase()
    let lista = app.centros.filter(
      (c) =>
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        (c.ciudad ?? '').toLowerCase().includes(q),
    )
    if (app.hubFiltro != null) lista = lista.filter((c) => String(c.hub_id) === String(app.hubFiltro))
    lista =
      app.ordenCentros === 'A–Z'
        ? [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre))
        : [...lista].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    return lista
  }, [app.centros, app.busquedaCentros, app.ordenCentros, app.hubFiltro])

  const grupos = useMemo(() => {
    const porHub: { hub: Hub | null; centros: Centro[] }[] = app.hubs
      .filter((h) => app.hubFiltro == null || String(h.id) === String(app.hubFiltro))
      .map((h) => ({ hub: h, centros: centrosFiltrados.filter((c) => String(c.hub_id) === String(h.id)) }))
      .filter((g) => g.centros.length > 0)
    const huerfanos = centrosFiltrados.filter(
      (c) => c.hub_id == null || !app.hubs.some((h) => String(h.id) === String(c.hub_id)),
    )
    if (app.hubFiltro == null && huerfanos.length) porHub.push({ hub: null, centros: huerfanos })
    return porHub
  }, [app.hubs, app.hubFiltro, centrosFiltrados])

  return (
    <section className="fade" style={sx('padding:28px 32px 60px')}>
      <div style={sx('display:grid;grid-template-columns:1.5fr 1fr;border-radius:16px;overflow:hidden;margin-bottom:22px;min-height:172px')}>
        <div style={sx('background:linear-gradient(155deg,#fafafa 35%,#FDE8DE);padding:28px 30px;position:relative')}>
          <div style={sx('font-size:25px;font-weight:500;letter-spacing:-.02em;line-height:1.25')}>
            Una marca. Todos los centros{DE_CLIENTE}.
            <br />
            Cada pieza, coherente.
          </div>
          <Flecha style="position:absolute;left:30px;bottom:24px" />
        </div>
        <div
          style={sx(
            'background:linear-gradient(180deg,#f7dede,#f0c3ca);position:relative;display:flex;align-items:flex-end;justify-content:flex-end;padding:24px 28px',
          )}
        >
          <Flecha style="position:absolute;top:24px;right:30px" />
          <div style={sx('font-size:12px;color:rgba(23,25,31,.65);text-align:right;line-height:1.5;max-width:220px')}>
            Piezas listas para publicar, con la identidad{DE_CLIENTE} aplicada y el rigor de {CLIENTE.territorio} en cada una.
          </div>
        </div>
      </div>

      <div style={sx('display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:12px;flex-wrap:wrap')}>
        <div style={sx('font-size:14.5px;font-weight:600')}>Centros</div>
        <div style={sx('font-size:11.5px;color:rgba(23,25,31,.45)')}>
          {plural(app.centros.length, 'centro', 'centros')} · {plural(app.hubs.length, 'hub', 'hubs')} · {DEMO ? 'datos demo' : 'datos de Supabase'}
        </div>
      </div>

      {app.centros.length > 0 && (
        <div style={sx('display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap')}>
          <input
            value={app.busquedaCentros}
            onChange={(e) => app.set({ busquedaCentros: e.target.value })}
            placeholder="Buscar centro…"
            style={sx(
              "flex:1;min-width:180px;border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:9px 12px;font-family:'Mulish';font-size:12.5px;background:#fff;color:#17191f",
            )}
          />
          <div style={sx('display:flex;gap:5px')}>
            {(['Recientes', 'A–Z'] as const).map((o) => (
              <button key={o} onClick={() => app.set({ ordenCentros: o })} style={sx(pill(app.ordenCentros === o))}>
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {app.centros.length === 0 && !app.cargandoDatos && (
        <div style={sx('background:#fff;border:1px dashed rgba(23,25,31,.18);border-radius:14px;padding:44px;text-align:center')}>
          <div
            style={sx(
              'width:52px;height:52px;border-radius:14px;background:#f2f3f4;display:grid;place-items:center;font-size:22px;margin:0 auto 15px;color:rgba(23,25,31,.4)',
            )}
          >
            ◔
          </div>
          <div style={sx('font-size:14.5px;font-weight:600;color:rgba(23,25,31,.7)')}>No se ve ningún centro</div>
          <div
            style={sx(
              'font-size:12.5px;color:rgba(23,25,31,.5);margin-top:6px;line-height:1.55;max-width:420px;margin-left:auto;margin-right:auto',
            )}
          >
            Los centros se leen de la tabla <strong>centros</strong> de Supabase. Si la tabla tiene filas pero aquí no
            aparecen, falta aplicar las políticas RLS de <code>supabase/03_policies.sql</code>.
          </div>
        </div>
      )}

      {centrosFiltrados.length === 0 && app.centros.length > 0 && (
        <div
          style={sx(
            'background:#fff;border:1px dashed rgba(23,25,31,.18);border-radius:14px;padding:36px;text-align:center;color:rgba(23,25,31,.5);font-size:12.5px;line-height:1.5',
          )}
        >
          Ningún centro coincide con la búsqueda.
        </div>
      )}

      {grupos.map((g) => (
        <div key={g.hub ? String(g.hub.id) : 'sin-hub'} style={sx('margin-bottom:22px')}>
          <div
            style={sx(
              "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.09em;color:rgba(23,25,31,.45);font-weight:600;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(23,25,31,.08)",
            )}
          >
            {g.hub ? g.hub.nombre : 'Sin asignar'}
          </div>
          <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px')}>
            {g.centros.map((c) => (
              <TarjetaCentro key={String(c.id)} centro={c} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function TarjetaCentro({ centro }: { centro: Centro }) {
  const app = useApp()
  const hue = hueDeCentro(centro.id)
  const carpetas = app.carpetas.filter((c) => String(c.centro_id) === String(centro.id))
  const piezas = app.piezasDeCentro(centro.id)

  const detalle = [centro.tipo, centro.ciudad].filter(Boolean).join(' · ') || `Centro${DE_CLIENTE}`
  const cuenta = carpetas.length
    ? `${plural(carpetas.length, 'carpeta', 'carpetas')} · ${plural(piezas.length, 'pieza', 'piezas')}`
    : piezas.length
      ? plural(piezas.length, 'pieza', 'piezas')
      : 'Sin contenido aún'

  return (
    <div
      className="hv-card"
      onClick={() => app.abrirCentro(centro.id)}
      style={sx(
        'position:relative;background:#fff;border:1px solid rgba(23,25,31,.08);border-radius:15px;overflow:visible;cursor:pointer;transition:box-shadow .16s',
      )}
    >
      <div style={sx('display:flex;gap:2px;height:96px;background:#eef0f1;border-radius:15px 15px 0 0;overflow:hidden')}>
        <div style={sx(trama(hue, 0.91), 'flex:2')} />
        <div style={sx(trama(hue, 0.86, 0.04), 'flex:1')} />
        <div style={sx(trama(hue, 0.91), 'flex:1')} />
      </div>
      <div style={sx('padding:15px 16px 16px')}>
        <div style={sx('display:flex;align-items:center;gap:9px')}>
          <div style={sx(`width:26px;height:26px;border-radius:7px;background:${colorDeCentro(centro.id)};flex:none`)} />
          <div style={sx('line-height:1.25;min-width:0')}>
            <div style={sx('font-size:14.5px;font-weight:600')}>{centro.nombre}</div>
            <div style={sx('font-size:11px;color:rgba(23,25,31,.5)')}>{detalle}</div>
          </div>
        </div>
        <div style={sx('display:flex;align-items:center;margin-top:13px;padding-top:12px;border-top:1px solid rgba(23,25,31,.06)')}>
          <span style={sx('font-size:11.5px;color:rgba(23,25,31,.5)')}>{cuenta}</span>
          <span style={sx('margin-left:auto;font-size:12.5px;font-weight:600;color:#17191f')}>Abrir →</span>
        </div>
      </div>
    </div>
  )
}
