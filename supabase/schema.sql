-- ================================================================
--  AntiGro — Esquema Supabase
--  Pegar en: Supabase → SQL Editor → New query → Run
--
--  🔴 Acá no hay ninguna columna de contenido de conversaciones, y no la va
--  a haber. Lo que se guarda es quién es cada uno, por dónde se le escribe,
--  qué señales llegaron y qué dijo el sistema.
-- ================================================================


-- ─── 1. USUARIOS (acceso al panel) ───────────────────────────────

create table if not exists usuarios (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  nombre        text not null,
  rol           text not null default 'admin' check (rol in ('admin')),
  activo        boolean not null default true,
  created_at    timestamptz default now()
);

alter table usuarios enable row level security;
-- Sin políticas para anon: nadie lee usuarios desde el browser.

-- Para generar el hash:
--   node -e "const b=require('bcryptjs'); b.hash('TU_CLAVE',12).then(console.log)"


-- ─── 2. FAMILIAS ─────────────────────────────────────────────────
--  El token es el enlace privado por el que los adultos entran SIN CUENTA.

create table if not exists familias (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  token       text not null unique,
  activo      boolean not null default true,
  -- Se completa el día que haya una cuenta de NextDNS. Hasta entonces, la
  -- fuente de señales es el simulador y esta columna queda vacía.
  nextdns_profile_id text,
  notas       text,
  created_at  timestamptz default now()
);

create index if not exists familias_token_idx  on familias (token);
create index if not exists familias_activo_idx on familias (activo);

alter table familias enable row level security;


-- ─── 3. CHICOS ───────────────────────────────────────────────────
--  🔴 `edad` y `genero` son datos del motor, no adornos: cambian el peso de
--  las señales y cambian el texto del mensaje.
--  El canal del chico va acá, separado del de los adultos.

create table if not exists chicos (
  id            uuid primary key default gen_random_uuid(),
  familia_id    uuid not null references familias(id) on delete cascade,
  nombre        text not null,
  edad          smallint not null check (edad between 7 and 17),
  genero        text not null check (genero in ('nena', 'varon', 'otro')),
  canal_tipo    text not null check (canal_tipo in ('telegram', 'correo', 'whatsapp')),
  canal_destino text not null,
  activo        boolean not null default true,
  created_at    timestamptz default now()
);

create index if not exists chicos_familia_idx on chicos (familia_id);

alter table chicos enable row level security;


-- ─── 4. ADULTOS RESPONSABLES ─────────────────────────────────────
--  🔴 Mínimo dos, y uno de los dos lo elige el chico: el 43% no habla de
--  estos temas con sus padres. El mínimo se valida en el alta (la base sola
--  no puede exigirlo sin un trigger, y un trigger acá sería de más).

create table if not exists adultos (
  id                   uuid primary key default gen_random_uuid(),
  familia_id           uuid not null references familias(id) on delete cascade,
  nombre               text not null,
  vinculo              text not null
                       check (vinculo in ('madre','padre','tia_tio','hermano_a','abuelo_a','otro')),
  elegido_por_el_chico boolean not null default false,
  canal_tipo           text not null check (canal_tipo in ('telegram', 'correo', 'whatsapp')),
  canal_destino        text not null,
  created_at           timestamptz default now()
);

create index if not exists adultos_familia_idx on adultos (familia_id);

alter table adultos enable row level security;


-- ─── 5. SEÑALES ──────────────────────────────────────────────────
--  El registro fechado. Sin fecha no se puede medir persistencia, y la
--  persistencia es la regla que define cuándo el sistema habla.
--
--  ⚠ `contexto` guarda metadatos: franja horaria, categoría, cantidad.
--  NUNCA texto de conversaciones. La aplicación lo valida antes de escribir.

create table if not exists senales (
  id          text primary key,
  chico_id    uuid not null references chicos(id) on delete cascade,
  fecha       timestamptz not null,
  tipo        text not null
              check (tipo in ('volumen', 'madrugada', 'plataforma_nueva', 'evasion')),
  intensidad  real not null check (intensidad between 0 and 1),
  contexto    jsonb not null default '{}'::jsonb,
  fuente      text not null check (fuente in ('simulador', 'nextdns')),
  created_at  timestamptz default now()
);

create index if not exists senales_chico_fecha_idx on senales (chico_id, fecha desc);

alter table senales enable row level security;


-- ─── 6. RESPUESTAS ───────────────────────────────────────────────
--  Lo que el sistema dijo, a quién, y con qué señales lo sostiene.
--  Una alerta sin respaldo es una afirmación, y el sistema no afirma.

create table if not exists respuestas (
  id                       uuid primary key default gen_random_uuid(),
  chico_id                 uuid not null references chicos(id) on delete cascade,
  fecha                    timestamptz not null,
  clase                    text not null
                           check (clase in ('alerta_adultos', 'orientacion_chico')),
  canal                    text not null
                           check (canal in ('telegram', 'correo', 'whatsapp')),
  destino                  text not null,
  texto                    text not null,
  senales_que_la_sostienen text[] not null default '{}',
  entregado                boolean not null default false,
  created_at               timestamptz default now()
);

create index if not exists respuestas_chico_fecha_idx on respuestas (chico_id, fecha desc);

alter table respuestas enable row level security;


-- ─── 7. OBSERVACIONES DE LOS ADULTOS ─────────────────────────────
--  La segunda entrada: lo que ven los adultos. Las preguntas del
--  cuestionario se escriben en la fase 2; acá viven las respuestas.

create table if not exists observaciones (
  id          uuid primary key default gen_random_uuid(),
  chico_id    uuid not null references chicos(id) on delete cascade,
  adulto_id   uuid not null references adultos(id) on delete cascade,
  fecha       timestamptz not null,
  -- id del indicador → 0 (nunca) a 3 (seguido)
  respuestas  jsonb not null default '{}'::jsonb,
  created_at  timestamptz default now()
);

create index if not exists observaciones_chico_fecha_idx on observaciones (chico_id, fecha desc);

alter table observaciones enable row level security;

-- Ninguna tabla tiene políticas para anon: todo pasa por el servidor con
-- service role, y el token de familia se valida ahí.
