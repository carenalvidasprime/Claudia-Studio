import { sx } from './lib/sx'
import { useApp } from './store'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Aviso, Modal } from './components/Overlays'
import { Copiloto } from './components/Copiloto'
import { Login } from './screens/Login'
import { Dashboard } from './screens/Dashboard'
import { CentroScreen } from './screens/Centro'
import { Calendario } from './screens/Calendario'
import { MarcaRibera } from './screens/MarcaRibera'
import { Contenido } from './screens/Contenido'
import { Papelera } from './screens/Papelera'
import { Estudio } from './screens/Estudio'
import { Detalle } from './screens/Detalle'

function Pantalla() {
  const app = useApp()
  switch (app.pantalla) {
    case 'dashboard':
      return <Dashboard />
    case 'contenido':
    case 'favoritos':
      return <Contenido />
    case 'papelera':
      return <Papelera />
    case 'calendario':
      return <Calendario />
    case 'marcaRibera':
      return <MarcaRibera />
    case 'centro':
      return <CentroScreen />
    // Flujo antiguo (gateway/situaciones/pasos/brief) retirado: ahora se crea
    // directamente en el estudio. Se mantienen los casos por si queda estado
    // persistido apuntando a ellos, pero todos resuelven al estudio único.
    case 'gateway':
    case 'situaciones':
    case 'pasoTestConsent':
    case 'pasoTestExposicion':
    case 'pasoColabPersonas':
    case 'pasoColabEntorno':
    case 'pasoHitoValidacion':
    case 'pasoHitoEntorno':
    case 'brief':
    case 'estudio':
      return <Estudio />
    case 'detalle':
      return <Detalle />
  }
}

function Cargando({ mensaje }: { mensaje: string }) {
  return (
    <div style={sx('position:fixed;inset:0;display:grid;place-items:center;background:#f2f2f2')}>
      <div style={sx('display:flex;align-items:center;gap:11px;font-size:13px;color:rgba(23,25,31,.55)')}>
        <span
          style={sx(
            'width:15px;height:15px;border:2px solid rgba(23,25,31,.2);border-top-color:#17191f;border-radius:50%;animation:spin .7s linear infinite',
          )}
        />
        {mensaje}
      </div>
    </div>
  )
}

export function App() {
  const app = useApp()

  if (app.comprobandoSesion) return <Cargando mensaje="Comprobando sesión…" />

  if (!app.sesion) {
    return (
      <>
        <Login />
        {app.errorDatos && (
          <div
            style={sx(
              'position:fixed;bottom:20px;left:20px;right:20px;z-index:120;background:#1D1D1B;color:#fff;border-radius:12px;padding:14px 16px;font-size:12px;line-height:1.55;max-width:520px',
            )}
          >
            {app.errorDatos}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div style={sx('display:grid;grid-template-columns:230px 1fr;height:100vh;overflow:hidden')}>
        <Sidebar />
        <main style={sx('overflow-y:auto;background:#f2f2f2')}>
          <Header />
          {app.cargandoDatos && app.centros.length === 0 ? (
            <div style={sx('padding:60px 32px;display:flex;align-items:center;gap:11px;font-size:13px;color:rgba(23,25,31,.55)')}>
              <span
                style={sx(
                  'width:15px;height:15px;border:2px solid rgba(23,25,31,.2);border-top-color:#17191f;border-radius:50%;animation:spin .7s linear infinite',
                )}
              />
              Cargando centros, líneas y situaciones desde Supabase…
            </div>
          ) : (
            <Pantalla />
          )}
        </main>
      </div>
      <Modal />
      <Aviso />
      <Copiloto />
    </>
  )
}
