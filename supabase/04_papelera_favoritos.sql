-- 04_papelera_favoritos.sql
-- Añade a las piezas dos marcas: papelera (borrado recuperable) y favorito
-- (destacado persistente). Idempotente: se puede ejecutar sin miedo aunque
-- las columnas ya existan.

alter table public.piezas
  add column if not exists descartada boolean not null default false;

alter table public.piezas
  add column if not exists favorita boolean not null default false;

create index if not exists piezas_descartada_idx on public.piezas (descartada);
create index if not exists piezas_favorita_idx   on public.piezas (favorita);
