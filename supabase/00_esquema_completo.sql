-- ===========================================================================
-- Claudia Studio · Esquema completo para una instancia NUEVA (marca blanca /
-- cualquier cliente). Crea todas las tablas, las políticas RLS, el bucket de
-- imágenes y una semilla de datos DEMO genéricos (sin ningún dato de cliente).
--
-- Uso: Supabase → SQL Editor → pegar todo → Run. Es idempotente (se puede
-- ejecutar más de una vez sin romper nada).
--
-- Después: crear un usuario en Authentication → Users para poder entrar.
-- ===========================================================================

-- --- Catálogos --------------------------------------------------------------
create table if not exists public.hubs (
  id      bigint generated always as identity primary key,
  clave   text not null,
  nombre  text not null
);

create table if not exists public.centros (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  nombre      text not null,
  ciudad      text,
  hub_id      bigint references public.hubs(id) on delete set null,
  tipo        text
);

create table if not exists public.lineas (
  id          bigint generated always as identity primary key,
  clave       text not null,
  nombre      text not null,
  descripcion text
);

create table if not exists public.situaciones (
  id                      bigint generated always as identity primary key,
  clave                   text not null,
  nombre                  text not null,
  requiere_consentimiento boolean not null default false
);

-- --- Carpetas (planificador) ------------------------------------------------
create table if not exists public.carpetas (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  centro_id   bigint not null references public.centros(id) on delete cascade,
  nombre      text not null
);

-- --- Piezas -----------------------------------------------------------------
create table if not exists public.piezas (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  titulo            text not null default 'Pieza',
  centro_id         bigint references public.centros(id) on delete cascade,
  carpeta_id        bigint references public.carpetas(id) on delete set null,
  situacion_id      bigint references public.situaciones(id) on delete set null,
  linea_id          bigint references public.lineas(id) on delete set null,
  estado            text not null default 'borrador',
  fecha_publicacion date,
  canal             text,
  brief             jsonb,
  prompt            text,
  imagen_url        text,
  consentimiento_ok boolean,
  notas_compliance  text
);

create index if not exists carpetas_centro_id_idx on public.carpetas (centro_id);
create index if not exists piezas_carpeta_id_idx   on public.piezas   (carpeta_id);
create index if not exists piezas_centro_id_idx    on public.piezas   (centro_id);
create index if not exists piezas_fecha_pub_idx    on public.piezas   (fecha_publicacion);

-- --- Marca (paleta y reglas editables) --------------------------------------
create table if not exists public.marca_paleta (
  id      bigint generated always as identity primary key,
  hex     text not null check (hex ~* '^#[0-9a-f]{6}$'),
  nombre  text not null,
  orden   int
);

create table if not exists public.marca_reglas (
  id     bigint generated always as identity primary key,
  texto  text not null,
  orden  int
);

-- --- RLS --------------------------------------------------------------------
alter table public.hubs         enable row level security;
alter table public.centros      enable row level security;
alter table public.lineas       enable row level security;
alter table public.situaciones  enable row level security;
alter table public.carpetas     enable row level security;
alter table public.piezas       enable row level security;
alter table public.marca_paleta enable row level security;
alter table public.marca_reglas enable row level security;

-- Catálogos: lectura para el equipo autenticado.
drop policy if exists "hubs_select_auth" on public.hubs;
create policy "hubs_select_auth" on public.hubs for select to authenticated using (true);
drop policy if exists "centros_select_auth" on public.centros;
create policy "centros_select_auth" on public.centros for select to authenticated using (true);
drop policy if exists "lineas_select_auth" on public.lineas;
create policy "lineas_select_auth" on public.lineas for select to authenticated using (true);
drop policy if exists "situaciones_select_auth" on public.situaciones;
create policy "situaciones_select_auth" on public.situaciones for select to authenticated using (true);

-- Carpetas: CRUD completo.
drop policy if exists "carpetas_select_auth" on public.carpetas;
create policy "carpetas_select_auth" on public.carpetas for select to authenticated using (true);
drop policy if exists "carpetas_insert_auth" on public.carpetas;
create policy "carpetas_insert_auth" on public.carpetas for insert to authenticated with check (true);
drop policy if exists "carpetas_update_auth" on public.carpetas;
create policy "carpetas_update_auth" on public.carpetas for update to authenticated using (true) with check (true);
drop policy if exists "carpetas_delete_auth" on public.carpetas;
create policy "carpetas_delete_auth" on public.carpetas for delete to authenticated using (true);

