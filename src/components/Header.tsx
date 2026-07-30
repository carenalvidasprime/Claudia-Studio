import { Fragment } from 'react'
import { sx } from '../lib/sx'
import { useApp, type Pantalla } from '../store'

const TITULOS: Record<Pantalla, string> = {
  dashboard: 'Tus centros',
  calendario: 'Calendario editorial',
  marcaRibera: 'Marca Ribera',
  centro: '',
  gateway: 'Nueva creatividad',
  situaciones: 'Elige una situación',
  pasoTestConsent: 'Consentimiento',
  pasoTestExposicion: 'Nivel de exposición',
  pasoColabPersonas: 'Personas en imagen',
  pasoColabEntorno: 'Entorno',
  pasoHitoValidacion: 'Validación clínica',
  pasoHitoEntorno: 'Entorno de grabación',
  brief: '¿Qué necesitas crear?',
  estudio: 'Estudio de generación',
  detalle: 'Revisión y retoque',
  exportar: 'Publicar y exportar',
}

const CON_VOLVER: Pantalla[] = [
  'centro',
  'brief',
  'estudio',
  'detalle',
  'exportar',
  'marcaRibera',
  'gateway',
  'situaciones',
  'pasoTestConsent',
  'pasoTestExposicion',
  'pasoColabPersonas',
  'pasoColabEntorno',
  'pasoHitoValidacion',
  'pasoHitoEntorno',
]

interface Seg {
  label: string
  ir?: () => void
}

export function Header() {
  const app = useApp()
  const centro = app.centroActual
  const carpeta = app.carpetaActual
  const hub = app.hubs.find((h) => String(h.id) === String(app.hubFiltro))

  const titulo = app.pantalla === 'centro' ? (centro?.nombre ?? 'Centro') : TITULOS[app.pantalla]

  const segDash: Seg = { label: 'CENTROS', ir: () => app.set({ pantalla: 'dashboard' }) }
  const segCentro: Seg | null = centro
    ? { label: centro.nombre.toUpperCase(), ir: () => app.abrirCentro(centro.id) }
    : null
  const segCarpeta: Seg | null = carpeta
    ? {
        label: carpeta.nombre.toUpperCase(),
        ir: () =>
          app.set((p) => ({
            pantalla: 'centro',
            centroTab: 'carpetas',
            desplegadas: { ...p.desplegadas, [String(carpeta.id)]: true },
          })),
      }
    : null

  const conRuta = (final: string): Seg[] =>
    [segDash, segCentro, segCarpeta, { label: final }].filter(Boolean) as Seg[]

  let segs: Seg[] = []
  switch (app.pantalla) {
    case 'dashboard':
      segs = [{ label: (hub ? hub.nombre : 'Todos los centros').toUpperCase() }]
      break
    case 'calendario':
      segs = [{ label: 'CALENDARIO' }]
      break
    case 'marcaRibera':
      segs = [{ label: 'MARCA RIBERA' }]
      break
    case 'centro':
      segs = [segDash, { label: (centro?.nombre ?? 'CENTRO').toUpperCase() }]
      break
    case 'gateway':
    case 'brief':
      segs = conRuta('NUEVA CREATIVIDAD')
      break
    case 'situaciones':
      segs = conRuta('SITUACIÓN')
      break
    case 'pasoTestConsent':
      segs = conRuta('TESTIMONIO · CONSENTIMIENTO')
      break
    case 'pasoTestExposicion':
      segs = conRuta('TESTIMONIO · EXPOSICIÓN')
      break
    case 'pasoColabPersonas':
      segs = conRuta('COLABORACIÓN · PERSONAS')
      break
    case 'pasoColabEntorno':
      segs = conRuta('COLABORACIÓN · ENTORNO')
      break
    case 'pasoHitoValidacion':
      segs = conRuta('HITO · VALIDACIÓN')
      break
    case 'pasoHitoEntorno':
      segs = conRuta('HITO · ENTORNO')
      break
    case 'estudio':
      segs = conRuta(app.borrador.formato.toUpperCase())
      break
    case 'detalle':
      segs = conRuta('REVISIÓN')
      break
    case 'exportar':
      segs = conRuta('ENTREGA')
      break
  }

  return (
    <header
      style={sx(
        'position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:14px;padding:15px 32px;background:rgba(242,242,242,.8);backdrop-filter:blur(10px);border-bottom:1px solid rgba(23,25,31,.07)',
      )}
    >
      {CON_VOLVER.includes(app.pantalla) && (
        <button
          onClick={app.volver}
          style={sx(
            "display:flex;align-items:center;gap:6px;background:#fff;border:1px solid rgba(23,25,31,.1);border-radius:9px;padding:8px 12px;font-family:'Mulish';font-weight:500;font-size:12.5px;cursor:pointer;color:#17191f;flex:none",
          )}
        >
          ← Volver
        </button>
      )}
      <div style={sx('min-width:0')}>
        <div style={sx('display:flex;align-items:center;gap:6px;flex-wrap:wrap')}>
          {segs.map((sg, i) => (
            <Fragment key={sg.label + i}>
              {i > 0 && (
                <span style={sx("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:rgba(23,25,31,.3)")}>›</span>
              )}
              <button
                onClick={sg.ir}
                className={sg.ir ? 'hv-crumb' : undefined}
                style={sx(
                  'background:none;border:none;padding:0;font-family:IBM Plex Mono,monospace;font-size:9.5px;letter-spacing:.09em;' +
                    (sg.ir ? 'color:rgba(23,25,31,.5);cursor:pointer' : 'color:rgba(23,25,31,.4);cursor:default'),
                )}
              >
                {sg.label}
              </button>
            </Fragment>
          ))}
        </div>
        <div style={sx('font-size:18px;font-weight:600;margin-top:3px')}>{titulo}</div>
      </div>
      <div style={sx('margin-left:auto;display:flex;align-items:center;gap:9px')}>
        {app.pantalla === 'dashboard' && app.hubFiltro != null && (
          <button
            onClick={app.abrirCalendarioHub}
            style={sx(
              "display:flex;align-items:center;gap:7px;background:#fff;color:#17191f;border:1px solid rgba(23,25,31,.14);border-radius:10px;padding:10px 15px;font-family:'Mulish';font-weight:600;font-size:12.5px;cursor:pointer",
            )}
          >
            ▦ Ver calendario
          </button>
        )}
        <div
          style={sx(
            'display:flex;align-items:center;gap:7px;background:#fff;border:1px solid rgba(23,25,31,.09);border-radius:20px;padding:7px 12px;font-size:11.5px;font-weight:500;color:rgba(23,25,31,.6)',
          )}
          title={
            app.generarDisponible
              ? 'La generación está conectada al workflow de n8n.'
              : 'Falta configurar el webhook de n8n (VITE_N8N_GENERAR_URL).'
          }
        >
          <span
            style={sx(
              `width:6px;height:6px;border-radius:50%;background:${app.generarDisponible ? 'oklch(0.62 0.13 155)' : 'oklch(0.68 0.15 70)'}`,
            )}
          />
          {app.generarDisponible ? 'n8n conectado' : 'n8n sin configurar'}
        </div>
      </div>
    </header>
  )
}
