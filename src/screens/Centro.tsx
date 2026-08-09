import { useMemo } from 'react'
import { sx } from '../lib/sx'
import { badgeEstado, colorDeCentro, colorEstado, pill, plural, tabBtn } from '../lib/ui'
import { ESTADO_LABEL, ESTADOS, type Carpeta, type Estado, type Pieza } from '../lib/types'
import { EtiquetaRatio, IconoAnimacion, VistaPieza } from '../components/Piezas'
import { MenuTarjeta } from '../components/Overlays'
import * as api from '../lib/api'
import { mensajeError } from '../lib/supabase'
import { useApp } from '../store'
import { TERRITORIO, TIPOGRAFIA } from '../lib/marca'
import { CLIENTE, DE_CLIENTE } from '../lib/cliente'

export function CentroScreen() {
  const app = useApp()
  const centro = app.centroActual
  if (!centro) return null

  const carpetas = app.carpetas.filter((c) => String(c.centro_id) === String(centro.id))
  const piezas = app.piezasDeCentro(centro.id)
  const hub = app.hubDeCentro(centro)

  const meta = [centro.tipo, centro.ciudad, hub?.nombre].filter(Boolean).join(' · ')

  return (
    <section className="fade" style={sx('padding:26px 32px 60px')}>
      <div
        style={sx(
          'display:flex;align-items:center;gap:14px;background:#fff;border:1px solid rgba(23,25,31,.08);border-radius:15px;padding:18px 20px;margin-bottom:22px;flex-wrap:wrap',
        )}
      >
        <div style={sx(`width:44px;height:44px;border-radius:11px;background:${colorDeCentro(centro.id)};flex:none`)} />
        <div>
          <div style={sx('font-size:17px;font-weight:600')}>{centro.nombre}</div>
          <div style={sx('font-size:12px;color:rgba(23,25,31,.5);margin-top:2px')}>
            {meta}
            {carpetas.length ? ` · ${plural(carpetas.length, 'carpeta', 'carpetas')}` : ''}
          </div>
        </div>
        <button
          onClick={app.abrirCalendarioCentro}
          style={sx(
            "margin-left:auto;display:flex;align-items:center;gap:7px;background:#fff;color:#17191f;border:1px solid rgba(23,25,31,.14);border-radius:10px;padding:10px 15px;font-family:'Mulish';font-weight:600;font-size:12.5px;cursor:pointer",
          )}
        >
          ▦ Ver calendario
        </button>
        <button
          onClick={() => void app.nuevaCarpeta()}
          style={sx(
            "display:flex;align-items:center;gap:7px;background:#D71029;color:#fff;border:none;border-radius:10px;padding:10px 15px;font-family:'Mulish';font-weight:600;font-size:12.5px;cursor:pointer",
          )}
        >
          <span style={sx('font-size:15px;line-height:1;margin-top:-1px')}>+</span> Nueva carpeta
        </button>
      </div>

      <div style={sx('display:flex;gap:2px;margin-bottom:18px;border-bottom:1px solid rgba(23,25,31,.08)')}>
        {(
          [
            ['carpetas', 'Carpetas'],
            ['marca', 'Marca y estilo'],
          ] as const
        ).map(([id, nombre]) => (
          <button key={id} onClick={() => app.set({ centroTab: id })} style={sx(tabBtn(app.centroTab === id))}>
            {nombre}
          </button>
        ))}
      </div>

      {app.centroTab === 'carpetas' ? (
        <TabCarpetas carpetas={carpetas} piezasCentro={piezas} />
      ) : (
        <TabMarca />
      )}
    </section>
  )
}

