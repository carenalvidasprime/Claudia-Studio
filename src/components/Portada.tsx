import { sx } from '../lib/sx'
import { CLIENTE } from '../lib/cliente'
import vidasprimeTrim from '../assets/logo-vidasprime-black-trim.png'

/**
 * Cortinilla de marca: un instante minimalista con purpurina que converge para
 * formar la «V» de VidasPrime, y el nombre del producto debajo, antes de
 * mostrar el login. Es una capa superpuesta: el contenido real (login o app) ya
 * se monta debajo, así que al desvanecerse hace un crossfade natural. Se puede
 * saltar con un clic.
 */

// Puntos de la «V» de VidasPrime, muestreados del propio logo (icono), en
// coordenadas relativas al centro. La purpurina converge a estos puntos desde
// una dispersión inicial hasta reconstruir la marca real.
const V_PTS: [number, number][] = [
  [-47.6, -36], [-40.5, -37.1], [-33.3, -36.5], [28, -35.6], [34.9, -36.9], [42.1, -36.7], [48.6, -35.4],
  [-54.5, -29.1], [-48.1, -29.7], [-40.7, -30], [-33.1, -29.7], [-25.7, -29.6], [21.5, -28.8], [27.2, -29.7],
  [34.6, -29.9], [42.4, -29.8], [49.8, -29.7], [-55.7, -22.2], [-48.5, -22.4], [-31.3, -23], [-25.5, -22.2],
  [-19.2, -21.6], [19.9, -22], [27, -22.3], [44.7, -22.9], [49.8, -22.2], [55.6, -22.1], [-55.3, -14.9],
  [-48.2, -14.6], [-25.1, -15], [-18, -14.6], [13.4, -14], [19.7, -14.6], [25.5, -15.4], [43.8, -14],
  [49.8, -14.6], [55.3, -15.2], [-53.6, -8.1], [-48.1, -7.1], [-41.5, -6.6], [-23.2, -8.3], [-18, -7.1],
  [-11.4, -6.8], [12.2, -7.1], [19.3, -7.4], [42.3, -7], [49.5, -7.4], [-47.4, 0], [-40.6, 0.4], [-35.3, 1.7],
  [-17.1, -0.6], [-11.3, -0.5], [5.4, 0.8], [12.1, 0.4], [17.5, -0.6], [35.7, 1], [42.3, 0.4], [47.8, -0.6],
  [-40.6, 8], [-33.6, 8.3], [-0.7, 9], [4.6, 8], [11.3, 7.5], [34.7, 8], [41.6, 7.6], [-39.4, 14.9],
  [-33.1, 15.5], [-27.4, 16.3], [-2.5, 15.8], [4.6, 15.4], [27.7, 15.9], [34.7, 15.5], [-32.9, 22.9],
  [-25.7, 23.2], [-9.1, 23.9], [-2.9, 23], [3.3, 22.4], [21.6, 23.9], [27.2, 23], [33.6, 22.5], [-31.3, 29.6],
  [-25.5, 30.5], [-18, 30.5], [-10.5, 30.5], [-3.2, 30.3], [19.9, 30.7], [27.1, 30.4], [-24.7, 36.1],
  [-17.9, 37.2], [-10.8, 36.8], [20.1, 36.9], [25.7, 36.6],
]

// Chispas finas que ascienden alrededor (el brillo de fondo).
const CHISPAS = [
  { x: 28, d: 0.3, s: 3 },
  { x: 42, d: 1.1, s: 2 },
  { x: 55, d: 0.6, s: 3 },
  { x: 66, d: 1.7, s: 2 },
  { x: 74, d: 2.4, s: 2 },
  { x: 48, d: 2.0, s: 2 },
]

