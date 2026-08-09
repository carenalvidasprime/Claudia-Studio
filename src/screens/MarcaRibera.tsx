import { sx } from '../lib/sx'
import { TERRITORIO, TERRITORIO_DESC, TIPOGRAFIA, normalizarHex } from '../lib/marca'
import * as api from '../lib/api'
import { mensajeError } from '../lib/supabase'
import { useApp } from '../store'

export function MarcaRibera() {
  const app = useApp()
  const editable = app.marcaEditable

  const anadirColor = () =>
    app.abrirModal({
      tipo: 'color',
      titulo: 'Añadir color',
      sub: 'Código hexadecimal y nombre del nuevo color de marca.',
      hex: 'var(--acento)',
      nombre: '',
      confirmar: async (_valor, extra) => {
        const hex = normalizarHex(extra?.hex ?? '')
        if (!hex) {
          app.set((p) => ({
            modal: p.modal && { ...p.modal, error: 'Código no válido. Usa un hex de 3 o 6 dígitos, p. ej. #2E7D32 o #FFF.' },
          }))
          return
        }
        app.cerrarModal()
        try {
          await api.anadirColorMarca(hex, (extra?.nombre ?? '').trim() || 'Nuevo color', app.paleta.length + 1)
          await app.recargar()
          app.avisar('Color añadido ✓')
        } catch (error) {
          app.avisar(mensajeError(error), 'error')
        }
      },
    })

  const anadirRegla = () =>
    app.abrirModal({
      tipo: 'texto',
      titulo: 'Añadir regla de cumplimiento',
      sub: 'Obligatoria en todos los centros del grupo.',
      valor: '',
      confirmar: async (valor) => {
        const texto = valor.trim()
        if (!texto) return
        try {
          await api.anadirReglaMarca(texto, app.reglas.length + 1)
          await app.recargar()
          app.avisar('Regla añadida ✓')
        } catch (error) {
          app.avisar(mensajeError(error), 'error')
        }
      },
    })

  return (
    <section className="fade" style={sx('padding:28px 32px 60px;max-width:900px')}>
      <div style={sx('background:linear-gradient(155deg,#fafafa 35%,var(--suave-1));border-radius:16px;padding:26px 28px;margin-bottom:22px')}>
        <div
          style={sx(
            "font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(29,29,27,.5);margin-bottom:8px",
          )}
        >
          TERRITORIO DE MARCA
        </div>
        <div style={sx('font-size:23px;font-weight:500;letter-spacing:-.02em;max-width:520px;line-height:1.3')}>
          {TERRITORIO}
        </div>
        <div style={sx('font-size:12.5px;color:#706F6F;margin-top:8px;max-width:560px;line-height:1.55')}>
          {TERRITORIO_DESC}
        </div>
      </div>

      {!editable && (
        <div
          style={sx(
            'background:#fff;border:1px solid rgba(23,25,31,.12);border-radius:12px;padding:14px 16px;font-size:12px;line-height:1.6;color:#1D1D1B;margin-bottom:22px',
          )}
        >
          Modo lectura: la paleta y las reglas se muestran con los valores del brandbook. Para poder añadirlas y
          quitarlas desde aquí, ejecuta <code>supabase/02_marca.sql</code> y vuelve a cargar.
        </div>
      )}

      <div style={sx('font-size:13px;font-weight:700;margin-bottom:10px')}>Paleta corporativa</div>
      <div style={sx('display:flex;gap:14px;margin-bottom:24px;flex-wrap:wrap;align-items:flex-start')}>
        {app.paleta.map((sw) => (
          <div key={String(sw.id)} style={sx('text-align:center;position:relative;width:64px')}>
            {editable && (
              <button
                onClick={async () => {
                  try {
                    await api.borrarColorMarca(sw.id)
                    await app.recargar()
                  } catch (error) {
                    app.avisar(mensajeError(error), 'error')
                  }
                }}
                style={sx(
                  'position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:#1D1D1B;color:#fff;border:none;font-size:10px;cursor:pointer;line-height:1;z-index:2',
                )}
              >
                ×
              </button>
            )}
            <div style={sx(`width:56px;height:56px;border-radius:11px;background:${sw.hex};border:1px solid rgba(29,29,27,.08);margin:0 auto`)} />
            <div
              style={sx(
                "width:64px;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:9px;color:#706F6F;margin-top:6px",
              )}
            >
              {sw.hex}
            </div>
            {editable ? (
              <input
                defaultValue={sw.nombre}
                onBlur={async (e) => {
                  const nombre = e.target.value.trim()
                  if (!nombre || nombre === sw.nombre) return
                  try {
                    await api.actualizarColorMarca(sw.id, { nombre })
                    await app.recargar()
                  } catch (error) {
                    app.avisar(mensajeError(error), 'error')
                  }
                }}
                style={sx(
                  'width:64px;text-align:center;font-size:10.5px;color:#1D1D1B;font-weight:600;border:none;background:none;padding:1px',
                )}
              />
            ) : (
              <div style={sx('width:64px;text-align:center;font-size:10.5px;color:#1D1D1B;font-weight:600;padding:1px')}>
                {sw.nombre}
              </div>
            )}
          </div>
        ))}
        {editable && (
          <button
            onClick={anadirColor}
            style={sx(
              'width:56px;height:56px;border-radius:11px;border:1.5px dashed rgba(29,29,27,.25);background:none;color:#706F6F;font-size:20px;cursor:pointer;flex:none',
            )}
          >
            +
          </button>
        )}
      </div>

      <div style={sx('font-size:13px;font-weight:700;margin-bottom:10px')}>Tipografía</div>
      <div style={sx('background:#fff;border:1px solid rgba(29,29,27,.1);border-radius:12px;padding:18px 20px;margin-bottom:24px')}>
        <div style={sx("font-family:'Mulish';font-weight:800;font-size:26px;letter-spacing:-.01em")}>
          {TIPOGRAFIA} — la voz visual de marca
        </div>
        <div style={sx("font-family:'Mulish';font-weight:400;font-size:13px;color:#706F6F;margin-top:6px")}>
          Sans serif, cercana y de fácil lectura. Titulares en bold/extrabold, cuerpo en regular/light.
        </div>
      </div>

      <div style={sx('display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px')}>
        <div style={sx('font-size:13px;font-weight:700')}>Líneas de comunicación</div>
        <div style={sx('font-size:11px;color:rgba(23,25,31,.45)')}>Tabla «lineas» de Supabase</div>
      </div>
      <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:24px')}>
        {app.lineas.map((l) => (
          <div key={String(l.id)} style={sx('background:#fff;border:1px solid rgba(29,29,27,.09);border-radius:11px;padding:13px 15px')}>
            <div style={sx('font-size:12.5px;font-weight:700;color:#1D1D1B')}>{l.nombre}</div>
            <div style={sx('font-size:11px;color:#706F6F;margin-top:4px;line-height:1.5')}>{l.descripcion ?? ''}</div>
          </div>
        ))}
        {app.lineas.length === 0 && (
          <div style={sx('font-size:12px;color:rgba(23,25,31,.5);line-height:1.5')}>
            No se han podido leer las líneas de comunicación. Revisa las políticas RLS de la tabla <strong>lineas</strong>.
          </div>
        )}
      </div>

      <div style={sx('display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px')}>
        <div style={sx('font-size:13px;font-weight:700')}>Reglas de cumplimiento — obligatorias en todos los centros</div>
        {editable && (
          <button
            onClick={anadirRegla}
            style={sx("background:none;border:none;color:var(--acento);font-family:'Mulish';font-weight:700;font-size:12px;cursor:pointer;flex:none")}
          >
            + Añadir regla
          </button>
        )}
      </div>
      <div style={sx('background:#fff;border:1px solid rgba(29,29,27,.09);border-radius:12px;padding:6px 4px')}>
        {app.reglas.map((r) => (
          <div
            key={String(r.id)}
            style={sx('display:flex;align-items:center;gap:10px;padding:8px 15px;border-bottom:1px solid rgba(29,29,27,.06)')}
          >
            <span style={sx('color:var(--acento);font-weight:700;flex:none')}>✓</span>
            {editable ? (
              <input
                defaultValue={r.texto}
                onBlur={async (e) => {
                  const texto = e.target.value.trim()
                  if (!texto || texto === r.texto) return
                  try {
                    await api.actualizarReglaMarca(r.id, texto)
                    await app.recargar()
                  } catch (error) {
                    app.avisar(mensajeError(error), 'error')
                  }
                }}
                style={sx('flex:1;font-size:12px;color:#1D1D1B;line-height:1.5;border:none;background:none;padding:3px 0;font-family:Mulish')}
              />
            ) : (
              <span style={sx('flex:1;font-size:12px;color:#1D1D1B;line-height:1.5;padding:3px 0')}>{r.texto}</span>
            )}
            {editable && (
              <button
                onClick={async () => {
                  try {
                    await api.borrarReglaMarca(r.id)
                    await app.recargar()
                  } catch (error) {
                    app.avisar(mensajeError(error), 'error')
                  }
                }}
                style={sx(
                  'width:20px;height:20px;border-radius:50%;background:#fafafa;color:#706F6F;border:none;font-size:11px;cursor:pointer;flex:none',
                )}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
