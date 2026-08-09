import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './store'
import { App } from './App'
import { DESCRIPCION, TITULO } from './lib/cliente'
import './styles/global.css'

// Título y descripción según el cliente del despliegue (el HTML es común).
document.title = TITULO
document
  .querySelector('meta[name="description"]')
  ?.setAttribute('content', DESCRIPCION)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
