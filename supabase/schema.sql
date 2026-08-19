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


-- ─── 11. LÍMITE DE FRECUENCIA (auditoría del 17/8) ───────────────
--  🔴 **Por qué existe.** Cada respuesta del asistente y cada texto que se
--  redacta son una llamada a Opus 5, y hasta el 17/8 no había NINGÚN límite en
--  todo el sistema. La auditoría encontró tres rutas abiertas que llamaban al
--  modelo sin pedir sesión; dos se cerraron y una —la de la demo— tiene que
--  seguir siendo pública, porque el botón está en la home y es el producto.
--
--  🔑 **Y vive en la base por la misma razón que el cupo.** Un contador en
--  memoria no sirve: en Vercel cada ruta de API es una función distinta con su
--  propia memoria, así que cada instancia tendría su propio conteo y el límite
--  sería el límite por instancia, que no es ningún límite. Es la tercera vez
--  que aparece la misma trampa en este proyecto.
--
--  🔑 **El conteo es atómico.** La cuenta sube dentro del mismo `insert … on
--  conflict`, no con un leer-y-después-escribir: si dos pedidos entran en el
--  mismo milisegundo, los dos se cuentan. Leer y escribir por separado es una
--  carrera, y una carrera en un límite de gasto es un límite que no limita.

create table if not exists frecuencia (
  -- Qué se está limitando y a quién: 'demo:<ip>', 'asistente:<adulto_id>'.
  clave   text primary key,
  -- Cuándo empezó la ventana en curso.
  ventana timestamptz not null default now(),
  cuenta  int not null default 0
);

alter table frecuencia enable row level security;

-- Devuelve si el pedido pasa, cuántos quedan y en cuántos segundos se libera.
create or replace function tomar_turno(
  p_clave       text,
  p_ventana_seg int,
  p_tope        int
)
returns table (permitido boolean, restantes int, espera_seg int)
language plpgsql
as $$
declare
  v_ahora   timestamptz := now();
  v_inicio  timestamptz;
  v_cuenta  int;
begin
  insert into frecuencia (clave, ventana, cuenta)
  values (p_clave, v_ahora, 1)
  on conflict (clave) do update
    set
      -- Si la ventana anterior ya venció, esta empieza de cero.
      ventana = case
        when frecuencia.ventana < v_ahora - make_interval(secs => p_ventana_seg)
        then v_ahora else frecuencia.ventana end,
      cuenta = case
        when frecuencia.ventana < v_ahora - make_interval(secs => p_ventana_seg)
        then 1 else frecuencia.cuenta + 1 end
  returning frecuencia.ventana, frecuencia.cuenta into v_inicio, v_cuenta;

  return query select
    v_cuenta <= p_tope,
    greatest(p_tope - v_cuenta, 0),
    greatest(
      0,
      ceil(extract(epoch from (v_inicio + make_interval(secs => p_ventana_seg)) - v_ahora))::int
    );
end;
$$;

-- Higiene: las claves que ya no se van a volver a mirar no tienen por qué
-- quedar. No hace falta cron — se limpia solo cuando alguien pasa por acá.
create index if not exists frecuencia_ventana_idx on frecuencia (ventana);


-- ═════════════════════════════════════════════════════════════════
--  12. EL HOGAR — rediseño del 17/8, y deja atrás varias cosas del 16
-- ═════════════════════════════════════════════════════════════════
--
--  Lo trajo Edgardo entero y corrige tres supuestos que estaban mal:
--
--  🔴 **No hay privacidad entre padres.** Textual: *"es el hijo, los dos son
--  igual de responsables, los dos van a querer saber cómo está. Es una locura
--  pensar privacidad entre padres."* Lo privado es frente al REFERENTE, nunca
--  entre los progenitores. El 16/8 se había construido al revés: la charla con
--  el asistente era de cada adulto. Se da vuelta.
--
--  🔴 **Una clave por hogar, no una por persona.** *"En la práctica los padres
--  no van a aceptar tener cada uno una clave diferente, es decirles que cada uno
--  se maneja por separado."* Y hay una razón más dura que la fricción: una clave
--  que los dos conocen no protege nada, así que sostener que la charla es
--  privada sería prometer algo que el sistema no puede cumplir.
--
--  🔴 **El referente NO entra al panel.** Sabe que es parte del sistema y recibe
--  los avisos, pero el panel es de los progenitores.
--
--  🔑 **Padres separados: UN panel con acceso desde cada casa.** *"No puede
--  haber dos panel, uno en cada casa."* Los dos ven lo mismo —mismas alertas,
--  mismo informe, misma charla—; lo único que hay dos es la puerta, para que
--  ninguno pueda dejar al otro afuera cambiando la clave.
--
--  🔴 **Nada es obligatorio.** *"Tampoco podemos exigir padres y referentes,
--  siempre sugerimos."* El mínimo de dos adultos deja de ser una exigencia. Y
--  eso arregla de paso un cartel imposible: a un chico de 8 el referente lo
--  eligen los padres, así que la marca «lo eligió el chico» va en `false` y la
--  familia veía un faltante que no podía resolver nunca.
--
--  📌 *"No podemos pensar que solo existe un solo escenario: dos padres y un
--  referente."*


