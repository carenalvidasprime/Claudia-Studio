import { useRef, useState } from 'react'
import { sx } from '../lib/sx'
import { chatConfigurado, preguntarACopiloto, type MensajeChat } from '../lib/n8n'
import { TERRITORIO } from '../lib/marca'
import { useApp } from '../store'

const SUGERENCIAS = [
  'Titulares para el Día Mundial del Corazón',
  'Ideas de copy para un testimonio de paciente',
  '¿Qué formato va mejor para un Reel?',
  'Revisa si este texto cumple: «Curamos la diabetes en 1 semana»',
]

export function Copiloto() {
  const app = useApp()
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<MensajeChat[]>([])
  const [entrada, setEntrada] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const scroll = useRef<HTMLDivElement>(null)

  const preguntar = async (texto?: string) => {
    const q = (texto ?? entrada).trim()
    if (!q || ocupado) return
    const siguientes: MensajeChat[] = [...mensajes, { role: 'user', content: q }]
    setMensajes(siguientes)
    setEntrada('')
    setOcupado(true)
    try {
      const centro = app.centroActual
      const respuesta = await preguntarACopiloto(siguientes, {
        territorio: TERRITORIO,
        centro: centro ? { nombre: centro.nombre, ciudad: centro.ciudad, tipo: centro.tipo } : null,
        lineas: app.lineas.map((l) => l.nombre),
        reglas: app.reglas.map((r) => r.texto),
        encargo: app.borrador.texto || null,
      })
      setMensajes((m) => [...m, { role: 'assistant', content: respuesta }])
    } catch (error) {
      setMensajes((m) => [...m, { role: 'assistant', content: (error as Error).message }])
    } finally {
      setOcupado(false)
      requestAnimationFrame(() => scroll.current?.scrollTo({ top: scroll.current.scrollHeight }))
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        style={sx(
          "position:fixed;bottom:22px;right:22px;z-index:60;display:flex;align-items:center;gap:9px;background:#D71029;color:#fff;border:none;border-radius:30px;padding:13px 18px;font-family:'Mulish';font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 12px 30px rgba(215,16,41,.34)",
        )}
      >
        <span style={sx('font-size:15px')}>✦</span> Pregunta a Claudia
      </button>
    )
  }

  return (
    <div
      style={sx(
        'position:fixed;bottom:22px;right:22px;z-index:60;width:min(94vw,372px);height:min(80vh,560px);background:#fff;border:1px solid rgba(29,29,27,.1);border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.26);display:flex;flex-direction:column;overflow:hidden;animation:pop .28s both',
      )}
    >
      <div style={sx('display:flex;align-items:center;gap:10px;padding:15px 16px;border-bottom:1px solid rgba(29,29,27,.08)')}>
        <div
          style={sx(
            'width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#D71029,#f26d84);display:grid;place-items:center;color:#fff;font-size:15px;flex:none',
          )}
        >
          ✦
        </div>
        <div style={sx('line-height:1.2')}>
          <div style={sx('font-size:13.5px;font-weight:700')}>Claudia · copiloto</div>
          <div style={sx('font-size:10.5px;color:#706F6F')}>IA de contenido · Salud Responsable</div>
        </div>
        <button
          onClick={() => setAbierto(false)}
          style={sx('margin-left:auto;background:none;border:none;font-size:20px;color:#706F6F;cursor:pointer;line-height:1')}
        >
          ×
        </button>
      </div>

      <div ref={scroll} style={sx('flex:1;overflow-y:auto;padding:15px;display:flex;flex-direction:column;gap:10px')}>
        {!chatConfigurado && (
          <div
            style={sx(
              'background:#FDE8DE;border:1px solid rgba(215,16,41,.25);border-radius:11px;padding:12px;font-size:11.5px;line-height:1.55;color:#1D1D1B',
            )}
          >
            El copiloto todavía no está conectado. Falta el webhook <strong>claudia-chat</strong> en n8n y la variable{' '}
            <strong>VITE_N8N_CHAT_URL</strong>. El contrato está en <code>n8n/claudia-chat.md</code>.
          </div>
        )}
        {mensajes.length === 0 && (
          <>
            <div style={sx('font-size:12.5px;color:#706F6F;line-height:1.55')}>
              Hola, soy Claudia. Te ayudo a redactar el encargo, propongo copys y titulares por red y reviso que todo
              respete el tono <strong>Salud Responsable</strong>. Prueba:
            </div>
            <div style={sx('display:flex;flex-direction:column;gap:7px;margin-top:4px')}>
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  className="hv-border-red"
                  onClick={() => void preguntar(s)}
                  style={sx(
                    "text-align:left;background:#fafafa;border:1px solid rgba(29,29,27,.1);border-radius:11px;padding:10px 12px;font-family:'Mulish';font-size:12px;color:#1D1D1B;cursor:pointer",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
        {mensajes.map((m, i) => (
          <div
            key={i}
            style={sx('display:flex;' + (m.role === 'user' ? 'justify-content:flex-end' : 'justify-content:flex-start'))}
          >
            <div
              style={sx(
                (m.role === 'user' ? 'background:#D71029;color:#fff' : 'background:#f2f2f2;color:#1D1D1B') +
                  ';max-width:80%;padding:10px 13px;border-radius:14px;font-size:12.5px;line-height:1.5;white-space:pre-wrap',
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {ocupado && (
          <div style={sx('display:flex;justify-content:flex-start')}>
            <div style={sx('background:#f2f2f2;color:#706F6F;padding:10px 13px;border-radius:14px;font-size:12.5px')}>
              Claudia está escribiendo…
            </div>
          </div>
        )}
      </div>

      <div style={sx('padding:12px;border-top:1px solid rgba(29,29,27,.08);display:flex;gap:8px;align-items:flex-end')}>
        <textarea
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void preguntar()
            }
          }}
          placeholder="Escribe tu pregunta…"
          rows={1}
          style={sx(
            "flex:1;resize:none;border:1px solid rgba(29,29,27,.14);border-radius:11px;padding:10px 12px;font-family:'Mulish';font-size:12.5px;background:#fafafa;color:#1D1D1B;max-height:90px",
          )}
        />
        <button
          onClick={() => void preguntar()}
          style={sx(
            "background:#D71029;color:#fff;border:none;border-radius:11px;padding:10px 14px;font-family:'Mulish';font-weight:700;font-size:12.5px;cursor:pointer;flex:none",
          )}
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
