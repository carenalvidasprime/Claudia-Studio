import { sx } from '../lib/sx'
import { CLIENTE } from '../lib/cliente'
import vidasprimeTrim from '../assets/logo-vidasprime-black-trim.png'
import vidasprime from '../assets/logo-vidasprime-black.png'

/**
 * Lockup del producto «Claudia by VidasPrime», con el logo del cliente al lado
 * si el despliegue lo tiene (Ribera). En la base de marca blanca no hay logo de
 * cliente y se muestra solo «Claudia by VidasPrime».
 */
export function Lockup({ variante }: { variante: 'login' | 'sidebar' }) {
  const login = variante === 'login'
  return (
    <div style={sx('display:flex;align-items:center;gap:' + (login ? '20px' : '14px'))}>
      <div style={sx('display:flex;flex-direction:column;gap:' + (login ? '5px' : '3px'))}>
        <span style={sx('display:flex;align-items:baseline;gap:' + (login ? '8px' : '5px'))}>
          <span
            style={sx(
              `font-family:'Poppins';font-size:${login ? '30px' : '19px'};font-weight:800;letter-spacing:-.02em;color:#1D1D1B;line-height:1`,
            )}
          >
            {CLIENTE.producto}
          </span>
          {CLIENTE.productoSufijo && (
            <span
              style={sx(
                `font-family:'Poppins';font-size:${login ? '19px' : '13px'};font-weight:400;letter-spacing:-.01em;color:rgba(29,29,27,.5);line-height:1`,
              )}
            >
              {CLIENTE.productoSufijo}
            </span>
          )}
        </span>
        <div style={sx('display:flex;align-items:center;gap:4px')}>
          <span
            style={sx(
              `font-family:'Poppins';font-size:${login ? '9.5px' : '8px'};color:rgba(29,29,27,${login ? '.55' : '.5'});font-weight:700`,
            )}
          >
            by
          </span>
          <img
            src={login ? vidasprimeTrim : vidasprime}
            alt="VidasPrime"
            style={sx(`height:${login ? '11px' : '8px'};width:auto;display:block`)}
          />
        </div>
      </div>
      {CLIENTE.logoPiezas && (
        <>
          <span style={sx(`width:1.5px;height:${login ? '44px' : '30px'};background:rgba(29,29,27,.14)`)} />
          <img
            src={CLIENTE.logoPiezas}
            alt={CLIENTE.cliente ?? 'Cliente'}
            style={sx(`height:${login ? '42px' : '22px'};width:auto;display:block`)}
          />
        </>
      )}
    </div>
  )
}

/** Motivo de flecha ↗ heredado del lenguaje visual de VidasPrime. */
export function Flecha({ size = 32, style }: { size?: number; style?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      style={style ? sx(style) : undefined}
      fill="none"
      stroke="#17191f"
      strokeWidth="1"
    >
      <path d="M4 30 L30 4 M10 4 H30 V24" />
    </svg>
  )
}
