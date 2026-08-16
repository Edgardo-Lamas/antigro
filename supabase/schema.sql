-- ================================================================
--  AntiGro — Esquema Supabase
--  Pegar en: Supabase → SQL Editor → New query → Run
--
--  🔴 De las conversaciones DEL CHICO no se guarda una sola palabra, y no se
--  va a guardar: eso es la regla 2 y es la línea que separa esto de un espía.
--  Lo que se guarda es quién es cada uno, por dónde se le escribe, qué
--  señales llegaron y qué dijo el sistema.
--
--  ⚠ Una sola tabla guarda texto de una charla, la 11 (`charlas`), y es la de
--  un ADULTO preguntándole al asistente. Está explicada ahí abajo. Si algún
--  día aparece una segunda tabla con texto, tiene que justificarse igual.
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
  -- 🔴 Vacío hasta que la persona aprieta "Iniciar" en el bot: el chat_id de
  -- Telegram no se puede cargar a mano, sólo lo entrega Telegram al vincular.
  canal_destino text,
  codigo_vinculacion text unique,
  vinculado_en  timestamptz,
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
  canal_destino        text,
  codigo_vinculacion   text unique,
  vinculado_en         timestamptz,
  created_at           timestamptz default now()
);

create index if not exists adultos_familia_idx on adultos (familia_id);
create index if not exists adultos_codigo_idx  on adultos (codigo_vinculacion);
create index if not exists chicos_codigo_idx   on chicos (codigo_vinculacion);

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


-- ─── 8. EL CUPO DE LA DEMO ───────────────────────────────────────
--  🔴 Esto NO estaba en la base y por eso el QR no funcionaba en producción.
--  El cupo vivía en `globalThis`, y en Vercel cada ruta de API es una función
--  distinta con su propia memoria: el webhook conectaba a alguien en SU
--  memoria y la consola seguía mostrando 0 de 3. En local anda porque es un
--  solo proceso. Es la misma trampa que ya nos habíamos comido con el
--  repositorio en memoria, repetida acá.
--
--  🔑 El índice único sobre `rol` ES el cupo. Como hay exactamente tres roles,
--  la base sola garantiza que no haya dos personas en el mismo lugar aunque
--  dos escaneen el QR en el mismo segundo. Contando filas en la aplicación
--  eso era una carrera; acá no puede pasar.

create table if not exists cupo_demo (
  chat_id text primary key,
  rol     text not null check (rol in ('madre', 'tia', 'chico')),
  nombre  text not null,
  -- Última señal de vida. Un cupo tomado para siempre es un cupo perdido:
  -- se vence solo a la media hora.
  visto   timestamptz not null default now()
);

create unique index if not exists cupo_demo_rol_idx on cupo_demo (rol);

alter table cupo_demo enable row level security;


-- ─── 9. CUENTAS DE LOS ADULTOS RESPONSABLES ──────────────────────
--  Decidido con Edgardo el 16/8: entran con usuario y contraseña **los dos
--  adultos responsables**, cada uno con la suya. El chico y cualquier otro
--  referente NO tienen cuenta: escanean el QR y reciben por su canal.
--
--  🔑 Las credenciales viven en UN solo lugar (`usuarios`) y el `rol` dice
--  si es el panel de administración o el de una familia. Así NextAuth lee
--  una sola tabla, y un adulto puede existir sin cuenta —la tía que sólo
--  quiere el aviso por Telegram— sin ninguna fila fantasma.

alter table usuarios drop constraint if exists usuarios_rol_check;
alter table usuarios add constraint usuarios_rol_check
  check (rol in ('admin', 'adulto'));

alter table usuarios add column if not exists adulto_id uuid
  references adultos(id) on delete cascade;

-- Una cuenta por adulto, y ninguna cuenta de adulto sin adulto detrás.
create unique index if not exists usuarios_adulto_idx on usuarios (adulto_id);

alter table usuarios drop constraint if exists usuarios_adulto_coherente;
alter table usuarios add constraint usuarios_adulto_coherente check (
  (rol = 'admin'  and adulto_id is null) or
  (rol = 'adulto' and adulto_id is not null)
);


