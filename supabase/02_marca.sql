-- ---------------------------------------------------------------------------
-- 02 · Marca Ribera (opcional)
--
-- La pantalla «Marca Ribera» permite añadir y quitar colores y reglas de
-- cumplimiento. Sin estas tablas la pantalla funciona igual pero en modo
-- lectura, con los valores del brandbook como respaldo.
--
-- Las 7 líneas de comunicación NO se duplican aquí: se leen de `public.lineas`.
--
-- Ejecutar en: Supabase → SQL Editor. Es idempotente.
-- ---------------------------------------------------------------------------

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

alter table public.marca_paleta enable row level security;
alter table public.marca_reglas enable row level security;

-- Semilla: paleta del brandbook de Ribera (Brandbook2020_Ribera_v1_7.pdf).
insert into public.marca_paleta (hex, nombre, orden)
select v.hex, v.nombre, v.orden
from (values
  ('#D71029', 'Rojo',           1),
  ('#1D1D1B', 'Negro',          2),
  ('#706F6F', 'Gris oscuro',    3),
  ('#DEDEDE', 'Gris claro',     4),
  ('#FDE8DE', 'Naranja claro',  5),
  ('#FAFAFA', 'Blanco',         6)
) as v(hex, nombre, orden)
where not exists (select 1 from public.marca_paleta);

-- Semilla: reglas de cumplimiento obligatorias en todos los centros.
insert into public.marca_reglas (texto, orden)
select v.texto, v.orden
from (values
  ('Nunca prometer resultados clínicos, curas o porcentajes de éxito no verificados.', 1),
  ('Fotos de pacientes solo con consentimiento firmado, representados siempre con dignidad y respeto, evitando el dramatismo y la victimización.', 2),
  ('Evitar aspecto de banco de imágenes: fotos propias, fondos planos, colores suaves, sin colores estridentes.', 3),
  ('Todo contenido debe respetar el territorio Salud Responsable: ética, transformación, cuidado y compromiso.', 4)
) as v(texto, orden)
where not exists (select 1 from public.marca_reglas);
