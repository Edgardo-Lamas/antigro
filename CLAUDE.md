# AntiGro — Guía del proyecto

Sistema que **percibe** señales de que un chico puede estar siendo acosado en internet, sin leer
un solo mensaje suyo. Cruza lo que ve la red, lo que observan los adultos, y lo que dicen las
estadísticas oficiales sobre qué pesa cuánto.

**Entrega: domingo 2026-08-23, 23:59 hora Argentina** (CoderCup AI de Coderhouse).
**El código se congela el jueves 20** — después hay que grabar y editar el video de 2 minutos.

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

Repo: `Edgardo-Lamas/antigroo`. El motor se clonó de `rodos-3` y se dejó afuera todo lo de
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

📌 **Falta el token del bot de Telegram** (`TELEGRAM_BOT_TOKEN` y `TELEGRAM_BOT_USERNAME`).
Lo saca él con `/newbot` en @BotFather; **yo no puedo: hace falta una cuenta de Telegram.**
⚠ **La cuenta de Resend es de Rodrigo y no tiene dominio verificado:** sólo puede enviar a
`rodos.si3.0@gmail.com`. Para el video, el canal que se muestra es Telegram.

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

## El simulador

**No es un reemplazo de los datos reales: es la única forma honesta de mostrar esto.** Un
sistema de riesgo no se puede demostrar con datos sanos — en una casa donde no pasa nada, el
sistema no dice nada, y eso no se filma.

🔑 **La entrada de datos va detrás de una interfaz única desde la fase 0**, para que el
simulador de hoy y un NextDNS real de mañana entren por el mismo lugar.

Tres controles:
1. **Perfil** — edad y género.
2. **Escenario** — prearmados de un clic: semana normal · cambio leve · patrón que persiste ·
   intento de saltar el filtro.
3. **Reloj** — comprime tres semanas en diez segundos. Es lo que hace visible la persistencia.

🎬 **El momento del video es el sistema quedándose callado:** día 1 sin alerta, día 5 sin
alerta, y recién el día 18 aparece el aviso. Cualquiera programa algo que grite; lo que se nota
es un sistema que sabe cuándo no molestar.

---

## El mensaje al chico, por banda de edad

Las bandas salen de los datos: el grueso de las víctimas está entre 11 y 15 años, con un
segundo grupo importante entre 7 y 10.

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

Todas del **Estudio nacional sobre acoso sexual a NNyA mediante TIC**, Ministerio de Justicia y
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

⚠ La parte académica internacional (indicadores conductuales, PAN12, detección por NLP) viene
de búsqueda web y **no está verificada en fuente primaria**. Si va a un video o a una
publicación, se confirma antes.

---

## Reglas de trabajo

- Rama por fase, `npm run typecheck` antes de cada commit.
- Verificación visual en **`localhost:3007`**, no en el 3000: en el 3000 hay un service worker
  de un proyecto viejo que sirve su caché por encima de lo que devuelva el servidor.
- ⚠ **No correr `npm run build` con el `npm run dev` levantado:** comparten `.next` y el build
  le voltea los chunks al servidor de desarrollo (`Cannot find module './vendor-chunks/next.js'`).
  Si pasa: matar el dev, `rm -rf .next`, y levantarlo de nuevo.
- **El modo demo tiene que seguir andando siempre:** es lo que permite que el jurado entre sin
  cuenta. Es un criterio de 25 puntos.
- Registro cordial y voseo en todo texto de cara al usuario. Nada de jerga sin traducir.
- ⚠ En este dominio **Edgardo no es la fuente** (a diferencia de calefacción): todo dato se cita
  o no se afirma.
