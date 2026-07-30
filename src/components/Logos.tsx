import { sx } from '../lib/sx'
import ribera from '../assets/logo-ribera-cropped.png'
import vidasprimeTrim from '../assets/logo-vidasprime-black-trim.png'
import vidasprime from '../assets/logo-vidasprime-black.png'

/**
 * Lockup «Claudia by VidasPrime | ribera».
 *
 * Proporciones cerradas tras varias iteraciones en el prototipo: «by VidasPrime»
 * nunca debe rebasar el ancho de «Claudia», y ambos logos comparten eje vertical.
 */
export function Lockup({ variante }: { variante: 'login' | 'sidebar' }) {
  const login = variante === 'login'
  return (
    <div style={sx('display:flex;align-items:center;gap:' + (login ? '20px' : '14px'))}>
      <div style={sx('display:flex;flex-direction:column;gap:' + (login ? '5px' : '3px'))}>
        <span
          style={sx(
            `font-family:'Poppins';font-size:${login ? '30px' : '19px'};font-weight:800;letter-spacing:-.02em;color:#1D1D1B;line-height:1`,
          )}
        >
          Claudia
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
      <span style={sx(`width:1.5px;height:${login ? '44px' : '30px'};background:rgba(29,29,27,.14)`)} />
      <img src={ribera} alt="Ribera" style={sx(`height:${login ? '42px' : '22px'};width:auto;display:block`)} />
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
