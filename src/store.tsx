import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigurado, mensajeError } from './lib/supabase'
import * as api from './lib/api'
import { generarPieza, generarConfigurado, generarCopy, copyConfigurado, type PayloadGenerar } from './lib/n8n'
import { presentacionDe, PALETA_POR_DEFECTO, REGLAS_POR_DEFECTO } from './lib/marca'
import { CLIENTE } from './lib/cliente'
import { MARCA_POR_DEFECTO, desdeFila, fijarMarca, type MarcaConfig } from './lib/brand'
import { construirPromptImagen } from './lib/direccion'
import {
  DEMO,
  DEMO_CARPETAS,
  DEMO_CENTROS,
  DEMO_HUBS,
  DEMO_LINEAS,
  DEMO_PIEZAS,
  DEMO_SESION,
  DEMO_SITUACIONES,
} from './lib/demo'
import type {
  Brief,
  Carpeta,
  Centro,
  Estado,
  Hub,
  Id,
  Linea,
  MarcaColor,
  MarcaRegla,
  Pieza,
  Situacion,
} from './lib/types'

export type Pantalla =
  | 'dashboard'
  | 'calendario'
  | 'marcaRibera'
  | 'centro'
  | 'gateway'
  | 'situaciones'
  | 'pasoTestConsent'
  | 'pasoTestExposicion'
  | 'pasoColabPersonas'
  | 'pasoColabEntorno'
  | 'pasoHitoValidacion'
  | 'pasoHitoEntorno'
  | 'brief'
  | 'estudio'
  | 'detalle'
  | 'exportar'

export type Origen = 'scratch' | 'testimonio' | 'colaboracion' | 'hito' | 'situacionDirecta' | 'centro' | null

/** Encargo en curso: vive en memoria hasta que n8n crea la fila en `piezas`. */
export interface Borrador {
  titulo: string
  texto: string
  /** Mensaje/copy que se pinta sobre la imagen en la capa de marca. */
  copy: string
  /** Plantilla de marca con la que se compone la pieza. */
  plantilla: 'editorial' | 'franja'
  /** Formato de red social (id de FORMATOS): fija proporción y canal. */
  redFormato: string
  /** Si se aplica la capa de marca (logo + copy) o se entrega la foto limpia. */
  marca: boolean
  objetivo: 'Orgánico' | 'Promoción'
  canal: string
  ratio: '1:1' | '4:5' | '9:16' | '16:9'
  formato: 'Imagen' | 'Animación'
  variantes: number
  /** Tipo de post (encuadra la intención): Novedad, Promoción, Efeméride… */
  tipoPost: string
  /** Ajuste conversacional para la siguiente ronda: «más luminoso», «sin personas»… */
  ajuste: string
  estilo: string
  iluminacion: string
  encuadre: string
  ritmo: string
  textoEnPantalla: string
  transicion: string
  prompt: string
  fechaPublicacion: string
  material: { url: string; nombre: string } | null
  lineaId: Id | null
  situacionId: Id | null
  situacionClave: string | null
  consentimiento: boolean
  exposicion: string
  personas: string | null
  menores: boolean
  entorno: string | null
  validadoPorProfesional: boolean
  fondoLibre: boolean
  sinPacientes: boolean
}

export const BORRADOR_INICIAL: Borrador = {
  titulo: '',
  texto: '',
  copy: '',
  plantilla: 'editorial',
  redFormato: 'ig-post',
  marca: true,
  objetivo: 'Orgánico',
  canal: 'Instagram',
  ratio: '4:5',
  formato: 'Imagen',
  variantes: 4,
  tipoPost: '',
  ajuste: '',
  estilo: 'Editorial',
  iluminacion: 'Natural',
  encuadre: 'Medio',
  ritmo: 'Dinámico',
  textoEnPantalla: 'Destacado',
  transicion: 'Suave',
  prompt: '',
  fechaPublicacion: '',
  material: null,
  lineaId: null,
  situacionId: null,
  situacionClave: null,
  consentimiento: false,
  exposicion: 'Rostro visible',
  personas: null,
  menores: false,
  entorno: null,
  validadoPorProfesional: false,
  fondoLibre: false,
  sinPacientes: false,
}

export interface Modal {
  tipo: 'renombrar' | 'eliminar' | 'color' | 'texto'
  titulo: string
  sub: string
  valor?: string
  hex?: string
  nombre?: string
  error?: string
  confirmar: (valor: string, extra?: { hex: string; nombre: string }) => void | Promise<void>
}

export interface Aviso {
  msg: string
  deshacer?: () => void
  tono?: 'normal' | 'error'
}

interface Estado_ {
  sesion: Session | null
  comprobandoSesion: boolean

  hubs: Hub[]
  centros: Centro[]
  lineas: Linea[]
  situaciones: Situacion[]
  carpetas: Carpeta[]
  piezas: Pieza[]
  paleta: MarcaColor[]
  reglas: MarcaRegla[]
  marcaConfig: MarcaConfig
  marcaEditable: boolean

