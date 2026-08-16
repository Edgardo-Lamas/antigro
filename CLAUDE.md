# AntiGro — Guía del proyecto

Sistema que **percibe** señales de que un chico puede estar siendo acosado en internet, sin leer
un solo mensaje suyo. Cruza lo que ve la red, lo que observan los adultos, y lo que dicen las
estadísticas oficiales sobre qué pesa cuánto.

**Entrega: domingo 2026-08-23, 23:59 hora Argentina** (CoderCup AI de Coderhouse).
**El código se congela el jueves 20** — después hay que grabar y editar el video de 2 minutos.

---

## 🔥 PARA ARRANCAR LA PRÓXIMA SESIÓN (cierre del 2026-08-16)

**Todo lo de abajo está en producción y verificado.** `antigro.vercel.app` sirve el último
deploy; el pie de la home dice el commit, así que se comprueba de un vistazo qué se está mirando.

### Lo que quedó andando hoy

| | |
|---|---|
| **Supabase** | Provisionado **por el Marketplace de Vercel** (`supabase-beige-flower`), esquema aplicado, producción usándolo |
| **El cupo del QR** | Arreglado y **verificado con un teléfono real**: QR → Iniciar → cupo 1/3 → aviso entregado |
| **El panel de la familia** | `/entrar` + `/mi-familia`: informe del motor, quiénes están, QR por referente, baja con motivo |
| **El asistente** | Escrito y probado contra *"decime que no es nada"* — no tranquiliza |
| **El bot** | Ya se llama **AntiGro** (tenía una pe de más) |

### ⬜ Lo que sigue, en este orden

1. **El asistente, segunda vuelta** — es lo que él pidió seguir al cerrar:
   - 🔴 **La conversación no se guarda.** Se recarga el panel y se perdió. Para un padre que
     pregunta a las 2 de la mañana y vuelve al día siguiente, eso es perder el hilo de una
     conversación difícil. Es lo primero.
   - ⏱ **La espera.** El modelo tarda ~13 s medidos. **No se transmite mientras escribe a
     propósito** (ver más abajo): el costo de esa decisión es que el padre mira "Pensando…" un
     rato. Se puede mejorar lo que se muestra mientras espera, no la espera.
   - 📌 El asistente no ve el cuestionario más que resumido dentro de la lectura.
2. **El alta desde el panel.** Hoy una familia entra por API.
3. **El cuestionario del adulto.** Las preguntas existen en `cuestionario.ts`; falta la pantalla.
   🔑 Es idea suya y es más que un formulario: *ante una conducta anormal, lo primero que dispara
   el sistema no es una alerta, es el cuestionario.*
4. **Cómo se filma el QR.** ⚠ Escanear en vivo es frágil — ver el hallazgo del 16/8 más abajo.
   Recomendación: tres teléfonos filmados, nunca un escaneo en vivo.
5. **El trailer, AL FINAL.** 🔴 Lo decidió él al cerrar el 16/8: *"el trailer lo vemos al final,
   recién cuando tengamos el sistema operativo y podamos decidir qué usar para el video"*. No
   empezarlo antes. El guion actual todavía es el de Criterio Térmico.

### ⚠ Dos cosas que le tocan a él, no al código

- **Leer las respuestas del asistente con calma.** Va a ser lo más citado del producto y es el
  único que puede decir si el registro está bien.
- **Activar la verificación en dos pasos de Telegram.** Ese bot es el canal por donde AntiGro
  entrega todo.

### 🔑 Por qué el asistente NO transmite mientras escribe

Lo natural en un chat es que el texto aparezca palabra por palabra. Acá **no se puede**: el
control tiene que ver el texto **entero** antes de que salga. Transmitiendo, una frase que no
debía decirse ya estaría en la pantalla del padre cuando el control la frena. Se eligió esperar
y estar seguro. **No "arreglar" esto agregando streaming sin volver a discutirlo.**

### Cuentas para probar

- Panel de la familia: `mariana@ejemplo.ar` o `carla@ejemplo.ar`, clave `familia2026`.
  ⚠ Es la familia **inventada** (Ana, Mariana y Carla no existen).
- Panel de administración: la cuenta de siempre, ya cargada en `usuarios`.
  🔴 Si algún día se enchufa una base nueva, el panel vuelve a quedar cerrado: `auth.ts` usa
  `ADMIN_EMAIL`/`ADMIN_PASSWORD` **sólo cuando no hay base**.

---

## 🔴 Las reglas que no se negocian

1. **El sistema NUNCA afirma que un chico está siendo acosado, ni que está a salvo.**
   Señala, nombra y deriva. Cuando la respuesta correcta es un adulto o la Línea 137, lo dice.
2. **No se lee el contenido de las conversaciones.** Nunca. Es la línea que separa este producto
   de un espía, y es lo que lo hace defendible.
3. **El chico sabe que AntiGro existe desde el minuto cero.** Sabe que no se leen sus mensajes y
   sabe que lo cuida de posibles acosos. Un chico que sabe que hay una red que lo cuida es un
   aliado; uno que se siente espiado es un adversario.
4. **La explicación inicial al chico es la primera intervención, no un trámite legal.**
   El 63% de los chicos no sabe qué es el grooming: la conversación de alta ya resuelve parte
   del problema antes de que el sistema haga nada.
5. **No se alerta por un evento. Se alerta por persistencia.** El 90% de las víctimas sufre
   acoso cotidiano sostenido durante meses. Un pico aislado es ruido.

---

## Qué construye el sistema

**Tres entradas → una lectura → dos salidas.**

| Entrada | Qué aporta | De dónde sale |
|---|---|---|
| Señales de red | El **cuándo** | Simulador (hoy) o NextDNS (mañana) |
| Cuestionario a los adultos | El **cómo está** | Indicadores conductuales documentados |
| Estadísticas | **Cuánto pesa cada cosa** | Estudio del Ministerio de Justicia, 2023 |

**Salidas:** alerta con contexto a los adultos responsables (mínimo dos), y orientación al
propio chico en su canal, con el texto que corresponde a su edad.

### El hallazgo que define el diseño

**Los indicadores de grooming están documentados pero son conversacionales.** Toda la
investigación seria detecta leyendo mensajes. Un filtro DNS ve dominio y hora.
🔴 **El 74,3% de los casos pasa por WhatsApp**, cifrado y permitido: para un filtro, un pedido
de fotos a un chico de 12 y la tarea del colegio son el mismo evento.
➡ **Ningún control parental por DNS protege del grooming. Ni éste ni ninguno.** Por eso el
sistema cruza tres fuentes en vez de confiar en una.

Informe completo: `https://claude.ai/code/artifact/5bc55053-faba-486a-b23f-2209c0d657e3`
Plan de las 6 fases: `https://claude.ai/code/artifact/d8657f28-19c6-415c-8fa6-be76df507df8`

---

## Lo que SÍ ve una señal de red

- Salto marcado de volumen.
- Actividad corrida a la madrugada.
- Plataformas nuevas o sitios de chat con desconocidos.
- 🔑 **Intentos de saltar el filtro (VPN, proxy, DNS alternativo)** — la señal más fuerte, y la
  que hoy no mira nadie.

---

## Stack

Heredado de `rodos-3`: **Next.js 14 App Router · TypeScript · Tailwind · Supabase · Vercel**,
NextAuth v5 para el panel, Resend para correo.

**Origen del código a extraer:**
`~/Desktop/Trabajos de edicion/WEBS/Rodo's 3.0/rodos-3`
Se lleva: dashboard por token, esquema de Supabase, modo demo, envío por Resend.
**Se deja atrás:** la landing de Rodrigo, su hero, su panel de admin, sus servicios.

⚠ **Propiedad:** el software lo construyó Edgardo entero; Rodrigo nunca lo usó ni lo pagó.
Ver [[project-red-familiar-segura]] en la memoria. El negocio de instalar filtros era idea de
Rodrigo — **se presenta la app, no el negocio.**

### Cómo quedó armado el repo (fase 0, 14/8)

Repo: `Edgardo-Lamas/antigro`. El motor se clonó de `rodos-3` y se dejó afuera todo lo de
Rodrigo: su landing, sus secciones, sus herramientas, su panel, sus leads y su tracker.

| Se trajo | Dónde vive ahora |
|---|---|
| Dashboard por token | `src/app/familia/[token]/` + `src/app/api/familia/[token]/` |
| NextAuth v5 con modo demo | `src/auth.ts`, `middleware.ts`, `/panel/login` |
| Alta de familias | `src/app/api/panel/familias/route.ts` |
| Esquema de Supabase | `supabase/schema.sql` |

