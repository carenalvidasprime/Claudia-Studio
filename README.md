# Claudia Studio · Ribera

Aplicación web para los equipos de comunicación de los centros del Grupo Ribera.
Genera piezas de contenido para redes sociales garantizando el cumplimiento de
marca y de compliance.

Sitio estático (React + Vite + TypeScript), pensado para desplegarse en
Cloudflare Pages. No depende del runtime de Claude Design.

---

## Puesta en marcha

### 1. Base de datos

En Supabase → SQL Editor, ejecutar **en este orden** los archivos de `supabase/`:

| Archivo | Qué hace | ¿Obligatorio? |
| --- | --- | --- |
| `01_carpetas.sql` | Crea la tabla `carpetas` y añade `piezas.carpeta_id`. El planificador de cada centro se organiza en carpetas (mensuales o de campaña); el esquema original colgaba las piezas directamente del centro. | Sí |
| `02_marca.sql` | Crea `marca_paleta` y `marca_reglas` con la semilla del brandbook, para que la pantalla Marca Ribera sea editable. Sin ellas funciona en modo lectura. | No |
| `03_policies.sql` | Políticas RLS. **Sin esto la app no lee nada**, porque RLS está activo y no había ninguna política. | Sí |

El modelo de acceso es: el rol `anon` no ve nada; el rol `authenticated` lee los
catálogos (`hubs`, `centros`, `lineas`, `situaciones`) y tiene CRUD sobre
`carpetas` y `piezas`; el rol `service_role` —el que usa n8n— salta RLS.

### 2. Usuarios

Las cuentas del equipo se dan de alta en **Supabase → Authentication → Users**.
No hay registro desde la app.

### 3. Variables de entorno

```bash
cp .env.example .env
```

Y rellenar `VITE_SUPABASE_ANON_KEY` con la clave `anon` del proyecto
(Supabase → Project Settings → API). Es publicable por diseño: lo que protege
los datos son las políticas RLS.

### 4. Desarrollo

```bash
npm install
npm run dev
```

### 5. Despliegue en Cloudflare Pages

- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Variables de entorno**: las cuatro `VITE_*` de `.env.example`, definidas en
  Settings → Environment variables (para *Production* y *Preview*).

`public/_redirects` deja la navegación en una sola página y `public/_headers`
añade las cabeceras de seguridad básicas.

### 6. n8n

Dos webhooks, documentados en `n8n/`:

- **`claudia-generar`** (ya existe, hay que ampliarlo): pasa de aceptar
  `{prompt, centro}` a recibir la pieza completa con sus identificadores. Ver
  `n8n/claudia-generar.md`.
- **`claudia-chat`** (por crear): da servicio al copiloto. Ver
  `n8n/claudia-chat.md`. Mientras no exista, el chat avisa de que no está
  disponible.

Ambos necesitan permitir CORS desde el dominio publicado y responder al
preflight `OPTIONS`.

---

## Cómo están repartidos los secretos

Ninguna credencial vive en el código del frontend:

- La **clave `anon`** de Supabase viaja en el bundle, como está previsto en su
  diseño; por sí sola no abre nada porque RLS solo concede acceso al rol
  `authenticated`.
- La **`service_role`** de Supabase y la **clave del modelo de imagen** están solo
  en las credenciales de n8n.
- La **clave del modelo de lenguaje** del copiloto, igual: solo en n8n.

---

## Estructura

```
src/
  lib/          supabase, api, n8n, tipos, tokens de marca y helpers de estilo
  components/   barra lateral, cabecera, overlays, copiloto, vista de pieza
  screens/      una por pantalla del flujo
  store.tsx     estado de la aplicación y acciones
supabase/       migraciones y políticas RLS
n8n/            contratos de los dos webhooks
```

### Datos: qué se lee y qué se escribe

Los catálogos se leen de Supabase y **nunca** se escriben a mano en el código:
hubs, centros, líneas de comunicación y situaciones. La app no los modifica; se
gestionan en Supabase.

Lo que sí escribe la app: carpetas, y sobre las piezas su estado, fecha de
publicación, título y borrado. La **creación** de una pieza con su imagen la hace
n8n; la app relee después de Supabase.

### Flujo

```
Login → Centros (agrupados por hub) → Centro (carpetas) → Nueva creatividad
  → Puerta: situación · desde cero · subir material
      → Situación con pasos propios (testimonio, colaboración, hito clínico)
      → Estudio de generación → n8n produce la pieza
          → Detalle → Publicar y exportar
```

Tres situaciones tienen pasos de compliance obligatorios antes del estudio, y
cualquier situación marcada en Supabase con `requiere_consentimiento` pasa por la
puerta de consentimiento aunque no tenga pasos propios.

El calendario editorial existe a tres niveles —general, por hub y por centro—
sobre los mismos datos (`piezas.fecha_publicacion`), solo cambia el alcance.

---

## Diferencias respecto al prototipo de Claude Design

- **Nada simulado en el contenido.** El prototipo generaba titulares inventados
  por tema y los pintaba como carteles de marca. Se ha eliminado: cada pieza
  muestra su `imagen_url` real y, si aún no la tiene, un marcador neutro sin
  texto atribuible a Ribera.
- **Retoque IA visible pero desactivado.** Las cinco acciones de retoque siguen
  en pantalla, deshabilitadas y marcadas como próximas: el workflow actual
  produce la imagen en una pasada y no tiene paso de edición.
- **Login real** contra Supabase Auth, en lugar del acceso ficticio.
- **Carpetas en vez de datos sembrados.** Los cinco hospitales de ejemplo
  desaparecen: se listan los 27 centros reales de Supabase, agrupados por sus 8
  hubs.
- **Línea de comunicación** como campo de la pieza: es parte del modelo real y no
  existía en el prototipo.
- **Cinco estados** (`borrador`, `en_revision`, `aprobado`, `programado`,
  `publicado`) en lugar de cuatro, siguiendo el esquema de la tabla.
- **Alta de centros retirada.** Los centros son un catálogo de Supabase; el botón
  «+ Nuevo centro» del prototipo habría necesitado escritura sobre `centros`.

## Pendiente

- Personalización de marca por centro (logo, colores y tono locales): haría falta
  ampliar la tabla `centros` con esas columnas.
- Paso de edición/retoque en el workflow de n8n.
- Bucket privado con URLs firmadas antes de producción; hoy `piezas` es público.