-- ── 12.1 · El adulto tiene ROL, y el rol dice si entra al panel ──
--
--  Hasta el 17/8 sólo existía `vinculo` (madre, tía, abuelo…), que describe el
--  parentesco pero no dice nada del acceso. Son dos preguntas distintas: una
--  abuela puede ser la tutora, y un padre puede ser el referente que eligió el
--  chico. El acceso no se deduce del parentesco.

alter table adultos add column if not exists rol text not null default 'progenitor'
  check (rol in ('progenitor', 'referente'));

--  Backfill: madre y padre son progenitores; el resto, referentes. Es sólo el
--  punto de partida de las familias que ya existían — de acá en adelante lo
--  elige el alta.
update adultos set rol = case
  when vinculo in ('madre', 'padre') then 'progenitor'
  else 'referente'
end
where rol = 'progenitor' and vinculo not in ('madre', 'padre');

create index if not exists adultos_rol_idx on adultos (familia_id, rol, activo);


-- ── 12.2 · La credencial es del HOGAR, no de la persona ──
--
--  Antes cada adulto tenía su cuenta (`usuarios.adulto_id`). Ahora la cuenta es
--  de la casa: `familia_id` + `hogar`. Un matrimonio es una fila; padres
--  separados son dos filas de la MISMA familia, con distinto `hogar`.
--
--  🔑 `hogar` en null significa que hay una sola casa. No es un dato faltante:
--  es el caso normal, y no hay que hacerle escribir «mi casa» a nadie.

alter table usuarios add column if not exists familia_id uuid
  references familias(id) on delete cascade;

alter table usuarios add column if not exists hogar text;

--  Se traslada lo que ya había: la familia sale del adulto al que colgaba.
update usuarios u
   set familia_id = a.familia_id
  from adultos a
 where u.adulto_id = a.id
   and u.familia_id is null;

--  🔴 **El referente pierde la cuenta, y no es un daño colateral: es el cambio.**
--  El panel es de los progenitores. Quien quedó como referente sigue en el
--  sistema —recibe los avisos, sabe que está— pero no entra. En la familia
--  sembrada esto se lleva puesta la cuenta de Carla, que es la tía.
delete from usuarios u
 using adultos a
 where u.adulto_id = a.id
   and a.rol = 'referente';

--  ⚠ Y si todavía quedan dos credenciales en la misma casa, se deja una: la
--  primera. Es lo que la migración se encontró al correr por primera vez, y
--  frenó entera antes de tocar nada. Dos cuentas en un hogar ya no existen
--  —*"sería en todo caso una cuenta y dos administradores"*—, así que
--  consolidarlas ES la migración, no un efecto secundario.
delete from usuarios u
 where u.rol = 'adulto'
   and exists (
     select 1 from usuarios otro
      where otro.rol = 'adulto'
        and otro.familia_id = u.familia_id
        and coalesce(otro.hogar, '') = coalesce(u.hogar, '')
        and (otro.created_at, otro.id) < (u.created_at, u.id)
   );

--  Y se sueltan las reglas viejas antes de borrar la columna.
drop index if exists usuarios_adulto_idx;
alter table usuarios drop constraint if exists usuarios_adulto_coherente;
alter table usuarios drop column if exists adulto_id;

--  La regla nueva: una cuenta de familia sin familia no significa nada, y una
--  de administración no pertenece a ninguna.
alter table usuarios drop constraint if exists usuarios_familia_coherente;
alter table usuarios add constraint usuarios_familia_coherente check (
  (rol = 'admin'  and familia_id is null) or
  (rol = 'adulto' and familia_id is not null)
);