🔑 **La interfaz única de entrada vive en `src/lib/senales/`.** El motor pide señales y no sabe
de dónde salen. `obtenerFuente()` prioriza NextDNS y cae al simulador **diciéndolo en pantalla**.
Conectar un filtro real es completar dos variables de entorno, sin tocar el motor.

⚠ Una señal **no tiene campo de contenido**, y `sanearContexto()` tira excepción si alguien
intenta colar texto de conversaciones. La regla 2 está en el tipo, no en un comentario.

⚠ El matcher de `middleware.ts` va `["/panel", "/panel/:path*"]`: **`/panel/:path*` solo no
cubre `/panel`** y el panel quedaba abierto. Además la página revalida la sesión por su cuenta.

⚠ `tsconfig.json` necesita `"target": "ES2020"` (heredado sin target, rompía al iterar `Map`).

### El modelo de datos (fase 1, 14/8)

Vive en `src/lib/datos/`, con el mismo criterio que las señales: **el sistema pide datos y no
sabe si del otro lado hay Supabase o memoria.** `repositorio()` elige.

- `tipos.ts` — Familia, Chico (edad y género), AdultoResponsable (con `elegidoPorElChico`),
  Canal, Respuesta y ObservacionDelAdulto. `faltantesDeAlta()` dice qué le falta a una familia.
- `memoria.ts` — el modo demo. Siembra la familia con token `demo`: Ana de 12, la madre y una
  tía elegida por ella. **Es una sola instancia por proceso**, si no cada pedido perdería lo
  cargado.
- `supabase.ts` — misma interfaz contra Postgres. La traducción snake_case ⇄ camelCase vive
  ahí y en ningún otro lado.

🔴 **La regla de los dos adultos se valida en el alta, no en el formulario:**
`POST /api/panel/familias` rechaza con 400 si hay menos de dos adultos o si ninguno lo eligió
el chico. Verificado de punta a punta.

📌 El **formulario** de alta no existe todavía: el alta entra por la API. Va con la fase 4.
📌 `senales` se guarda con `id` de texto (viene de la fuente) y `upsert`, para que releer la
misma ventana no duplique.

### IA (fase 2, 14/8)

Modelo: **`claude-opus-5`**. Vive en `src/lib/ia/`.

🔴 **El modelo no decide nada.** El motor decide con el registro fechado; la IA sólo pone eso
en palabras para una persona con la edad que tiene. Tres piezas:

| Archivo | Qué hace |
|---|---|
| `redactar.ts` | La llamada. Prompt estable en `system` con `cache_control`; los datos del chico van en el mensaje del usuario. |
| `reglas.ts` | **El control.** Nada generado sale sin pasar por acá. |
| `respaldo.ts` | Los textos deterministas por banda de edad. La garantía. |

🔑 **Si el texto generado no pasa el control, sale el de respaldo** — y se guarda el rechazado
en `Redaccion.rechazado`, para poder mostrar en pantalla lo que el sistema frenó. Un prompt que
pide no afirmar es una intención; esto es una verificación.

🔴 **Regla nacida del primer mensaje real (14/8):** el modelo escribió *"un salto en el volumen
de **mensajes**"*. El sistema no ve mensajes — ve consultas de red, dominios y horarios, y
contar mensajes implica verlos. Ahí se cae la regla 2 entera. Ahora el control lo frena y el
prompt aclara qué significa cada señal. **Lección: el control se prueba contra salidas reales,
no contra las que uno imagina.**

⚠ **Las reglas entienden la negación, regla por regla.** "No leemos lo que escribís" y "todavía
no hay nada confirmado" son lo que el sistema TIENE que decir; "no estás a salvo" sigue
prohibida. Sin esto el control frena los textos correctos (pasó, y estaba mal).

⚠ En Opus 5 el pensamiento viene **encendido por defecto** y `max_tokens` topea pensamiento +
respuesta **juntos**: mínimo 2048. Y **`effort` NO acorta la salida visible** — el largo se pide
en el prompt o no se consigue.

🔴 **La clave va en `ANTIGRO_ANTHROPIC_KEY`, no en `ANTHROPIC_API_KEY`.** Next.js no pisa una
variable que ya exista en el proceso: si la terminal exporta su propia `ANTHROPIC_API_KEY`, esa
gana y el `.env.local` queda ignorado. El síntoma es un 401 con una clave que aparte anda bien.

---

### Las salidas (fase 3, 14/8)

Viven en `src/lib/mensajeria/`. Misma idea que las señales y el almacenamiento: **el sistema
arma qué decir y a quién; por dónde sale es problema de la capa.**

🔑 **Si el canal que pidió la familia no está configurado, NO se cambia de canal.** Se usa el
transporte de **ensayo**, que registra el mensaje entero y devuelve `entregado: false` con
`ensayo: true`. Nunca se finge una entrega, y la demo no depende de ningún proveedor.

🔴 **No se repite el aviso.** `avisar()` deduce del registro fechado si ya se avisó hoy a ese
destinatario. No hay marca aparte: si el registro es la fuente de verdad para decidir, también
lo es para no repetir. Verificado — la segunda corrida del mismo día omite los tres avisos.

### La vinculación — por qué una familia no configura nada

🔴 **AntiGro tiene UN bot para todo el sistema.** La familia no crea ningún bot y no genera
ninguna clave: cada persona se conecta apretando **"Iniciar"** una vez, desde un enlace o un QR.

⚠ **Por qué hace falta un código y no alcanza con cargar el número:** Telegram no deja
escribirle a nadie por teléfono. Sólo se puede responder a un `chat_id`, y ese número aparece
recién cuando la persona le habla al bot. El código es lo que permite saber **cuál** de todas
las personas es la que acaba de escribir.

| Pieza | Dónde |
|---|---|
| Código, enlace y lectura del `/start` | `src/lib/mensajeria/vinculacion.ts` |
| Lo que recibe el "Iniciar" | `POST /api/telegram/webhook` |
| Guardado del `chat_id` | `repositorio().vincularPorCodigo()` |

- Los códigos **no llevan caracteres confundibles** (sin 0/O, sin 1/I/L): se dictan por teléfono.
- **Sirven una sola vez.** En Supabase lo garantiza el `.is("vinculado_en", null)` del update.
- El webhook **exige el secreto** de Telegram (`TELEGRAM_WEBHOOK_SECRET`). Es un endpoint
  público: sin eso, cualquiera que descubra la URL prueba códigos hasta pegarle a uno.
- A quien todavía no vinculó **no se le disimula**: el aviso sale marcado `sinVincular` con su
  código a la vista. Un adulto que cree que va a recibir avisos y no los recibe está peor que
  uno que sabe que le falta un clic.

✅ **El bot existe: `@AntiGroArBot`.** Token, username y secreto del webhook cargados.

🔴 **El correo NO es un canal hoy, y la pantalla lo dice.** La cuenta de Resend es de Rodrigo y
no tiene dominio verificado: con el remitente `onboarding@resend.dev` **sólo se le puede escribir
a la casilla dueña de la cuenta**, cualquier otro destinatario lo rechaza Resend. Por eso
`TransporteCorreo.estado()` devuelve **no disponible aunque la clave exista y sea válida**, y el
canal figura *en ensayo* con el motivo entero a la vista. Decir "conectado" ahí sería fingir una
entrega — justo lo que el sistema promete no hacer, en la pantalla que lo promete. Se habilita
verificando un dominio y completando `CORREO_REMITENTE`. **Telegram es el único canal real.**

### El QR de la demo y el cupo de tres (15/8)

🔑 **Para que alguien crea que el sistema entrega, tiene que llegarle al teléfono.** La consola
muestra un QR: se escanea, se aprieta "Iniciar", y el aviso llega. Sin instalar nada y sin dar
un número.

| Pieza | Dónde |
|---|---|
| El cupo, los roles y el vencimiento | `src/lib/mensajeria/cupo-demo.ts` |
| QR (GET) y entrega real (POST) | `src/app/api/demo/telegram/route.ts` |
| El código del QR, atajado primero | `POST /api/telegram/webhook` |
| La tabla | `cupo_demo` (punto 8 de `supabase/schema.sql`) |

🔴 **El cupo vivía en `globalThis` y en producción NO FUNCIONABA. Arreglado el 16/8.**
Medido contra producción el 15/8: el escaneo entraba y la consola mostraba 0 de 3, siempre. En
Vercel **cada ruta de API es una función distinta con su propia memoria**, así que el webhook
tomaba el cupo en la suya y la consola miraba otra. En local andaba porque es un solo proceso —
por eso pasó todas las pruebas. **Es la misma trampa que ya nos habíamos comido con el
repositorio, repetida.** La regla que queda: *si dos rutas tienen que ver el mismo dato, el dato
no puede vivir en memoria.*

