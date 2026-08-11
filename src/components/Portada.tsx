import { sx } from '../lib/sx'
import { CLIENTE } from '../lib/cliente'

/**
 * Cortinilla de marca: un instante minimalista con el nombre del producto y un
 * pequeño «orbe» de IA antes de mostrar el login. Es una capa superpuesta: el
 * contenido real (login o app) ya se monta debajo, así que al desvanecerse hace
 * un crossfade natural. Se puede saltar con un clic.
 */

// Chispas que ascienden alrededor del orbe (el toque de «fantasía»).
const CHISPAS = [
  { x: 38, d: 0.2, s: 4 },
  { x: 46, d: 0.9, s: 3 },
  { x: 53, d: 0.5, s: 5 },
  { x: 60, d: 1.2, s: 3 },
  { x: 43, d: 1.5, s: 4 },
  { x: 57, d: 0.0, s: 3 },
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
      <div style={sx('position:relative;display:flex;flex-direction:column;align-items:center;gap:26px')}>
        {/* Orbe: aura difusa + anillo cónico que gira + núcleo. */}
        <div style={sx('position:relative;width:96px;height:96px')}>
          <span
            style={sx(
              'position:absolute;top:50%;left:50%;width:130px;height:130px;border-radius:50%;' +
                'background:radial-gradient(circle, rgba(var(--acento-rgb),.55), rgba(var(--acento-rgb),0) 68%);' +
                'filter:blur(6px);animation:portada-aura 2.6s ease-in-out infinite',
            )}
          />
          <span
            style={sx(
              'position:absolute;top:50%;left:50%;width:96px;height:96px;border-radius:50%;' +
                'background:conic-gradient(from 0deg, rgba(var(--acento-rgb),0), var(--acento), rgba(var(--acento-rgb),0) 55%);' +
                '-webkit-mask:radial-gradient(circle, transparent 60%, #000 62%);mask:radial-gradient(circle, transparent 60%, #000 62%);' +
                'transform:translate(-50%,-50%);animation:portada-ring 2.4s linear infinite',
            )}
          />
          <span
            style={sx(
              'position:absolute;top:50%;left:50%;width:15px;height:15px;border-radius:50%;transform:translate(-50%,-50%);' +
                'background:radial-gradient(circle at 35% 30%, #fff, var(--acento) 75%);box-shadow:0 0 18px 2px rgba(var(--acento-rgb),.55);' +
                'animation:portada-in .7s ease both',
            )}
          />
          {CHISPAS.map((c, i) => (
            <span
              key={i}
              style={sx(
                `position:absolute;bottom:8px;left:${c.x}%;width:${c.s}px;height:${c.s}px;border-radius:50%;` +
                  `background:var(--acento);animation:portada-dot 2.4s ease-in-out ${c.d}s infinite`,
              )}
            />
          ))}
        </div>

        {/* Wordmark: Claudia dominante + Studio ligero, con barrido de luz. */}
        <div
          style={sx(
            'display:flex;align-items:baseline;gap:11px;animation:portada-in .8s cubic-bezier(.2,.7,.3,1) .15s both',
          )}
        >
          <span
            style={sx(
              "font-family:'Poppins';font-weight:800;font-size:46px;letter-spacing:-.03em;line-height:1;color:transparent;" +
                'background:linear-gradient(100deg,#1D1D1B 0%,#1D1D1B 38%,var(--acento) 50%,#1D1D1B 62%,#1D1D1B 100%);' +
                'background-size:280px 100%;-webkit-background-clip:text;background-clip:text;' +
                'animation:portada-sweep 2s ease-out .35s both',
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

        <div
          style={sx(
            "display:flex;align-items:center;gap:5px;animation:portada-in .8s ease .5s both;" +
              "font-family:'Poppins';font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:rgba(29,29,27,.4)",
          )}
        >
          {CLIENTE.territorio ? `${CLIENTE.territorio} · IA` : 'Estudio de contenido · IA'}
        </div>
      </div>
    </div>
  )
}