--  Una sola puerta por casa. Dos filas de la misma familia sólo si son dos
--  hogares distintos, que es exactamente el caso de los padres separados.
create unique index if not exists usuarios_hogar_idx
  on usuarios (familia_id, coalesce(hogar, ''));

create index if not exists usuarios_familia_idx on usuarios (familia_id);


-- ── 12.3 · La charla es de la familia, no de cada adulto ──
--
--  🔴 Es lo que se da vuelta del 16/8. El comentario de la sección 11 decía
--  «Es de cada ADULTO, no de la familia. El informe lo ven los dos; esto no.»
--  **Eso quedó sin efecto.** Entre padres no hay nada separado.

alter table charlas alter column adulto_id drop not null;

create index if not exists charlas_familia_fecha_idx on charlas (familia_id, fecha);


-- ── 12.4 · El perfil de NextDNS es del CHICO, no de la casa ──
--
--  🔑 Sale de la otra mitad de la conversación del 17/8: si el chico vive una
--  quincena en cada casa, un filtro instalado en el router deja de verlo en
--  cuanto cruza la puerta. Por eso en Red Familiar se eligió NextDNS sobre
--  Pi-hole y el filtro va en el DISPOSITIVO del chico —perfil de iOS, DNS
--  privado en Android—: viaja con él, y encima sigue viéndolo en datos móviles,
--  que es donde vive la señal de madrugada.
--
--  ➡ Si el filtro es del aparato del chico, el perfil es del chico. Estaba
--  colgado de la familia, y así dos hermanos compartían perfil: sus señales se
--  mezclaban en una sola lectura.

alter table chicos add column if not exists nextdns_profile_id text;

--  Lo que hubiera cargado a nivel familia se baja al chico, pero sólo si hay
--  uno solo: con dos hermanos no hay forma de saber de quién era.
update chicos c
   set nextdns_profile_id = f.nextdns_profile_id
  from familias f
 where c.familia_id = f.id
   and f.nextdns_profile_id is not null
   and c.nextdns_profile_id is null
   and (select count(*) from chicos h where h.familia_id = f.id) = 1;

--  La de `familias` queda, vacía y sin uso, para no perder nada en la mudanza.
comment on column familias.nextdns_profile_id is
  'EN DESUSO desde el 17/8: el perfil pasó a chicos.nextdns_profile_id, porque el filtro va en el dispositivo del chico y no en el router de la casa.';


-- ═════════════════════════════════════════════════════════════════
--  13. EL RECORRIDO DE ALTA — 17/8
-- ═════════════════════════════════════════════════════════════════
--
--  Edgardo describió la secuencia completa del producto: *"accede al enlace,
--  elige la suscripción, paga la suscripción y luego el sistema lo lleva en un
--  recorrido de pantallas para cargar los datos"*. Y para el CoderCup, lo mismo
--  sin el pago: *"abre el enlace, llega al panel de logueo, crea credenciales, y
--  accede al mismo recorrido pero sin pagar. Ve el simulador y luego la carga de
--  datos"*.
--
--  🔴 Eso cierra el agujero que dejó al descubierto la auditoría: hasta hoy el
--  alta creaba familia, chicos y adultos y NINGUNA cuenta, así que una familia
--  dada de alta quedaba afuera de su propio panel. Las de la familia sembrada se
--  habían hecho a mano.


-- ── 13.1 · El turno escolar del chico ──
--
--  🔴 **No es una pregunta más: repara algo que el sistema afirmaba sin saberlo.**
--  El 16/8 el asistente decía que la madrugada «desordena el descanso» del chico,
--  y Edgardo lo volteó — el sistema no sabe a qué hora se levanta ese chico.
--
--  🔑 **Corre la HORA de referencia, no toca ningún peso.** Es el mismo mecanismo
--  que ya usa la edad (`horaDeReferencia` en `pesos.ts`), y por eso se enchufa
--  sin tocar el motor: mañana adelanta una hora, tarde y noche la atrasan una,
--  «no va al colegio» no mueve nada. Topado entre las 21 y las 02.
--
--  ⚠ Es criterio de producto, NO un dato. A diferencia del corrimiento de fase de
--  la adolescencia —que tiene fuente clínica citada en `pesos.ts`—, acá no hay
--  estudio que diga cuánto corre un turno tarde, y no se cita como si lo hubiera.
--
--  📌 Nullable a propósito: las familias de antes del recorrido no lo tienen, y
--  sin el dato el motor hace exactamente lo que hacía antes. Un dato que falta no
--  puede cambiar una lectura ya hecha.