-- ─── 10. LA BAJA Y EL CAMBIO DE UN ADULTO ────────────────────────
--  🔴 El cambio NO lleva ninguna traba, y lo marcó Edgardo el 16/8: el
--  referente se muda, fallece, pierde el teléfono, o el chico simplemente lo
--  quiere cambiar. Ninguna de esas es una excepción rara: es la vida normal
--  de una familia. Un sistema que dificulta el reemplazo termina con un
--  referente que ya no existe, que es peor que no tener ninguno.
--
--  🔴 La baja es blanda, no un `delete`. Dos motivos: las observaciones que
--  ese adulto cargó son entrada del motor y borrarlas cambiaría lecturas ya
--  hechas; y el sistema tiene que poder decir después que esa persona estuvo.

alter table adultos add column if not exists activo boolean not null default true;
alter table adultos add column if not exists baja_en timestamptz;

--  El motivo no es burocracia: «lo quiere cambiar el chico» y «perdió el
--  teléfono» son dos hechos distintos, y el primero puede importar —un cambio
--  de referente justo después de un aviso es algo que los adultos tienen que
--  poder ver.
alter table adultos add column if not exists baja_motivo text
  check (baja_motivo is null or baja_motivo in
    ('se_mudo', 'fallecio', 'perdio_el_telefono', 'lo_cambio_el_chico', 'otro'));

create index if not exists adultos_activo_idx on adultos (familia_id, activo);

-- ─── 11. LA CHARLA DEL ADULTO CON EL ASISTENTE ───────────────────
--  🔴 **Esta tabla SÍ guarda texto de una conversación, y hay que leer por
--  qué antes de mirarla con desconfianza.** Lo que el sistema nunca lee ni
--  guarda es lo que escribió EL CHICO — esa es la regla 2 y sigue intacta.
--  Acá vive otra cosa: lo que un adulto responsable le preguntó al asistente
--  sobre el informe que ya tiene delante, y lo que el asistente le contestó.
--  El chico no escribe acá y no aparece nombrado más que como lo nombra su
--  propio padre.
--
--  🔑 Por qué se guarda. El padre pregunta a las dos de la mañana, cierra el
--  navegador, y vuelve al otro día. Sin esta tabla vuelve a empezar de cero
--  la conversación más difícil que va a tener, y el asistente no se acuerda
--  de nada de lo que ya le dijo. Perder el hilo justo ahí no es una molestia:
--  es el momento exacto en que el sistema deja de acompañar.
--
--  ⚠ Es de cada ADULTO, no de la familia. El informe lo ven los dos; esto no.
--  Una madre puede preguntarle al asistente algo que todavía no habló con el
--  padre, y eso no tiene por qué aparecerle a nadie más.
--
--  🔑 Y se borra entero de un toque, con un `delete` de verdad. Las señales y
--  las observaciones no se pueden borrar porque de ahí sale la lectura; esto
--  no entra a ningún cálculo, es del adulto, y se va cuando él quiere.

create table if not exists charlas (
  id         uuid primary key default gen_random_uuid(),
  familia_id uuid not null references familias(id) on delete cascade,
  adulto_id  uuid not null references adultos(id)  on delete cascade,
  fecha      timestamptz not null default now(),
  quien      text not null check (quien in ('adulto', 'asistente')),
  texto      text not null,
  -- Sólo en los turnos del asistente: si lo escribió el modelo o si salió el
  -- respaldo. Que quede guardado es lo que permite mirar después cuántas
  -- veces el control frenó de más.
  origen     text check (origen is null or origen in ('ia', 'respaldo')),
  -- 🔴 Y si salió el respaldo, por qué. Que el control frene una respuesta es
  -- la promesa cumpliéndose; que se caiga la llamada es el sistema caído. Sin
  -- esta columna, al recargar el panel las dos se ven iguales y el sistema se
  -- cuelga un mérito que no tuvo.
  causa      text check (causa is null or causa in ('control', 'falla')),
  created_at timestamptz default now()
);

create index if not exists charlas_adulto_fecha_idx on charlas (adulto_id, fecha);

alter table charlas enable row level security;


-- Ninguna tabla tiene políticas para anon: todo pasa por el servidor con
-- service role, y el token de familia se valida ahí.
