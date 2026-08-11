import { useState } from 'react'
import { sx } from '../lib/sx'
import { MarcaOverlay } from '../components/Piezas'
import { descargarPieza, descargarPiezaSVG } from '../lib/componer'
import * as api from '../lib/api'
import { mensajeError } from '../lib/supabase'
import { useApp } from '../store'

/**
 * Acciones de retoque. Se muestran deshabilitadas: hoy la producción de imagen
 * la hace n8n en una sola pasada y no hay un endpoint de edición, así que
 * dejarlas activas prometería una capacidad que no existe.
 */
const RETOQUES = [
  { id: 'variar', icono: '⧉', nombre: 'Variaciones de esta imagen', sub: 'Versiones parecidas partiendo de esta misma imagen', activo: true },
  { id: 'otras', icono: '✦', nombre: 'Generar otras versiones', sub: 'Nuevas imágenes con la misma idea y el mismo texto', activo: true },
  { id: 'fondo', icono: '◫', nombre: 'Cambiar fondo', sub: 'Mismo sujeto, entorno nuevo', activo: false },
  { id: 'resolucion', icono: '⤢', nombre: 'Mejorar resolución', sub: 'Reescalado a mayor tamaño', activo: false },
  { id: 'luz', icono: '☀', nombre: 'Ajustar iluminación', sub: 'Reilumina la escena', activo: false },
]

