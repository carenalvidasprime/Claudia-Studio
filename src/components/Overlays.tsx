import { sx } from '../lib/sx'
import { menuItem } from '../lib/ui'
import { normalizarHex } from '../lib/marca'
import { useApp } from '../store'

export interface AccionMenu {
  nombre: string
  peligro?: boolean
  hacer: () => void
}

/** Menú «⋯» de las tarjetas (centro, carpeta, pieza). */
export function MenuTarjeta({
  clave,
  acciones,
  posicion = { top: '10px', right: '10px' },
  tam = 28,
}: {
  clave: string
  acciones: AccionMenu[]
  posicion?: { top: string; right: string }
  tam?: number
}) {
  const app = useApp()
  const abierto = app.menu === clave
  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          app.alternarMenu(clave)
        }}
        style={sx(
          `position:absolute;top:${posicion.top};right:${posicion.right};z-index:20;width:${tam}px;height:${tam}px;border-radius:${tam > 26 ? '8px' : '7px'};border:none;background:rgba(255,255,255,.92);color:#17191f;font-size:${tam > 26 ? '15px' : '14px'};line-height:1;cursor:pointer;display:grid;place-items:center;box-shadow:0 1px 3px rgba(0,0,0,.12)`,
        )}
      >
        ⋯
      </button>
      {abierto && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={sx(
            `position:absolute;top:${tam > 26 ? '42px' : '40px'};right:${posicion.right};z-index:60;background:#fff;border:1px solid rgba(23,25,31,.1);border-radius:10px;box-shadow:0 12px 28px rgba(23,25,31,.16);padding:5px;min-width:150px;display:flex;flex-direction:column;gap:1px`,
          )}
        >
          {acciones.map((a) => (
            <button
              key={a.nombre}
              className="hv-menu-item"
              onClick={(e) => {
                e.stopPropagation()
                a.hacer()
              }}
              style={sx(menuItem(!!a.peligro))}
            >
              {a.nombre}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export function Modal() {
  const app = useApp()
  const m = app.modal
  if (!m) return null

  const esBorrado = m.tipo === 'eliminar'
  const hexValido = m.tipo !== 'color' || normalizarHex(m.hex ?? '') !== null

  return (
    <div
      style={sx('position:fixed;inset:0;z-index:80;background:rgba(23,25,31,.34);display:grid;place-items:center;padding:20px')}
      onClick={app.cerrarModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={sx('background:#fff;border-radius:16px;padding:22px;width:min(92vw,360px);box-shadow:0 22px 54px rgba(0,0,0,.28)')}
      >
        <div style={sx('font-size:15px;font-weight:600')}>{m.titulo}</div>
        <div style={sx('font-size:12.5px;color:rgba(23,25,31,.55);margin-top:6px;line-height:1.5')}>{m.sub}</div>

        {(m.tipo === 'renombrar' || m.tipo === 'texto') && (
          <input
            autoFocus
            value={m.valor ?? ''}
            onChange={(e) => app.set((p) => ({ modal: p.modal && { ...p.modal, valor: e.target.value } }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') app.confirmarModal()
            }}
            style={sx(
              "width:100%;margin-top:14px;border:1px solid rgba(23,25,31,.14);border-radius:10px;padding:11px;font-family:'Mulish';font-size:13px;background:#fafbfb;color:#17191f",
            )}
          />
        )}

        {m.tipo === 'color' && (
          <>
            <div style={sx('display:flex;gap:8px;margin-top:14px')}>
              <input
                autoFocus
                value={m.hex ?? ''}
                onChange={(e) =>
                  app.set((p) => ({ modal: p.modal && { ...p.modal, hex: e.target.value, error: undefined } }))
                }
                placeholder="#2E7D32"
                style={sx(
                  "width:100px;border:1px solid rgba(23,25,31,.14);border-radius:10px;padding:11px;font-family:'IBM Plex Mono',monospace;font-size:12.5px;background:#fafbfb;color:#17191f",
                )}
              />
              <input
                value={m.nombre ?? ''}
                onChange={(e) => app.set((p) => ({ modal: p.modal && { ...p.modal, nombre: e.target.value } }))}
                placeholder="Nombre del color"
                style={sx(
                  "flex:1;border:1px solid rgba(23,25,31,.14);border-radius:10px;padding:11px;font-family:'Mulish';font-size:13px;background:#fafbfb;color:#17191f",
                )}
              />
            </div>
            {m.error && (
              <div style={sx('font-size:11.5px;color:oklch(0.55 0.18 25);margin-top:8px;line-height:1.4')}>{m.error}</div>
            )}
            {hexValido && (
              <div style={sx('display:flex;align-items:center;gap:9px;margin-top:10px')}>
                <span
                  style={sx(
                    `width:26px;height:26px;border-radius:8px;background:${normalizarHex(m.hex ?? '')};border:1px solid rgba(29,29,27,.12)`,
                  )}
                />
                <span style={sx("font-family:'IBM Plex Mono',monospace;font-size:11px;color:rgba(23,25,31,.5)")}>
                  {normalizarHex(m.hex ?? '')}
                </span>
              </div>
            )}
          </>
        )}

        <div style={sx('display:flex;gap:8px;margin-top:18px;justify-content:flex-end')}>
          <button
            onClick={app.cerrarModal}
            style={sx(
              "background:#f4f4f4;border:1px solid rgba(23,25,31,.1);border-radius:9px;padding:9px 15px;font-family:'Mulish';font-weight:500;font-size:12.5px;cursor:pointer;color:#17191f",
            )}
          >
            Cancelar
          </button>
          <button
            onClick={app.confirmarModal}
            style={sx(
              esBorrado
                ? 'background:oklch(0.55 0.18 25);color:#fff;border:none;border-radius:9px;padding:9px 15px;font-family:Mulish;font-weight:600;font-size:12.5px;cursor:pointer'
                : 'background:var(--acento);color:#fff;border:none;border-radius:9px;padding:9px 15px;font-family:Mulish;font-weight:600;font-size:12.5px;cursor:pointer',
            )}
          >
            {esBorrado ? 'Eliminar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Aviso() {
  const app = useApp()
  const a = app.aviso
  if (!a) return null
  const error = a.tono === 'error'
  return (
    <div
      style={sx(
        `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${error ? 'oklch(0.5 0.17 25)' : 'var(--acento)'};color:#fff;padding:12px 19px;border-radius:11px;font-size:12.5px;font-weight:500;box-shadow:0 12px 30px rgba(0,0,0,.22);animation:pop .3s both;display:flex;align-items:center;gap:9px;z-index:90;max-width:min(92vw,560px)`,
      )}
    >
      <span style={sx('width:7px;height:7px;border-radius:50%;background:#f0607a;flex:none')} />
      <span style={sx('line-height:1.45')}>{a.msg}</span>
      {a.deshacer && (
        <button
          onClick={() => {
            a.deshacer?.()
            app.cerrarAviso()
          }}
          style={sx(
            "margin-left:6px;background:none;border:none;color:#f0607a;font-family:'Mulish';font-weight:600;font-size:12.5px;cursor:pointer;text-decoration:underline;flex:none",
          )}
        >
          Deshacer
        </button>
      )}
    </div>
  )
}
