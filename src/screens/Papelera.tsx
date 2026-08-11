import { sx } from '../lib/sx'
import { VistaPieza } from '../components/Piezas'
import { ESTADO_LABEL } from '../lib/types'
import { useApp } from '../store'

export function Papelera() {
  const app = useApp()
  const piezas = app.piezas.filter((p) => p.descartada)

  return (
    <section className="fade" style={sx('padding:28px 32px 60px')}>
      <div style={sx('display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px')}>
        <div style={sx('font-size:22px;font-weight:600;letter-spacing:-.02em')}>Papelera</div>
        <div style={sx('font-size:11.5px;color:rgba(23,25,31,.45)')}>
          {piezas.length === 1 ? '1 pieza' : `${piezas.length} piezas`}
        </div>
      </div>
      <div style={sx('font-size:12px;color:rgba(23,25,31,.5);line-height:1.5;margin-bottom:20px;max-width:560px')}>
        Las piezas que desechas se guardan aquí. Puedes restaurarlas o borrarlas
        definitivamente. El borrado definitivo no se puede deshacer.
      </div>

      {piezas.length === 0 ? (
        <div style={sx('background:#fff;border:1px dashed rgba(23,25,31,.18);border-radius:14px;padding:44px;text-align:center;color:rgba(23,25,31,.5);font-size:12.5px')}>
          La papelera está vacía.
        </div>
      ) : (
        <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px')}>
          {piezas.map((p) => {
            const centro = app.centros.find((c) => String(c.id) === String(p.centro_id))
            return (
              <div
                key={p.id}
                style={sx('background:#fff;border:1px solid rgba(23,25,31,.08);border-radius:14px;overflow:hidden')}
              >
                <div style={sx('opacity:.7')}>
                  <VistaPieza url={p.imagen_url} ratio={p.brief?.ratio ?? '4:5'} radio="0" titulo={p.titulo} compacto />
                </div>
                <div style={sx('padding:11px 12px 12px')}>
                  <div style={sx('font-size:12.5px;font-weight:600;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>
                    {p.titulo}
                  </div>
                  <div style={sx('font-size:10.5px;color:rgba(23,25,31,.5);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>
                    {centro?.nombre ?? 'Sin centro'} · {ESTADO_LABEL[p.estado]}
                  </div>
                  <div style={sx('display:flex;gap:7px;margin-top:10px')}>
                    <button
                      onClick={() => app.restaurarPieza(p.id)}
                      style={sx(
                        "flex:1;background:#fff;border:1px solid rgba(23,25,31,.16);border-radius:9px;padding:8px;font-family:'Mulish';font-weight:600;font-size:11.5px;cursor:pointer;color:#17191f",
                      )}
                    >
                      Restaurar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Borrar definitivamente «${p.titulo}»? No se puede deshacer.`)) {
                          void app.borrarPiezaDef(p.id)
                        }
                      }}
                      title="Borrar definitivamente"
                      style={sx(
                        "flex:none;background:#fff;border:1px solid rgba(200,40,40,.3);border-radius:9px;padding:8px 11px;font-family:'Mulish';font-weight:600;font-size:11.5px;cursor:pointer;color:oklch(0.55 0.18 25)",
                      )}
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