🔑 **Y el arreglo trajo algo que en memoria no se podía tener: el índice único sobre `rol` ES el
cupo.** Como hay exactamente tres roles, la base sola impide que dos personas caigan en el mismo
lugar aunque escaneen en el mismo segundo. Contar filas en la aplicación era una carrera; el
`insert` prueba los roles libres de a uno y ante un 23505 pasa al siguiente en vez de pisar.
📌 Sin base configurada sigue usando la memoria: en una sola máquina alcanza y el modo demo
tiene que andar siempre.

🔴 **Tres, y no es un número al azar: es el modelo del producto.** Dos adultos responsables —uno
elegido por el chico— y el chico en su canal. Tres personas escanean el **mismo** QR y reciben
**tres textos distintos**: ahí se ve de un vistazo lo que separa esto de un control parental.

🔐 **Y es el tope de seguridad.** El QR está en una página pública: sin cupo, cualquiera con un
script conecta miles de chats y el bot manda lo que quiera el que lo encontró. Con tres, el peor
caso es que tres desconocidos vean el mensaje de una chica inventada. Se libera solo a la media
hora, o con `/chau` al bot.

⚠ **El visitante NO se convierte en Ana.** Ocupa el lugar de un rol para ver qué le llegaría a
esa persona; **la familia sembrada no se toca.** Si el QR escribiera dentro de ella, la demo
quedaría distinta para el que entra después y con el canal de una "familia" ocupado por un
desconocido. Y cada mensaje sale con un encabezado que dice que es una demostración y que Ana no
existe: un texto así llegando sin marco es alarmante.

🔐 **`CODIGO_DEMO = "DEMO-ANTIGRO"` no puede colisionar con el código de una familia real**, y no
por convención: lleva guion y letras (O, I) que el generador de códigos **nunca emite** —su
alfabeto las excluye para que se dicten sin confusión. Además el webhook lo resuelve y **corta
con un `return` antes de buscar entre las familias**.

🔴 **El QR va oscuro sobre CLARO** aunque la página sea oscura. Un QR en negativo queda lindo y
**hay teléfonos que no lo leen**: el estándar asume módulos oscuros sobre fondo claro y varios
lectores no prueban la inversión. Salió así en el primer intento y se corrigió mirándolo.

Verificado el 15/8 con el webhook simulado: tres cupos se llenan, **el cuarto se rechaza**,
apretar "Iniciar" dos veces **no consume otro lugar**, `/chau` libera el correcto, y con historia
en calma **no se manda nada** (misma regla que `avisar()`). Con chats falsos el envío falla y lo
reporta como *no salió · chat not found* — **no finge**.

✅ **Y el 16/8 quedó probado con un teléfono real, en producción, de punta a punta:**
QR → Telegram → «Iniciar» → webhook → Supabase (cupo 1/3, rol *madre*) → motor (patrón
sostenido) → la IA escribe → el control aprueba → **entregado**.

🔴 **Hallazgo de esa prueba, y es de producto, no de código: escanear el QR con la cámara abre
`t.me` en el NAVEGADOR, no en la app.** Ahí Telegram no sabe quién sos y pide número de teléfono
y código de verificación. Le pasó a Edgardo, que ya tenía cuenta y había construido el bot.
**Un jurado no va a completar eso, y con razón.** La demo por QR supone que el otro ya tiene
Telegram abierto en ese aparato, y con desconocidos ese supuesto no se sostiene.
✅ La página ya lo avisa antes de que alguien escanee. ⚠ **Para el video: nunca un escaneo en
vivo** — se filma, con teléfonos ya logueados.

### Dos vías en paralelo, y el punto ciego que las hizo falta (14/8)

🔴 **Lo encontró Edgardo:** el que contrata este sistema muchas veces lo contrata **porque ya
sospecha algo**. Si el chico ya está dentro del proceso cuando arranca el aprendizaje, un
sistema que sólo detecta CAMBIOS aprende el abuso como lo normal de esa casa y no alerta nunca.

Por eso hay dos clases de señal, y **corren en paralelo, no se reemplazan** (`CLASE_DE_SENAL`):

| Clase | Cuáles | Cuánto pesa |
|---|---|---|
| **Absoluta** | Madrugada · evasión del filtro | **Siempre el 100%, desde el día uno.** No se comparan contra nada |
| **Relativa** | Salto de volumen · plataforma nueva | Por el **alcance** de la lectura, que crece con el perfil |

La madrugada es absoluta porque desordena el descanso por sí sola: al otro día no descansó para
la escuela. La evasión, porque es un acto deliberado — da igual si es el día 2 o el 200.

### 🔴 El perfil y la ventana son DOS cosas (rediseñado el 15/8/2026)

Había un `APRENDIZAJE_DIAS = 14` que era un **interruptor**: antes del día 14 las señales
relativas valían cero, después el 100%. **Lo tiró Edgardo y tenía razón**, textual: *"cada chico,
cada situación, es diferente, no hay manera de establecer una conducta 'x' en 5/10/14/30 días…
son adolescentes, están permanentemente cambiando"*. Y lo que ordenó el diseño nuevo:

> **"El sistema protege al chico desde el día uno. Pero esa protección se va desplegando con el
> tiempo. No es un soldado listo para disparar, es un sistema que debe analizar, porque el
> acosador se esconde y sólo podemos ver/imaginar sus consecuencias."**

Lo que estaba mal de fondo: **el perfil y la ventana eran la misma cosa.** Todo se calculaba
dentro de una caja de 21 días, así que el sistema nunca conocía al chico más allá de tres
semanas. Ahora son dos piezas separadas:

| Pieza | Dónde | Qué es |
|---|---|---|
| **El perfil** | `src/lib/motor/perfil.ts` | Lo que el sistema sabe del chico. **Sin tope de días** y con olvido: lo de hace dos meses pesa un cuarto que lo de esta semana |
| **La ventana** | `VENTANA_DIAS` en `evaluar.ts` | Sólo el tramo reciente que se evalúa. Existe para medir persistencia, nada más |

**El alcance** (`alcanceDeLaLectura`) es cuánto se desplegó la lectura, de 0 a 1, y multiplica a
las señales relativas. Sale de dos cosas: la historia acumulada (`1 - e^(-días/7)`, sin escalón)
y lo predecible que es ese chico. Medido en el escenario persistente: día 1 → 0,13 · día 5 →
0,51 · día 14 → 0,72 · día 21 → 0,80. **En ningún día se prende nada.**

🔑 **Que la evasión siga avisando el día 12 con el perfil recién nacido es la prueba de que la
protección no espera al perfil:** es una señal absoluta y pesa el 100% desde el primer día.

🔴 **`diasObservados` sale del ALTA del chico, nunca de las señales** (`diasDeObservacion`). Para
una fuente de señales, "no hubo desviaciones" y "todavía no lo miramos" son indistinguibles: en
los dos casos no llega nada. Deducirlo de las señales hacía que un chico tranquilo pareciera
tener tres semanas de historia el primer día. Fue un bug real del 15/8.

⚠ **Y lo que el perfil no puede resolver, se dice en vez de taparse** (`advertenciasDelPerfil`):
si el chico ya venía siendo acosado cuando el sistema empezó a mirar, el perfil aprende ese daño
como parte de lo habitual. Va siempre en `loQueNoSeVe`.

⚠ **El punto ciego se achicó, no desapareció.** Un chico ya acosado cuyas únicas señales sean
volumen y plataforma nueva sigue siendo difícil de ver mientras el perfil es joven: esas dos son
relativas y pesan por el alcance. **Ya no quedan en cero como antes** —cuentan atenuadas desde el
primer día— pero cuentan poco. Candidata para sumar a la vía absoluta: chat con desconocidos en
chicos de 7 a 10 — ahí la EDAD hace de referencia en lugar de la historia, y la respalda el 4 de
cada 10 que tiene su primer teléfono antes de los 9.

🔑 **El cuestionario es la primera respuesta, no un formulario** (idea de Edgardo, 14/8).
Ante una conducta anormal —un chico de 8 chateando, por ejemplo— lo primero que dispara el
sistema **no es una alerta: es el cuestionario a los adultos.** Sirve para dos cosas a la vez:

1. Consigue el dato que a la red le falta. Hay cambios que el sistema no va a ver nunca y los
   adultos sí, y con eso el motor pasa a tener un elemento más y contundente.
2. **Los pone en alerta sin decirlo.** Quizá vieron esos cambios y los archivaron como "cosas
   de la edad" — **y los archivaron ahí por desconocimiento del grooming**, no por descuido.
   Nadie mira lo que no sabe que hay que mirar.
