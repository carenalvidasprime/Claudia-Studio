import type { ReactNode } from 'react'
import { sx } from '../lib/sx'
import { pill } from '../lib/ui'
import { useApp } from '../store'

function Marco({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <section className="fade" style={sx('padding:34px 32px 60px;max-width:480px')}>
      <div
        style={sx(
          "font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.09em;color:rgba(23,25,31,.4);margin-bottom:10px",
        )}
      >
        {eyebrow}
      </div>
      {children}
    </section>
  )
}

function Panel({ tono, children }: { tono: 'aviso' | 'neutro'; children: ReactNode }) {
  return (
    <div
      style={sx(
        tono === 'aviso'
          ? 'background:var(--suave-1);border:1px solid rgba(var(--acento-rgb),.25);border-radius:14px;padding:22px'
          : 'background:#fff;border:1px solid rgba(23,25,31,.1);border-radius:14px;padding:22px',
      )}
    >
      {children}
    </div>
  )
}

function Casilla({
  marcada,
  onClick,
  children,
  fondo = '#fff',
}: {
  marcada: boolean
  onClick: () => void
  children: ReactNode
  fondo?: string
}) {
  return (
    <button
      onClick={onClick}
      style={sx(
        `display:flex;align-items:center;gap:9px;background:${fondo};border:1px solid rgba(29,29,27,.18);border-radius:9px;padding:11px 12px;font-family:'Mulish';font-size:12.5px;font-weight:600;cursor:pointer;width:100%;color:#1D1D1B;text-align:left`,
      )}
    >
      <span
        style={sx(
          'width:18px;height:18px;border-radius:5px;border:1.5px solid var(--acento);display:grid;place-items:center;flex:none;' +
            (marcada ? 'background:var(--acento);color:#fff' : 'background:#fff'),
        )}
      >
        {marcada ? '✓' : ''}
      </span>
      {children}
    </button>
  )
}

function Continuar({
  habilitado,
  onClick,
  etiqueta = 'Continuar',
}: {
  habilitado: boolean
  onClick: () => void
  etiqueta?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={!habilitado}
      style={sx(
        "margin-top:18px;width:100%;border-radius:10px;padding:13px;font-family:'Mulish';font-weight:600;font-size:13px;",
        habilitado
          ? 'background:var(--acento);color:#fff;border:none;cursor:pointer'
          : 'background:rgba(23,25,31,.12);color:rgba(23,25,31,.4);border:none;cursor:not-allowed',
      )}
    >
      {etiqueta}
    </button>
  )
}

function Opciones({ valor, opciones, elegir }: { valor: string | null; opciones: string[]; elegir: (o: string) => void }) {
  return (
    <div style={sx('display:flex;flex-direction:column;gap:7px')}>
      {opciones.map((o) => (
        <button key={o} onClick={() => elegir(o)} style={sx(pill(valor === o), ';text-align:left;width:100%')}>
          {o}
        </button>
      ))}
    </div>
  )
}

function Titulo({ texto, sub }: { texto: string; sub: string }) {
  return (
    <>
      <div style={sx('font-size:15px;font-weight:700;color:#1D1D1B;margin-bottom:8px')}>{texto}</div>
      <div style={sx('font-size:12.5px;color:rgba(23,25,31,.65);line-height:1.6;margin-bottom:16px')}>{sub}</div>
    </>
  )
}

// --- Testimonio -------------------------------------------------------------

export function PasoTestConsent() {
  const app = useApp()
  const b = app.borrador
  return (
    <Marco eyebrow="TESTIMONIO DE PACIENTE · PASO 1 DE 2">
      <Panel tono="aviso">
        <Titulo
          texto="Consentimiento requerido"
          sub="Esta situación necesita el consentimiento informado y firmado de la persona antes de producir la pieza. No se puede continuar sin él."
        />
        <Casilla marcada={b.consentimiento} onClick={() => app.setBorrador({ consentimiento: !b.consentimiento })}>
          Consentimiento firmado
        </Casilla>
        <div style={sx('font-size:10.5px;color:rgba(29,29,27,.5);margin-top:8px')}>
          Revocable en cualquier momento por la persona.
        </div>
      </Panel>
      <Continuar habilitado={b.consentimiento} onClick={() => app.ir('pasoTestExposicion')} />
    </Marco>
  )
}

export function PasoTestExposicion() {
  const app = useApp()
  const b = app.borrador
  return (
    <Marco eyebrow="TESTIMONIO DE PACIENTE · PASO 2 DE 2">
      <Panel tono="neutro">
        <Titulo texto="Nivel de exposición" sub="¿Cuánto se muestra a la persona en la pieza?" />
        <Opciones
          valor={b.exposicion}
          opciones={['Rostro visible', 'Solo voz', 'Anónimo (sin rostro)', 'Solo texto']}
          elegir={(o) => app.setBorrador({ exposicion: o })}
        />
      </Panel>
      <Continuar habilitado onClick={() => app.ir('estudio')} etiqueta="Continuar al estudio →" />
    </Marco>
  )
}

// --- Colaboración -----------------------------------------------------------

