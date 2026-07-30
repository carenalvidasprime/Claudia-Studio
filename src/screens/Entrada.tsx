import { useRef, useState } from 'react'
import { sx } from '../lib/sx'
import { presentacionDe } from '../lib/marca'
import * as api from '../lib/api'
import { mensajeError } from '../lib/supabase'
import { useApp } from '../store'

/** Puerta de entrada: los tres caminos para crear una creatividad. */
export function Gateway() {
  const app = useApp()
  const input = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)

  const tarjeta = (
    icono: string,
    fondo: string,
    titulo: string,
    desc: string,
    accion: () => void,
    deshabilitada = false,
  ) => (
    <button
      className="hv-border-red"
      onClick={accion}
      disabled={deshabilitada}
      style={sx(
        "text-align:left;background:#fff;border:1.5px solid rgba(23,25,31,.1);border-radius:14px;padding:20px;font-family:'Mulish';cursor:pointer;display:flex;flex-direction:column;gap:8px",
        deshabilitada && 'opacity:.6;cursor:progress',
      )}
    >
      <span style={sx(`width:34px;height:34px;border-radius:9px;background:${fondo};display:grid;place-items:center;font-size:15px`)}>
        {icono}
      </span>
      <span style={sx('font-size:13.5px;font-weight:700;color:#1D1D1B')}>{titulo}</span>
      <span style={sx('font-size:11px;color:rgba(23,25,31,.55);line-height:1.5')}>{desc}</span>
    </button>
  )

  const subir = async (archivo: File) => {
    setSubiendo(true)
    try {
      const material = await api.subirMaterial(archivo)
      app.setBorrador({ material })
      app.set({ pantalla: 'brief', origen: 'scratch' })
      app.avisar(`Material subido: ${material.nombre} ✓`)
    } catch (error) {
      app.avisar(mensajeError(error), 'error')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <section className="fade" style={sx('padding:34px 32px 60px;max-width:760px')}>
      <div style={sx('font-size:12.5px;color:rgba(23,25,31,.5);margin-bottom:18px')}>
        {app.centroActual?.nombre} · {app.carpetaActual?.nombre ?? 'Sin carpeta'}
      </div>
      <div style={sx('display:grid;grid-template-columns:repeat(3,1fr);gap:14px')}>
        {tarjeta(
          '✦',
          '#FDE8DE',
          'Partir de una situación',
          'Elige un tipo de contenido (testimonio, evento, hito clínico…) y Claudia lo prepara con su criterio.',
          () => app.ir('situaciones'),
        )}
        {tarjeta('✎', '#DEDEDE', 'Empezar desde cero', 'Describe el encargo libremente.', () =>
          app.set({ pantalla: 'brief', origen: 'scratch' }),
        )}
        {tarjeta(
          '↑',
          '#DEDEDE',
          subiendo ? 'Subiendo…' : 'Subir material',
          'Ya tienes una foto real: súbela como referencia y Claudia la adapta a marca.',
          () => input.current?.click(),
          subiendo,
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*,video/*"
        style={sx('display:none')}
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) void subir(f)
        }}
      />
    </section>
  )
}

/** Selector de situaciones. Las 6 se leen de la tabla `situaciones`. */
export function Situaciones() {
  const app = useApp()

  return (
    <section className="fade" style={sx('padding:34px 32px 60px;max-width:1080px')}>
      <div style={sx('font-size:12.5px;color:rgba(23,25,31,.5);margin-bottom:18px')}>
        {app.centroActual?.nombre} · {app.carpetaActual?.nombre ?? 'Sin carpeta'}
      </div>

      {app.situaciones.length === 0 && (
        <div
          style={sx(
            'background:#fff;border:1px dashed rgba(23,25,31,.18);border-radius:14px;padding:32px;text-align:center;color:rgba(23,25,31,.5);font-size:12.5px;line-height:1.55',
          )}
        >
          No se han podido leer las situaciones. Revisa las políticas RLS de la tabla <strong>situaciones</strong>.
        </div>
      )}

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px')}>
        {app.situaciones.map((s) => {
          const pres = presentacionDe(s.clave)
          const meta = [pres.objetivo, 'Imagen', pres.ratio].join(' · ')
          return (
            <button
              key={String(s.id)}
              className="hv-situacion"
              onClick={() => app.elegirSituacion(s)}
              style={{
                ...sx(
                  "text-align:left;background:#fff;border:1.5px solid rgba(23,25,31,.1);border-radius:16px;padding:22px 20px;font-family:'Mulish';cursor:pointer;display:flex;flex-direction:column;gap:14px;transition:border-color .15s,box-shadow .15s,transform .15s",
                ),
                ['--sit-color' as string]: pres.color,
              }}
            >
              <span
                style={sx(`width:44px;height:44px;border-radius:11px;background:${pres.tinte};display:grid;place-items:center;flex:none`)}
              >
                <svg
                  viewBox="0 0 32 32"
                  width={22}
                  height={22}
                  fill="none"
                  stroke={pres.color}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  dangerouslySetInnerHTML={{ __html: pres.icono }}
                />
              </span>
              <div>
                <div style={sx('font-size:14.5px;font-weight:700;color:#1D1D1B')}>{s.nombre}</div>
                <div style={sx('font-size:12px;color:rgba(23,25,31,.65);line-height:1.5;margin-top:6px')}>{pres.desc}</div>
              </div>
              <div
                style={sx(
                  "font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.04em;color:rgba(23,25,31,.4);margin-top:auto;padding-top:10px;border-top:1px solid rgba(23,25,31,.08);display:flex;gap:8px;flex-wrap:wrap",
                )}
              >
                <span>{meta}</span>
                {s.requiere_consentimiento && <span style={sx('color:#D71029')}>· CONSENTIMIENTO</span>}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