3. 🔑 **Enseña mientras pregunta.** Cada pregunta le está diciendo al adulto qué mirar, en forma
   de pregunta y no de sermón: *"¿apareció algo que no sabés de dónde salió?"* le enseña que los
   regalos son parte del mecanismo, sin nombrarlo ni alarmarlo. Es la misma lógica que la regla 4
   con el chico —la explicación inicial ya es la primera intervención— pero del lado del adulto.

Si después llega una alerta, ya venían atentos.

⚠ **Por eso el pedido del cuestionario NO puede sonar a que se detectó algo.** Tiene que leerse
como rutina. Si dice "notamos algo", es una alarma con pasos de más, y vuelve el problema del
falso positivo que gasta la confianza. 📌 Falta implementarlo.

🔴 **Sólo se avisa con patrón sostenido.** El estado "hay un cambio" no le escribe a nadie: ni
a los adultos ni al chico. Cualquier chico se queda una noche hasta tarde por algo puntual, y
alarmar por eso gasta la atención de los adultos y —peor— la confianza del chico, que es el
activo del que depende todo el producto.

### La home es la consola (fase 4, 15/8)

🔴 **La demo no está abajo de una landing: la demo ES la home.** Un padre y un jurado quieren lo
mismo al entrar — ver el sistema andando, sin cuenta. Decidido por Edgardo el 15/8.

| Pieza | Dónde |
|---|---|
| La consola entera, cliente | `src/app/_demo/Consola.tsx` |
| La cáscara y el estado de lo conectado | `src/app/page.tsx` |

🔑 **El simulador sólo emite señales; quién decide es el motor**, con la misma regla de
persistencia, el mismo perfil y el mismo alcance que correrían contra un NextDNS real. Lo único
fabricado es de dónde salen los horarios y los dominios. **Eso va escrito al pie de la consola,
no escondido:** es lo que hace que se le crea el resto.

⚠ Los mensajes se piden **a demanda**, con un botón. Redactarlos llama al modelo, y hacerlo en
cada movimiento del reloj sería lento y caro.

Medido de punta a punta el 15/8, con el reloj en el día 21 y sin cuestionario contestado:

| Escenario | Cuándo habla |
|---|---|
| Semana normal | Nunca. Puntaje 0,02 el día 21 |
| Cambio leve | Nunca. Sube hasta 0,14 el día 10 y vuelve a bajar |
| Patrón que persiste | `atencion` el día 14 · `patron_sostenido` el **día 20** |
| Intento de saltar el filtro | `patron_sostenido` el **día 14**, con el perfil todavía joven |

🎬 Los dos primeros son el momento del video: el sistema quedándose callado tres semanas.

⚠ **Tres cosas que se cayeron recién al mirar la pantalla,** no en los tests — y que son el
argumento de por qué hay que abrir el navegador:

1. Un `**markdown**` crudo salía con los asteriscos a la vista en `porQue`. **Los textos del
   motor son para leer, no para renderizar.**
2. La advertencia del perfil nombraba la fecha en ISO (`2026-07-29`) y, peor, la sacaba de
   `perfil.primerDia` — **el primer día con señal, no el alta.** Decía "lo conoce hace 21 días"
   y en el renglón siguiente nombraba una fecha de hace 18. Es el mismo error de `diasObservados`
   que ya se había corregido, sobreviviendo en otro lado. Ahora sale del alta y se dice en
   criollo (`enCriollo` / `desdeCuando` en `perfil.ts`).
3. El cierre de `loQueNoSeVe` estaba **fijo** y decía "hay un cambio que se sostuvo" incluso en
   calma, donde no hubo ninguno. Ahora depende del estado, y **el de calma no dice que el chico
   esté a salvo** (regla 1): dice qué fue lo que no apareció.

### La madrugada se compara contra la EDAD (15/8)

🔴 **A las 2 de la mañana, una nena de 9 y un pibe de 16 no son lo mismo.** Lo marcó Edgardo:
*"si el chico comienza a tener hábitos nocturnos propios de su crecimiento… a los 15 es esperable
el cambio"*. La madrugada pesaba 0,80 fijo y el sistema no sabía la edad del que estaba despierto.

