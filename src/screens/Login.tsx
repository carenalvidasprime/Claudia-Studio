import { useState, type FormEvent } from 'react'
import { sx } from '../lib/sx'
import { Flecha, Lockup } from '../components/Logos'
import { OrbIA } from '../components/OrbIA'
import { OrbMorph } from '../components/OrbMorph'
import { CLIENTE, DE_CLIENTE } from '../lib/cliente'
import { useApp } from '../store'

export function Login() {
  const app = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await app.entrar(email.trim(), password)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  const campo =
    "width:100%;border:1px solid rgba(23,25,31,.14);border-radius:10px;padding:11px 12px;font-family:'Mulish';font-size:13px;background:#fff;color:#17191f"

  return (
    <div style={sx('position:fixed;inset:0;z-index:100;display:grid;grid-template-columns:1.1fr 1fr')}>
      <div
        style={sx(
          'background:linear-gradient(155deg,#fafafa 35%,var(--suave-1));padding:40px 48px 44px;position:relative;display:flex;flex-direction:column',
        )}
      >
        <Lockup variante="login" />
        <div style={sx('flex:1;display:grid;place-items:center;min-height:0')}>
          {CLIENTE.cliente ? <OrbIA size={248} /> : <OrbMorph size={264} />}
        </div>
        <div style={sx('font-size:33px;font-weight:500;letter-spacing:-.02em;line-height:1.22;max-width:470px')}>
          {DE_CLIENTE
            ? `Contenido para las redes de los centros${DE_CLIENTE}, generado con IA`
            : 'Contenido de marca para tus redes, generado con IA'}
        </div>
        <Flecha size={44} style="position:absolute;right:46px;bottom:46px" />
      </div>

      <div style={sx('background:#fff;display:grid;place-items:center;padding:40px;overflow-y:auto')}>
        <form onSubmit={enviar} style={sx('width:min(100%,320px)')}>
          <div style={sx('font-size:20px;font-weight:600')}>Inicia sesión</div>
          <div style={sx('font-size:12.5px;color:rgba(23,25,31,.5);margin-top:5px;margin-bottom:22px')}>
            Acceso del equipo de comunicación · {CLIENTE.cuenta}
          </div>

          <div style={sx('font-size:11.5px;font-weight:500;color:rgba(23,25,31,.62);margin-bottom:6px')}>Correo</div>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`nombre@${CLIENTE.dominioEmail}`}
            style={sx(campo, 'margin-bottom:14px')}
          />

          <div style={sx('font-size:11.5px;font-weight:500;color:rgba(23,25,31,.62);margin-bottom:6px')}>Contraseña</div>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={sx(campo, 'margin-bottom:20px')}
          />

          {error && (
            <div
              style={sx(
                'background:var(--suave-1);border:1px solid rgba(var(--acento-rgb),.28);border-radius:10px;padding:11px 12px;font-size:11.5px;line-height:1.5;color:#1D1D1B;margin-bottom:14px',
              )}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            style={sx(
              "width:100%;background:var(--acento);color:#fff;border:none;border-radius:10px;padding:13px;font-family:'Mulish';font-weight:600;font-size:13.5px;cursor:pointer",
              enviando && 'opacity:.6;cursor:progress',
            )}
          >
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
          <div style={sx('font-size:11px;color:rgba(23,25,31,.4);margin-top:14px;text-align:center;line-height:1.5')}>
            Las cuentas se dan de alta en Supabase → Authentication → Users.
          </div>
        </form>
      </div>
    </div>
  )
}
