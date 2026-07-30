-- ---------------------------------------------------------------------------
-- 03 · Políticas RLS
--
-- RLS está activado en las tablas pero sin políticas: sin esto la app no lee
-- nada. El modelo es «equipo de comunicación autenticado»:
--
--   · rol `anon`          → sin acceso a ninguna tabla. La clave anon puede
--                           viajar en el frontend porque por sí sola no abre nada.
--   · rol `authenticated` → lectura de los catálogos (hubs, centros, líneas,
--                           situaciones, marca) y CRUD completo sobre carpetas
--                           y piezas.
--   · rol `service_role`  → salta RLS por definición; es el que usa n8n para
--                           escribir la fila de la pieza y subir la imagen.
--
-- Los usuarios se dan de alta en Supabase → Authentication → Users.
--
-- Ejecutar en: Supabase → SQL Editor, DESPUÉS de 01 y 02. Es idempotente.
-- ---------------------------------------------------------------------------

alter table public.hubs        enable row level security;
alter table public.centros     enable row level security;
alter table public.lineas      enable row level security;
alter table public.situaciones enable row level security;
alter table public.piezas      enable row level security;

-- --- Catálogos: solo lectura para el equipo autenticado ---------------------
-- Se leen de Supabase y no se escriben desde la app, por eso no hay políticas
-- de insert/update/delete: quedan reservados a service_role.

drop policy if exists "hubs_select_auth" on public.hubs;
create policy "hubs_select_auth" on public.hubs
  for select to authenticated using (true);

drop policy if exists "centros_select_auth" on public.centros;
create policy "centros_select_auth" on public.centros
  for select to authenticated using (true);

drop policy if exists "lineas_select_auth" on public.lineas;
create policy "lineas_select_auth" on public.lineas
  for select to authenticated using (true);

drop policy if exists "situaciones_select_auth" on public.situaciones;
create policy "situaciones_select_auth" on public.situaciones
  for select to authenticated using (true);

-- --- Carpetas: CRUD completo -----------------------------------------------

drop policy if exists "carpetas_select_auth" on public.carpetas;
create policy "carpetas_select_auth" on public.carpetas
  for select to authenticated using (true);

drop policy if exists "carpetas_insert_auth" on public.carpetas;
create policy "carpetas_insert_auth" on public.carpetas
  for insert to authenticated with check (true);

drop policy if exists "carpetas_update_auth" on public.carpetas;
create policy "carpetas_update_auth" on public.carpetas
  for update to authenticated using (true) with check (true);

drop policy if exists "carpetas_delete_auth" on public.carpetas;
create policy "carpetas_delete_auth" on public.carpetas
  for delete to authenticated using (true);

-- --- Piezas: CRUD completo --------------------------------------------------

drop policy if exists "piezas_select_auth" on public.piezas;
create policy "piezas_select_auth" on public.piezas
  for select to authenticated using (true);

drop policy if exists "piezas_insert_auth" on public.piezas;
create policy "piezas_insert_auth" on public.piezas
  for insert to authenticated with check (true);

drop policy if exists "piezas_update_auth" on public.piezas;
create policy "piezas_update_auth" on public.piezas
  for update to authenticated using (true) with check (true);

drop policy if exists "piezas_delete_auth" on public.piezas;
create policy "piezas_delete_auth" on public.piezas
  for delete to authenticated using (true);

-- --- Marca: lectura para todo el equipo, edición también --------------------
-- (Solo si se ejecutó 02_marca.sql.)

do $$
begin
  if to_regclass('public.marca_paleta') is not null then
    execute 'drop policy if exists "marca_paleta_select_auth" on public.marca_paleta';
    execute 'create policy "marca_paleta_select_auth" on public.marca_paleta for select to authenticated using (true)';
    execute 'drop policy if exists "marca_paleta_insert_auth" on public.marca_paleta';
    execute 'create policy "marca_paleta_insert_auth" on public.marca_paleta for insert to authenticated with check (true)';
    execute 'drop policy if exists "marca_paleta_update_auth" on public.marca_paleta';
    execute 'create policy "marca_paleta_update_auth" on public.marca_paleta for update to authenticated using (true) with check (true)';
    execute 'drop policy if exists "marca_paleta_delete_auth" on public.marca_paleta';
    execute 'create policy "marca_paleta_delete_auth" on public.marca_paleta for delete to authenticated using (true)';
  end if;

  if to_regclass('public.marca_reglas') is not null then
    execute 'drop policy if exists "marca_reglas_select_auth" on public.marca_reglas';
    execute 'create policy "marca_reglas_select_auth" on public.marca_reglas for select to authenticated using (true)';
    execute 'drop policy if exists "marca_reglas_insert_auth" on public.marca_reglas';
    execute 'create policy "marca_reglas_insert_auth" on public.marca_reglas for insert to authenticated with check (true)';
    execute 'drop policy if exists "marca_reglas_update_auth" on public.marca_reglas';
    execute 'create policy "marca_reglas_update_auth" on public.marca_reglas for update to authenticated using (true) with check (true)';
    execute 'drop policy if exists "marca_reglas_delete_auth" on public.marca_reglas';
    execute 'create policy "marca_reglas_delete_auth" on public.marca_reglas for delete to authenticated using (true)';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Storage
--
-- El bucket «piezas» es público, así que sus objetos se leen sin política, y las
-- imágenes generadas las sube n8n con service_role (salta RLS).
--
-- Esta política añade lo único que falta: que el equipo autenticado pueda subir
-- desde la app el material de referencia (la «foto base» del estudio), que se
-- guarda bajo el prefijo `material/`.
-- ---------------------------------------------------------------------------

drop policy if exists "piezas_bucket_insert_auth" on storage.objects;
create policy "piezas_bucket_insert_auth" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'piezas');

drop policy if exists "piezas_bucket_select_auth" on storage.objects;
create policy "piezas_bucket_select_auth" on storage.objects
  for select to authenticated
  using (bucket_id = 'piezas');

-- Antes de producción conviene pasar el bucket a privado y servir las imágenes
-- con URLs firmadas; las dos políticas de arriba ya cubren ese escenario.