alter table chicos add column if not exists turno_escolar text
  check (turno_escolar in ('manana', 'tarde', 'doble', 'noche', 'no_va'));


-- ── 13.2 · La cuenta del hogar la crea el recorrido, no la mano ──
--
--  No hay columna nueva: la 12.2 ya dejó `usuarios.familia_id` + `usuarios.hogar`
--  y el índice único `usuarios_hogar_idx` (una puerta por casa). Lo que cambia es
--  QUIÉN escribe esa fila — ahora el alta, y ya no un insert a mano.
--
--  🔴 Y por eso este comentario existe: el índice único dejó de ser una red y
--  pasó a ser la regla que corre en caliente cada vez que alguien se registra.
--  `crearHogar` pregunta antes para poder decir cuál de las dos cosas pasó, pero
--  el que decide es el índice: dos altas simultáneas de la misma casa las corta
--  Postgres, no la aplicación.

comment on index usuarios_hogar_idx is
  'Una puerta por casa. Lo aplica el recorrido de alta (crearHogar): si dos altas de la misma casa entran a la vez, la que pierde recibe 23505 y se le contesta hogar_ocupado.';


-- ─── 14. LA ACEPTACIÓN DE LOS TÉRMINOS ───────────────────────────
--  🔴 Se guarda la VERSIÓN, no un booleano, y el motivo es todo el punto:
--  «aceptó» no dice QUÉ aceptó. Si el texto de los términos cambia en
--  septiembre, un `true` de agosto no prueba nada. Con la versión y la fecha
--  se puede reconstruir exactamente qué documento tenía delante.
--
--  🔑 Van en `usuarios` y no en una tabla aparte porque la unidad que acepta es
--  la CREDENCIAL DEL HOGAR: cada casa acepta cuando se crea su puerta, y la
--  segunda casa de padres separados acepta la suya. Una tabla de aceptaciones
--  tendría exactamente una fila por usuario.
--
--  ⚠ Nullable, y no puede ser de otra manera: las cuentas que ya existían —la
--  de administración, la familia sembrada— nacieron antes de que hubiera
--  términos. Marcarlas como que aceptaron sería inventar un consentimiento.
--  Vacío significa «no consta», que es la verdad.

alter table usuarios add column if not exists terminos_version text;
alter table usuarios add column if not exists terminos_en timestamptz;

comment on column usuarios.terminos_version is
  'Qué versión de los términos aceptó esta casa al crearse. Vacío = la cuenta es anterior a que existieran, no que se haya salteado la aceptación.';


-- ─── 15. LA FIRMA DEL CUESTIONARIO ───────────────────────────────
--  🔴 Es la distinción que pidió Edgardo el 18/8 y que hace honesta a la
--  firma: **desde qué casa se contestó es un HECHO** —la credencial es del
--  hogar y el sistema la comprobó al abrir la sesión— mientras que **quién de
--  las personas contestó es una DECLARACIÓN** de quien estaba delante de la
--  pantalla. `adulto_id` ya guardaba lo segundo; faltaba lo primero.
--
--  🔑 Y desde el 18/8 la firma SE MUESTRA en el panel, así que las dos tienen
--  que estar: enseñar una declaración con cara de hecho sería exactamente lo
--  que este producto no puede hacer.
--
--  ⚠ Nullable, y significa dos cosas distintas que conviene no confundir:
--  en una familia de una sola casa `hogar` es null porque **no hay dos casas**
--  (es el caso normal, igual que en `usuarios`); y en las observaciones
--  anteriores al 18/8 es null porque **no se registraba**. Las segundas no
--  existen en producción: nunca hubo pantalla para cargar una.

alter table observaciones add column if not exists hogar text;

comment on column observaciones.hogar is
  'Desde qué casa se contestó. Es un HECHO: sale de la sesión, no del formulario. Se lee junto a adulto_id, que es una DECLARACION de quien contestó. Null = casa única, no dato faltante.';