  cargandoDatos: boolean
  errorDatos: string | null

  pantalla: Pantalla
  hubFiltro: Id | null
  centroId: Id | null
  carpetaId: Id | null
  piezaId: string | null
  origen: Origen
  centroTab: 'carpetas' | 'marca'
  desplegadas: Record<string, boolean>

  borrador: Borrador
  generando: boolean
  errorGeneracion: string | null
  /** Piezas creadas por la última generación, en orden. */
  resultados: string[]
  seleccion: Record<string, boolean>
  favoritas: Record<string, boolean>
  filtroResultados: 'Todas' | 'Favoritas'

  busquedaCentros: string
  ordenCentros: 'Recientes' | 'A–Z'
  busquedaCarpetas: string
  ordenCarpetas: 'Recientes' | 'A–Z'
  busquedaPiezas: string
  filtroEstado: 'Todas' | Estado

  calMes: number
  calAnio: number
  calHub: Id | null
  calEstado: 'Todas' | Estado
  calCentroScope: Id | null
  calHubScope: Id | null

  formato: string
  resolucion: string
  destino: string
  entregada: { tipo: 'descarga' | 'centro'; etiqueta: string } | null

  menu: string | null
  modal: Modal | null
  aviso: Aviso | null
}

const ESTADO_INICIAL: Estado_ = {
  sesion: null,
  comprobandoSesion: true,
  hubs: [],
  centros: [],
  lineas: [],
  situaciones: [],
  carpetas: [],
  piezas: [],
  paleta: PALETA_POR_DEFECTO,
  reglas: REGLAS_POR_DEFECTO,
  marcaConfig: MARCA_POR_DEFECTO,
  marcaEditable: false,
  cargandoDatos: false,
  errorDatos: null,
  pantalla: 'dashboard',
  hubFiltro: null,
  centroId: null,
  carpetaId: null,
  piezaId: null,
  origen: null,
  centroTab: 'carpetas',
  desplegadas: {},
  borrador: BORRADOR_INICIAL,
  generando: false,
  errorGeneracion: null,
  resultados: [],
  seleccion: {},
  favoritas: {},
  filtroResultados: 'Todas',
  busquedaCentros: '',
  ordenCentros: 'Recientes',
  busquedaCarpetas: '',
  ordenCarpetas: 'Recientes',
  busquedaPiezas: '',
  filtroEstado: 'Todas',
  calMes: new Date().getMonth(),
  calAnio: new Date().getFullYear(),
  calHub: null,
  calEstado: 'Todas',
  calCentroScope: null,
  calHubScope: null,
  formato: 'JPG',
  resolucion: '4K',
  destino: 'Descargar',
  entregada: null,
  menu: null,
  modal: null,
  aviso: null,
}

// --- Persistencia ligera en el navegador ---------------------------------
// Guardamos SOLO la navegación y el borrador (no los datos, que se releen de
// Supabase, ni el estado transitorio de UI). Así recargar la página no borra
// lo que el usuario había empezado. La clave incluye el cliente para no mezclar
// borradores entre despliegues.
const CLAVE_PERSISTENCIA = `claudia:estado:${CLIENTE.id}`
const CAMPOS_PERSISTENTES = [
  'pantalla',
  'hubFiltro',
  'centroId',
  'carpetaId',
  'piezaId',
  'origen',
  'centroTab',
  'borrador',
  'resultados',
  'seleccion',
  'favoritas',
  'filtroResultados',
] as const

function cargarPersistido(): Partial<Estado_> {
  try {
    const raw = localStorage.getItem(CLAVE_PERSISTENCIA)
    if (!raw) return {}
    const obj = JSON.parse(raw) as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of CAMPOS_PERSISTENTES) if (k in obj) out[k] = obj[k]
    return out as Partial<Estado_>
  } catch {
    return {}
  }
}

function guardarPersistido(st: Estado_): void {
  try {
    const sub: Record<string, unknown> = {}
    for (const k of CAMPOS_PERSISTENTES) sub[k] = st[k]
    localStorage.setItem(CLAVE_PERSISTENCIA, JSON.stringify(sub))
  } catch {
    /* almacenamiento no disponible: seguimos sin persistir */
  }
}

type Parche = Partial<Estado_> | ((prev: Estado_) => Partial<Estado_>)

interface Contexto extends Estado_ {
  set: (parche: Parche) => void
  setBorrador: (parche: Partial<Borrador>) => void

  entrar: (email: string, password: string) => Promise<void>
  salir: () => Promise<void>
  recargar: () => Promise<void>

  ir: (pantalla: Pantalla) => void
  volver: () => void
  abrirCentro: (id: Id) => void
  abrirPieza: (id: string) => void
  abrirCalendarioCentro: () => void
  abrirCalendarioHub: () => void

