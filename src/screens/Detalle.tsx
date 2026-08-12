import { useState } from 'react'
import { sx } from '../lib/sx'
import { MarcaOverlay } from '../components/Piezas'
import { descargarPieza, descargarPiezaSVG } from '../lib/componer'
import * as api from '../lib/api'
import { mensajeError } from '../lib/supabase'
import { ESTADOS, ESTADO_LABEL, type Brief, type Estado } from '../lib/types'
import { useApp } from '../store'

// Chip de estado (color semántico, no es el acento de marca).
const TONO_ESTADO: Record<Estado, string> = {
  borrador: 'background:#eef0f1;color:#5b6674',
  en_revision: 'background:#FBEFD8;color:#9A6B1B',
  aprobado: 'background:#E4F4EC;color:#1C7A4E',
  programado: 'background:#E7F0FB;color:#1F5FB0',
  publicado: 'background:#1D1D1B;color:#fff',
}

/**
 * La columna vertebral del producto es el estado de la pieza. Cada estado
 * tiene UN "siguiente paso" claro (avanzar) y, si procede, una vuelta atrás
 * (retroceder). Así el usuario nunca se pregunta "¿y ahora qué?": la propia
 * pieza se lo dice.
 */
const FLUJO: Record<Estado, { avanzar?: { a: Estado; label: string }; retroceder?: { a: Estado; label: string } }> = {
  borrador: { avanzar: { a: 'en_revision', label: 'Enviar a revisión' } },
  en_revision: {
    avanzar: { a: 'aprobado', label: 'Aprobar' },
    retroceder: { a: 'borrador', label: 'Devolver a borrador' },
  },
  aprobado: {
    avanzar: { a: 'programado', label: 'Programar' },
    retroceder: { a: 'en_revision', label: 'Volver a revisión' },
  },
  programado: {
    avanzar: { a: 'publicado', label: 'Marcar como publicado' },
    retroceder: { a: 'aprobado', label: 'Quitar de la programación' },
  },
  publicado: { retroceder: { a: 'programado', label: 'Reabrir' } },
}