-- Piezas: CRUD completo.
drop policy if exists "piezas_select_auth" on public.piezas;
create policy "piezas_select_auth" on public.piezas for select to authenticated using (true);
drop policy if exists "piezas_insert_auth" on public.piezas;
create policy "piezas_insert_auth" on public.piezas for insert to authenticated with check (true);
drop policy if exists "piezas_update_auth" on public.piezas;
create policy "piezas_update_auth" on public.piezas for update to authenticated using (true) with check (true);
drop policy if exists "piezas_delete_auth" on public.piezas;
create policy "piezas_delete_auth" on public.piezas for delete to authenticated using (true);

-- Marca: lectura y edición para el equipo.
drop policy if exists "marca_paleta_all_auth" on public.marca_paleta;
create policy "marca_paleta_all_auth" on public.marca_paleta for all to authenticated using (true) with check (true);
drop policy if exists "marca_reglas_all_auth" on public.marca_reglas;
create policy "marca_reglas_all_auth" on public.marca_reglas for all to authenticated using (true) with check (true);

-- --- Storage: bucket público «piezas» ---------------------------------------
insert into storage.buckets (id, name, public)
values ('piezas', 'piezas', true)
on conflict (id) do nothing;

drop policy if exists "piezas_bucket_insert_auth" on storage.objects;
create policy "piezas_bucket_insert_auth" on storage.objects
  for insert to authenticated with check (bucket_id = 'piezas');
drop policy if exists "piezas_bucket_select_auth" on storage.objects;
create policy "piezas_bucket_select_auth" on storage.objects
  for select to authenticated using (bucket_id = 'piezas');

-- ===========================================================================
-- Semilla DEMO genérica (sin datos de ningún cliente). Bórrala y mete los
-- datos reales del cliente cuando corresponda.
--
-- Nota sobre HUBS: los hubs (agrupaciones de centros, p. ej. zonas) son
-- OPCIONALES. Un proyecto genérico normalmente no los necesita, así que la
-- semilla NO crea ninguno y los centros quedan sin agrupar. Si un cliente sí
-- usa agrupaciones, basta con insertar filas en «hubs» y asignar «hub_id» a
-- sus centros; la app los agrupará automáticamente.
-- ===========================================================================
insert into public.centros (nombre, ciudad, hub_id, tipo)
select v.nombre, v.ciudad, null, v.tipo
from (values
  ('Hospital Demo',        'Bilbao',   'Hospital'),
  ('Clínica Demo',         'Madrid',   'Clínica'),
  ('Centro Médico Demo',   'Valencia', 'Centro médico'),
  ('Consulta Demo',        'Sevilla',  'Consulta')
) as v(nombre, ciudad, tipo)
where not exists (select 1 from public.centros);

insert into public.lineas (clave, nombre, descripcion)
select v.clave, v.nombre, v.descripcion from (values
  ('prevencion', 'Prevención y salud',          'Consejos de prevención y hábitos saludables.'),
  ('servicios',  'Servicios y especialidades',  'Difusión de servicios, unidades y especialidades.'),
  ('comunidad',  'Comunidad y compromiso',      'Vínculo del centro con su comunidad.')
) as v(clave, nombre, descripcion)
where not exists (select 1 from public.lineas);

insert into public.situaciones (clave, nombre, requiere_consentimiento)
select v.clave, v.nombre, v.req from (values
  ('testimonio',   'Testimonio de paciente',           true),
  ('hito',         'Hito clínico o nueva tecnología',  false),
  ('colaboracion', 'Colaboración con la comunidad',    false),
  ('efemeride',    'Día mundial / efeméride',          false)
) as v(clave, nombre, req)
where not exists (select 1 from public.situaciones);

insert into public.marca_paleta (hex, nombre, orden)
select v.hex, v.nombre, v.orden from (values
  ('#D71029', 'Rojo',          1),
  ('#1D1D1B', 'Negro',         2),
  ('#706F6F', 'Gris oscuro',   3),
  ('#DEDEDE', 'Gris claro',    4),
  ('#FDE8DE', 'Naranja claro', 5),
  ('#FAFAFA', 'Blanco',        6)
) as v(hex, nombre, orden)
where not exists (select 1 from public.marca_paleta);

insert into public.marca_reglas (texto, orden)
select v.texto, v.orden from (values
  ('Nunca prometer resultados clínicos, curas o porcentajes de éxito no verificados.', 1),
  ('Fotos de pacientes solo con consentimiento firmado, representados con dignidad y respeto.', 2),
  ('Evitar aspecto de banco de imágenes: fotos propias, fondos planos, colores suaves.', 3),
  ('Todo contenido debe respetar el territorio Salud Responsable: ética, cuidado y compromiso.', 4)
) as v(texto, orden)
where not exists (select 1 from public.marca_reglas);
