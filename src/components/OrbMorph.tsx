import { useEffect, useState } from 'react'

/**
 * Esfera de IA que se va transformando en conceptos (Instagram, Meta, Google,
 * un post…). Todo en el color de la marca, como siluetas que se materializan
 * desde el mismo «material» luminoso. Sugiere que hay una IA que convierte una
 * idea en piezas para cualquier red. Respeta prefers-reduced-motion.
 */
const FORMAS = ['orbe', 'instagram', 'post', 'meta', 'google', 'tiktok'] as const

export function OrbMorph({ size = 260 }: { size?: number }) {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setI((v) => (v + 1) % FORMAS.length), 2100)
    return () => window.clearInterval(id)
  }, [])

  const activa = FORMAS[i]
  const on = (f: (typeof FORMAS)[number]) => 'om-shape' + (activa === f ? ' on' : '')

  return (
    <div style={{ width: size, height: size, position: 'relative' }} aria-hidden="true">
      <style>{`
        .om-breathe { transform-box: fill-box; transform-origin: center; animation: om-breathe 4.5s ease-in-out infinite; }
        @keyframes om-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        .om-shape { transform-box: fill-box; transform-origin: center; opacity: 0; transform: scale(.62) rotate(-6deg);
          transition: opacity .65s ease, transform .65s cubic-bezier(.34,1.15,.4,1); }
        .om-shape.on { opacity: 1; transform: scale(1) rotate(0); }
        .om-gloss { animation: om-gloss 6s ease-in-out infinite; }
        @keyframes om-gloss { 0%,100% { transform: translate(0,0); } 50% { transform: translate(6px,5px); } }
        @media (prefers-reduced-motion: reduce) {
          .om-breathe, .om-gloss { animation: none; }
          .om-shape { transition: none; }
        }
      `}</style>
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: 'block' }}>
        <defs>
          <radialGradient id="omg" cx="36%" cy="32%" r="78%">
            <stop offset="0%" stopColor="var(--acento-2)" />
            <stop offset="58%" stopColor="var(--acento)" />
            <stop offset="100%" stopColor="var(--acento)" />
          </radialGradient>
          <filter id="om-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Halo/brillo detrás, siempre presente */}
        <circle className="om-breathe" cx="100" cy="100" r="58" fill="url(#omg)" opacity=".26" filter="url(#om-glow)" />

        <g className="om-breathe">
          {/* ORBE */}
          <g className={on('orbe')}>
            <circle cx="100" cy="100" r="60" fill="url(#omg)" />
            <ellipse className="om-gloss" cx="80" cy="76" rx="22" ry="16" fill="#fff" opacity=".38" />
          </g>

          {/* INSTAGRAM */}
          <g className={on('instagram')} fill="none" stroke="url(#omg)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="52" y="52" width="96" height="96" rx="28" />
            <circle cx="100" cy="100" r="23" />
            <circle cx="128" cy="72" r="3" fill="url(#omg)" stroke="none" />
          </g>

          {/* POST (tarjeta) */}
          <g className={on('post')} fill="none" stroke="url(#omg)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="52" y="46" width="96" height="108" rx="14" />
            <circle cx="70" cy="66" r="7" />
            <rect x="60" y="82" width="80" height="44" rx="7" />
            <line x1="60" y1="138" x2="122" y2="138" />
            <line x1="60" y1="148" x2="100" y2="148" />
          </g>

          {/* META (infinito) */}
          <g className={on('meta')} fill="none" stroke="url(#omg)" strokeWidth="11" strokeLinecap="round">
            <path d="M62 100 C62 74 86 74 100 100 C114 126 138 126 138 100 C138 74 114 74 100 100 C86 126 62 126 62 100 Z" />
          </g>

          {/* GOOGLE (G) */}
          <g className={on('google')} fill="none" stroke="url(#omg)" strokeWidth="11" strokeLinecap="round">
            <path d="M139 76 A46 46 0 1 0 147 108 L104 108" />
          </g>

          {/* TIKTOK (nota) */}
          <g className={on('tiktok')} fill="none" stroke="url(#omg)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
            <path d="M112 54 L112 118 A20 20 0 1 1 92 98" />
            <path d="M112 54 C112 68 122 78 138 78" />
          </g>
        </g>
      </svg>
    </div>
  )
}
