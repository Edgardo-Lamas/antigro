-- ================================================================
--  AntiGro — Esquema Supabase
--  Pegar en: Supabase → SQL Editor → New query → Run
--
--  📌 Fase 0: sólo lo que sostiene el acceso — cuentas del panel y
--  familias con su enlace privado. El modelo completo (chicos con edad y
--  género, dos adultos responsables con su canal, y el registro fechado de
--  señales y respuestas) entra en la fase 1.
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
-- Sólo service role. El token se valida en el servidor, nunca desde el browser.