export function Portada({ saliendo, onSaltar }: { saliendo: boolean; onSaltar: () => void }) {
  return (
    <div
      onClick={onSaltar}
      style={sx(
        'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;cursor:pointer;' +
          'background:radial-gradient(120% 120% at 50% 42%, rgba(var(--acento-rgb),.13), rgba(var(--acento-rgb),0) 60%), #f4f5f7;',
        saliendo && 'animation:portada-fade-out .5s ease forwards',
      )}
    >
      <div style={sx('position:relative;display:flex;flex-direction:column;align-items:center;gap:24px')}>
        {/* Orbe: aura que respira + purpurina que forma la «V». */}
        <div style={sx('position:relative;width:150px;height:132px')}>
          <span
            style={sx(
              'position:absolute;top:50%;left:50%;width:150px;height:150px;border-radius:50%;' +
                'background:radial-gradient(circle, rgba(var(--acento-rgb),.4), rgba(var(--acento-rgb),0) 66%);' +
                'filter:blur(7px);animation:portada-aura 3s ease-in-out infinite',
            )}
          />
          <span
            style={sx(
              'position:absolute;top:50%;left:50%;width:130px;height:130px;border-radius:50%;' +
                'background:radial-gradient(circle, rgba(var(--acento-rgb),.3), rgba(var(--acento-rgb),0) 64%);' +
                'animation:portada-bloom 3.4s ease-out infinite',
            )}
          />
          {V_PTS.map(([tx, ty], i) => {
            // Dispersión inicial determinista (estable entre renders).
            const sxr = Math.cos(i * 2.399) * 78
            const syr = Math.sin(i * 1.7) * 62
            const size = i % 6 === 0 ? 5 : 3.5
            // Retardo pseudoaleatorio: la V se rellena de forma orgánica.
            const delay = (0.1 + ((i * 0.618034) % 1) * 0.95).toFixed(2)
            return (
              <span
                key={i}
                style={sx(
                  `position:absolute;top:50%;left:50%;width:${size}px;height:${size}px;border-radius:50%;` +
                    'background:radial-gradient(circle at 34% 28%, #fff, var(--acento) 80%);' +
                    'box-shadow:0 0 6px rgba(var(--acento-rgb),.65);' +
                    `--tx:${tx}px;--ty:${ty}px;--sx:${sxr.toFixed(1)}px;--sy:${syr.toFixed(1)}px;` +
                    `animation:portada-forma 1s cubic-bezier(.2,.8,.25,1) ${delay}s both`,
                )}
              />
            )
          })}
          {CHISPAS.map((c, i) => (
            <span
              key={`ch${i}`}
              style={sx(
                `position:absolute;bottom:8px;left:${c.x}%;width:${c.s}px;height:${c.s}px;border-radius:50%;` +
                  `background:var(--acento);opacity:.7;animation:portada-dot 3s ease-in-out ${c.d}s infinite`,
              )}
            />
          ))}
        </div>

        {/* Wordmark: Claudia dominante + Studio ligero, con barrido de luz. */}
        <div
          style={sx(
            'display:flex;align-items:baseline;gap:11px;animation:portada-in .8s cubic-bezier(.2,.7,.3,1) .9s both',
          )}
        >
          <span
            style={sx(
              "font-family:'Poppins';font-weight:800;font-size:46px;letter-spacing:-.03em;line-height:1;color:transparent;" +
                'background:linear-gradient(100deg,#1D1D1B 0%,#1D1D1B 38%,var(--acento) 50%,#1D1D1B 62%,#1D1D1B 100%);' +
                'background-size:280px 100%;-webkit-background-clip:text;background-clip:text;' +
                'animation:portada-sweep 2s ease-out 1.1s both',
            )}
          >
            {CLIENTE.producto}
          </span>
          {CLIENTE.productoSufijo && (
            <span
              style={sx(
                "font-family:'Poppins';font-weight:300;font-size:30px;letter-spacing:-.01em;line-height:1;color:rgba(29,29,27,.5)",
              )}
            >
              {CLIENTE.productoSufijo}
            </span>
          )}
        </div>

        {/* by VidasPrime */}
        <div
          style={sx('display:flex;align-items:center;gap:6px;margin-top:-10px;animation:portada-in .8s ease 1.2s both')}
        >
          <span
            style={sx("font-family:'Poppins';font-size:11px;font-weight:700;color:rgba(29,29,27,.5)")}
          >
            by
          </span>
          <img src={vidasprimeTrim} alt="VidasPrime" style={sx('height:13px;width:auto;display:block')} />
        </div>
      </div>
    </div>
  )
}
