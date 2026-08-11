import { useRef, useState } from 'react'
import { sx } from '../lib/sx'
import { colorDeCentro, pill, ratioToCss, seg } from '../lib/ui'
import { MarcaOverlay } from '../components/Piezas'
import * as api from '../lib/api'
import { mensajeError } from '../lib/supabase'
import { useApp } from '../store'
import { FORMATOS, type Pieza } from '../lib/types'

const rotulo =
  "font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4);margin-bottom:9px"
const campo =
  "width:100%;border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:11px;font-family:'Mulish';font-size:12.5px;line-height:1.5;background:#fff;color:#17191f"

// Tipos de post genéricos: encuadran la intención sin obligar. Se podrán
// configurar por cliente desde el Brand Kit más adelante.
const TIPOS = ['Novedad', 'Promoción', 'Efeméride', 'Consejo', 'Testimonio', 'Detrás de cámaras']

export function Estudio() {
  const app = useApp()
  const b = app.borrador
  const centro = app.centroActual

  const resultados = app.resultados
    .map((id) => app.piezas.find((p) => p.id === id))
    .filter(Boolean) as Pieza[]
  const visibles = app.filtroResultados === 'Favoritas' ? resultados.filter((p) => app.favoritas[p.id]) : resultados
  const seleccionadas = Object.keys(app.seleccion).filter((k) => app.seleccion[k]).length

  const [modo, setModo] = useState<'crear' | 'remezclar'>('crear')
  const cambiarModo = (m: 'crear' | 'remezclar') => {
    setModo(m)
    if (m === 'crear') app.setBorrador({ material: null }) // Crear parte de una idea, no de una imagen.
  }
  const listo = modo === 'remezclar' ? !!b.material : b.prompt.trim().length > 0
  const puedeGenerar = listo && !app.generando

  // Piezas recientes del centro con imagen, para remezclar sin subir nada.
  const recientes = (centro ? app.piezasDeCentro(centro.id) : [])
    .filter((p) => p.imagen_url)
    .slice(0, 8)

  return (
    <section className="fade" style={sx('display:grid;grid-template-columns:352px 1fr;height:calc(100vh - 64px)')}>
      {/* ---- Brief: lo que el usuario SÍ sabe ---- */}
      <div style={sx('border-right:1px solid rgba(23,25,31,.08);background:#fff;overflow-y:auto;padding:20px 18px')}>
        <div style={sx('display:flex;align-items:center;gap:9px;background:#f4f4f4;border-radius:10px;padding:10px 11px;margin-bottom:18px')}>
          <div style={sx(`width:26px;height:26px;border-radius:7px;background:${centro ? colorDeCentro(centro.id) : '#DEDEDE'};flex:none`)} />
          <div style={sx('line-height:1.2;min-width:0')}>
            <div style={sx('font-size:12.5px;font-weight:600')}>{centro?.nombre ?? '—'}</div>
            <div style={sx('font-size:10.5px;color:rgba(23,25,31,.45)')}>{app.carpetaActual?.nombre ?? 'Sin carpeta'}</div>
          </div>
        </div>

        {/* Modo: Crear (desde una idea) o Remezclar (desde una imagen) */}
        <div style={sx('display:flex;gap:5px;background:#f4f4f4;border-radius:10px;padding:4px;margin-bottom:18px')}>
          {(
            [
              ['crear', 'Crear', 'desde una idea'],
              ['remezclar', 'Remezclar', 'desde una imagen'],
            ] as const
          ).map(([val, label, sub]) => {
            const on = modo === val
            return (
              <button
                key={val}
                onClick={() => cambiarModo(val)}
                style={sx(
                  "flex:1;border:none;border-radius:8px;padding:8px 6px;cursor:pointer;font-family:'Mulish';line-height:1.15;text-align:center",
                  on ? 'background:#fff;box-shadow:0 1px 3px rgba(23,25,31,.12)' : 'background:none',
                )}
              >
                <div style={sx(`font-size:12.5px;font-weight:700;color:${on ? '#17191f' : 'rgba(23,25,31,.55)'}`)}>{label}</div>
                <div style={sx(`font-size:9.5px;color:${on ? 'rgba(23,25,31,.5)' : 'rgba(23,25,31,.4)'}`)}>{sub}</div>
              </button>
            )
          })}
        </div>

        {modo === 'crear' && (
          <>
            <div style={sx(rotulo)}>¿QUÉ QUIERES COMUNICAR?</div>
            <textarea
              value={b.prompt}
              onChange={(e) => app.setBorrador({ prompt: e.target.value, texto: e.target.value })}
              placeholder="En una frase, en tu idioma. Ej: «anunciar nuestra nueva unidad de fisioterapia» o «felicitar el Día de la Madre»."
              style={sx(campo, 'min-height:104px;resize:vertical')}
            />
            <div style={sx('font-size:10px;color:rgba(23,25,31,.42);margin-top:6px;line-height:1.5')}>
              Cuéntale la idea. Claudia se encarga de la dirección de arte.
            </div>

            <div style={sx(rotulo, 'margin:20px 0 9px')}>TIPO (OPCIONAL)</div>
            <div style={sx('display:flex;flex-wrap:wrap;gap:5px')}>
              {TIPOS.map((t) => (
                <button
                  key={t}
                  onClick={() => app.setBorrador({ tipoPost: b.tipoPost === t ? '' : t })}
                  style={sx(pill(b.tipoPost === t))}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        {modo === 'remezclar' && (
          <>
            <div style={sx(rotulo)}>IMAGEN DE PARTIDA</div>
            <FotoBase />
            {recientes.length > 0 && (
              <>
                <div style={sx('font-size:10px;color:rgba(23,25,31,.45);margin:12px 0 7px')}>o elige una pieza reciente:</div>
                <div style={sx('display:flex;gap:7px;flex-wrap:wrap')}>
                  {recientes.map((p) => {
                    const sel = b.material?.url === p.imagen_url
                    return (
                      <button
                        key={p.id}
                        onClick={() => app.setBorrador({ material: { url: p.imagen_url as string, nombre: p.titulo } })}
                        style={sx(
                          'width:52px;height:52px;border-radius:9px;overflow:hidden;padding:0;cursor:pointer;background:#eee',
                          sel ? 'outline:2.5px solid var(--acento);outline-offset:-1px;border:none' : 'border:1px solid rgba(23,25,31,.12)',
                        )}
                      >
                        <img src={p.imagen_url as string} alt={p.titulo} style={sx('width:100%;height:100%;object-fit:cover;display:block')} />
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <div style={sx(rotulo, 'margin:20px 0 9px')}>GRADO DE VARIACIÓN</div>
            <div style={sx('display:flex;gap:5px')}>
              {(
                [
                  ['sutil', 'Sutil'],
                  ['media', 'Media'],
                  ['atrevida', 'Atrevida'],
                ] as const
              ).map(([val, label]) => (
                <button key={val} onClick={() => app.setBorrador({ variacion: val })} style={sx(seg(b.variacion === val), 'flex:1')}>
                  {label}
                </button>
              ))}
            </div>
            <div style={sx('font-size:10px;color:rgba(23,25,31,.45);margin-top:6px;line-height:1.5')}>
              {b.variacion === 'sutil'
                ? 'Casi idéntica: solo cambian matices.'
                : b.variacion === 'atrevida'
                  ? 'Mismo sujeto y mensaje, pero reinterpreta con libertad.'
                  : 'Mismo sujeto e idea; varía encuadre, luz o entorno.'}
            </div>

            <div style={sx(rotulo, 'margin:20px 0 9px')}>¿ALGÚN CAMBIO? (OPCIONAL)</div>
            <input
              value={b.ajuste}
              onChange={(e) => app.setBorrador({ ajuste: e.target.value })}
              placeholder="p. ej. «en exteriores», «más luminoso», «otro fondo»"
              style={sx(campo)}
            />
            <div style={sx('font-size:10px;color:rgba(23,25,31,.42);margin-top:6px;line-height:1.5')}>
              El texto y el logo se mantienen (viven en la capa de marca, no en la imagen).
            </div>
          </>
        )}

        <div style={sx(rotulo, 'margin:20px 0 9px')}>RED SOCIAL Y FORMATO</div>
        <div style={sx('display:flex;flex-wrap:wrap;gap:6px')}>
          {FORMATOS.map((f) => {
            const activo = b.redFormato === f.id
            return (
              <button
                key={f.id}
                onClick={() => app.setBorrador({ redFormato: f.id, ratio: f.ratio, canal: f.red })}
                style={sx(
                  "display:flex;flex-direction:column;align-items:flex-start;gap:1px;border-radius:9px;padding:7px 9px;cursor:pointer;font-family:'Mulish'",
                  activo
                    ? 'background:var(--acento);border:1px solid var(--acento);color:#fff'
                    : 'background:#f4f4f4;border:1px solid rgba(23,25,31,.1);color:#17191f',
                )}
              >
                <span style={sx('font-weight:700;font-size:11px')}>{f.red}</span>
                <span style={sx(`font-size:9px;${activo ? 'color:rgba(255,255,255,.85)' : 'color:rgba(23,25,31,.5)'}`)}>
                  {f.nombre} · {f.ratio}
                </span>
              </button>
            )
          })}
        </div>

        <div style={sx(rotulo, 'margin:20px 0 9px')}>MARCA</div>
        <div style={sx('display:flex;gap:5px')}>
          {(
            [
              [true, 'Con marca'],
              [false, 'Sin marca'],
            ] as const
          ).map(([val, label]) => (
            <button key={label} onClick={() => app.setBorrador({ marca: val })} style={sx(seg(b.marca === val), 'flex:1')}>
              {label}
            </button>
          ))}
        </div>
        <div style={sx('font-size:10px;color:rgba(23,25,31,.45);margin-top:6px;line-height:1.5')}>
          {b.marca ? 'Se aplica tu Brand Kit (logo y mensaje) sobre la imagen.' : 'Se entrega la foto limpia, sin logo ni texto.'}
        </div>

        <div style={sx('margin-top:22px;display:flex;align-items:center;gap:10px')}>
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
          disabled={!puedeGenerar}
          style={sx(
            "margin-top:12px;width:100%;background:var(--acento);color:#fff;border:none;border-radius:11px;padding:13px;font-family:'Mulish';font-weight:600;font-size:13.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px",
            !puedeGenerar && 'opacity:.5;cursor:not-allowed',
          )}
        >
          {app.generando ? 'Generando…' : modo === 'remezclar' ? 'Generar variaciones' : 'Generar'}
        </button>
        {!listo && !app.generando && (
          <div style={sx('font-size:10px;color:rgba(23,25,31,.45);margin-top:7px;text-align:center')}>
            {modo === 'remezclar' ? 'Sube o elige una imagen de partida.' : 'Escribe qué quieres comunicar para generar.'}
          </div>
        )}
      </div>

      {/* ---- Lienzo: resultados + refinar ---- */}
      <div style={sx('overflow-y:auto;padding:22px 28px')}>
        {app.errorGeneracion && (
          <div
            style={sx(
              'background:var(--suave-1);border:1px solid rgba(var(--acento-rgb),.28);border-radius:12px;padding:14px 16px;font-size:12.5px;line-height:1.6;color:#1D1D1B;margin-bottom:16px',
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
            <div style={sx('text-align:center;margin-top:22px;font-size:12.5px;color:rgba(23,25,31,.55);display:flex;align-items:center;justify-content:center;gap:10px')}>
              <span style={sx('width:14px;height:14px;border:2px solid rgba(23,25,31,.2);border-top-color:#17191f;border-radius:50%;animation:spin .7s linear infinite')} />
              Claudia está creando las variantes…
            </div>
          </>
        )}

        {!app.generando && resultados.length > 0 && (
          <>
            {b.concepto && (
              <div style={sx('display:flex;align-items:flex-start;gap:9px;background:var(--suave-1);border:1px solid rgba(var(--acento-rgb),.22);border-radius:11px;padding:10px 13px;margin-bottom:14px')}>
                <span style={sx('color:var(--acento);font-weight:700;font-size:12px;flex:none;margin-top:1px')}>✦</span>
                <div style={sx('min-width:0;flex:1')}>
                  <div style={sx("font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.08em;color:rgba(23,25,31,.45);margin-bottom:3px")}>
                    CLAUDIA PROPONE
                  </div>
                  <div style={sx('font-size:12.5px;line-height:1.5;color:#1D1D1B')}>{b.concepto}</div>
                </div>
              </div>
            )}

            {/* Barra: filtro + maqueta de marca (post-producción) + entrega */}
            <div style={sx('display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px')}>
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
                  style={sx("background:var(--acento);color:#fff;border:none;border-radius:9px;padding:8px 13px;font-family:'Mulish';font-weight:600;font-size:12px;cursor:pointer")}
                >
                  Publicar →
                </button>
              </div>
            </div>

            {b.marca && (
              <div style={sx('display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#fff;border:1px solid rgba(23,25,31,.1);border-radius:11px;padding:9px 11px;margin-bottom:14px')}>
                <span style={sx('font-size:10.5px;font-weight:700;color:rgba(23,25,31,.5)')}>Mensaje sobre la pieza</span>
                <input
                  value={b.copy}
                  onChange={(e) => app.setBorrador({ copy: e.target.value })}
                  placeholder="Titular que va encima de la imagen (opcional)"
                  style={sx("flex:1;min-width:180px;border:1px solid rgba(23,25,31,.12);border-radius:8px;padding:7px 10px;font-family:'Mulish';font-size:12px;background:#fff;color:#17191f")}
                />
                <div style={sx('display:flex;gap:4px')}>
                  {(
                    [
                      ['editorial', 'Editorial'],
                      ['franja', 'Franja'],
                    ] as const
                  ).map(([val, label]) => (
                    <button key={val} onClick={() => app.setBorrador({ plantilla: val })} style={sx(seg(b.plantilla === val))}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Refinar: ajuste conversacional + otra ronda */}
            <div style={sx('display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap')}>
              <input
                value={b.ajuste}
                onChange={(e) => app.setBorrador({ ajuste: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && b.prompt.trim()) void app.generar()
                }}
                placeholder="Dile un ajuste a Claudia: «más luminoso», «en exteriores», «sin personas»…"
                style={sx("flex:1;min-width:220px;border:1px solid rgba(23,25,31,.14);border-radius:10px;padding:10px 12px;font-family:'Mulish';font-size:12.5px;background:#fff;color:#17191f")}
              />
              <button
                onClick={() => void app.generar()}
                disabled={app.generando || !b.prompt.trim()}
                style={sx(
                  "background:#17191f;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-family:'Mulish';font-weight:600;font-size:12.5px;cursor:pointer;white-space:nowrap",
                  (app.generando || !b.prompt.trim()) && 'opacity:.5;cursor:not-allowed',
                )}
              >
                ↻ Otra ronda
              </button>
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
                        copy={b.marca ? b.copy : undefined}
                        mostrarLogo={b.marca}
                        plantilla={b.plantilla}
                        extra={
                          <span
                            style={sx(
                              "position:absolute;top:8px;left:50%;transform:translateX(-50%);background:rgba(23,25,31,.72);color:#fff;font-family:'IBM Plex Mono',monospace;font-size:9px;padding:3px 6px;border-radius:5px",
                            )}
                          >
                            V{i + 1}
                          </span>
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
                          ? 'position:absolute;top:8px;right:8px;width:23px;height:23px;border-radius:50%;border:none;background:var(--acento);color:#fff;font-size:12px;cursor:pointer'
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
          <div style={sx('height:100%;min-height:380px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:rgba(23,25,31,.42);padding:20px')}>
            <div style={sx('width:60px;height:60px;border-radius:16px;background:#fff;border:1px solid rgba(23,25,31,.09);display:grid;place-items:center;font-size:24px;margin-bottom:15px')}>
              ◍
            </div>
            <div style={sx('font-size:14.5px;font-weight:600;color:rgba(23,25,31,.66)')}>
              Cuéntale a Claudia qué quieres comunicar
            </div>
            <div style={sx('font-size:12px;margin-top:6px;max-width:380px;line-height:1.55')}>
              Ella dirige el arte y produce las variantes con tu marca aplicada. Aparecerán aquí en cuanto estén listas.
            </div>
          </div>
        )}
      </div>
    </section>
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
          'height:96px;border-radius:11px;display:grid;place-items:center;cursor:pointer;padding:12px;',
          material
            ? 'border:1.5px dashed oklch(0.62 0.1 155);background:oklch(0.97 0.02 155)'
            : 'border:1.5px dashed rgba(23,25,31,.2);background:#fafbfb',
        )}
      >
        {subiendo ? (
          <div style={sx('font-size:11.5px;color:rgba(23,25,31,.5)')}>Subiendo…</div>
        ) : material ? (
          <div style={sx("font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:rgba(23,25,31,.5);text-align:center;line-height:1.6;word-break:break-all")}>
            {material.nombre}
            <br />
            <span style={sx('color:oklch(0.55 0.12 155);font-weight:600')}>✓ foto cargada</span>
          </div>
        ) : (
          <div style={sx('text-align:center')}>
            <div style={sx('font-size:19px;color:rgba(23,25,31,.3)')}>↑</div>
            <div style={sx('font-size:11.5px;font-weight:600;margin-top:5px')}>Sube una foto para mejorarla</div>
            <div style={sx('font-size:10.5px;color:rgba(23,25,31,.42);margin-top:2px')}>o genera desde cero</div>
          </div>
        )}
      </div>
      {material && (
        <button
          onClick={() => app.setBorrador({ material: null })}
          style={sx("margin-top:7px;background:none;border:none;padding:0;font-family:'Mulish';font-size:11px;color:rgba(23,25,31,.5);cursor:pointer;text-decoration:underline")}
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
