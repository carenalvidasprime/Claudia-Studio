import { useRef, useState } from 'react'
import { sx } from '../lib/sx'
import { colorDeCentro, objInline, outInline, pill, ratioToCss, seg } from '../lib/ui'
import { CRITERIOS } from '../lib/marca'
import { IconoAnimacion, MarcaOverlay } from '../components/Piezas'
import * as api from '../lib/api'
import { mensajeError } from '../lib/supabase'
import { useApp } from '../store'
import type { Pieza } from '../lib/types'

const rotulo =
  "font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4);margin-bottom:9px"

const VERDE = 'display:grid;place-items:center;flex:none;width:20px;height:20px;border-radius:50%;background:oklch(0.62 0.13 155);color:#fff;font-size:11px;font-weight:700'
const AMBAR = 'display:grid;place-items:center;flex:none;width:20px;height:20px;border-radius:50%;background:oklch(0.75 0.15 70);color:#fff;font-size:11px;font-weight:700'

export function Estudio() {
  const app = useApp()
  const b = app.borrador
  const centro = app.centroActual
  const situacion = app.situacionDe(b.situacionId)
  const linea = app.lineaDe(b.lineaId)
  const esAnimacion = b.formato === 'Animación'

  const resultados = app.resultados
    .map((id) => app.piezas.find((p) => p.id === id))
    .filter(Boolean) as Pieza[]
  const visibles = app.filtroResultados === 'Favoritas' ? resultados.filter((p) => app.favoritas[p.id]) : resultados
  const seleccionadas = Object.keys(app.seleccion).filter((k) => app.seleccion[k]).length

  // Sin acentos ni mayúsculas, para que «Testimonio» y «testimonío» detecten igual.
  const normaliza = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const mencionaPersonas = /paciente|testimonio|historia real|persona real|caso real/.test(
    normaliza(`${b.texto} ${b.prompt}`),
  )
  const requiereConsentimiento = !!situacion?.requiere_consentimiento || mencionaPersonas

  const checks = [
    { label: 'Marca Ribera aplicada', sub: 'Paleta, tipografía y territorio en el prompt', icono: '✓', estilo: VERDE },
    { label: 'Sin promesas de curación', sub: 'Sin resultados clínicos garantizados', icono: '✓', estilo: VERDE },
    { label: 'Sin superlativos no verificables', sub: 'Sin «el mejor» o «único» sin dato', icono: '✓', estilo: VERDE },
    { label: 'Tono Salud Responsable', sub: 'Ética, cuidado y compromiso', icono: '✓', estilo: VERDE },
    requiereConsentimiento
      ? b.consentimiento
        ? { label: 'Consentimiento de paciente', sub: 'Firmado y confirmado en el flujo', icono: '✓', estilo: VERDE }
        : {
            label: 'Consentimiento de paciente',
            sub: 'Verifica el consentimiento firmado antes de publicar',
            icono: '⚠',
            estilo: AMBAR,
          }
      : { label: 'Consentimiento de paciente', sub: 'No aplica', icono: '✓', estilo: VERDE },
  ]

  return (
    <section className="fade" style={sx('display:grid;grid-template-columns:314px 1fr;height:calc(100vh - 64px)')}>
      <div style={sx('border-right:1px solid rgba(23,25,31,.08);background:#fff;overflow-y:auto;padding:20px 18px')}>
        <div style={sx(rotulo)}>CENTRO</div>
        <div style={sx('display:flex;align-items:center;gap:9px;background:#f4f4f4;border-radius:10px;padding:10px 11px;margin-bottom:14px')}>
          <div style={sx(`width:26px;height:26px;border-radius:7px;background:${centro ? colorDeCentro(centro.id) : '#DEDEDE'};flex:none`)} />
          <div style={sx('line-height:1.2;min-width:0')}>
            <div style={sx('font-size:12.5px;font-weight:600')}>{centro?.nombre ?? '—'}</div>
            <div style={sx('font-size:10.5px;color:rgba(23,25,31,.45)')}>{app.carpetaActual?.nombre ?? 'Sin carpeta'}</div>
          </div>
        </div>

        <div style={sx(rotulo)}>ENCARGO</div>
        <div style={sx('background:#f4f4f4;border-radius:10px;padding:11px 12px;margin-bottom:14px')}>
          <div style={sx('display:flex;align-items:center;gap:6px;flex-wrap:wrap')}>
            <span style={sx(outInline(b.formato))}>{b.formato}</span>
            <span style={sx(objInline(b.objetivo))}>{b.objetivo}</span>
            <span
              style={sx(
                "margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:9px;background:#fff;padding:2px 7px;border-radius:5px;color:rgba(23,25,31,.55)",
              )}
            >
              {b.ratio}
            </span>
          </div>
          <div style={sx('font-size:10.5px;color:rgba(23,25,31,.55);margin-top:8px')}>
            {b.canal}
            {linea ? ` · ${linea.nombre}` : ''}
          </div>
        </div>

        <ResumenSituacion />
        <PanelCriterio />

        <div style={sx(rotulo)}>FOTO BASE</div>
        <FotoBase />

        <div style={sx(rotulo, 'margin:20px 0 9px')}>DESCRIPCIÓN</div>
        <textarea
          value={b.prompt}
          onChange={(e) => app.setBorrador({ prompt: e.target.value })}
          placeholder="Instrucción concreta para el modelo de imagen."
          style={sx(
            "width:100%;min-height:80px;resize:vertical;border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:11px;font-family:'Mulish';font-size:12.5px;line-height:1.55;background:#fff;color:#17191f",
          )}
        />

        <div style={sx(rotulo, 'margin:20px 0 9px')}>MENSAJE SOBRE LA PIEZA</div>
        <textarea
          value={b.copy}
          onChange={(e) => app.setBorrador({ copy: e.target.value })}
          placeholder="Texto que aparecerá encima de la imagen (con el logo de Ribera). Déjalo vacío para una pieza solo imagen."
          style={sx(
            "width:100%;min-height:56px;resize:vertical;border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:11px;font-family:'Mulish';font-size:12.5px;line-height:1.5;background:#fff;color:#17191f",
          )}
        />

        <div style={sx(rotulo, 'margin:16px 0 9px')}>PLANTILLA DE MARCA</div>
        <div style={sx('display:flex;gap:5px')}>
          {(
            [
              ['editorial', 'Editorial'],
              ['franja', 'Franja'],
            ] as const
          ).map(([val, label]) => (
            <button key={val} onClick={() => app.setBorrador({ plantilla: val })} style={sx(seg(b.plantilla === val), 'flex:1')}>
              {label}
            </button>
          ))}
        </div>

        <div style={sx('margin-top:15px;display:flex;align-items:center;gap:10px')}>
          <div style={sx('font-size:11.5px;font-weight:500;color:rgba(23,25,31,.62)')}>Variantes</div>
          <div style={sx('display:flex;gap:5px;margin-left:auto')}>
            {[2, 4, 6].map((n) => (
              <button key={n} onClick={() => app.setBorrador({ variantes: n })} style={sx(seg(b.variantes === n))}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => void app.generar()}
          disabled={app.generando}
          style={sx(
            "margin-top:12px;width:100%;background:#D71029;color:#fff;border:none;border-radius:11px;padding:13px;font-family:'Mulish';font-weight:600;font-size:13.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px",
            app.generando && 'opacity:.65;cursor:progress',
          )}
        >
          <span style={sx('width:6px;height:6px;border-radius:50%;background:#f0607a')} />
          {app.generando ? 'Generando…' : esAnimacion ? 'Generar animación' : 'Generar'}
        </button>

        <div style={sx(rotulo, 'margin:20px 0 9px')}>CUMPLIMIENTO</div>
        <div style={sx('background:#f4f4f4;border-radius:10px;padding:4px 2px')}>
          {checks.map((c) => (
            <div key={c.label} style={sx('display:flex;align-items:center;gap:9px;padding:8px 11px')}>
              <span style={sx(c.estilo)}>{c.icono}</span>
              <div style={sx('line-height:1.25')}>
                <div style={sx('font-size:11.5px;font-weight:500;color:#17191f')}>{c.label}</div>
                <div style={sx('font-size:10px;color:rgba(23,25,31,.48)')}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={sx('overflow-y:auto;padding:22px 28px')}>
        {app.errorGeneracion && (
          <div
            style={sx(
              'background:#FDE8DE;border:1px solid rgba(215,16,41,.28);border-radius:12px;padding:14px 16px;font-size:12.5px;line-height:1.6;color:#1D1D1B;margin-bottom:16px',
            )}
          >
            {app.errorGeneracion}
          </div>
        )}

        {app.generando && (
          <>
            <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px')}>
              {Array.from({ length: b.variantes }).map((_, i) => (
                <div
                  key={i}
                  style={sx(
                    `aspect-ratio:${ratioToCss(b.ratio)};border-radius:13px;background:linear-gradient(100deg,#e9ebed 30%,#f4f5f6 50%,#e9ebed 70%);background-size:820px 100%;animation:shimmer 1.3s infinite linear`,
                  )}
                />
              ))}
            </div>
            <div
              style={sx(
                'text-align:center;margin-top:22px;font-size:12.5px;color:rgba(23,25,31,.55);display:flex;align-items:center;justify-content:center;gap:10px',
              )}
            >
              <span
                style={sx(
                  'width:14px;height:14px;border:2px solid rgba(23,25,31,.2);border-top-color:#17191f;border-radius:50%;animation:spin .7s linear infinite',
                )}
              />
              n8n está produciendo la pieza…
            </div>
          </>
        )}

        {!app.generando && resultados.length > 0 && (
          <>
            <div style={sx('display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;flex-wrap:wrap;gap:10px')}>
              <div style={sx('display:flex;gap:6px')}>
                {(['Todas', 'Favoritas'] as const).map((f) => (
                  <button key={f} onClick={() => app.set({ filtroResultados: f })} style={sx(pill(app.filtroResultados === f))}>
                    {f}
                  </button>
                ))}
              </div>
              <div style={sx('display:flex;align-items:center;gap:10px')}>
                <span style={sx('font-size:11.5px;color:rgba(23,25,31,.5)')}>{seleccionadas} en la entrega</span>
                <button
                  onClick={() => app.ir('exportar')}
                  style={sx(
                    "background:#D71029;color:#fff;border:none;border-radius:9px;padding:8px 13px;font-family:'Mulish';font-weight:600;font-size:12px;cursor:pointer",
                  )}
                >
                  Publicar →
                </button>
              </div>
            </div>

            <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px')}>
              {visibles.map((p, i) => {
                const sel = !!app.seleccion[p.id]
                const fav = !!app.favoritas[p.id]
                return (
                  <div
                    key={p.id}
                    className="fade hv-result"
                    style={sx(
                      'border-radius:13px;overflow:hidden;position:relative;transition:transform .15s;',
                      sel ? 'outline:2.5px solid #17191f;outline-offset:-1px' : 'outline:1px solid rgba(23,25,31,.08)',
                    )}
                  >
                    <div onClick={() => app.set({ piezaId: p.id, pantalla: 'detalle' })} style={sx('cursor:pointer')}>
                      <MarcaOverlay
                        url={p.imagen_url}
                        ratio={b.ratio}
                        radio="0"
                        copy={app.borrador.copy}
                        plantilla={app.borrador.plantilla}
                        extra={
                          <>
                            <span
                              style={sx(
                                "position:absolute;top:8px;left:50%;transform:translateX(-50%);background:rgba(23,25,31,.72);color:#fff;font-family:'IBM Plex Mono',monospace;font-size:9px;padding:3px 6px;border-radius:5px",
                              )}
                            >
                              V{i + 1}
                            </span>
                            {esAnimacion && <IconoAnimacion tam={28} />}
                          </>
                        }
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        app.set((s) => ({ favoritas: { ...s.favoritas, [p.id]: !s.favoritas[p.id] } }))
                      }}
                      style={sx(
                        `position:absolute;top:8px;left:8px;width:23px;height:23px;border-radius:50%;border:none;background:rgba(23,25,31,.32);color:${fav ? 'oklch(0.75 0.15 60)' : '#fff'};font-size:12px;cursor:pointer`,
                      )}
                    >
                      {fav ? '★' : '☆'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        app.set((s) => ({ seleccion: { ...s.seleccion, [p.id]: !s.seleccion[p.id] } }))
                      }}
                      style={sx(
                        sel
                          ? 'position:absolute;top:8px;right:8px;width:23px;height:23px;border-radius:50%;border:none;background:#D71029;color:#fff;font-size:12px;cursor:pointer'
                          : 'position:absolute;top:8px;right:8px;width:23px;height:23px;border-radius:50%;border:1.5px solid rgba(255,255,255,.92);background:rgba(23,25,31,.32);color:#fff;font-size:12px;cursor:pointer',
                      )}
                    >
                      {sel ? '✓' : ''}
                    </button>
                  </div>
                )
              })}
            </div>
            {visibles.length === 0 && (
              <div style={sx('font-size:12.5px;color:rgba(23,25,31,.5);padding:20px 0')}>
                Ninguna variante marcada como favorita.
              </div>
            )}
          </>
        )}

        {!app.generando && resultados.length === 0 && !app.errorGeneracion && (
          <div
            style={sx(
              'height:100%;min-height:380px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:rgba(23,25,31,.42);padding:20px',
            )}
          >
            <div
              style={sx(
                'width:60px;height:60px;border-radius:16px;background:#fff;border:1px solid rgba(23,25,31,.09);display:grid;place-items:center;font-size:24px;margin-bottom:15px',
              )}
            >
              ◍
            </div>
            <div style={sx('font-size:14.5px;font-weight:600;color:rgba(23,25,31,.66)')}>
              Ajusta el encargo y pulsa {esAnimacion ? 'Generar animación' : 'Generar'}
            </div>
            <div style={sx('font-size:12px;margin-top:6px;max-width:360px;line-height:1.55')}>
              n8n producirá la pieza, la subirá al bucket y creará su fila. Aparecerá aquí en cuanto termine.
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ResumenSituacion() {
  const app = useApp()
  const b = app.borrador
  const clave = b.situacionClave
  if (!clave) return null

  if (clave === 'testimonio') {
    return (
      <div
        style={sx(
          'display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#FDE8DE;border:1px solid rgba(215,16,41,.2);border-radius:9px;padding:8px 11px;margin-bottom:14px;font-size:10.5px;color:#1D1D1B',
        )}
      >
        <span style={sx(`${b.consentimiento ? 'color:oklch(0.5 0.11 155)' : 'color:oklch(0.55 0.16 40)'};font-weight:600`)}>
          {b.consentimiento ? '✓ Consentimiento firmado' : '⚠ Consentimiento pendiente'}
        </span>
        <span style={sx('color:rgba(29,29,27,.35)')}>·</span>
        <span>
          Exposición: <strong>{b.exposicion}</strong>
        </span>
      </div>
    )
  }

  if (clave === 'colaboracion') {
    return (
      <div
        style={sx(
          'display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#f4f4f4;border:1px solid rgba(23,25,31,.12);border-radius:9px;padding:8px 11px;margin-bottom:14px;font-size:10.5px;color:#1D1D1B',
        )}
      >
        <span>
          Personas: <strong>{b.personas ?? '—'}</strong>
        </span>
        <span style={sx('color:rgba(29,29,27,.35)')}>·</span>
        <span>
          Entorno: <strong>{b.entorno ?? '—'}</strong>
        </span>
      </div>
    )
  }

  if (clave === 'hito') {
    return (
      <div
        style={sx(
          'display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#f4f4f4;border:1px solid rgba(23,25,31,.12);border-radius:9px;padding:8px 11px;margin-bottom:14px;font-size:10.5px;color:#1D1D1B',
        )}
      >
        <span>{b.validadoPorProfesional ? '✓ Validado por profesional' : '⚠ Validación pendiente'}</span>
        <span style={sx('color:rgba(29,29,27,.35)')}>·</span>
        <span>{b.fondoLibre && b.sinPacientes ? '✓ Entorno confirmado' : '⚠ Entorno sin confirmar'}</span>
      </div>
    )
  }

  return null
}

function PanelCriterio() {
  const app = useApp()
  const clave = app.borrador.situacionClave
  const criterio = clave ? CRITERIOS[clave] : null
  if (!criterio) return null

  return (
    <div style={sx('background:#f4f4f4;border-radius:10px;padding:11px 12px;margin-bottom:14px')}>
      <div
        style={sx(
          "font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4);margin-bottom:8px",
        )}
      >
        {criterio.titulo}
      </div>
      <div style={sx('font-size:11px;line-height:1.5;color:#1D1D1B;margin-bottom:7px')}>
        <strong>El ángulo:</strong> {criterio.angulo}
      </div>
      <div style={sx('display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:7px')}>
        <div style={sx('font-size:10.5px;line-height:1.45;color:rgba(29,29,27,.75)')}>
          <strong style={sx('color:oklch(0.5 0.11 155)')}>Qué sí</strong>
          <br />
          {criterio.si}
        </div>
        <div style={sx('font-size:10.5px;line-height:1.45;color:rgba(29,29,27,.75)')}>
          <strong style={sx('color:#D71029')}>Qué no</strong>
          <br />
          {criterio.no}
        </div>
      </div>
      <div
        style={sx(
          'font-size:10px;line-height:1.45;color:rgba(29,29,27,.55);border-top:1px solid rgba(29,29,27,.1);padding-top:7px',
        )}
      >
        Cumplimiento: {criterio.cumplimiento}
      </div>
    </div>
  )
}

function FotoBase() {
  const app = useApp()
  const material = app.borrador.material
  const input = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)

  const subir = async (archivo: File) => {
    setSubiendo(true)
    try {
      const m = await api.subirMaterial(archivo)
      app.setBorrador({ material: m })
      app.avisar('Foto base subida ✓')
    } catch (error) {
      app.avisar(mensajeError(error), 'error')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <>
      <div
        onClick={() => input.current?.click()}
        style={sx(
          'height:104px;border-radius:11px;display:grid;place-items:center;cursor:pointer;padding:12px;',
          material
            ? 'border:1.5px dashed oklch(0.62 0.1 155);background:oklch(0.97 0.02 155)'
            : 'border:1.5px dashed rgba(23,25,31,.2);background:#fafbfb',
        )}
      >
        {subiendo ? (
          <div style={sx('font-size:11.5px;color:rgba(23,25,31,.5)')}>Subiendo…</div>
        ) : material ? (
          <div
            style={sx(
              "font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:rgba(23,25,31,.5);text-align:center;line-height:1.6;word-break:break-all",
            )}
          >
            {material.nombre}
            <br />
            <span style={sx('color:oklch(0.55 0.12 155);font-weight:600')}>✓ foto real cargada</span>
          </div>
        ) : (
          <div style={sx('text-align:center')}>
            <div style={sx('font-size:19px;color:rgba(23,25,31,.3)')}>↑</div>
            <div style={sx('font-size:11.5px;font-weight:600;margin-top:5px')}>Sube una foto real</div>
            <div style={sx('font-size:10.5px;color:rgba(23,25,31,.42);margin-top:2px')}>o genera desde cero</div>
          </div>
        )}
      </div>
      {material && (
        <button
          onClick={() => app.setBorrador({ material: null })}
          style={sx(
            "margin-top:7px;background:none;border:none;padding:0;font-family:'Mulish';font-size:11px;color:rgba(23,25,31,.5);cursor:pointer;text-decoration:underline",
          )}
        >
          Quitar foto base
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        style={sx('display:none')}
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) void subir(f)
        }}
      />
    </>
  )
}