  nuevaCarpeta: () => Promise<void>
  nuevaCreatividad: (carpetaId: Id) => void
  elegirSituacion: (s: Situacion) => void
  generar: () => Promise<void>
  generarTextoPost: (piezaId: string) => Promise<void>
  copyDisponible: boolean
  aprobarPieza: (id: string) => Promise<void>
  ponerEstado: (id: string, estado: Estado) => Promise<void>
  ponerFecha: (id: string, fecha: string) => Promise<void>
  entregar: (tipo: 'descarga' | 'centro') => Promise<void>

  avisar: (msg: string, tono?: 'normal' | 'error') => void
  avisarConDeshacer: (msg: string, deshacer: () => void) => void
  cerrarAviso: () => void
  abrirModal: (m: Modal) => void
  confirmarModal: () => void
  cerrarModal: () => void
  alternarMenu: (clave: string) => void

  centroActual: Centro | null
  carpetaActual: Carpeta | null
  piezaActual: Pieza | null
  situacionDe: (id: Id | null) => Situacion | null
  lineaDe: (id: Id | null) => Linea | null
  hubDeCentro: (centro: Centro | null) => Hub | null
  piezasDeCarpeta: (carpetaId: Id) => Pieza[]
  piezasDeCentro: (centroId: Id) => Pieza[]
  generarDisponible: boolean
}

const Ctx = createContext<Contexto | null>(null)

