-- ---------------------------------------------------------------------------
-- 01 · Carpetas
--
-- El planificador de cada centro se organiza en carpetas (mensuales o de
-- campaña). El esquema actual cuelga `piezas` directamente de `centros`, así que
-- esta migración añade el nivel intermedio.
--
-- El tipo de `carpetas.centro_id` se deriva en tiempo de ejecución del tipo real
-- de `centros.id`, para no asumir bigint ni uuid.
--
-- Ejecutar en: Supabase → SQL Editor. Es idempotente.
-- ---------------------------------------------------------------------------

create table if not exists public.carpetas (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  nombre      text not null
);

do $$
declare
  tipo_centro text;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'carpetas' and column_name = 'centro_id'
  ) then
    select format_type(a.atttypid, a.atttypmod)
      into tipo_centro
      from pg_attribute a
     where a.attrelid = 'public.centros'::regclass
       and a.attname  = 'id'
       and a.attnum   > 0;

    execute format(
      'alter table public.carpetas
         add column centro_id %s not null
         references public.centros(id) on delete cascade',
      tipo_centro
    );
  end if;
end $$;

alter table public.piezas
  add column if not exists carpeta_id bigint
  references public.carpetas(id) on delete set null;

create index if not exists carpetas_centro_id_idx on public.carpetas (centro_id);
create index if not exists piezas_carpeta_id_idx  on public.piezas   (carpeta_id);
create index if not exists piezas_centro_id_idx   on public.piezas   (centro_id);
create index if not exists piezas_fecha_pub_idx   on public.piezas   (fecha_publicacion);

alter table public.carpetas enable row level security;
