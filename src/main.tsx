import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './store'
import { App } from './App'
import { DESCRIPCION, TITULO, aplicarTema } from './lib/cliente'
import './styles/global.css'

// Título, descripción y colores de marca según el cliente del despliegue
// (el HTML y el CSS son comunes; el tema se aplica en tiempo de arranque).
document.title = TITULO
document
  .querySelector('meta[name="description"]')
  ?.setAttribute('content', DESCRIPCION)
aplicarTema()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