function TabCarpetas({ carpetas, piezasCentro }: { carpetas: Carpeta[]; piezasCentro: Pieza[] }) {
  const app = useApp()

  const lista = useMemo(() => {
    const q = app.busquedaCarpetas.trim().toLowerCase()
    const filtradas = carpetas.filter((c) => !q || c.nombre.toLowerCase().includes(q))
    return app.ordenCarpetas === 'A–Z'
      ? [...filtradas].sort((a, b) => a.nombre.localeCompare(b.nombre))
      : [...filtradas].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  }, [carpetas, app.busquedaCarpetas, app.ordenCarpetas])

  const sinCarpeta = piezasCentro.filter((p) => p.carpeta_id == null)

  return (
    <>
      {carpetas.length > 0 && (
        <div style={sx('display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap')}>
          <input
            value={app.busquedaCarpetas}
            onChange={(e) => app.set({ busquedaCarpetas: e.target.value })}
            placeholder="Buscar carpeta…"
            style={sx(
              "flex:1;min-width:180px;border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:9px 12px;font-family:'Mulish';font-size:12.5px;background:#fff;color:#17191f",
            )}
          />
          <div style={sx('display:flex;gap:5px')}>
            {(['Recientes', 'A–Z'] as const).map((o) => (
              <button key={o} onClick={() => app.set({ ordenCarpetas: o })} style={sx(pill(app.ordenCarpetas === o))}>
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {piezasCentro.length > 0 && (
        <div style={sx('display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap')}>
          <input
            value={app.busquedaPiezas}
            onChange={(e) => app.set({ busquedaPiezas: e.target.value })}
            placeholder="Buscar creatividad en todas las carpetas…"
            style={sx(
              "flex:1;min-width:200px;border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:9px 12px;font-family:'Mulish';font-size:12.5px;background:#fff;color:#17191f",
            )}
          />
          <div style={sx('display:flex;gap:5px;flex-wrap:wrap')}>
            {(['Todas', ...ESTADOS] as const).map((o) => (
              <button key={o} onClick={() => app.set({ filtroEstado: o })} style={sx(pill(app.filtroEstado === o))}>
                {o === 'Todas' ? 'Todas' : ESTADO_LABEL[o]}
              </button>
            ))}
          </div>
        </div>
      )}

      {app.errorDatos && (
        <div
          style={sx(
            'background:#FDE8DE;border:1px solid rgba(215,16,41,.25);border-radius:12px;padding:14px 16px;font-size:12px;line-height:1.55;color:#1D1D1B;margin-bottom:16px',
          )}
        >
          {app.errorDatos}
        </div>
      )}

      {carpetas.length === 0 && (
        <div
          style={sx(
            'background:#fff;border:1px dashed rgba(23,25,31,.18);border-radius:14px;padding:36px;text-align:center;color:rgba(23,25,31,.5);font-size:12.5px;line-height:1.5;margin-bottom:14px',
          )}
        >
          Aún no hay carpetas para este centro.
          <br />
          Crea la primera con «+ Nueva carpeta».
        </div>
      )}

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;align-items:start')}>
        {lista.map((c) => (
          <TarjetaCarpeta key={String(c.id)} carpeta={c} />
        ))}
        <button
          className="hv-newfolder"
          onClick={() => void app.nuevaCarpeta()}
          style={sx(
            "display:flex;align-items:center;justify-content:center;gap:8px;background:none;border:1.5px dashed rgba(23,25,31,.2);border-radius:15px;padding:16px;min-height:150px;font-family:'Mulish';font-weight:600;font-size:13px;color:rgba(23,25,31,.55);cursor:pointer",
          )}
        >
          <span style={sx('font-size:16px;line-height:1')}>+</span> Nueva carpeta
        </button>
      </div>

      {sinCarpeta.length > 0 && (
        <div style={sx('margin-top:26px')}>
          <div
            style={sx(
              "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.09em;color:rgba(23,25,31,.45);font-weight:600;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(23,25,31,.08)",
            )}
          >
            SIN CARPETA · {plural(sinCarpeta.length, 'pieza', 'piezas')}
          </div>
          <RejillaPiezas piezas={sinCarpeta} />
        </div>
      )}
    </>
  )
}

function TarjetaCarpeta({ carpeta }: { carpeta: Carpeta }) {
  const app = useApp()
  const todas = app.piezasDeCarpeta(carpeta.id)
  const q = app.busquedaPiezas.trim().toLowerCase()
  const visibles = todas.filter(
    (p) =>
      (!q || p.titulo.toLowerCase().includes(q)) &&
      (app.filtroEstado === 'Todas' || p.estado === app.filtroEstado),
  )
  const desplegada = !!app.desplegadas[String(carpeta.id)]
  const previas = visibles.slice(0, 3)

  const resumen = ESTADOS.map((e) => {
    const n = todas.filter((p) => p.estado === e).length
    return n ? { estado: e, texto: `${n} ${ESTADO_LABEL[e].toLowerCase()}` } : null
  }).filter(Boolean) as { estado: Estado; texto: string }[]

  const renombrar = () =>
    app.abrirModal({
      tipo: 'renombrar',
      titulo: 'Renombrar carpeta',
      sub: 'Escribe el nuevo nombre.',
      valor: carpeta.nombre,
      confirmar: async (valor) => {
        const nombre = valor.trim() || carpeta.nombre
        app.set((p) => ({ carpetas: p.carpetas.map((c) => (c.id === carpeta.id ? { ...c, nombre } : c)) }))
        try {
          await api.renombrarCarpeta(carpeta.id, nombre)
        } catch (error) {
          app.avisar(mensajeError(error), 'error')
          void app.recargar()
        }
      },
    })

  const eliminar = () =>
    app.abrirModal({
      tipo: 'eliminar',
      titulo: 'Eliminar carpeta',
      sub: `Se eliminará «${carpeta.nombre}». Sus creatividades no se borran: quedan sin carpeta.`,
      confirmar: async () => {
        try {
          await api.borrarCarpeta(carpeta.id)
          await app.recargar()
          app.avisar('Carpeta eliminada')
        } catch (error) {
          app.avisar(mensajeError(error), 'error')
        }
      },
    })

  return (
    <div style={sx('position:relative;background:#fff;border:1px solid rgba(23,25,31,.08);border-radius:15px;overflow:visible')}>
      <MenuTarjeta
        clave={'carpeta:' + carpeta.id}
        acciones={[
          { nombre: 'Renombrar', hacer: renombrar },
          { nombre: 'Eliminar', peligro: true, hacer: eliminar },
        ]}
      />

      <div
        onClick={() =>
          app.set((p) => ({ desplegadas: { ...p.desplegadas, [String(carpeta.id)]: !p.desplegadas[String(carpeta.id)] } }))
        }
        style={sx('cursor:pointer')}
      >
        {previas.length === 0 ? (
          <div
            style={sx(
              'height:150px;border-radius:15px 15px 0 0;background:#fafafa;display:grid;place-items:center;color:rgba(23,25,31,.4);font-size:12px',
            )}
          >
            Sin creatividades aún
          </div>
        ) : (
          <div style={sx('display:flex;gap:2px;height:150px;border-radius:15px 15px 0 0;overflow:hidden;background:#eef0f1')}>
            {previas.map((p, i) => (
              <div key={p.id} style={sx(`flex:${i === 0 && previas.length > 1 ? '1.5' : '1'};position:relative;overflow:hidden`)}>
                <VistaPieza url={p.imagen_url} ratio={null} radio="0" titulo={p.titulo} compacto />
                <span
                  style={sx(
                    `position:absolute;left:0;right:0;bottom:0;padding:${i === 0 ? '10px' : '7px'};background:linear-gradient(180deg,rgba(23,25,31,0),rgba(23,25,31,.72));color:#fff;font-weight:700;font-size:${i === 0 ? '11.5px' : '9.5px'};line-height:1.25`,
                  )}
                >
                  {p.titulo}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={sx('padding:15px 16px 16px')}>
          <div style={sx('display:flex;align-items:center;gap:8px')}>
            <span
              style={sx(
                'font-size:11px;color:#706F6F;transition:transform .15s;flex:none;' + (desplegada ? 'transform:rotate(90deg)' : ''),
              )}
            >
              ▸
            </span>
            <div style={sx('font-size:14.5px;font-weight:600')}>{carpeta.nombre}</div>
          </div>
          <div
            style={sx(
              'display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(23,25,31,.06)',
            )}
          >
            <span style={sx('font-size:11.5px;color:rgba(23,25,31,.5)')}>
              {todas.length ? plural(todas.length, 'creatividad', 'creatividades') : 'Sin creatividades aún'}
            </span>
            {resumen.map((r) => (
              <span
                key={r.estado}
                style={sx('display:flex;align-items:center;gap:5px;font-size:11.5px;color:rgba(23,25,31,.5)')}
              >
                <span style={sx(`width:7px;height:7px;border-radius:50%;background:${colorEstado(r.estado)};flex:none`)} />
                {r.texto}
              </span>
            ))}
          </div>
        </div>
      </div>

      {desplegada && (
        <div style={sx('padding:0 16px 18px;border-top:1px solid rgba(23,25,31,.06)')}>
          <div style={sx('display:flex;gap:8px;margin:14px 0')}>
            <button
              onClick={() => app.nuevaCreatividad(carpeta.id)}
              style={sx(
                "display:flex;align-items:center;gap:6px;background:#D71029;color:#fff;border:none;border-radius:9px;padding:8px 13px;font-family:'Mulish';font-weight:600;font-size:12px;cursor:pointer",
              )}
            >
              + Nueva creatividad
            </button>
          </div>
          {visibles.length === 0 ? (
            <div style={sx('color:rgba(23,25,31,.45);font-size:12px;padding:6px 0 12px')}>
              {todas.length ? 'Ninguna creatividad coincide con el filtro.' : 'Sin creatividades todavía.'}
            </div>
          ) : (
            <RejillaPiezas piezas={visibles} />
          )}
        </div>
      )}
    </div>
  )
}

export function RejillaPiezas({ piezas }: { piezas: Pieza[] }) {
  return (
    <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px')}>
      {piezas.map((p) => (
        <TarjetaPieza key={p.id} pieza={p} />
      ))}
    </div>
  )
}

function TarjetaPieza({ pieza }: { pieza: Pieza }) {
  const app = useApp()
  const linea = app.lineaDe(pieza.linea_id)
  const ratio = pieza.brief?.ratio ?? '4:5'
  const esAnimacion = pieza.brief?.formato === 'Animación'

  const acciones = [
    ...(pieza.estado === 'borrador'
      ? [{ nombre: 'Enviar a revisión', hacer: () => void app.ponerEstado(pieza.id, 'en_revision') }]
      : []),
    ...(pieza.estado === 'en_revision'
      ? [{ nombre: 'Aprobar', hacer: () => void app.ponerEstado(pieza.id, 'aprobado') }]
      : []),
    ...(pieza.estado === 'aprobado'
      ? [{ nombre: 'Programar', hacer: () => void app.ponerEstado(pieza.id, 'programado') }]
      : []),
    ...(pieza.imagen_url
      ? [
          {
            nombre: 'Descargar imagen',
            hacer: () => {
              app.alternarMenu('')
              window.open(pieza.imagen_url as string, '_blank', 'noopener')
            },
          },
        ]
      : []),
    {
      nombre: 'Duplicar',
      hacer: async () => {
        app.alternarMenu('')
        try {
          await api.duplicarPieza(pieza)
          await app.recargar()
          app.avisar('Creatividad duplicada ✓')
        } catch (error) {
          app.avisar(mensajeError(error), 'error')
        }
      },
    },
    {
      nombre: 'Renombrar',
      hacer: () =>
        app.abrirModal({
          tipo: 'renombrar',
          titulo: 'Renombrar creatividad',
          sub: 'Escribe el nuevo nombre.',
          valor: pieza.titulo,
          confirmar: async (valor) => {
            const titulo = valor.trim() || pieza.titulo
            app.set((p) => ({ piezas: p.piezas.map((x) => (x.id === pieza.id ? { ...x, titulo } : x)) }))
            try {
              await api.actualizarPieza(pieza.id, { titulo })
            } catch (error) {
              app.avisar(mensajeError(error), 'error')
              void app.recargar()
            }
          },
        }),
    },
    {
      nombre: 'Eliminar',
      peligro: true,
      hacer: () =>
        app.abrirModal({
          tipo: 'eliminar',
          titulo: 'Eliminar creatividad',
          sub: `Se eliminará «${pieza.titulo}». Esta acción no se puede deshacer.`,
          confirmar: async () => {
            try {
              await api.borrarPieza(pieza.id)
              app.set((p) => ({ piezas: p.piezas.filter((x) => x.id !== pieza.id) }))
              app.avisar('Creatividad eliminada')
            } catch (error) {
              app.avisar(mensajeError(error), 'error')
            }
          },
        }),
    },
  ]

  return (
    <div
      className="hv-card"
      onClick={() => app.abrirPieza(pieza.id)}
      style={sx(
        'position:relative;background:#fafafa;border:1px solid rgba(23,25,31,.08);border-radius:13px;overflow:visible;cursor:pointer;transition:box-shadow .16s',
      )}
    >
      <MenuTarjeta clave={'pieza:' + pieza.id} acciones={acciones} posicion={{ top: '9px', right: '9px' }} tam={26} />
      <div style={sx('border-radius:13px 13px 0 0;overflow:hidden')}>
        <VistaPieza
          url={pieza.imagen_url}
          ratio={ratio}
          radio="0"
          titulo={pieza.titulo}
          extra={
            <>
              <EtiquetaRatio ratio={ratio} />
              {esAnimacion && <IconoAnimacion />}
            </>
          }
        />
      </div>
      <div style={sx('padding:11px 13px 12px')}>
        <div style={sx('display:flex;align-items:center;gap:7px;margin-bottom:6px;flex-wrap:wrap')}>
          <span style={sx('font-size:10.5px;color:rgba(23,25,31,.55)')}>{pieza.canal ?? '—'}</span>
          <span style={sx(badgeEstado(pieza.estado))}>{ESTADO_LABEL[pieza.estado]}</span>
        </div>
        <div style={sx('font-size:12.5px;font-weight:600;letter-spacing:-.01em;line-height:1.35')}>{pieza.titulo}</div>
        <div style={sx('display:flex;align-items:center;justify-content:space-between;margin-top:7px;gap:8px')}>
          <span style={sx('font-size:11px;color:rgba(23,25,31,.48);overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>
            {linea?.nombre ?? 'Sin línea'}
          </span>
        </div>
        <div
          style={sx(
            'display:flex;align-items:center;gap:6px;margin-top:6px;padding-top:6px;border-top:1px dashed rgba(23,25,31,.1)',
          )}
        >
          <span style={sx("font-size:9px;font-family:'IBM Plex Mono',monospace;letter-spacing:.04em;color:rgba(23,25,31,.4)")}>
            PUBLICA
          </span>
          <input
            type="date"
            value={pieza.fecha_publicacion ?? ''}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation()
              void app.ponerFecha(pieza.id, e.target.value)
            }}
            style={sx(
              "border:none;background:none;font-family:'IBM Plex Mono',monospace;font-size:10px;color:#17191f;padding:0;cursor:pointer",
            )}
          />
        </div>
      </div>
    </div>
  )
}

function TabMarca() {
  const app = useApp()
  const centro = app.centroActual
  if (!centro) return null
  const hub = app.hubDeCentro(centro)

  const ficha = (etiqueta: string, valor: string) => (
    <div style={sx('background:#fff;border:1px solid rgba(23,25,31,.08);border-radius:14px;padding:16px')}>
      <div
        style={sx(
          "font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4);margin-bottom:11px",
        )}
      >
        {etiqueta}
      </div>
      <div style={sx('font-size:13px;color:#17191f;line-height:1.5')}>{valor}</div>
    </div>
  )

  return (
    <>
      <button
        className="hv-border-red"
        onClick={() => app.ir('marcaRibera')}
        style={sx(
          "width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:#fff;border:1px solid rgba(29,29,27,.12);border-radius:12px;padding:13px 16px;margin-bottom:16px;font-family:'Mulish';cursor:pointer",
        )}
      >
        <span style={sx('width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#D71029,#f26d84);flex:none')} />
        <span style={sx('font-size:12.5px;color:#1D1D1B;line-height:1.5')}>
          <strong>Este centro hereda la identidad{DE_CLIENTE}.</strong> Paleta, tipografía y reglas de cumplimiento
          son comunes a todos los centros.
        </span>
        <span style={sx('margin-left:auto;font-size:12px;font-weight:700;color:#D71029;flex:none')}>
          Ver {CLIENTE.cliente ? `Marca ${CLIENTE.cliente}` : 'Marca'} →
        </span>
      </button>

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:14px')}>
        {ficha('NOMBRE', centro.nombre)}
        {ficha('CIUDAD', centro.ciudad ?? '—')}
        {ficha('TIPO', centro.tipo ?? '—')}
        {ficha('HUB', hub?.nombre ?? 'Sin asignar')}
        {ficha('TIPOGRAFÍA', `${TIPOGRAFIA} — común a todo el grupo`)}
        {ficha('TERRITORIO DE MARCA', TERRITORIO)}
      </div>

      <p style={sx('font-size:11.5px;color:rgba(23,25,31,.45);margin:18px 0 0;line-height:1.6;max-width:620px')}>
        Los datos del centro se leen de la tabla <strong>centros</strong> de Supabase y no se editan desde aquí. Para
        personalizaciones por centro —logo propio, colores locales o tono específico— harían falta columnas nuevas en esa
        tabla; hoy toda la identidad se hereda de la Marca.
      </p>
    </>
  )
}
