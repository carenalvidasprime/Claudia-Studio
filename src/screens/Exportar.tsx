import { useState } from 'react'
import { sx } from '../lib/sx'
import { colorDeCentro, plural, seg } from '../lib/ui'
import { VistaPieza } from '../components/Piezas'
import { useApp } from '../store'
import type { Pieza } from '../lib/types'

/**
 * Descarga la imagen real del bucket. Si el navegador bloquea la lectura
 * cruzada, se abre en una pestaña para que el usuario la guarde a mano en vez
 * de fallar en silencio.
 */
async function descargar(pieza: Pieza, indice: number) {
  const url = pieza.imagen_url
  if (!url) return
  const nombreBase = `Ribera-${pieza.titulo.replace(/[^a-z0-9]+/gi, '-')}-${indice + 1}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(String(res.status))
    const blob = await res.blob()
    const extension = (url.split('.').pop() ?? 'jpg').split('?')[0].slice(0, 4)
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = `${nombreBase}.${extension}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(objectUrl), 4000)
  } catch {
    window.open(url, '_blank', 'noopener')
  }
}

export function Exportar() {
  const app = useApp()
  const centro = app.centroActual
  const b = app.borrador
  const [ocupado, setOcupado] = useState(false)

  const seleccionadas = Object.keys(app.seleccion)
    .filter((k) => app.seleccion[k])
    .map((id) => app.piezas.find((p) => p.id === id))
    .filter(Boolean) as Pieza[]

  const opciones: { etiqueta: string; valores: string[]; actual: string; elegir: (v: string) => void }[] = [
    {
      etiqueta: 'Formato',
      valores: b.formato === 'Animación' ? ['MP4', 'GIF', 'WebM'] : ['JPG', 'PNG', 'WebP'],
      actual: app.formato,
      elegir: (v) => app.set({ formato: v }),
    },
    {
      etiqueta: 'Resolución',
      valores: ['2K', '4K', 'Original'],
      actual: app.resolucion,
      elegir: (v) => app.set({ resolucion: v }),
    },
    {
      etiqueta: 'Destino',
      valores: ['Descargar', 'Enlace'],
      actual: app.destino,
      elegir: (v) => app.set({ destino: v }),
    },
  ]

  const descargarTodas = async () => {
    setOcupado(true)
    try {
      for (let i = 0; i < seleccionadas.length; i++) {
        await descargar(seleccionadas[i], i)
      }
      await app.entregar('descarga')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <section className="fade" style={sx('padding:28px 32px 60px;max-width:1000px')}>
      <div style={sx('display:grid;grid-template-columns:1fr 296px;gap:24px')}>
        <div>
          <div style={sx('font-size:14px;font-weight:600;margin-bottom:13px')}>
            Selección final · {plural(seleccionadas.length, 'creatividad', 'creatividades')}
          </div>

          {seleccionadas.length === 0 && (
            <div
              style={sx(
                'background:#fff;border:1px dashed rgba(23,25,31,.18);border-radius:12px;padding:22px;font-size:12.5px;color:rgba(23,25,31,.5);line-height:1.5',
              )}
            >
              Aún no hay creatividades en la entrega. Vuelve al estudio y marca con ✓ las aprobadas.
            </div>
          )}

          <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:11px')}>
            {seleccionadas.map((p) => (
              <div key={p.id} style={sx('position:relative')}>
                <VistaPieza url={p.imagen_url} ratio={b.ratio} radio="12px" titulo={p.titulo} />
                <span
                  style={sx(
                    'position:absolute;top:8px;right:8px;width:19px;height:19px;border-radius:50%;background:oklch(0.62 0.13 155);color:#fff;display:grid;place-items:center;font-size:11px',
                  )}
                >
                  ✓
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={sx('background:#fff;border:1px solid rgba(23,25,31,.08);border-radius:15px;padding:19px;height:fit-content')}>
          <div style={sx('font-size:13.5px;font-weight:600;margin-bottom:15px')}>Publicar o exportar</div>
          <div style={sx('display:flex;align-items:center;gap:9px;background:#f4f4f4;border-radius:9px;padding:9px 11px;margin-bottom:15px')}>
            <div style={sx(`width:20px;height:20px;border-radius:6px;background:${centro ? colorDeCentro(centro.id) : '#DEDEDE'};flex:none`)} />
            <div style={sx('line-height:1.2;min-width:0')}>
              <div style={sx('font-size:12.5px;font-weight:600')}>{centro?.nombre ?? '—'}</div>
              <div style={sx('font-size:10.5px;color:rgba(23,25,31,.45)')}>{b.canal}</div>
            </div>
          </div>

          {opciones.map((o) => (
            <div key={o.etiqueta} style={sx('margin-bottom:14px')}>
              <div style={sx('font-size:11px;font-weight:500;color:rgba(23,25,31,.58);margin-bottom:6px')}>{o.etiqueta}</div>
              <div style={sx('display:flex;flex-wrap:wrap;gap:5px')}>
                {o.valores.map((v) => (
                  <button key={v} onClick={() => o.elegir(v)} style={sx(seg(o.actual === v))}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div style={sx('font-size:10.5px;color:rgba(23,25,31,.45);line-height:1.5;margin-bottom:12px')}>
            La descarga entrega el archivo tal como lo produjo n8n; formato y resolución acompañan a la entrega como
            instrucción, no reconvierten la imagen.
          </div>

          <button
            onClick={() => void descargarTodas()}
            disabled={!seleccionadas.length || ocupado}
            style={sx(
              "width:100%;background:#D71029;color:#fff;border:none;border-radius:10px;padding:13px;font-family:'Mulish';font-weight:600;font-size:13.5px;cursor:pointer",
              (!seleccionadas.length || ocupado) && 'opacity:.55;cursor:not-allowed',
            )}
          >
            {ocupado ? 'Descargando…' : 'Descargar creatividades'}
          </button>
          <button
            onClick={() => void app.entregar('centro')}
            disabled={!seleccionadas.length}
            style={sx(
              "margin-top:8px;width:100%;background:#f4f4f4;border:1px solid rgba(23,25,31,.1);border-radius:10px;padding:12px;font-family:'Mulish';font-weight:500;font-size:13px;cursor:pointer;color:#17191f",
              !seleccionadas.length && 'opacity:.55;cursor:not-allowed',
            )}
          >
            Enviar al centro
          </button>
        </div>
      </div>

      {app.entregada && (
        <div style={sx('position:fixed;inset:0;background:rgba(23,25,31,.5);display:grid;place-items:center;z-index:50;padding:20px')}>
          <div style={sx('background:#fff;border-radius:16px;padding:32px 30px;max-width:360px;text-align:center;box-shadow:0 24px 60px rgba(23,25,31,.25)')}>
            <div
              style={sx(
                'width:52px;height:52px;border-radius:50%;background:oklch(0.62 0.13 155);color:#fff;display:grid;place-items:center;font-size:24px;margin:0 auto 14px',
              )}
            >
              ✓
            </div>
            <div style={sx('font-size:15px;font-weight:700;margin-bottom:6px')}>Entrega completada</div>
            <div style={sx('font-size:12.5px;color:rgba(23,25,31,.6);line-height:1.5;margin-bottom:20px')}>
              {app.entregada.etiqueta} y marcada como <strong>Publicado</strong> en el planificador.
            </div>
            <button
              onClick={() =>
                app.set((p) => ({
                  entregada: null,
                  pantalla: 'centro',
                  centroTab: 'carpetas',
                  desplegadas: p.carpetaId ? { ...p.desplegadas, [String(p.carpetaId)]: true } : p.desplegadas,
                }))
              }
              style={sx(
                "width:100%;background:#17191f;color:#fff;border:none;border-radius:10px;padding:12px;font-family:'Mulish';font-weight:600;font-size:13px;cursor:pointer",
              )}
            >
              Volver al planificador
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
