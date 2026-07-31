import { sx } from '../lib/sx'
import { colorDeCentro, outCard, pill } from '../lib/ui'
import { FORMATOS } from '../lib/types'
import { useApp } from '../store'

const OUTPUTS = [
  { id: 'Imagen' as const, icono: '▣', sub: 'Foto generada o editada' },
  { id: 'Animación' as const, icono: '▶', sub: 'Motion design · texto y marca' },
]

const rotulo =
  "font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.08em;color:rgba(23,25,31,.4);margin-bottom:8px"

export function Brief() {
  const app = useApp()
  const b = app.borrador
  const centro = app.centroActual

  return (
    <section className="fade" style={sx('padding:30px 32px 60px;max-width:820px')}>
      <div style={sx('background:#fff;border:1px solid rgba(23,25,31,.08);border-radius:16px;padding:22px')}>
        <div style={sx('display:flex;align-items:center;gap:9px;margin-bottom:14px;flex-wrap:wrap')}>
          <div style={sx(`width:26px;height:26px;border-radius:7px;background:${centro ? colorDeCentro(centro.id) : '#DEDEDE'};flex:none`)} />
          <div style={sx('font-size:12.5px;font-weight:600')}>{centro?.nombre ?? '—'}</div>
          <div style={sx('font-size:11px;color:rgba(23,25,31,.45)')}>· {app.carpetaActual?.nombre ?? 'Sin carpeta'}</div>
        </div>

        <div style={sx(rotulo)}>TÍTULO DE LA PIEZA</div>
        <input
          value={b.titulo}
          onChange={(e) => app.setBorrador({ titulo: e.target.value })}
          placeholder="Cómo se llamará esta creatividad en el planificador"
          style={sx(
            "width:100%;border:1px solid rgba(23,25,31,.12);border-radius:12px;padding:12px 13px;font-family:'Mulish';font-size:13.5px;background:#fafbfb;color:#17191f;margin-bottom:18px",
          )}
        />

        <div style={sx(rotulo)}>EL ENCARGO</div>
        <textarea
          value={b.texto}
          onChange={(e) => app.setBorrador({ texto: e.target.value })}
          placeholder="Describe qué necesitas: mensaje, tono y objetivo concretos de esta creatividad."
          style={sx(
            "width:100%;min-height:104px;resize:vertical;border:1px solid rgba(23,25,31,.12);border-radius:12px;padding:13px;font-family:'Mulish';font-size:13.5px;line-height:1.55;background:#fafbfb;color:#17191f",
          )}
        />

        {b.material && (
          <div
            style={sx(
              'display:flex;align-items:center;gap:8px;margin-top:10px;font-size:11.5px;color:oklch(0.5 0.13 155);line-height:1.5',
            )}
          >
            ✓ Material de referencia: {b.material.nombre}
          </div>
        )}

        <div style={sx('display:grid;grid-template-columns:1fr 1fr;gap:18px 24px;margin-top:20px')}>
          <div style={sx('grid-column:span 2')}>
            <div style={sx(rotulo)}>RED SOCIAL Y FORMATO</div>
            <div style={sx('display:flex;flex-wrap:wrap;gap:8px')}>
              {FORMATOS.map((f) => {
                const activo = b.redFormato === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => app.setBorrador({ redFormato: f.id, ratio: f.ratio, canal: f.red })}
                    style={sx(
                      "display:flex;flex-direction:column;align-items:flex-start;gap:2px;border-radius:11px;padding:10px 13px;cursor:pointer;font-family:'Mulish';min-width:118px",
                      activo
                        ? 'background:#D71029;border:1px solid #D71029;color:#fff'
                        : 'background:#fafbfb;border:1px solid rgba(23,25,31,.12);color:#17191f',
                    )}
                  >
                    <span style={sx('font-weight:700;font-size:12.5px')}>{f.red}</span>
                    <span style={sx(`font-size:10.5px;${activo ? 'color:rgba(255,255,255,.85)' : 'color:rgba(23,25,31,.5)'}`)}>
                      {f.nombre} · {f.ratio}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div style={sx(rotulo)}>OBJETIVO</div>
            <div style={sx('display:flex;gap:5px')}>
              {(['Orgánico', 'Promoción'] as const).map((o) => (
                <button key={o} onClick={() => app.setBorrador({ objetivo: o })} style={sx(pill(b.objetivo === o))}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div style={sx('grid-column:span 2')}>
            <div style={sx(rotulo)}>LÍNEA DE COMUNICACIÓN</div>
            <div style={sx('display:flex;flex-wrap:wrap;gap:5px')}>
              {app.lineas.map((l) => (
                <button
                  key={String(l.id)}
                  title={l.descripcion ?? undefined}
                  onClick={() => app.setBorrador({ lineaId: String(b.lineaId) === String(l.id) ? null : l.id })}
                  style={sx(pill(String(b.lineaId) === String(l.id)))}
                >
                  {l.nombre}
                </button>
              ))}
              {app.lineas.length === 0 && (
                <span style={sx('font-size:11.5px;color:rgba(23,25,31,.45)')}>
                  No se han podido leer las líneas de comunicación de Supabase.
                </span>
              )}
            </div>
          </div>

          <div style={sx('grid-column:span 2')}>
            <div style={sx(rotulo)}>FORMATO DE SALIDA</div>
            <div style={sx('display:flex;flex-wrap:wrap;gap:8px')}>
              {OUTPUTS.map((o) => (
                <button key={o.id} onClick={() => app.setBorrador({ formato: o.id })} style={sx(outCard(b.formato === o.id))}>
                  <span style={sx('display:flex;align-items:center;gap:7px')}>
                    <span style={sx('font-size:13px')}>{o.icono}</span>
                    <span style={sx('font-weight:600;font-size:12.5px')}>{o.id}</span>
                  </span>
                  <span style={sx('font-size:10.5px;opacity:.62;text-align:left;margin-top:3px')}>{o.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={sx(rotulo)}>FECHA DE PUBLICACIÓN</div>
            <input
              type="date"
              value={b.fechaPublicacion}
              onChange={(e) => app.setBorrador({ fechaPublicacion: e.target.value })}
              style={sx(
                "border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:12px;background:#fafbfb;color:#17191f",
              )}
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => app.ir('estudio')}
        style={sx(
          "margin-top:24px;background:#D71029;color:#fff;border:none;border-radius:11px;padding:13px 22px;font-family:'Mulish';font-weight:600;font-size:13.5px;cursor:pointer;display:inline-flex;align-items:center;gap:8px",
        )}
      >
        Abrir estudio <span style={sx('font-size:15px')}>→</span>
      </button>
    </section>
  )
}
