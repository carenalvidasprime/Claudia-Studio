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
import { Gateway, Situaciones } from './screens/Entrada'
import { Brief } from './screens/Brief'
import { Estudio } from './screens/Estudio'
import { Detalle } from './screens/Detalle'
import { Exportar } from './screens/Exportar'
import {
  PasoColabEntorno,
  PasoColabPersonas,
  PasoHitoEntorno,
  PasoHitoValidacion,
  PasoTestConsent,
  PasoTestExposicion,
} from './screens/Pasos'

function Pantalla() {
  const app = useApp()
  switch (app.pantalla) {
    case 'dashboard':
      return <Dashboard />
    case 'calendario':
      return <Calendario />
    case 'marcaRibera':
      return <MarcaRibera />
    case 'centro':
      return <CentroScreen />
    case 'gateway':
      return <Gateway />
    case 'situaciones':
      return <Situaciones />
    case 'pasoTestConsent':
      return <PasoTestConsent />
    case 'pasoTestExposicion':
      return <PasoTestExposicion />
    case 'pasoColabPersonas':
      return <PasoColabPersonas />
    case 'pasoColabEntorno':
      return <PasoColabEntorno />
    case 'pasoHitoValidacion':
      return <PasoHitoValidacion />
    case 'pasoHitoEntorno':
      return <PasoHitoEntorno />
    case 'brief':
      return <Brief />
    case 'estudio':
      return <Estudio />
    case 'detalle':
      return <Detalle />
    case 'exportar':
      return <Exportar />
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