export function Detalle() {
  const app = useApp()
  const pieza = app.piezaActual
  const b = app.borrador
  const [descargando, setDescargando] = useState(false)
  const [generandoTexto, setGenerandoTexto] = useState(false)
  if (!pieza) return null

  const esAnimacion = b.formato === 'Animación'

  const setCampo = (campo: 'copy_texto' | 'hashtags', valor: string) =>
    app.set((s) => ({ piezas: s.piezas.map((x) => (x.id === pieza.id ? { ...x, [campo]: valor } : x)) }))

  const guardarCampo = async (campo: 'copy_texto' | 'hashtags', valor: string) => {
    try {
      await api.actualizarPieza(pieza.id, { [campo]: valor })
    } catch (error) {
      app.avisar(mensajeError(error), 'error')
    }
  }

  const generarTexto = async () => {
    setGenerandoTexto(true)
    try {
      await app.generarTextoPost(pieza.id)
      app.avisar('Texto del post redactado ✓')
    } catch (error) {
      app.avisar(mensajeError(error), 'error')
    } finally {
      setGenerandoTexto(false)
    }
  }

  const copiarTexto = async () => {
    const t = [pieza.copy_texto, pieza.hashtags].filter(Boolean).join('\n\n')
    if (!t) return
    try {
      await navigator.clipboard.writeText(t)
      app.avisar('Texto copiado ✓')
    } catch {
      app.avisar('No se pudo copiar. Cópialo a mano.', 'error')
    }
  }

  const descargar = async (formato: 'png' | 'svg') => {
    setDescargando(true)
    try {
      if (formato === 'png') await descargarPieza(pieza, b.copy)
      else await descargarPiezaSVG(pieza, b.copy)
      app.avisar(formato === 'png' ? 'PNG descargado ✓' : 'SVG editable descargado ✓')
    } catch (error) {
      app.avisar(mensajeError(error), 'error')
    } finally {
      setDescargando(false)
    }
  }

  // Reutiliza el encargo de esta pieza (idea, texto, dirección) y regenera
  // otras versiones. El borrador ya refleja la pieza abierta.
  const otrasVersiones = () => {
    app.ir('estudio')
    void app.generar()
  }

  // Remezclar: parte de ESTA imagen (imagen-a-imagen) y crea variaciones
  // parecidas, manteniendo el texto y la marca de la capa superpuesta.
  const variaciones = () => {
    app.ir('estudio')
    void app.generar({ referenciaUrl: pieza.imagen_url ?? undefined })
  }

  const accionRetoque = (id?: string) => (id === 'variar' ? variaciones : otrasVersiones)

  return (
    <section className="fade" style={sx('display:grid;grid-template-columns:1fr 296px;height:calc(100vh - 64px)')}>
      <div style={sx('display:grid;place-items:center;padding:30px;background:#eceef0;overflow-y:auto')}>
        <div style={sx('width:min(100%,420px);border-radius:16px;box-shadow:0 18px 44px rgba(23,25,31,.14);overflow:hidden')}>
          <MarcaOverlay
            url={pieza.imagen_url}
            ratio={b.ratio}
            radio="0"
            copy={b.marca ? b.copy : undefined}
            mostrarLogo={b.marca}
            plantilla={b.plantilla}
            grande
            extra={
              <>
                <span
                  style={sx(
                    "position:absolute;bottom:13px;right:13px;background:rgba(23,25,31,.75);color:#fff;font-family:'IBM Plex Mono',monospace;font-size:9.5px;padding:4px 8px;border-radius:6px",
                  )}
                >
                  {b.ratio}
                </span>
                {esAnimacion && (
                  <span
                    style={sx(
                      'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:52px;height:52px;border-radius:50%;background:rgba(23,25,31,.7);color:#fff;display:grid;place-items:center;font-size:18px',
                    )}
                  >
                    ▶
                  </span>
                )}
              </>
            }
          />
        </div>
      </div>

      <div style={sx('border-left:1px solid rgba(23,25,31,.08);background:#fff;padding:22px 20px;overflow-y:auto')}>
        <div style={sx('font-size:13.5px;font-weight:700;line-height:1.35;margin-bottom:4px')}>{pieza.titulo}</div>
        <div style={sx('font-size:11px;color:rgba(23,25,31,.5);margin-bottom:18px')}>
          {pieza.canal ?? '—'} · {app.lineaDe(pieza.linea_id)?.nombre ?? 'Sin línea'}
        </div>

        <div
          style={sx(
            "font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4);margin-bottom:9px",
          )}
        >
          MENSAJE SOBRE LA PIEZA
        </div>
        <textarea
          value={b.copy}
          onChange={(e) => app.setBorrador({ copy: e.target.value })}
          onBlur={async () => {
            try {
              await api.actualizarPieza(pieza.id, { brief: { ...(pieza.brief ?? {}), copy: b.copy } })
              app.set((s) => ({
                piezas: s.piezas.map((x) => (x.id === pieza.id ? { ...x, brief: { ...(x.brief ?? {}), copy: b.copy } } : x)),
              }))
            } catch (error) {
              app.avisar(mensajeError(error), 'error')
            }
          }}
          placeholder="Texto que aparece encima de la imagen, con el logo. Se guarda al salir del campo."
          style={sx(
            "width:100%;min-height:60px;resize:vertical;border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:11px;font-family:'Mulish';font-size:12.5px;line-height:1.5;background:#fff;color:#17191f;margin-bottom:18px",
          )}
        />

        <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px')}>
          <div style={sx("font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4)")}>
            TEXTO DEL POST
          </div>
          <button
            onClick={() => void generarTexto()}
            disabled={!app.copyDisponible || generandoTexto}
            title={
              app.copyDisponible
                ? 'Redacta el texto con IA, en el tono de la marca'
                : 'Disponible cuando configures el flujo de texto en n8n (VITE_N8N_COPY_URL).'
            }
            style={sx(
              "display:inline-flex;align-items:center;gap:5px;background:none;border:none;padding:0;font-family:'Mulish';font-weight:700;font-size:11px;color:var(--acento);cursor:pointer",
              (!app.copyDisponible || generandoTexto) && 'opacity:.45;cursor:not-allowed',
            )}
          >
            ✦ {generandoTexto ? 'Redactando…' : 'Generar con IA'}
          </button>
        </div>
        <textarea
          value={pieza.copy_texto ?? ''}
          onChange={(e) => setCampo('copy_texto', e.target.value)}
          onBlur={(e) => void guardarCampo('copy_texto', e.target.value)}
          placeholder="El texto que acompaña al post. Escríbelo o genéralo con IA."
          style={sx(
            "width:100%;min-height:96px;resize:vertical;border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:11px;font-family:'Mulish';font-size:12.5px;line-height:1.55;background:#fff;color:#17191f;margin-bottom:8px",
          )}
        />
        <input
          value={pieza.hashtags ?? ''}
          onChange={(e) => setCampo('hashtags', e.target.value)}
          onBlur={(e) => void guardarCampo('hashtags', e.target.value)}
          placeholder="#hashtags del post"
          style={sx(
            "width:100%;border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:9px 11px;font-family:'Mulish';font-size:12px;color:var(--acento);background:#fff;margin-bottom:8px",
          )}
        />
        <button
          onClick={() => void copiarTexto()}
          disabled={!pieza.copy_texto && !pieza.hashtags}
          style={sx(
            "width:100%;background:#f4f4f4;border:1px solid rgba(23,25,31,.1);border-radius:9px;padding:9px;font-family:'Mulish';font-weight:600;font-size:11.5px;cursor:pointer;color:#17191f;margin-bottom:18px",
            !pieza.copy_texto && !pieza.hashtags && 'opacity:.5;cursor:not-allowed',
          )}
        >
          ⧉ Copiar texto del post
        </button>

        <div
          style={sx(
            "font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4);margin-bottom:11px",
          )}
        >
          RETOQUE IA
        </div>
        <div style={sx('display:flex;flex-direction:column;gap:7px')}>
          {RETOQUES.map((r) => (
            <button
              key={r.nombre}
              disabled={!r.activo || app.generando}
              onClick={r.activo ? accionRetoque(r.id) : undefined}
              title={
                r.activo
                  ? r.id === 'variar'
                    ? 'Crea variaciones partiendo de esta misma imagen'
                    : 'Regenera versiones nuevas manteniendo la idea y el texto'
                  : 'Disponible cuando el workflow de n8n incorpore un paso de edición.'
              }
              className={r.activo ? undefined : 'is-pending'}
              style={sx(
                "display:flex;align-items:center;gap:11px;border-radius:10px;padding:11px 12px;font-family:'Mulish';font-weight:500;font-size:12.5px;color:#17191f;text-align:left;width:100%",
                r.activo
                  ? 'background:#fff;border:1px solid rgba(23,25,31,.16);cursor:pointer'
                  : 'background:#f4f4f4;border:1px solid transparent',
              )}
            >
              <span
                style={sx(
                  'width:28px;height:28px;border-radius:8px;display:grid;place-items:center;font-size:13px;flex:none',
                  r.activo ? 'background:var(--suave-1);color:var(--acento)' : 'background:#ddf3fb;color:oklch(0.45 0.09 220)',
                )}
              >
                {r.icono}
              </span>
              <span>
                {r.nombre}
                <br />
                <span style={sx('font-weight:400;font-size:10.5px;color:rgba(23,25,31,.48)')}>{r.sub}</span>
              </span>
            </button>
          ))}
        </div>
        <div style={sx('font-size:10.5px;color:rgba(23,25,31,.45);margin-top:9px;line-height:1.5')}>
          El resto de retoques (resolución, fondo, iluminación…) llegará cuando el workflow de n8n incorpore un paso de edición sobre la propia imagen.
        </div>

        <div
          style={sx('margin-top:18px;border-top:1px solid rgba(23,25,31,.08);padding-top:16px;display:flex;flex-direction:column;gap:8px')}
        >
          <div style={sx('display:flex;gap:8px')}>
            <button
              onClick={() => void descargar('png')}
              disabled={descargando || !pieza.imagen_url}
              title="Pieza final lista para publicar"
              style={sx(
                "flex:1;background:#17191f;color:#fff;border:none;border-radius:10px;padding:12px 10px;font-family:'Mulish';font-weight:600;font-size:12.5px;cursor:pointer",
                (descargando || !pieza.imagen_url) && 'opacity:.6;cursor:not-allowed',
              )}
            >
              {descargando ? 'Componiendo…' : '↓ PNG (final)'}
            </button>
            <button
              onClick={() => void descargar('svg')}
              disabled={descargando || !pieza.imagen_url}
              title="Editable: capas sueltas para retocar en Figma, Illustrator o Inkscape"
              style={sx(
                "flex:1;background:#fff;color:#17191f;border:1px solid rgba(23,25,31,.18);border-radius:10px;padding:12px 10px;font-family:'Mulish';font-weight:600;font-size:12.5px;cursor:pointer",
                (descargando || !pieza.imagen_url) && 'opacity:.6;cursor:not-allowed',
              )}
            >
              ↓ SVG (editable)
            </button>
          </div>
          <button
            onClick={() => void app.aprobarPieza(pieza.id)}
            style={sx(
              "width:100%;background:var(--acento);color:#fff;border:none;border-radius:10px;padding:12px;font-family:'Mulish';font-weight:600;font-size:13px;cursor:pointer",
            )}
          >
            Aprobar y añadir a entrega
          </button>
          <button
            onClick={() => app.ir('estudio')}
            style={sx(
              "width:100%;background:#f4f4f4;border:1px solid rgba(23,25,31,.1);border-radius:10px;padding:12px;font-family:'Mulish';font-weight:500;font-size:13px;cursor:pointer;color:#17191f",
            )}
          >
            Volver a variantes
          </button>
        </div>
      </div>
    </section>
  )
}
