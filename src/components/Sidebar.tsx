import { sx } from '../lib/sx'
import { navBtn, navDot } from '../lib/ui'
import { useApp, type Pantalla } from '../store'
import { Lockup } from './Logos'

const EN_CENTROS: Pantalla[] = [
  'dashboard',
  'centro',
  'gateway',
  'situaciones',
  'pasoTestConsent',
  'pasoTestExposicion',
  'pasoColabPersonas',
  'pasoColabEntorno',
  'pasoHitoValidacion',
  'pasoHitoEntorno',
  'brief',
  'estudio',
  'detalle',
  'exportar',
]

function Grupo({ titulo, items }: { titulo: string; items: { nombre: string; activo: boolean; ir: () => void }[] }) {
  if (!items.length) return null
  return (
    <div
      style={sx(
        'display:flex;flex-direction:column;gap:2px',
        titulo !== 'TRABAJO' && 'margin-top:14px;padding-top:14px;border-top:1px solid rgba(23,25,31,.08)',
      )}
    >
      <div
        style={sx(
          "font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.1em;color:rgba(23,25,31,.35);padding:0 8px 6px",
        )}
      >
        {titulo}
      </div>
      {items.map((it) => (
        <button key={it.nombre} onClick={it.ir} style={sx(navBtn(it.activo))}>
          <span style={sx(navDot(it.activo))} />
          {it.nombre}
        </button>
      ))}
    </div>
  )
}

export function Sidebar() {
  const app = useApp()
  const enCentros = EN_CENTROS.includes(app.pantalla)

  const trabajo = [
    {
      nombre: 'Todos los centros',
      activo: enCentros && !app.hubFiltro,
      ir: () => app.set({ hubFiltro: null, pantalla: 'dashboard' }),
    },
    {
      nombre: 'Calendario',
      activo: app.pantalla === 'calendario' && !app.calCentroScope && !app.calHubScope,
      ir: () => app.set({ calCentroScope: null, calHubScope: null, pantalla: 'calendario' }),
    },
  ]

  const hubs = app.hubs.map((h) => ({
    nombre: h.nombre,
    activo: enCentros && String(app.hubFiltro) === String(h.id),
    ir: () => app.set({ hubFiltro: h.id, pantalla: 'dashboard' }),
  }))

  const marca = [
    { nombre: 'Marca Ribera', activo: app.pantalla === 'marcaRibera', ir: () => app.ir('marcaRibera') },
  ]

  const correo = app.sesion?.user.email ?? ''

  return (
    <aside
      style={sx(
        'background:#fff;border-right:1px solid rgba(23,25,31,.08);display:flex;flex-direction:column;padding:20px 14px;gap:22px;overflow-y:auto',
      )}
    >
      <div style={sx('padding:2px 6px')}>
        <Lockup variante="sidebar" />
      </div>

      <Grupo titulo="TRABAJO" items={trabajo} />
      <Grupo titulo="HUBS" items={hubs} />
      <Grupo titulo="MARCA" items={marca} />

      <div style={sx('margin-top:auto;display:flex;flex-direction:column;gap:12px')}>
        <div style={sx('display:flex;align-items:center;gap:9px;padding:2px')}>
          <div style={sx('width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#D71029,#f26d84);flex:none')} />
          <div style={sx('line-height:1.25;min-width:0')}>
            <div style={sx('font-size:12.5px;font-weight:600')}>Grupo Ribera</div>
            <div
              style={sx(
                'font-size:10.5px;color:rgba(23,25,31,.45);overflow:hidden;text-overflow:ellipsis;white-space:nowrap',
              )}
              title={correo}
            >
              {correo || 'Comunicación · Salud Responsable'}
            </div>
          </div>
        </div>
        <button
          onClick={() => void app.salir()}
          style={sx(
            "width:100%;background:#f4f4f4;border:1px solid rgba(23,25,31,.1);border-radius:9px;padding:9px;font-family:'Mulish';font-weight:500;font-size:12px;cursor:pointer;color:#17191f",
          )}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