export function Detalle() {
  const app = useApp()
  const pieza = app.piezaActual
  const b = app.borrador
  const [descargando, setDescargando] = useState(false)
  const [generandoTexto, setGenerandoTexto] = useState(false)
  const [cambiarManual, setCambiarManual] = useState(false)
  if (!pieza) return null

  const flujo = FLUJO[pieza.estado]

  const esAnimacion = b.formato === 'Animación'
  const ANUNCIOS: IdPlantilla[] = ['anuncio', 'anuncioOscuro', 'anuncioMarca', 'sobrefoto']
  const esAnuncio = ANUNCIOS.includes(b.plantilla)

  type IdPlantilla = 'editorial' | 'franja' | 'anuncio' | 'anuncioOscuro' | 'anuncioMarca' | 'sobrefoto'
  const PLANTILLAS: Array<{ id: IdPlantilla; label: string }> = [
    { id: 'editorial', label: 'Editorial' },
    { id: 'franja', label: 'Franja' },
    { id: 'anuncio', label: 'Anuncio' },
    { id: 'anuncioOscuro', label: 'Oscuro' },
    { id: 'anuncioMarca', label: 'Marca' },
    { id: 'sobrefoto', label: 'Sobre foto' },
  ]
  const elegirPlantilla = (id: IdPlantilla) => {
    app.setBorrador({ plantilla: id })
    void guardarBrief({ plantilla: id })
  }

  const setCampo = (campo: 'copy_texto' | 'hashtags', valor: string) =>
    app.set((s) => ({ piezas: s.piezas.map((x) => (x.id === pieza.id ? { ...x, [campo]: valor } : x)) }))

  const guardarCampo = async (campo: 'copy_texto' | 'hashtags', valor: string) => {
    try {
      await api.actualizarPieza(pieza.id, { [campo]: valor })
    } catch (error) {
      app.avisar(mensajeError(error), 'error')
    }
  }

  // Guarda cambios en el brief de la pieza (plantilla, maqueta…) de forma
  // optimista y persistente. La fusión se hace SOBRE la pieza más reciente del
  // estado (no una copia del render), para que dos ediciones seguidas no se
  // pisen. `maqueta` se fusiona sobre la existente.
  const guardarBrief = async (cambios: Partial<Brief>) => {
    let brief: Brief = pieza.brief ?? {}
    app.set((s) => ({
      piezas: s.piezas.map((x) => {
        if (x.id !== pieza.id) return x
        const prev = x.brief ?? {}
        brief = { ...prev, ...cambios, maqueta: { ...(prev.maqueta ?? {}), ...(cambios.maqueta ?? {}) } }
        return { ...x, brief }
      }),
    }))
    try {
      await api.actualizarPieza(pieza.id, { brief })
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

  // Genera versiones: N fotos nuevas manteniendo la idea, la plantilla y los
  // textos. Es la vía principal para producir más imágenes.
  const generarVersiones = otrasVersiones

  // Variaciones: parte de ESTA imagen (imagen-a-imagen) y crea variantes
  // parecidas. Lleva al estudio en modo remezclar, con esta foto como partida,
  // para que el usuario ajuste el grado antes de lanzar.
  const variaciones = () => {
    if (!pieza.imagen_url) return
    app.setBorrador({ material: { url: pieza.imagen_url, nombre: pieza.titulo } })
    app.ir('estudio')
  }

  return (
    <section className="fade" style={sx('display:grid;grid-template-columns:1fr 296px;height:calc(100vh - 64px)')}>
      <div style={sx('display:grid;place-items:center;padding:30px;background:#eceef0;overflow-y:auto')}>
        <div style={sx('width:min(100%,420px);border-radius:16px;box-shadow:0 18px 44px rgba(23,25,31,.14);overflow:hidden')}>
          <MarcaOverlay
            url={pieza.imagen_url}
            ratio={b.ratio}
            radio="0"
            copy={b.marca ? b.copy : undefined}
            subtitulo={b.subtitulo}
            cta={b.cta}
            mostrarSubtitulo={b.mostrarSubtitulo}
            mostrarCta={b.mostrarCta}
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

      <div style={sx('border-left:1px solid rgba(23,25,31,.08);background:#fff;padding:22px 20px 72px;overflow-y:auto')}>
        <div style={sx('font-size:13.5px;font-weight:700;line-height:1.35;margin-bottom:4px')}>{pieza.titulo}</div>
        <div style={sx('font-size:11px;color:rgba(23,25,31,.5);margin-bottom:14px')}>
          {pieza.canal ?? '—'} · {app.lineaDe(pieza.linea_id)?.nombre ?? 'Sin línea'}
        </div>

        <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px')}>
          <div style={sx("font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4)")}>
            ESTADO
          </div>
          <button
            onClick={() => setCambiarManual((v) => !v)}
            style={sx(
              "background:none;border:none;padding:0;font-family:'Mulish';font-weight:600;font-size:10.5px;color:rgba(23,25,31,.45);cursor:pointer",
            )}
          >
            {cambiarManual ? 'Cerrar' : 'Cambiar ▾'}
          </button>
        </div>
        {cambiarManual ? (
          <select
            value={pieza.estado}
            onChange={(e) => void app.ponerEstado(pieza.id, e.target.value as Estado)}
            style={sx(
              "width:100%;border:1px solid rgba(23,25,31,.14);border-radius:10px;padding:9px 11px;font-family:'Mulish';font-size:12.5px;background:#fff;color:#17191f;margin-bottom:18px;cursor:pointer",
            )}
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ESTADO_LABEL[e]}
              </option>
            ))}
          </select>
        ) : (
          <div
            style={sx(
              `display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:6px 11px;border-radius:999px;margin-bottom:18px;${TONO_ESTADO[pieza.estado]}`,
            )}
          >
            {ESTADO_LABEL[pieza.estado]}
          </div>
        )}

        <div style={sx("font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4);margin-bottom:8px")}>
          PLANTILLA
        </div>
        <div style={sx('display:flex;flex-wrap:wrap;gap:5px;margin-bottom:18px')}>
          {PLANTILLAS.map((p) => {
            const on = b.plantilla === p.id
            return (
              <button
                key={p.id}
                onClick={() => elegirPlantilla(p.id)}
                style={sx(
                  "flex:1 1 45%;border-radius:8px;padding:8px 4px;cursor:pointer;font-family:'Mulish';font-weight:600;font-size:11.5px",
                  on ? 'background:#17191f;color:#fff;border:1px solid #17191f' : 'background:#fff;color:#17191f;border:1px solid rgba(23,25,31,.14)',
                )}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        <div
          style={sx(
            "font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4);margin-bottom:9px",
          )}
        >
          {esAnuncio ? 'TITULAR' : 'MENSAJE SOBRE LA PIEZA'}
        </div>
        <textarea
          value={b.copy}
          onChange={(e) => app.setBorrador({ copy: e.target.value })}
          onBlur={() => void guardarBrief({ copy: b.copy })}
          placeholder={esAnuncio ? 'Titular del anuncio' : 'Texto que aparece encima de la imagen, con el logo. Se guarda al salir del campo.'}
          style={sx(
            "width:100%;min-height:60px;resize:vertical;border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:11px;font-family:'Mulish';font-size:12.5px;line-height:1.5;background:#fff;color:#17191f;margin-bottom:14px",
          )}
        />

        {esAnuncio && (
          <>
            <div style={sx("font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4);margin-bottom:7px")}>
              SUBTÍTULO
            </div>
            <textarea
              value={b.subtitulo}
              onChange={(e) => app.setBorrador({ subtitulo: e.target.value })}
              onBlur={() => void guardarBrief({ maqueta: { subtitulo: b.subtitulo } })}
              placeholder="Una frase de apoyo (opcional)."
              style={sx(
                "width:100%;min-height:44px;resize:vertical;border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:10px;font-family:'Mulish';font-size:12px;line-height:1.5;background:#fff;color:#17191f;margin-bottom:12px",
              )}
            />
            <div style={sx("font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4);margin-bottom:7px")}>
              BOTÓN (CTA)
            </div>
            <input
              value={b.cta}
              onChange={(e) => app.setBorrador({ cta: e.target.value })}
              onBlur={() => void guardarBrief({ maqueta: { cta: b.cta } })}
              placeholder="Ej.: «Pide tu cita»"
              style={sx(
                "width:100%;border:1px solid rgba(23,25,31,.12);border-radius:10px;padding:10px 11px;font-family:'Mulish';font-size:12px;background:#fff;color:#17191f;margin-bottom:14px",
              )}
            />
          </>
        )}

        {/* Acciones de imagen: siempre visibles (cualquier plantilla). Dos vías
            claras para producir imagen — nuevas fotos con la misma idea, o
            variaciones partiendo de ESTA foto. */}
        <div style={sx("font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4);margin-bottom:9px")}>
          {esAnuncio ? 'GENERAR IMAGEN' : 'MÁS IMÁGENES'}
        </div>
        <button
          onClick={() => void generarVersiones()}
          disabled={app.generando || !app.generarDisponible}
          title={app.generarDisponible ? 'Genera varias fotos nuevas manteniendo la idea, la plantilla y el texto' : 'Falta configurar el webhook de n8n.'}
          style={sx(
            "width:100%;display:flex;flex-direction:column;align-items:center;gap:1px;background:var(--acento);color:#fff;border:none;border-radius:11px;padding:12px;font-family:'Mulish';cursor:pointer;margin-bottom:8px",
            (app.generando || !app.generarDisponible) && 'opacity:.55;cursor:not-allowed',
          )}
        >
          <span style={sx('font-weight:700;font-size:13px')}>✨ {app.generando ? 'Generando…' : 'Generar versiones'}</span>
          <span style={sx('font-size:10px;opacity:.85')}>{b.variantes} fotos nuevas · misma idea{esAnuncio ? ', maqueta y textos' : ' y texto'}</span>
        </button>
        <button
          onClick={() => void variaciones()}
          disabled={app.generando || !app.generarDisponible || !pieza.imagen_url}
          title={
            !pieza.imagen_url
              ? 'Aún no hay imagen de partida.'
              : app.generarDisponible
                ? 'Crea variaciones partiendo de esta misma foto (mismo sujeto y escena)'
                : 'Falta configurar el webhook de n8n.'
          }
          style={sx(
            "width:100%;display:flex;flex-direction:column;align-items:center;gap:1px;background:#fff;color:#17191f;border:1px solid rgba(23,25,31,.18);border-radius:11px;padding:11px;font-family:'Mulish';cursor:pointer;margin-bottom:18px",
            (app.generando || !app.generarDisponible || !pieza.imagen_url) && 'opacity:.5;cursor:not-allowed',
          )}
        >
          <span style={sx('font-weight:700;font-size:12.5px')}>⧉ Variaciones de esta foto</span>
          <span style={sx('font-size:10px;color:rgba(23,25,31,.5)')}>Parte de esta misma imagen · ajusta el grado en el estudio</span>
        </button>

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

        <div style={sx('font-size:10.5px;color:rgba(23,25,31,.4);line-height:1.5')}>
          Los retoques sobre la propia imagen (cambiar fondo, mejorar resolución, reiluminar…) llegarán cuando el workflow de n8n incorpore un paso de edición.
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
          {flujo.avanzar && (
            <button
              onClick={() => void app.ponerEstado(pieza.id, flujo.avanzar!.a)}
              style={sx(
                "width:100%;display:flex;align-items:center;justify-content:center;gap:7px;background:var(--acento);color:#fff;border:none;border-radius:10px;padding:12px;font-family:'Mulish';font-weight:700;font-size:13px;cursor:pointer",
              )}
            >
              {flujo.avanzar.label} <span style={sx('font-size:15px;line-height:1')}>→</span>
            </button>
          )}
          {flujo.retroceder && (
            <button
              onClick={() => void app.ponerEstado(pieza.id, flujo.retroceder!.a)}
              style={sx(
                "width:100%;background:#fff;border:1px solid rgba(23,25,31,.14);border-radius:10px;padding:10px;font-family:'Mulish';font-weight:500;font-size:12px;cursor:pointer;color:rgba(23,25,31,.7)",
              )}
            >
              {flujo.retroceder.label}
            </button>
          )}
          {!flujo.avanzar && !flujo.retroceder && (
            <div style={sx('text-align:center;font-size:12px;color:rgba(23,25,31,.5);padding:6px')}>
              Esta pieza ya está publicada.
            </div>
          )}
          <button
            onClick={() => app.ir('estudio')}
            style={sx(
              "width:100%;background:none;border:none;border-radius:10px;padding:8px;font-family:'Mulish';font-weight:500;font-size:12px;cursor:pointer;color:rgba(23,25,31,.5)",
            )}
          >
            ↩ Volver a las variantes del estudio
          </button>
        </div>
      </div>
    </section>
  )
}
