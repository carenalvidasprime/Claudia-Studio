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

// Puntos de la «V» (coordenadas relativas al centro del orbe). La purpurina
// converge a estos puntos desde una dispersión inicial.
const N = 9
const TL: [number, number] = [-56, -46]
const BV: [number, number] = [0, 46]
const TR: [number, number] = [56, -46]
const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
]
const V_PTS: [number, number][] = []
for (let i = 0; i <= N; i++) V_PTS.push(lerp(TL, BV, i / N))
for (let i = 1; i <= N; i++) V_PTS.push(lerp(BV, TR, i / N))

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
            const sxr = Math.cos(i * 2.399) * 74
            const syr = Math.sin(i * 1.7) * 60
            const size = i % 3 === 0 ? 6 : 5
            return (
              <span
                key={i}
                style={sx(
                  `position:absolute;top:50%;left:50%;width:${size}px;height:${size}px;border-radius:50%;` +
                    'background:radial-gradient(circle at 34% 28%, #fff, var(--acento) 80%);' +
                    'box-shadow:0 0 8px rgba(var(--acento-rgb),.7);' +
                    `--tx:${tx}px;--ty:${ty}px;--sx:${sxr.toFixed(1)}px;--sy:${syr.toFixed(1)}px;` +
                    `animation:portada-forma 1s cubic-bezier(.2,.8,.25,1) ${(0.15 + i * 0.045).toFixed(2)}s both`,
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