export function useApp(): Contexto {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp fuera de <AppProvider>')
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<Estado_>(() => ({ ...ESTADO_INICIAL, ...cargarPersistido() }))
  const timerAviso = useRef<number | undefined>(undefined)
  const accionModal = useRef<Modal['confirmar'] | null>(null)

  const set = useCallback((parche: Parche) => {
    setSt((prev) => ({ ...prev, ...(typeof parche === 'function' ? parche(prev) : parche) }))
  }, [])

  const setBorrador = useCallback((parche: Partial<Borrador>) => {
    setSt((prev) => ({ ...prev, borrador: { ...prev.borrador, ...parche } }))
  }, [])

  const avisar = useCallback((msg: string, tono: 'normal' | 'error' = 'normal') => {
    window.clearTimeout(timerAviso.current)
    setSt((p) => ({ ...p, aviso: { msg, tono } }))
    timerAviso.current = window.setTimeout(() => setSt((p) => ({ ...p, aviso: null })), tono === 'error' ? 5200 : 2800)
  }, [])

  const avisarConDeshacer = useCallback((msg: string, deshacer: () => void) => {
    window.clearTimeout(timerAviso.current)
    setSt((p) => ({ ...p, aviso: { msg, deshacer } }))
    timerAviso.current = window.setTimeout(() => setSt((p) => ({ ...p, aviso: null })), 6000)
  }, [])

  const cerrarAviso = useCallback(() => {
    window.clearTimeout(timerAviso.current)
    setSt((p) => ({ ...p, aviso: null }))
  }, [])

  // --- Sesión ---------------------------------------------------------------
  useEffect(() => {
    if (DEMO) {
      // Marca blanca sin backend: entra directo con una sesión demo.
      setSt((p) => ({ ...p, sesion: DEMO_SESION, comprobandoSesion: false }))
      return
    }
    if (!supabaseConfigurado) {
      setSt((p) => ({
        ...p,
        comprobandoSesion: false,
        errorDatos:
          'Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y rellénalos.',
      }))
      return
    }
    let vivo = true
    supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return
      setSt((p) => ({ ...p, sesion: data.session, comprobandoSesion: false }))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      setSt((p) => ({ ...p, sesion, comprobandoSesion: false }))
    })
    return () => {
      vivo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const recargar = useCallback(async () => {
    setSt((p) => ({ ...p, cargandoDatos: true, errorDatos: null }))
    if (DEMO) {
      // Datos genéricos incorporados: ni Supabase ni n8n.
      setSt((p) => ({
        ...p,
        hubs: DEMO_HUBS,
        centros: DEMO_CENTROS,
        lineas: DEMO_LINEAS,
        situaciones: DEMO_SITUACIONES,
        carpetas: DEMO_CARPETAS,
        piezas: DEMO_PIEZAS,
        paleta: PALETA_POR_DEFECTO,
        reglas: REGLAS_POR_DEFECTO,
        marcaConfig: MARCA_POR_DEFECTO,
        marcaEditable: false,
        cargandoDatos: false,
        errorDatos: null,
      }))
      fijarMarca(MARCA_POR_DEFECTO)
      return
    }
    try {
      const [catalogos, piezas, marca] = await Promise.all([
        api.cargarCatalogos(),
        api.cargarPiezas(),
        api.cargarMarca(),
      ])
      let carpetas: Carpeta[] = []
      let errorCarpetas: string | null = null
      try {
        carpetas = await api.cargarCarpetas()
      } catch {
        errorCarpetas =
          'Falta la tabla «carpetas». Ejecuta supabase/01_carpetas.sql para poder organizar las piezas en carpetas.'
      }
      const marcaConfig = desdeFila(marca?.config ?? null)
      fijarMarca(marcaConfig)
      setSt((p) => ({
        ...p,
        ...catalogos,
        carpetas,
        piezas,
        paleta: marca?.paleta.length ? marca.paleta : PALETA_POR_DEFECTO,
        reglas: marca?.reglas.length ? marca.reglas : REGLAS_POR_DEFECTO,
        marcaConfig,
        marcaEditable: marca !== null,
        cargandoDatos: false,
        errorDatos: errorCarpetas,
      }))
    } catch (error) {
      setSt((p) => ({ ...p, cargandoDatos: false, errorDatos: mensajeError(error) }))
    }
  }, [])

  useEffect(() => {
    if (st.sesion) void recargar()
  }, [st.sesion, recargar])

  // Persiste navegación + borrador para que recargar no borre lo empezado.
  useEffect(() => {
    guardarPersistido(st)
  }, [
    st.pantalla,
    st.hubFiltro,
    st.centroId,
    st.carpetaId,
    st.piezaId,
    st.origen,
    st.centroTab,
    st.borrador,
    st.resultados,
    st.seleccion,
    st.favoritas,
    st.filtroResultados,
  ])

  const entrar = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(mensajeError(error))
  }, [])

  const salir = useCallback(async () => {
    await supabase.auth.signOut()
    setSt((p) => ({ ...ESTADO_INICIAL, sesion: null, comprobandoSesion: false, paleta: p.paleta, reglas: p.reglas }))
  }, [])

  // --- Cierre de menús al hacer clic fuera ----------------------------------
  useEffect(() => {
    const cerrar = () => setSt((p) => (p.menu ? { ...p, menu: null } : p))
    document.addEventListener('click', cerrar)
    return () => document.removeEventListener('click', cerrar)
  }, [])

  // --- Selectores -----------------------------------------------------------
  const centroActual = useMemo(
    () => st.centros.find((c) => String(c.id) === String(st.centroId)) ?? null,
    [st.centros, st.centroId],
  )
  const carpetaActual = useMemo(
    () => st.carpetas.find((c) => String(c.id) === String(st.carpetaId)) ?? null,
    [st.carpetas, st.carpetaId],
  )
  const piezaActual = useMemo(
    () => st.piezas.find((p) => p.id === st.piezaId) ?? null,
    [st.piezas, st.piezaId],
  )

  const situacionDe = useCallback(
    (id: Id | null) => (id == null ? null : st.situaciones.find((s) => String(s.id) === String(id)) ?? null),
    [st.situaciones],
  )
  const lineaDe = useCallback(
    (id: Id | null) => (id == null ? null : st.lineas.find((l) => String(l.id) === String(id)) ?? null),
    [st.lineas],
  )
  const hubDeCentro = useCallback(
    (centro: Centro | null) =>
      centro?.hub_id == null ? null : st.hubs.find((h) => String(h.id) === String(centro.hub_id)) ?? null,
    [st.hubs],
  )
  const piezasDeCarpeta = useCallback(
    (carpetaId: Id) => st.piezas.filter((p) => p.carpeta_id != null && String(p.carpeta_id) === String(carpetaId)),
    [st.piezas],
  )
  const piezasDeCentro = useCallback(
    (centroId: Id) => st.piezas.filter((p) => String(p.centro_id) === String(centroId)),
    [st.piezas],
  )

  // --- Navegación -----------------------------------------------------------
  const ir = useCallback((pantalla: Pantalla) => setSt((p) => ({ ...p, pantalla })), [])

  const abrirCentro = useCallback((id: Id) => {
    setSt((p) => ({ ...p, centroId: id, carpetaId: null, centroTab: 'carpetas', pantalla: 'centro' }))
  }, [])

  const abrirPieza = useCallback((id: string) => {
    setSt((p) => {
      const pieza = p.piezas.find((x) => x.id === id)
      if (!pieza) return p
      const brief = pieza.brief ?? {}
      const sit = p.situaciones.find((s) => String(s.id) === String(pieza.situacion_id)) ?? null
      return {
        ...p,
        centroId: pieza.centro_id,
        carpetaId: pieza.carpeta_id,
        piezaId: pieza.id,
        origen: 'centro',
        pantalla: 'estudio',
        resultados: [pieza.id],
        seleccion: {},
        favoritas: {},
        filtroResultados: 'Todas',
        errorGeneracion: null,
        borrador: {
          ...BORRADOR_INICIAL,
          titulo: pieza.titulo,
          texto: brief.texto ?? '',
          copy: brief.copy ?? '',
          plantilla: brief.plantilla ?? 'editorial',
          redFormato: brief.redFormato ?? 'ig-post',
          marca: brief.marca !== false,
          objetivo: brief.objetivo ?? 'Orgánico',
          canal: pieza.canal ?? 'Instagram',
          ratio: brief.ratio ?? '4:5',
          formato: brief.formato ?? 'Imagen',
          variantes: brief.variantes ?? 4,
          estilo: brief.direccion?.estilo ?? 'Editorial',
          iluminacion: brief.direccion?.iluminacion ?? 'Natural',
          encuadre: brief.direccion?.encuadre ?? 'Medio',
          ritmo: brief.direccion?.ritmo ?? 'Dinámico',
          textoEnPantalla: brief.direccion?.texto ?? 'Destacado',
          transicion: brief.direccion?.transicion ?? 'Suave',
          prompt: pieza.prompt ?? '',
          fechaPublicacion: pieza.fecha_publicacion ?? '',
          material: brief.material ?? null,
          lineaId: pieza.linea_id,
          situacionId: pieza.situacion_id,
          situacionClave: sit?.clave ?? null,
          consentimiento: pieza.consentimiento_ok ?? false,
          exposicion: brief.situacion?.exposicion ?? 'Rostro visible',
          personas: brief.situacion?.personas ?? null,
          menores: brief.situacion?.menores ?? false,
          entorno: brief.situacion?.entorno ?? null,
          validadoPorProfesional: brief.situacion?.validadoPorProfesional ?? false,
          fondoLibre: brief.situacion?.fondoLibre ?? false,
          sinPacientes: brief.situacion?.sinPacientes ?? false,
        },
      }
    })
  }, [])

  const volver = useCallback(() => {
    setSt((p) => {
      const destino: Record<Pantalla, Pantalla> = {
        dashboard: 'dashboard',
        calendario: 'dashboard',
        marcaRibera: 'dashboard',
        centro: 'dashboard',
        gateway: 'centro',
        situaciones: 'gateway',
        pasoTestConsent: 'situaciones',
        pasoTestExposicion: 'pasoTestConsent',
        pasoColabPersonas: 'situaciones',
        pasoColabEntorno: 'pasoColabPersonas',
        pasoHitoValidacion: 'situaciones',
        pasoHitoEntorno: 'pasoHitoValidacion',
        brief: 'gateway',
        estudio: 'centro',
        detalle: 'estudio',
        exportar: 'estudio',
      }
      if (p.pantalla === 'estudio') {
        const porOrigen: Record<string, Pantalla> = {
          testimonio: 'pasoTestExposicion',
          colaboracion: 'pasoColabEntorno',
          hito: 'pasoHitoEntorno',
          situacionDirecta: 'situaciones',
          scratch: 'brief',
          centro: 'centro',
        }
        return { ...p, pantalla: porOrigen[p.origen ?? 'centro'] ?? 'centro' }
      }
      return { ...p, pantalla: destino[p.pantalla] }
    })
  }, [])

  const abrirCalendarioCentro = useCallback(() => {
    setSt((p) => ({ ...p, calCentroScope: p.centroId, calHubScope: null, calHub: null, pantalla: 'calendario' }))
  }, [])
  const abrirCalendarioHub = useCallback(() => {
    setSt((p) => ({ ...p, calCentroScope: null, calHubScope: p.hubFiltro, calHub: null, pantalla: 'calendario' }))
  }, [])

  // --- Modales --------------------------------------------------------------
  const abrirModal = useCallback((m: Modal) => {
    accionModal.current = m.confirmar
    setSt((p) => ({ ...p, menu: null, modal: m }))
  }, [])
  const cerrarModal = useCallback(() => {
    accionModal.current = null
    setSt((p) => ({ ...p, modal: null }))
  }, [])
  const confirmarModal = useCallback(() => {
    const m = st.modal
    if (!m) return
    const accion = accionModal.current
    if (m.tipo === 'color') {
      void accion?.('', { hex: m.hex ?? '', nombre: m.nombre ?? '' })
      return
    }
    accionModal.current = null
    setSt((p) => ({ ...p, modal: null }))
    void accion?.(m.valor ?? '')
  }, [st.modal])

  const alternarMenu = useCallback((clave: string) => {
    setSt((p) => ({ ...p, menu: p.menu === clave ? null : clave }))
  }, [])

  // --- Carpetas y piezas ----------------------------------------------------
  const nombreMesActual = () => {
    const m = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    return m.charAt(0).toUpperCase() + m.slice(1)
  }

  const nuevaCarpeta = useCallback(async () => {
    const centroId = st.centroId
    if (centroId == null) return
    abrirModal({
      tipo: 'renombrar',
      titulo: 'Nueva carpeta',
      sub: 'Ponle nombre: un mes («Septiembre 2026») o una campaña.',
      valor: nombreMesActual(),
      confirmar: async (valor) => {
        try {
          const carpeta = await api.crearCarpeta(centroId, valor.trim() || nombreMesActual())
          setSt((p) => ({
            ...p,
            carpetas: [...p.carpetas, carpeta],
            desplegadas: { ...p.desplegadas, [String(carpeta.id)]: true },
          }))
          avisar('Carpeta creada ✓')
        } catch (error) {
          avisar(mensajeError(error), 'error')
        }
      },
    })
  }, [st.centroId, abrirModal, avisar])

  const nuevaCreatividad = useCallback(
    (carpetaId: Id) => {
      const centro = st.centros.find((c) => String(c.id) === String(st.centroId))
      setSt((p) => ({
        ...p,
        carpetaId,
        piezaId: null,
        origen: 'scratch',
        pantalla: 'estudio',
        resultados: [],
        seleccion: {},
        favoritas: {},
        errorGeneracion: null,
        borrador: { ...BORRADOR_INICIAL, titulo: centro ? `Nueva creatividad · ${centro.nombre}` : 'Nueva creatividad' },
      }))
    },
    [st.centros, st.centroId],
  )

  const elegirSituacion = useCallback((s: Situacion) => {
    const pres = presentacionDe(s.clave)
    const pantallaPorPasos: Record<string, Pantalla> = {
      testimonio: 'pasoTestConsent',
      colaboracion: 'pasoColabPersonas',
      hito: 'pasoHitoValidacion',
    }
    // Una situación marcada en Supabase como `requiere_consentimiento` siempre
    // pasa por la puerta de consentimiento, aunque no tenga pasos propios.
    const pasos = pres.pasos ?? (s.requiere_consentimiento ? 'testimonio' : null)
    setSt((p) => ({
      ...p,
      pantalla: pasos ? pantallaPorPasos[pasos] : 'estudio',
      origen: pasos ?? 'situacionDirecta',
      borrador: {
        ...p.borrador,
        situacionId: s.id,
        situacionClave: s.clave,
        texto: pres.briefPorDefecto,
        prompt: pres.briefPorDefecto,
        objetivo: pres.objetivo,
        canal: pres.canal,
        ratio: pres.ratio,
        consentimiento: false,
        exposicion: 'Rostro visible',
        personas: null,
        menores: false,
        entorno: null,
        validadoPorProfesional: false,
        fondoLibre: false,
        sinPacientes: false,
      },
    }))
  }, [])

  // --- Generación -----------------------------------------------------------
  const generar = useCallback(async () => {
    const centro = st.centros.find((c) => String(c.id) === String(st.centroId))
    if (!centro) {
      avisar('Selecciona un centro antes de generar.', 'error')
      return
    }
    if (!generarConfigurado) {
      setSt((p) => ({
        ...p,
        errorGeneracion:
          'Falta configurar VITE_N8N_GENERAR_URL. Sin el webhook de n8n no se puede producir la imagen.',
      }))
      return
    }
    const b = st.borrador
    const situacion = st.situaciones.find((s) => String(s.id) === String(b.situacionId)) ?? null
    const linea = st.lineas.find((l) => String(l.id) === String(b.lineaId)) ?? null
    const hub = centro.hub_id == null ? null : st.hubs.find((h) => String(h.id) === String(centro.hub_id)) ?? null

    const brief: Brief = {
      texto: b.texto,
      copy: b.copy,
      plantilla: b.plantilla,
      redFormato: b.redFormato,
      marca: b.marca,
      objetivo: b.objetivo,
      ratio: b.ratio,
      formato: b.formato,
      variantes: b.variantes,
      direccion:
        b.formato === 'Animación'
          ? { estilo: b.estilo, ritmo: b.ritmo, texto: b.textoEnPantalla, transicion: b.transicion }
          : { estilo: b.estilo, iluminacion: b.iluminacion, encuadre: b.encuadre },
      material: b.material ?? undefined,
      situacion: {
        exposicion: b.exposicion,
        personas: b.personas ?? undefined,
        menores: b.menores,
        entorno: b.entorno ?? undefined,
        validadoPorProfesional: b.validadoPorProfesional,
        fondoLibre: b.fondoLibre,
        sinPacientes: b.sinPacientes,
      },
    }

    // Título automático a partir de la intención (el usuario ya no lo escribe).
    const intencion = b.prompt.trim()
    const tituloAuto =
      intencion.length > 0 ? intencion.charAt(0).toUpperCase() + intencion.slice(1, 56) : b.titulo.trim() || `${b.canal}`

    const payload: PayloadGenerar = {
      pieza_id: st.piezaId,
      pieza: {
        titulo: tituloAuto,
        centro_id: centro.id,
        carpeta_id: st.carpetaId,
        situacion_id: b.situacionId,
        linea_id: b.lineaId,
        estado: 'borrador',
        fecha_publicacion: b.fechaPublicacion || null,
        canal: b.canal,
        consentimiento_ok: b.consentimiento,
        notas_compliance: notasCompliance(st.borrador, situacion),
        // Dirección de arte: la intención se enriquece con fotografía, formato y
        // Brand Kit (no se manda pelada). La marca real (logo/copy) la compone
        // la app encima, por eso a la IA se le pide una foto limpia sin texto.
        prompt: construirPromptImagen({
          intencion,
          tipoPost: b.tipoPost,
          ajuste: b.ajuste,
          ratio: b.ratio,
          territorio: st.marcaConfig.territorio,
          tono: st.marcaConfig.tonoVoz,
          paleta: st.paleta,
          reglas: st.reglas.map((r) => r.texto),
        }),
        brief,
      },
      contexto: {
        centro: { id: centro.id, nombre: centro.nombre, ciudad: centro.ciudad, tipo: centro.tipo, hub },
        linea,
        situacion,
        marca: {
          territorio: st.marcaConfig.territorio,
          tono: st.marcaConfig.tonoVoz,
          tipografia: st.marcaConfig.tipografia,
          paleta: st.paleta.map((c) => ({ hex: c.hex, nombre: c.nombre })),
          reglas: st.reglas.map((r) => r.texto),
        },
      },
    }

    // Una llamada a n8n por variante: el workflow genera una imagen por llamada,
    // así conseguimos las N variantes que pide el brief sin depender de que n8n
    // itere por dentro. Se lanzan EN SERIE (una tras otra, con un respiro entre
    // ellas): el modelo de imagen de Google limita las peticiones simultáneas y
    // en paralelo las rechaza con «too many requests». En serie son fiables.
    const nVariantes = Math.min(Math.max(brief.variantes ?? 1, 1), 6)
    const payloadUno: PayloadGenerar = {
      ...payload,
      pieza: { ...payload.pieza, brief: { ...payload.pieza.brief, variantes: 1 } },
    }
    const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))

    const desde = new Date().toISOString()
    setSt((p) => ({ ...p, generando: true, errorGeneracion: null, resultados: [], seleccion: {}, favoritas: {} }))

    try {
      const respuestas: PromiseSettledResult<Awaited<ReturnType<typeof generarPieza>>>[] = []
      for (let i = 0; i < nVariantes; i++) {
        if (i > 0) await espera(1500)
        try {
          respuestas.push({ status: 'fulfilled', value: await generarPieza(payloadUno) })
        } catch (error) {
          respuestas.push({ status: 'rejected', reason: error })
        }
      }
      const algunaOk = respuestas.some((r) => r.status === 'fulfilled' && r.value.ok !== false)

      // Si todas fallan, propaga el primer error para mostrarlo en el estudio.
      if (!algunaOk) {
        const fallo = respuestas.find(
          (r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.ok === false),
        )
        const msg =
          fallo?.status === 'rejected'
            ? (fallo.reason as Error)?.message ?? 'No se pudo generar.'
            : (fallo?.status === 'fulfilled' ? fallo.value.error : null) ?? 'No se pudo generar.'
        throw new Error(msg)
      }

      // Supabase es la fuente de verdad: n8n escribe las filas, la app las relee.
      const piezas = await api.cargarPiezas()
      const nuevas = piezas
        .filter((p) => String(p.centro_id) === String(centro.id))
        .filter((p) => (p.created_at ?? '') >= desde)
        .sort((a, b2) => (a.created_at ?? '').localeCompare(b2.created_at ?? ''))

      const resultados = nuevas.length
        ? nuevas.map((p) => p.id)
        : st.piezaId && piezas.some((p) => p.id === st.piezaId)
          ? [st.piezaId]
          : []

      setSt((p) => ({
        ...p,
        piezas,
        generando: false,
        resultados,
        piezaId: resultados[0] ?? p.piezaId,
        errorGeneracion: resultados.length
          ? null
          : 'n8n respondió, pero no han aparecido piezas nuevas en Supabase. Revisa el workflow.',
      }))
      if (resultados.length)
        avisar(`${resultados.length === 1 ? 'Pieza generada' : `${resultados.length} variantes generadas`} ✓`)
    } catch (error) {
      setSt((p) => ({ ...p, generando: false, errorGeneracion: mensajeError(error) }))
    }
  }, [st.centros, st.centroId, st.borrador, st.situaciones, st.lineas, st.hubs, st.paleta, st.reglas, st.carpetaId, st.piezaId, avisar])

  // Redacta el texto del post (caption + hashtags) con la IA, en el tono de voz
  // de la marca. n8n devuelve el texto; la app lo guarda en la pieza.
  const generarTextoPost = useCallback(
    async (piezaId: string) => {
      const pieza = st.piezas.find((p) => p.id === piezaId)
      if (!pieza) return
      const centro = st.centros.find((c) => String(c.id) === String(pieza.centro_id))
      const linea = st.lineas.find((l) => String(l.id) === String(pieza.linea_id))
      const r = await generarCopy({
        pieza_id: piezaId,
        red: pieza.canal ?? 'Instagram',
        descripcion: pieza.prompt ?? pieza.brief?.texto ?? pieza.titulo,
        cliente: CLIENTE.cliente ?? '',
        marca: {
          territorio: st.marcaConfig.territorio,
          tono: st.marcaConfig.tonoVoz,
          reglas: st.reglas.map((rg) => rg.texto),
        },
        contexto: { centro: centro?.nombre ?? '', linea: linea?.nombre ?? '' },
      })
      if (!r.ok) throw new Error(r.error ?? 'No se pudo redactar el texto.')
      const cambios = { copy_texto: r.copy_texto ?? null, hashtags: r.hashtags ?? null }
      await api.actualizarPieza(piezaId, cambios)
      setSt((s) => ({ ...s, piezas: s.piezas.map((x) => (x.id === piezaId ? { ...x, ...cambios } : x)) }))
    },
    [st.piezas, st.centros, st.lineas, st.marcaConfig, st.reglas],
  )

  const ponerEstado = useCallback(
    async (id: string, estado: Estado) => {
      const anterior = st.piezas.find((p) => p.id === id)?.estado
      setSt((p) => ({ ...p, piezas: p.piezas.map((x) => (x.id === id ? { ...x, estado } : x)), menu: null }))
      try {
        await api.cambiarEstado(id, estado)
      } catch (error) {
        setSt((p) => ({
          ...p,
          piezas: p.piezas.map((x) => (x.id === id && anterior ? { ...x, estado: anterior } : x)),
        }))
        avisar(mensajeError(error), 'error')
      }
    },
    [st.piezas, avisar],
  )

  const aprobarPieza = useCallback(
    async (id: string) => {
      await ponerEstado(id, 'aprobado')
      setSt((p) => ({ ...p, seleccion: { ...p.seleccion, [id]: true }, pantalla: 'exportar' }))
    },
    [ponerEstado],
  )

  const ponerFecha = useCallback(
    async (id: string, fecha: string) => {
      const valor = fecha || null
      setSt((p) => ({ ...p, piezas: p.piezas.map((x) => (x.id === id ? { ...x, fecha_publicacion: valor } : x)) }))
      try {
        await api.actualizarPieza(id, { fecha_publicacion: valor })
      } catch (error) {
        avisar(mensajeError(error), 'error')
        void recargar()
      }
    },
    [avisar, recargar],
  )

  const entregar = useCallback(
    async (tipo: 'descarga' | 'centro') => {
      const ids = Object.keys(st.seleccion).filter((k) => st.seleccion[k])
      if (!ids.length) {
        avisar('No hay creatividades en la entrega.', 'error')
        return
      }
      try {
        await Promise.all(ids.map((id) => api.cambiarEstado(id, 'publicado')))
        setSt((p) => ({
          ...p,
          piezas: p.piezas.map((x) => (ids.includes(x.id) ? { ...x, estado: 'publicado' as Estado } : x)),
          entregada: { tipo, etiqueta: tipo === 'descarga' ? 'Descargada' : 'Enviada al centro' },
        }))
      } catch (error) {
        avisar(mensajeError(error), 'error')
      }
    },
    [st.seleccion, avisar],
  )

  const valor: Contexto = {
    ...st,
    set,
    setBorrador,
    entrar,
    salir,
    recargar,
    ir,
    volver,
    abrirCentro,
    abrirPieza,
    abrirCalendarioCentro,
    abrirCalendarioHub,
    nuevaCarpeta,
    nuevaCreatividad,
    elegirSituacion,
    generar,
    aprobarPieza,
    ponerEstado,
    ponerFecha,
    entregar,
    avisar,
    avisarConDeshacer,
    cerrarAviso,
    abrirModal,
    confirmarModal,
    cerrarModal,
    alternarMenu,
    centroActual,
    carpetaActual,
    piezaActual,
    situacionDe,
    lineaDe,
    hubDeCentro,
    piezasDeCarpeta,
    piezasDeCentro,
    generarDisponible: generarConfigurado,
    generarTextoPost,
    copyDisponible: copyConfigurado,
  }

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

