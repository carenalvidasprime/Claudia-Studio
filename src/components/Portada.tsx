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
  [-47.3,-38.2],[-42.4,-38.9],[-37.6,-39],[-32.6,-38.2],[29.5,-37.8],[34.1,-38.7],[39,-39],[44,-38.5],
  [-52.6,-33.8],[-47.7,-34],[-42.6,-34],[-37.4,-34],[-32.3,-34],[-27.4,-33.9],[24.6,-33.5],[28.9,-34],
  [34,-34],[39.1,-34],[44.3,-34],[49.4,-34],[53.3,-33.1],[-57,-28.6],[-52.8,-28.9],[-47.7,-28.9],
  [-42.7,-29.1],[-37.3,-29.1],[-32.3,-28.9],[-27.2,-28.9],[-22.7,-28.6],[20.3,-28.4],[23.8,-28.9],[28.9,-28.9],
  [34,-29],[39.1,-29.4],[44.3,-28.9],[49.4,-28.9],[54.3,-28.8],[-57.9,-23.8],[-52.8,-23.8],[-47.9,-24],
  [-31.9,-24.1],[-27.2,-23.8],[-22.1,-23.8],[-18.5,-23],[19,-23.6],[23.8,-23.8],[28.9,-23.8],[45.3,-24.3],
  [49.4,-23.8],[54.5,-23.8],[57.8,-23.6],[-57.9,-18.7],[-52.8,-18.7],[-48,-18.5],[-27.2,-18.7],[-22.1,-18.7],
  [-17.4,-18.5],[14.8,-18.2],[18.7,-18.7],[23.8,-18.7],[28.1,-19.1],[45.6,-18.4],[49.4,-18.7],[54.5,-18.7],
  [57.9,-18.7],[-57.3,-13.9],[-52.8,-13.6],[-47.7,-13.6],[-44.1,-13],[-26.6,-14],[-22.1,-13.6],[-17,-13.6],
  [-13.1,-13],[13.7,-13.5],[18.7,-13.6],[23.8,-13.7],[44.5,-13.4],[49.4,-13.6],[54.4,-13.7],[-52.8,-8.5],
  [-47.7,-8.5],[-42.8,-8.3],[-22.1,-8.6],[-17,-8.5],[-12,-8.4],[9.4,-8.1],[13.6,-8.5],[18.7,-8.5],[22.6,-8.9],
  [40.1,-8],[44.3,-8.5],[49.4,-8.5],[53.5,-8.9],[-51.9,-3.8],[-47.7,-3.4],[-42.6,-3.4],[-38.6,-3],[-21.1,-3.9],
  [-17,-3.4],[-11.9,-3.4],[-8.5,-3.4],[8.5,-3.4],[13.6,-3.4],[18.5,-3.6],[39.2,-3.3],[44.3,-3.4],[49.2,-3.5],
  [-47.5,1.6],[-42.6,1.7],[-37.5,1.8],[-16.7,1],[-12.1,1],[4,2],[8.5,1.7],[13.6,1.7],[17.3,1],[34.7,2.1],
  [39.1,1.7],[44.3,1.7],[48,1.2],[-46.5,6.3],[-42.6,6.8],[-37.4,6.8],[-33.1,7.2],[-0.3,7.5],[3.4,6.8],
  [8.5,6.8],[13.1,6.5],[34,6.8],[39.1,6.8],[43.9,6.6],[-42.3,11.7],[-37.4,11.9],[-32.3,11.9],[-1.5,12.1],
  [3.4,11.9],[8.5,11.9],[29.3,12.1],[34,11.9],[39.1,11.9],[-41,16.2],[-37.4,17],[-32.3,17],[-27.6,17.3],
  [-5.6,17.4],[-1.7,17],[3.4,17],[7.7,16.6],[25.2,17.6],[28.9,17],[34,17],[38.6,16.7],[-36.9,21.8],
  [-32.3,22.1],[-27.2,22.1],[-23.5,22.8],[-6.7,22.2],[-1.7,22.1],[3.3,22],[24,22.3],[28.9,22.1],[34,22.1],
  [-32.3,27.2],[-27.2,27.2],[-22.2,27.3],[-17,28.1],[-11.7,27.5],[-6.8,27.2],[-1.7,27.2],[2.2,26.6],[19.7,27.6],
  [23.8,27.2],[28.9,27.2],[33.1,26.8],[-31.4,31.7],[-27.2,32.3],[-22.1,32.3],[-17,32.3],[-11.9,32.3],
  [-6.8,32.3],[-2.1,32],[18.8,32.4],[23.8,32.3],[28.8,32.2],[-26.7,36.3],[-22,37.3],[-17,37.4],[-11.9,37.4],
  [-7.1,36.7],[19,37.1],[23.8,37.4],[27.7,36.6],
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
                'background:radial-gradient(circle, rgba(var(--acento-rgb),.28), rgba(var(--acento-rgb),0) 68%);' +
                'filter:blur(8px);animation:portada-aura 3s ease-in-out infinite',
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
            const sxr = Math.cos(i * 2.399) * 80
            const syr = Math.sin(i * 1.7) * 64
            // Chispas finas (no gotas): puntos pequeños de luz, alguno mínimo.
            const size = i % 6 === 0 ? 2.8 : i % 3 === 0 ? 1.7 : 2.2
            // Retardo pseudoaleatorio: la V se rellena de forma orgánica.
            const delay = 0.1 + ((i * 0.618034) % 1) * 1.1
            const tw = (1.4 + (i % 5) * 0.22).toFixed(2)
            return (
              <span
                key={i}
                style={sx(
                  `position:absolute;top:50%;left:50%;width:${size}px;height:${size}px;border-radius:50%;` +
                    'background:radial-gradient(circle, #fff 0%, #bcd3ff 42%, var(--acento) 100%);' +
                    'box-shadow:0 0 3px rgba(var(--acento-rgb),.8);' +
                    `--tx:${tx}px;--ty:${ty}px;--sx:${sxr.toFixed(1)}px;--sy:${syr.toFixed(1)}px;` +
                    `animation:portada-forma 1s cubic-bezier(.2,.8,.25,1) ${delay.toFixed(2)}s both, ` +
                    `portada-chispear ${tw}s ease-in-out ${(delay + 1).toFixed(2)}s infinite`,
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
            'display:flex;align-items:baseline;gap:11px;animation:portada-in .8s cubic-bezier(.2,.7,.3,1) 1.1s both',
          )}
        >
          <span
            style={sx(
              "font-family:'Poppins';font-weight:800;font-size:46px;letter-spacing:-.03em;line-height:1;color:transparent;" +
                'background:linear-gradient(100deg,#1D1D1B 0%,#1D1D1B 38%,var(--acento) 50%,#1D1D1B 62%,#1D1D1B 100%);' +
                'background-size:280px 100%;-webkit-background-clip:text;background-clip:text;' +
                'animation:portada-sweep 2s ease-out 1.3s both',
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

        {/* by VidasPrime: aparece ~1s después, para que Claudia gane protagonismo. */}
        <div
          style={sx('display:flex;align-items:center;gap:6px;margin-top:-10px;animation:portada-in .9s ease 2.3s both')}
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