📊 **Tiene respaldo clínico, no es sentido común:** en la adolescencia hay un **retraso biológico
de la secreción nocturna de melatonina**, y el punto medio del sueño se corre a lo largo de la
segunda década. Es el sustrato del *síndrome de retraso de fase*, el trastorno circadiano más
frecuente en adolescentes, definido como un corrimiento de **más de dos horas**. Fuentes:
[AEP](https://www.aeped.es/enfamilia/salud-en-familia/sueno-en-adolescente-sindrome-retraso-fase)
y [SEMA](https://www.adolescenciasema.org/adolescentes/si-eres-adolescente-este-es-tu-sitio/mi-sueno/el-sueno-en-la-adolescencia/).

🔑 **No se atenúa el peso: se corre la hora de referencia** (`horaDeReferencia` / `factorMadrugada`
en `pesos.ts`). Amortiguar el peso diría "en los grandes la madrugada importa menos", que es falso.
Correr la hora dice lo que pasa: **en los grandes la madrugada empieza más tarde.** Referencias:
≤10 → 22 h · 11-13 → 23 h · 14-15 → 24 h · 16-17 → 01 h. Piso 0,55, máximo a las 4 h de desvío.

⚠ **Sigue siendo absoluta**: no se compara contra la historia, se compara contra la EDAD. Por eso
funciona desde el día uno incluso con un chico ya acosado, que es lo que el perfil no puede
resolver.

🔴 **Y hubo que arreglar el simulador para que se notara:** emitía la madrugada sólo de 01 a 04, o
sea **la fuente decidía qué es anómalo**. Un filtro ve una consulta a las 23:40 y no sabe si es
tarde — depende de la edad, que la fuente no conoce. Ahora emite de 22 a 04 y decide el motor.

Medido el 15/8, escenario persistente, puntaje al día 21: 7 años 0,668 · **11-13 años 0,698** (el
pico, donde las dos fuentes coinciden) · 15 años 0,663 · **16-17 años 0,579**. La "atención" se
corre del día 14 al 15 en los grandes y **el día de la ALERTA no se mueve para nadie** (día 20).
Eso es el guardarraíl funcionando: atrasa, no apaga.

### 🔴 Los lugares se clasifican por lo que PERMITEN, no por lo que son (15/8)

**Corrección de Edgardo, y reescribió `src/lib/senales/plataformas.ts` entero:** *"el lugar
peligroso no es WhatsApp; el lugar peligroso es de donde sale el contacto que luego lleva a
WhatsApp"*.

El modelo anterior clasificaba por lo que cada app **es** —juego, mensajería, red social— y eso
metía a WhatsApp y a Discord en la misma bolsa. Pero WhatsApp es donde el chico habla con la
madre: no es un lugar peligroso, **es el destino**.

🔑 **Lo que divide a los lugares es UNA propiedad: si un desconocido puede empezar una
conversación sin que el chico le entregue nada.**

| Puerta | Qué significa | Ejemplos |
|---|---|---|
| `contacto_abierto` | Un desconocido llega solo | Roblox, Free Fire, **Snapchat**, TikTok, Instagram |
| `requiere_entrega` | El chico tiene que dar su teléfono o usuario | WhatsApp, Telegram, Discord |
| `sin_contacto` | Sin canal con desconocidos | YouTube |
| `desconocida` | Fuera del radar — **lo que más se mira** | |

➡ **Y de ahí sale la señal buena: el CRUCE.** Que aparezca WhatsApp no dice nada. Que aparezca
*después* de un lugar de contacto abierto significa que **el chico entregó su teléfono a alguien
que conoció ahí**. Es un hecho observable, no una interpretación.

📊 **El dato que lo sostiene:** NSPCC, 45 fuerzas policiales del Reino Unido — 7.062 delitos de
comunicación sexual con un menor en 2023-24, **+89% desde 2017-18**. De los 1.824 casos con medio
identificado: **Snapchat 48%**, WhatsApp 12%, Facebook/Messenger 12%, Instagram 6%.
https://www.nspcc.org.uk/about-us/news-opinion/2024/online-grooming-crimes-increase/

⚠ **Y choca con nuestra otra fuente:** el Estudio nacional argentino (2023) da **74,3% WhatsApp**;
el británico le da 12%. No es que uno esté mal — **el ranking de plataformas es propio de cada
país**. Snapchat es masivo entre adolescentes británicos y marginal acá; WhatsApp es dominante en
Argentina para todo.
🔴 **Conclusión, y cierra el argumento del observatorio: una lista de plataformas peligrosas NO se
puede importar.** Sirve la PROPIEDAD (contacto abierto vs. entrega), que no depende del país. El
ranking hay que producirlo acá.

Medido el 15/8: el cruce aparece en persistente (*"de Roblox, donde cualquiera puede escribirle, a
Discord, donde hace falta que él haya entregado su contacto"*) y en evasión (Free Fire → WhatsApp),
y **no aparece** en normal ni en cambio leve.

### 🔑 El modus operandi — mirar al acosador, no sólo al chico (15/8)

**De Edgardo:** *"también deberíamos saber cómo actúan estos depredadores; eso nos va a permitir
anticipar medidas… convertir a AntiGro en un agente sabueso"*.

🔴 **Cambia lo que el sistema es.** Hasta acá miraba **cambios en el chico** — eso es mirar la
sombra. El grooming **no es un evento: es una secuencia con etapas**, y una secuencia se reconoce a
mitad de camino. Ahí está el anticipar.

📊 **Sexual Grooming Model (SGM)** — Winters & Jeglic 2017, ampliado a cinco etapas por Winters y
col. 2020. **Validez de contenido establecida por panel de expertos; 77 conductas.** Vive mapeado
en `src/lib/motor/modus-operandi.ts`.
https://www.tandfonline.com/doi/full/10.1080/15564886.2021.1974994
⚠ **Fuente secundaria** (publicaciones de los autores y resúmenes, no el paper completo). Citado
con nombre y año para poder verificarlo; si va al video, se confirma antes.

| Etapa | ¿La ve la red? | Con qué |
|---|---|---|
| 1. Selección de la víctima | Apenas | Plataforma de contacto abierto nueva |
| 2. Acceso y aislamiento | **Sí, es su punto fuerte** | **El cruce** + madrugada |
| 3. Desarrollo de la confianza | Mal | Sólo volumen sostenido |
| 4. Desensibilización sexual | **NO. Nada** | — |
| 5. Mantenimiento | **Sí, con claridad** | Evasión del filtro |

🔴 **De cinco etapas, la red ve bien dos, ve mal dos y NO VE la quinta — que es donde el delito
ocurre.** Eso no se disimula: **es el argumento entero del diseño de tres entradas.** Un producto
que dijera que detecta grooming mirando el DNS estaría mintiendo y bastaría un perito para
demostrarlo. Lo que AntiGro puede sostener es que reconoce **la forma del proceso** con lo que ve,
y que pide ayuda para el resto — a los adultos por el cuestionario, y al propio chico, que es el
único que estuvo en la etapa 4.

📌 Por eso el cuestionario pregunta por regalos sin explicación y por el chico que se aísla: **son
la etapa 3 vista desde la casa**, que es donde la red no llega.

⚠ La etapa se nombra en la lectura pero **no suma puntaje**: que la huella esté no prueba que la
etapa ocurrió. Ordena el relato de la alerta, no la decide. Medido: persistente llega a *desarrollo
de la confianza*, evasión llega a *mantenimiento*.

### El observatorio — estadísticas propias (15/8)

🔴 **No existe un registro de "dónde se hace grooming"**, y conviene saber por qué antes de
buscarlo: el grooming pasa en los lugares **más populares**, no en sitios oscuros. Lo que sí
existe es de otro delito:

| Registro | Qué tiene | Se puede usar |
|---|---|---|
| [IWF URL List](https://www.iwf.org.uk/our-technology/our-services/url-list/) | Material de abuso confirmado. **No grooming.** 260.699 URLs en 2025 | Sólo miembros, licencia paga |
| [Project Arachnid](https://projectarachnid.ca/en/) | Ídem (CSAM) | API gratis, hay que pedirla |
| [Google Safe Browsing](https://developers.google.com/safe-browsing) | Malware y phishing | Pública y gratis |
| [Categorías NextDNS](https://github.com/nextdns/metadata) | Porno, apuestas, citas, juegos | Ya viene con el filtro |

🔑 **Por eso el sistema produce su propio dato** (`src/lib/observatorio/`), y **no espera a tener
volumen** — decisión de Edgardo: *"que se sepa que AntiGro busca ser efectivo, y es un argumento
para posicionarnos mejor"*.

🔴 **Y no esperar es correcto también técnicamente.** Yo objeté que con pocas familias el dato no
vale; está mal, y lo desarma un hallazgo de la literatura: los acosadores **contactan a muchos
chicos a la vez**. La revisión de estrategias de grooming pre y post internet (*Child Abuse &
Neglect*, nov. 2021, [PubMed 34801848](https://pubmed.ncbi.nlm.nih.gov/34801848/)) lo llama
**"spray and prey"**. ➡ Si un mismo acosador toca a muchos chicos a la vez, **el mismo lugar
aparece en varios chicos a la vez**: el dato no necesita escala, necesita simultaneidad, y la
simultaneidad la pone el atacante.

**Las dos trampas, resueltas en el código:**

1. 🔴 **Contar no sirve.** El dominio más frecuente antes de una alerta es WhatsApp, siempre,
   porque está en todos los chicos. Contar aprendería que lo peligroso es lo popular. Se mide
   **lift**: cuánto más aparece entre los alertados que en la población.
2. 🔴 **La privacidad es la licencia para existir.** No se guarda "el chico A pasó por acá": se
   guarda, por dominio, **cuántos chicos distintos** lo vieron. Un número, sin identidad. El tipo
   `FilaDelObservatorio` está escrito para que guardar ids obligue a cambiarlo y se note.

Verificado el 15/8 con `GET /api/observatorio?ejemplo=1` (100 chicos, 10 con alerta):
**descarta WhatsApp (lift 1,0), Roblox (1,33) y TikTok**, y levanta `chat-libre-24.top` — 4 chicos,
los 4 alertados, en 7 días — con **lift 10, simultáneo y fuera del radar**. Y se rotula solo como
**"indicio"**, no como conclusión: un observatorio que informa sin decir sobre cuántos casos se
apoya es peor que no tenerlo.

#### 🔑 La homogeneidad del perfil — lo más fuerte que tiene el observatorio

Idea de Edgardo: *"si el sistema detecta que en la misma dirección están conectados 10 chicos… y
son todas nenas de 10 años, esto ya es un patrón grave"*.

🔴 **Discrimina donde el volumen no puede.** Un lugar legítimo y popular tiene público **diverso**
—Roblox tiene chicos de 7 a 17, varones y nenas—; un canal armado para captar tiene público
**angosto**. La señal no es que haya muchos chicos: es que sean **todos parecidos**. Y sirve
contra un dominio que nadie vio nunca: no hace falta saber qué es el sitio para notar que su
público es imposible.

⚠ **Lo que lo sostiene y lo que no.** Que las víctimas se concentran en un perfil está en las dos
fuentes (80% nenas; franja 9-13). Que **cada acosador** persiga un perfil consistente es una
inferencia razonable **no verificada en fuente**: no se afirma. El detector no depende de eso —
mide contra la diversidad esperable de una plataforma, sea cual sea el motivo.

🔴 **Guardarraíl más filoso que el resto:** un casillero de "nenas de 10" con un integrante es casi
una identidad. Por eso el perfil **no se computa por debajo de `CHICOS_PARA_PERFIL = 5`**, y nunca
se devuelven los casilleros: sólo el índice.

Medido el 15/8 con el ejemplo: `amigos-secretos.click`, 10 chicos, **homogeneidad 100%**, y entra
**aunque el lift sea apenas 2,0** porque 8 de los 10 todavía no tienen alerta. Ahí está el valor:
**ve el patrón antes de que esos chicos lleguen a tener una alerta.** Roblox, con público diverso,
sigue descartado.

📌 **Falta la acumulación**: hoy `GET /api/observatorio` devuelve vacío y lo dice, porque hay una
sola familia sembrada. La función `analizar()` ya está escrita y probada; lo que falta es el
registro agregado, que necesita más de una casa para significar algo.

#### ❓ Sin decidir: avisarle a las autoridades

Planteado por Edgardo el 15/8. **Mi recomendación, para cuando se retome:**

🔴 **Automático, no.** Por tres motivos: (1) choca con la regla 1 —el sistema no afirma—; (2) un
falso positivo contra un servicio legítimo es irreversible; (3) un agregado de DNS **no es prueba**,
y presentarlo como tal quema la credibilidad ante la única oficina que hace falta.

✅ **Lo que sí:** el sistema **arma el informe**, una persona decide mandarlo, y el informe es sobre
**un dominio y un patrón, nunca sobre un chico**. Esa distinción es la que lo vuelve defendible: se
reporta infraestructura, no una criatura.

Canales reales verificados el 15/8: **UFECI** (Unidad Fiscal Especializada en Ciberdelincuencia,
`denunciasufeci@mpf.gov.ar`, (5411) 5071-0040) y **Línea 137 / WhatsApp 11-3133-1000**, donde el
Equipo de Violencia Digital acompaña hasta la denuncia.
📌 Y encaja con la conversación de partner: **Grooming Argentina ya articula con el sistema
judicial.** AntiGro no denuncia — equipa al que denuncia.

## Modelo de datos

- **Familia**
- **Chico** — `edad` y `género` son **datos del motor**, no adornos: cambian el peso de las
  señales y cambian el texto del mensaje.
- **Adultos responsables — mínimo dos**, cada uno con su canal.
  📌 Propuesta abierta: que **uno de los dos lo elija el chico** (una tía, un hermano mayor).
  El 43% de los chicos no habla de estos temas con sus padres, así que el segundo adulto no es
  redundancia técnica: es alguien a quien de verdad le va a escribir.
- **Canal del chico**, separado del de los adultos.
- **Canales configurables al contratar:** Telegram, correo, WhatsApp. La capa de mensajería es
  indiferente al canal.
- **Registro de señales y respuestas con fecha** — sin esto no se puede medir persistencia.

---

## 🏠 EL PANEL DE LA FAMILIA — decidido con Edgardo el 16/8/2026

**Lo trajo él, y es más que una pantalla de logueo: es el producto del lado del cliente.**
Su planteo textual: *"debe existir un panel donde los padres reciben las notificaciones, los
informes, está el asistente, tienen el código QR para incluir a los referentes, incluso darlos
de baja"*.

🔑 **Resuelve tres cosas que estaban sueltas de una sola vez:** el formulario de alta que quedó
pendiente de la fase 4, dónde vive el asistente, y la versión real del QR (hoy sólo existe el
de la demo). El asistente no es una pantalla aparte: **vive adentro del panel.**

### ✅ Hecho el 16/8 — la puerta y el panel

| Dirección | Qué |
|---|---|
| `/entrar` | La puerta de la familia. **No es `/panel/login`**, que es la de administración |
| `/mi-familia` | El panel: informe, quiénes están, QR, baja |
| `GET /api/mi-familia` | Los datos **+ la lectura del motor** |
| `GET /api/mi-familia/qr?codigo=` | El QR de un referente |
| `POST /api/mi-familia/adultos/baja` | La baja, con motivo y aviso al chico |

🔴 **La familia sale de la SESIÓN, nunca de la dirección.** Si viniera del navegador, cambiar un
identificador alcanzaría para leer el informe del chico de otra casa. Por eso `authorize()`
resuelve el `familiaId` contra la base y lo mete en el token, y por eso `darDeBajaAdulto()` pide
la familia además del adulto: el filtro va **dentro del UPDATE**, así el repositorio mismo se
niega a tocar a alguien de otra casa sin depender de que quien llame se acuerde de comprobarlo.

🔑 **Si al adulto lo dan de baja, su cuenta deja de abrir** (se comprueba en `authorize()`). Es la
consecuencia real de la baja: sin eso, quien se fue de la familia seguiría entrando a ver a la
criatura.

🔑 **`faltantesDeAlta()` ahora cuenta sólo adultos ACTIVOS.** Es lo que hace visible el hueco: la
baja no se traba nunca, pero la familia que queda con uno solo lo ve escrito en pantalla hasta
que lo cubra. Verificado en el navegador el 16/8.

📌 **Cuando dos adultos contestaron distinto el cuestionario, gana el que vio MÁS**
(`loQueVieronLosAdultos` en `/api/mi-familia`). Si la madre marcó «nunca» y la tía «seguido», la
tía vio algo que la madre no — y ese es el motivo por el que el sistema exige un segundo adulto.
Promediar borraría el único dato nuevo que hay ahí.

### 🔴 La trampa que apareció al probar en producción (16/8) — `middleware.ts` no se compilaba

**`/mi-familia` sin sesión devolvía 200 en vez de mandar al logueo.** El motivo: este proyecto usa
carpeta `src/`, y **con `src/` Next busca el middleware en `src/middleware.ts`**. Estaba en la
raíz desde la fase 0, así que **nunca se compiló** — el manifiesto salía con `"middleware": {}`.

🔑 **Lo importante no es el archivo mal puesto: es que no se notó durante dos días.** `/panel`
parecía protegido porque redirige igual, pero eso lo hacía la comprobación *dentro de la página*,
no el middleware. La segunda línea de defensa era la única que había, y nadie lo sabía.

⚠ **Cómo se comprueba, y conviene hacerlo cada vez que se toque:**
`cat .next/server/middleware-manifest.json` — si `middleware` viene vacío, no existe. En el build
tiene que aparecer la línea `ƒ Middleware`.

✅ Arreglado: el archivo se movió a `src/middleware.ts` y `/mi-familia` tiene además su propia
comprobación en `layout.tsx`, igual que `/panel`.
📌 **No hubo dato expuesto:** las rutas de API comprueban la sesión por su cuenta y devolvían 401.
Lo que quedaba abierto era la pantalla, que sin datos mostraba su estado de error.

⚠ **Cuentas de prueba de la familia inventada** (Ana, Mariana y Carla no existen):
`mariana@ejemplo.ar` y `carla@ejemplo.ar`, clave `familia2026`.

⬜ **Falta:** el alta desde el panel, el cuestionario del adulto y el asistente (que ya tiene su
lugar reservado en la pantalla, diciendo que todavía no está).

### Quién tiene cuenta

| Quién | Entra con contraseña | Recibe por su canal |
|---|---|---|
| **Los dos adultos responsables** | ✅ sí, cada uno la suya | ✅ |
| **El chico** | ❌ no | ✅ (texto distinto, por banda) |
| Cualquier otro referente | ❌ no | ✅ |

Las credenciales viven en **una sola tabla** (`usuarios`) y el `rol` dice si es el panel de
administración o el de una familia. Así NextAuth lee un solo lugar, y un adulto puede existir
sin cuenta —el que sólo quiere el aviso por Telegram— sin ninguna fila fantasma.

⚠ Él eligió esto sabiendo el costo: el segundo adulto responsable **ve el informe completo de
Ana**. Es coherente —es un adulto responsable, no un espectador— pero está elegido, no asumido.

### 🔴 El referente del chico: existe siempre, pero no siempre lo elige él

**Lo marcó Edgardo:** *"esa opción la van a usar los chicos más grandes, me parece que un chico
de 7 años no tiene la capacidad de decidir ese tema, pero también creo que es una buena idea
tener un referente fuera de los padres"*.

- **El adulto fuera de los padres existe en TODAS las edades.** No depende de la edad, y es lo
  que sostiene el 43% que no habla de estos temas con sus padres.
- **Lo que depende de la edad es quién lo elige:** de 7 a 10 lo eligen los padres, de 11 en
  adelante lo elige el chico. `EDAD_PARA_ELEGIR_REFERENTE` en `src/lib/config.ts`.
- ⚠ **Ese 11 es criterio de producto, no un dato.** No hay fuente que fije una edad para elegir
  un confidente y **no se cita como si la hubiera**. Está ahí porque es donde ya cortan las
  bandas del sistema. Es un valor por defecto que los padres pueden mover en el alta.

### 🔴 El cambio de referente no lleva ninguna traba

**También suyo:** *"puede pasar que el referente del chico se muda, fallece, el chico lo quiere
cambiar, pierde el teléfono, etc. Tiene que estar abierta esa posibilidad de cambio."*

Ninguna de esas es una excepción rara: es la vida normal de una familia. **Un sistema que
dificulta el reemplazo termina con un referente que ya no existe, que es peor que no tener
ninguno.** Por eso:

- La baja es **blanda** (`adultos.activo`), nunca un `delete`: las observaciones que ese adulto
  cargó son entrada del motor, y borrarlas cambiaría lecturas ya hechas.
- Se registra el **motivo** (`baja_motivo`). No es burocracia: «lo quiere cambiar el chico» y
  «perdió el teléfono» son dos hechos distintos, y un cambio de referente justo después de un
  aviso es algo que los adultos tienen que poder ver.
- 🔑 **Si el chico lo había elegido, el chico se entera del cambio por su canal.** Ese segundo
  adulto existe justamente porque el chico no habla con los padres; una baja silenciosa lo
  convertiría en un sistema que trabaja *sobre* el chico y no *para* él.

### La suscripción — el modelo se define, todavía no se cobra

**Decidido el 16/8, con el código congelándose el jueves 20.** Se construye la cuenta y el
panel entero; el precio y el plan quedan escritos, pero **nadie paga por ahora**. No hay
checkout, no hay Mercado Pago, no hay estados de pago en la base.

📌 `familias.activo` ya alcanza como estado del servicio: la página de la familia devuelve 403 y
dice *"El servicio está pausado para esta familia"*. Eso es todo lo que la suscripción necesita
hoy del lado de los datos.
⚠ **Falta escribir el modelo en palabras** (qué incluye, por familia o por chico, cuántos
referentes). Es contenido para el PDF y el guion, no código.

---

## ✅ EL ASISTENTE PARA LOS ADULTOS — escrito el 16/8/2026

**Definido con Edgardo el 15/8, construido el 16/8.** Vive dentro de `/mi-familia`, no en una
pantalla aparte: el padre lo consulta con el informe a la vista, que es cuando le sirve.

| Pieza | Dónde |
|---|---|
| El corpus, el prompt estable y el respaldo | `src/lib/ia/asistente.ts` |
| El control (`revisarRespuestaDelAsistente`) | `src/lib/ia/reglas.ts` |
| La ruta | `POST /api/mi-familia/asistente` |
| La pantalla y el dibujo del markdown | `src/app/mi-familia/page.tsx` |

🔴 **La lectura se recalcula en el servidor en cada pregunta.** El navegador ya la tiene y sería
más barato mandarla en el pedido — no se hace: quien controle el navegador controlaría entonces
qué "vio" el sistema y podría hacerle decir al asistente cualquier cosa. Del cliente sólo viene
la pregunta y los turnos previos.

🔑 **Sin RAG: el corpus entero va en el `system` y se cachea.** Es la lección de Criterio Térmico
aplicada de entrada, y encima sale más barato — el material viaja en cada pedido pero se paga una
vez.

🔴 **El control agrega lo que faltaba: tranquilizar y estimar probabilidad.** Diagnosticar ya lo
frenaba `AFIRMACIONES_PROHIBIDAS`. Verificado el 16/8 con la pregunta que un padre real va a
hacer —*"decime que no es nada, por favor"*—: el asistente **no la tranquiliza**, explica por qué
no puede, y ofrece enseguida lo que sí. Esa respuesta la leyó Edgardo antes que nadie.

⚠ **Trampa del 16/8, y vale para cualquier regla que se agregue:** el primer patrón contra
tranquilizar era `\bqueda(te|se|\s+tranquil)`, que frena **cualquier** «quedate» —incluido
«quedate con esto»— y tiró al respaldo una respuesta correcta. Apareció en la primera prueba
real, no en el typecheck. **Un patrón que frena de más es tan malo como uno que no frena:** un
asistente que cae al respaldo seguido es un asistente que nadie consulta.

📌 **Las cifras del informe LATAM se agregaron a `CIFRAS_CITABLES`.** Sin eso, citar el informe
que el propio proyecto documenta caía al respaldo como si fuera una invención.

🔐 **El markdown del modelo se dibuja armando elementos de React, nunca con
`dangerouslySetInnerHTML`.** El texto viene de un modelo; pasarlo como HTML sería dejar que lo
que escriba se ejecute en la pantalla del padre.

⬜ **Sin decidir:** si el chico tiene el suyo más adelante, y qué se le puede decir a un menor.

---

### Lo que se decidió el 15/8, y no hay que volver a discutir

### Por qué

Hoy la alerta llega y **el padre queda solo con ella**. El informe dice *"hay un cambio que se
sostuvo y conviene mirar"*, y el pensamiento siguiente de cualquier padre es *"¿y ahora qué
hago?"*. Ahí el sistema se calla, y ese silencio se come el valor de todo lo demás. Además ahora
hay mucho más para explicar: el alcance, por qué la madrugada pesa distinto a los 15 que a los 9,
qué significa el cruce, qué etapa encaja.

### Decidido

| Qué | Decisión |
|---|---|
| **Con quién habla** | 🔴 **Sólo los adultos.** El chico no, por ahora |
| **Recuperación** | 🔴 **Sin RAG.** Todo el corpus en el prompt estable, cacheado |
| **Registro** | **Cálido.** Ver abajo: es un requisito, no una preferencia |

🔴 **Sin RAG, y es la lección más cara de Criterio Térmico aplicada de entrada:** allá se
descubrió el 14/8 que *la regla anti-invención NO protege contra material que existe pero el RAG
no recuperó* — el modelo rellena con conocimiento general que suena bien y contradice la
documentación. Acá el corpus es chico y cerrado (el objeto `Lectura` + las estadísticas + las
recomendaciones del MPBA y la 137): **entra entero en el prompt estable.** Elimina de raíz una
clase completa de error y encima sale más barato. Ver [[project-ct-asistente-calidad]].

### 🔴 Dónde va la línea — la discusión que la definió

Yo propuse "sólo material documentado" y **Edgardo lo corrigió con razón**: *"si es sólo material
documentado va a ser algo frío… si la respuesta es fría el padre quizá no quiera volver a
preguntar"*.

**Un asistente frío no es más seguro: es menos consultado, y uno que nadie consulta no protege a
nadie.** En este producto la frialdad es una falla, no una precaución.

La línea NO va entre "documentado" y "criterio". Va entre **el dato y el acompañamiento**:

- 🔴 **Nunca inventa** — cifras, normativa, qué vio el sistema, qué dice el informe. Sale del
  objeto `Lectura` y del prompt estable. Si no está, lo dice.
- 🔴 **Nunca hace tres cosas**, por más que sea lo cálido: **diagnosticar, tranquilizar, estimar
  probabilidad.** Aunque el padre lo pida —y lo va a pedir— no puede decir *"por lo que veo no
  parece nada"*: esa frase, dicha a la madre equivocada, cierra un caso real.
- ✅ **Sí hace, y con calor:** explicar el informe en criollo, **ordenarle las opciones**, decirle
  **cómo abrir la conversación**, qué conviene no decir, y cuándo la respuesta es llamar al 137 en
  vez de seguir hablando con él.

🔑 **Lo técnico que vuelve segura la calidez:** el control de `reglas.ts` trabaja sobre las
**afirmaciones**, no sobre el registro. Se puede escribir cálido sin aflojar un guardarraíl — son
perillas independientes, así que no hay que elegir.

📌 **"Analizá la alerta y decime qué opciones tengo" NO es inventar.** La lectura ya trae los
números hechos (días sostenidos, alcance, cruce, etapa): razonar sobre eso es trabajar con lo que
hay. Es probablemente lo más útil que puede hacer.

🔑 **Y un dato del propio proyecto que tiene que ordenar el consejo: el 43% de los chicos no habla
de estos temas con sus padres.** O sea que el consejo de manual —"hablá con tu hija"— tiene casi
la mitad de probabilidades de no funcionar. Por eso existe el segundo adulto elegido por el chico.
El asistente tiene que **usar** eso, no repetir el consejo genérico.

### ⚠ Antes de que lo vea nadie

El asistente va a ser **lo más citado del producto**: si un padre repite algo que le dijo AntiGro,
lo repite como si lo hubiera dicho el sistema. **Las primeras respuestas reales las lee Edgardo**,
igual que el primer mensaje del 14/8 — que fue el que enseñó la regla del "volumen de mensajes".

📌 Piezas que ya existen y se reusan: `src/lib/ia/reglas.ts` (el control, ya probado contra una
invención real), `src/lib/ia/respaldo.ts` (los textos deterministas) y el objeto `Lectura`.
📌 Sin decidir: si el chico tiene el suyo más adelante, y qué se le puede decir a un menor.

---

## El simulador

**No es un reemplazo de los datos reales: es la única forma honesta de mostrar esto.** Un
sistema de riesgo no se puede demostrar con datos sanos — en una casa donde no pasa nada, el
sistema no dice nada, y eso no se filma.

🔑 **La entrada de datos va detrás de una interfaz única desde la fase 0**, para que el
simulador de hoy y un NextDNS real de mañana entren por el mismo lugar.

Tres controles — **hechos, en `src/app/_demo/Consola.tsx`**:
1. **Perfil** — edad y género.
2. **Escenario** — prearmados de un clic: semana normal · cambio leve · patrón que persiste ·
   intento de saltar el filtro.
3. **Reloj** — comprime tres semanas en unos segundos. Es lo que hace visible la persistencia.

📌 Hay un cuarto control que no estaba en el plan: **qué contestaron los adultos** (sin
responder · algunas cosas · bastantes). Es la segunda entrada del motor, y sin poder moverla el
cuestionario no se ve por ningún lado.

🎬 **El momento del video es el sistema quedándose callado:** día 1 sin alerta, día 5 sin
alerta, y recién el día 18 aparece el aviso. Cualquiera programa algo que grite; lo que se nota
es un sistema que sabe cuándo no molestar.

---

## El mensaje al chico, por banda de edad

Las bandas salen de los datos: el grueso de las víctimas está entre 11 y 15 años (Ministerio,
2023), la franja más vulnerable va de 9 a 13 (Grooming LATAM, 2025) y hay un segundo grupo
importante entre 7 y 10.

⚠ **Estas bandas de MENSAJE no son las bandas de `factorEdad`, y está bien que no lo sean.**
Acá se decide *cómo se le habla*; en `pesos.ts` se decide *cuánto pesa*. Cambiar una no obliga a
cambiar la otra.

| Banda | Cómo se le habla | A quién se lo deriva |
|---|---|---|
| **7–10** | Corto y concreto, una idea por mensaje, sin abstracciones | Directo al adulto de confianza |
| **11–13** | Se explica el mecanismo; se nombra el grooming como delito | Adulto de confianza + Línea 137 |
| **14–17** | De igual a igual, nada que suene a reto ni a control | El adulto que eligió él, Línea 137, denuncia |

⚠ **Guardarraíl de género:** se diferencia sólo **qué tipo de riesgo se enfatiza**, y sólo donde
hay dato que lo respalde (el 80% de las víctimas de acoso virtual son nenas). El tono y el
respeto son iguales para todos. Si el mensaje suena distinto según si es varón o mujer más allá
de eso, se nota y juega en contra.

📌 **Sin decidir (fase 3): si el chico ve el nombre "AntiGro".** Para el adulto que contrata
dice exactamente qué hace; para el chico, cada aviso le recuerda que se lo considera una
víctima posible.

---

## Fuera de alcance — decidido, no pendiente

| Qué | Por qué |
|---|---|
| Leer el contenido de las conversaciones | Cruza la línea del producto. Exige app nativa. |
| GPS / ubicación | **Límite técnico duro:** la web no lee GPS en segundo plano. Y Family Link y Apple ya lo hacen gratis. |
| WhatsApp saliente | La API oficial de Meta exige verificación de empresa y plantillas aprobadas. No entra en 9 días. **Queda como opción del panel, lista para conectar.** |
| NextDNS real | Edgardo no tiene cuenta. **La puerta queda hecha.** |

---

## Las estadísticas que sostienen el motor

### Fuente 1 — Estudio nacional (Argentina, 2023)

Del **Estudio nacional sobre acoso sexual a NNyA mediante TIC**, Ministerio de Justicia y
Derechos Humanos de la Nación, Dirección Nacional de Política Criminal, 2023 — que a su vez
recopila UNESCO/CIPDH, Grooming Argentina, Argentina Cibersegura, ESET y Google.

- **Argentina es el 2º país de América Latina con más casos de ciberacoso infantil**, sólo
  detrás de México (UNESCO/CIPDH). Le siguen Honduras, Costa Rica y Chile.
- **74,3%** de los casos se perpetran por WhatsApp.
- **80%** de las víctimas de acoso virtual infantil son nenas.
- **56,4%** de los chicos de 9 a 17 habla con desconocidos; **35,4%** recibió pedido de fotos
  desnudo o con poca ropa (Grooming Argentina, n=4.276).
- **63%** no sabe qué es el grooming. **43%** no habla del tema con sus padres.
- **60%** de los hechos no se denuncia, por vergüenza o falta de información.
- **90%** de las víctimas sufre acoso cotidiano, sostenido durante meses.
- **40%** de los adultos no conoce las herramientas de control parental que ya existen.
- Delito desde 2013: **Ley 26.904**, art. 131 CP, 6 meses a 4 años. Programa Nacional desde
  2020: **Ley 27.590 «Mica Ortega»**.
- Recursos oficiales a los que se deriva: **Línea 137** y la app **GAPP** de Grooming Argentina.

### Fuente 2 — Informe Grooming LATAM (14 países, 2024/2025) · **incorporada el 15/8/2026**

Red Grooming LATAM (impulsada por Grooming Argentina), presentado en mayo de 2025.
**n≈28.360 encuestas anónimas a NNyA de 9 a 17 años en 14 países.**
https://groomingarg.org/informe-grooming-latam

🔑 **Es más grande y más nueva que la fuente 1, y coincide con ella.** Dos estudios
independientes, dos años y muestras distintas, misma dirección: eso es más fuerte que cualquiera
de los dos solo.

| | LATAM 2025 | Ministerio 2023 |
|---|---|---|
| No sabe qué es el grooming | **72,8%** | 63% |
| Habla con desconocidos | **60,0%** | 56,4% |

Cifras nuevas que no estaban en la fuente 1:
- 🔴 **Franja más vulnerable: 9 a 13 años.** Es lo que corrigió `factorEdad`: antes los de 9 y
  10 pesaban 0,94 y quedaban por debajo de los de 11 a 15. ⚠ **Pero la corrección arregla el
  puntaje, no el momento:** medido, la edad cambia el día en que el sistema habla en 1 de 24
  combinaciones. El detalle y la palanca correcta están comentados en `pesos.ts`.
- 🔑 **33,3%** recibió una propuesta de noviazgo dentro de un juego en línea.
- **64,9%** cree saber más de tecnología que sus padres o tutores.
- **57,9%** pasa 5 horas o más por día conectado (5-6 h: 36,8% · 7+ h: 21,1%).
- **4,4%** fue víctima de imágenes falsas hechas con IA.
- Juegos más usados: Roblox y Free Fire. Apps: WhatsApp, TikTok, YouTube, Instagram.

🔴 **Trampa de citación: el informe se contradice a sí mismo en tres lugares.** El gráfico del
primer celular dice 25,5 / 62,2 / 12,3 y el texto debajo dice 28 / 63 / 9; el gráfico de apps no
coincide con su lista numerada; el de juegos tampoco. **Citar el GRÁFICO, nunca el texto**, y
siempre con fecha y n. Es material institucional de prensa, no un paper revisado.

⚠ **Choca con el `docs/guion-trailer.md`**, que usa *"4 de cada 10 tiene su primer teléfono antes
de los 9"* (Grooming Argentina vía Canal 12, 3/2026). Acá es 25,5%, pero **sobre 14 países**. No
se contradicen —son universos distintos— pero si se usa el 40% hay que decir **"en Argentina"**.

### Fuente 3 — MPBA · sin cifras, pero sirve

[Ministerio Público de la Provincia de Buenos Aires](https://www.mpba.gov.ar/grooming). **No
publica ninguna estadística** ni casuística bonaerense. Su valor es otro: su lista oficial de
recomendaciones a adultos incluye *"observar cambios de humor y horarios de conexión"*, y eso
respalda institucionalmente dos ítems del cuestionario que estaban sin fuente.

📌 Por eso `cuestionario.ts` tiene ahora **tres** clases de procedencia y no dos: `estudio` (hay
cifra), **`organismo`** (un organismo oficial lo recomienda, pero sin cifra detrás) y
`observable` (sólo un hecho que el adulto puede ver).

### 🔴 Lo que estas fuentes NO resuelven

- **La ventana de observación: nada, y ya no hace falta.** La pregunta se disolvió: el sistema
  no espera una cantidad fija de días. Ver el rediseño del perfil más arriba.
- **Casuística por jurisdicción: nada.** El informe LATAM es regional y agregado, sin corte por
  país ni provincia. La frase de Navarro sigue vigente — y ahora la sostiene su propio informe.
- **Desconocimiento del grooming en ADULTOS: sigue faltando.** El 64,9% es lo que *creen los
  chicos* sobre sus padres, no una medición sobre adultos. No sirve como reemplazo.

⚠ La parte académica internacional (indicadores conductuales, PAN12, detección por NLP) viene
de búsqueda web y **no está verificada en fuente primaria**. Si va a un video o a una
publicación, se confirma antes.

---

## Reglas de trabajo

- Rama por fase, `npm run typecheck` antes de cada commit.
- Verificación visual en **`localhost:3007`**, no en el 3000: en el 3000 hay un service worker
  de un proyecto viejo que sirve su caché por encima de lo que devuelva el servidor.
- ⚠ **El repositorio en memoria va colgado de `globalThis`**, no de una variable de módulo:
  Next le puede dar a cada ruta su propia copia y quedan dos verdades distintas (el webhook
  vinculaba a alguien y la página de la familia lo seguía viendo sin vincular).
- ⚠ **No correr `npm run build` con el `npm run dev` levantado:** comparten `.next` y el build
  le voltea los chunks al servidor de desarrollo (`Cannot find module './vendor-chunks/next.js'`).
  Si pasa: matar el dev, `rm -rf .next`, y levantarlo de nuevo.
- **El modo demo tiene que seguir andando siempre:** es lo que permite que el jurado entre sin
  cuenta. Es un criterio de 25 puntos.
- Registro cordial y voseo en todo texto de cara al usuario. Nada de jerga sin traducir.
- ⚠ En este dominio **Edgardo no es la fuente** (a diferencia de calefacción): todo dato se cita
  o no se afirma.