/** Resumen de cumplimiento que se guarda en `piezas.notas_compliance`. */
export function notasCompliance(b: Borrador, situacion: Situacion | null): string {
  const partes: string[] = []
  if (situacion) partes.push(`Situación: ${situacion.nombre}.`)
  if (situacion?.requiere_consentimiento || b.situacionClave === 'testimonio') {
    partes.push(b.consentimiento ? 'Consentimiento firmado confirmado.' : 'Consentimiento PENDIENTE.')
    partes.push(`Nivel de exposición: ${b.exposicion}.`)
  }
  if (b.situacionClave === 'colaboracion') {
    if (b.personas) partes.push(`Personas en imagen: ${b.personas}.`)
    if (b.menores) partes.push('Aparecen menores: requiere permiso familiar por escrito.')
    if (b.entorno) partes.push(`Entorno: ${b.entorno}.`)
  }
  if (b.situacionClave === 'hito') {
    partes.push(
      b.validadoPorProfesional
        ? 'Afirmaciones clínicas validadas por un profesional del centro.'
        : 'Afirmaciones clínicas SIN validar.',
    )
    if (b.fondoLibre) partes.push('Fondo libre de pantallas con datos clínicos.')
    if (b.sinPacientes) partes.push('Sin pacientes identificables en el plano.')
  }
  partes.push('Marca aplicada · sin promesas de curación · sin superlativos no verificables · tono Salud Responsable.')
  return partes.join(' ')
}