export function PasoColabPersonas() {
  const app = useApp()
  const b = app.borrador
  const elegir = (o: string) => app.setBorrador({ personas: o, menores: o === 'Aparecen menores' })
  return (
    <Marco eyebrow="COLABORACIÓN / EVENTO CON CLUB · PASO 1 DE 2">
      <Panel tono="neutro">
        <Titulo texto="Personas en imagen" sub="¿Quién aparece en el contenido? Elige lo que aplica." />
        <Opciones
          valor={b.personas}
          opciones={['Aparecen personas identificables', 'Aparecen menores', 'No aparecen personas identificables']}
          elegir={elegir}
        />
        {b.personas === 'Aparecen personas identificables' && (
          <div style={sx('background:#f4f4f4;border-radius:9px;padding:10px 12px;margin-top:12px;font-size:11.5px;line-height:1.55;color:#1D1D1B')}>
            Necesitan consentimiento firmado antes de publicar.
          </div>
        )}
        {b.personas === 'Aparecen menores' && (
          <div
            style={sx(
              'background:var(--suave-1);border:1px solid rgba(var(--acento-rgb),.25);border-radius:9px;padding:12px;margin-top:10px;font-size:11.5px;line-height:1.6;color:#1D1D1B',
            )}
          >
            <strong>Los menores requieren permiso familiar por escrito.</strong> Sin él deben ir de espaldas, en grupo
            lejano o fuera de plano.
          </div>
        )}
      </Panel>
      <Continuar habilitado={!!b.personas} onClick={() => app.ir('pasoColabEntorno')} />
    </Marco>
  )
}

export function PasoColabEntorno() {
  const app = useApp()
  const b = app.borrador
  return (
    <Marco eyebrow="COLABORACIÓN / EVENTO CON CLUB · PASO 2 DE 2">
      <Panel tono="neutro">
        <Titulo texto="Entorno" sub="¿Dónde se produce el contenido?" />
        <Opciones
          valor={b.entorno}
          opciones={['En instalaciones del hospital', 'En instalaciones del club', 'En espacio público']}
          elegir={(o) => app.setBorrador({ entorno: o })}
        />
        {b.entorno === 'En instalaciones del hospital' && (
          <div
            style={sx(
              'background:var(--suave-1);border:1px solid rgba(var(--acento-rgb),.25);border-radius:9px;padding:12px;margin-top:12px;font-size:11.5px;line-height:1.6;color:#1D1D1B',
            )}
          >
            <strong>Cuidar el fondo:</strong> sin otros pacientes visibles, sin puertas de consulta con nombres, sin
            pantallas con datos.
          </div>
        )}
      </Panel>
      <Continuar habilitado={!!b.entorno} onClick={() => app.ir('estudio')} etiqueta="Continuar al estudio →" />
    </Marco>
  )
}

// --- Hito clínico -----------------------------------------------------------

export function PasoHitoValidacion() {
  const app = useApp()
  const b = app.borrador
  return (
    <Marco eyebrow="HITO CLÍNICO O NUEVA TECNOLOGÍA · PASO 1 DE 2">
      <Panel tono="aviso">
        <Titulo
          texto="Validación clínica requerida"
          sub="Solo se comunica lo que el profesional valida; nada de mejoras, porcentajes o cifras sin respaldo."
        />
        <Casilla
          marcada={b.validadoPorProfesional}
          onClick={() => app.setBorrador({ validadoPorProfesional: !b.validadoPorProfesional })}
        >
          Un profesional del centro ha validado las afirmaciones clínicas
        </Casilla>
      </Panel>
      <Continuar habilitado={b.validadoPorProfesional} onClick={() => app.ir('pasoHitoEntorno')} />
    </Marco>
  )
}

export function PasoHitoEntorno() {
  const app = useApp()
  const b = app.borrador
  const listo = b.fondoLibre && b.sinPacientes
  return (
    <Marco eyebrow="HITO CLÍNICO O NUEVA TECNOLOGÍA · PASO 2 DE 2">
      <Panel tono="neutro">
        <Titulo texto="Entorno de grabación" sub="Confirma antes de continuar." />
        <div style={sx('display:flex;flex-direction:column;gap:9px')}>
          <Casilla marcada={b.fondoLibre} fondo="#f4f4f4" onClick={() => app.setBorrador({ fondoLibre: !b.fondoLibre })}>
            El fondo está libre de pantallas con datos clínicos o de pacientes
          </Casilla>
          <Casilla
            marcada={b.sinPacientes}
            fondo="#f4f4f4"
            onClick={() => app.setBorrador({ sinPacientes: !b.sinPacientes })}
          >
            No hay pacientes identificables en el plano
          </Casilla>
        </div>
        <div style={sx('font-size:10.5px;color:rgba(29,29,27,.5);margin-top:9px')}>
          Si los hay, necesitan consentimiento o deben quedar fuera de plano.
        </div>
      </Panel>
      <Continuar habilitado={listo} onClick={() => app.ir('estudio')} etiqueta="Continuar al estudio →" />
    </Marco>
  )
}
