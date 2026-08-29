# AntiGro — Guía del proyecto

Sistema que **percibe** señales de que un chico puede estar siendo acosado en internet, sin leer
un solo mensaje suyo. Cruza lo que ve la red, lo que observan los adultos, y lo que dicen las
estadísticas oficiales sobre qué pesa cuánto.

**Entrega: domingo 2026-08-23, 23:59 hora Argentina** (CoderCup AI de Coderhouse).
⚠ **NO hay congelamiento el jueves 20.** Esa fecha era un colchón nuestro, no de las bases, y
Edgardo lo volteó el 19/8: *"tenemos margen con un buen colchón, no tiene sentido que me
autoimponga una soga al cuello"*. Lo que sí queda del criterio: **el último día no se toca motor,
base ni entrega de mensajes**, y hay que dejar tiempo para grabar y editar el video de 2 minutos.

---

## 🔴 FACEBOOK Y MESSENGER NO ESTABAN EN EL CATÁLOGO — arreglado el 28/8

**Salió de una pregunta de Edgardo:** si se le podía hacer llegar al sistema alguna base de datos
externa que le sume al análisis. Al ir a mirar dónde entraría una, apareció que el agujero no era
la falta de una base: era el catálogo propio.

🔴 **`CATALOGO` en `src/lib/senales/plataformas.ts` tenía DOCE entradas escritas a mano, y
Facebook no era una de ellas.** El Estudio nacional —la fuente que este proyecto usa para calibrar
los pesos— lo mide como el **primer** medio de contacto en Argentina (**52,8%**, por encima de
Instagram 33,1% y WhatsApp 30,7%), y el encabezado de ese mismo archivo lo cita desde que se
escribió. **La fuente estaba, la entrada no.**

➡ **Qué se rompía, y no era cosmético:** Facebook caía en `desconocida`, así que la secuencia
*Facebook → WhatsApp* —el traslado más frecuente que describe nuestra propia fuente— **no
disparaba `esCruce`**. La señal más filosa del motor era ciega justo en la plataforma número uno.

✅ **Agregados los dos, en `contacto_abierto`** y no con la mensajería: la propiedad que gobierna
ese archivo es *si un desconocido puede escribirle sin que el chico le entregue nada*, y en
Facebook/Messenger el mensaje de un desconocido cae en «solicitudes de mensajes» y el chico lo lee
igual. Es el mismo motivo por el que Snapchat está arriba y no abajo.
📌 **`fbcdn.net` queda afuera a propósito:** es infraestructura de contenido y también se resuelve
al abrir Instagram — meterlo llamaría «Facebook» a tráfico que no lo es.
📌 **Messenger comparte dominios con Facebook en el DNS.** Ponerlos en la misma puerta hace que esa
ambigüedad no cambie la lectura; separarlos habría hecho depender el resultado de una distinción
que el filtro no siempre puede hacer.

### ✅ `npm run probar-plataformas` — la tanda 12, hoy con **42 comprobaciones**

🔑 **La comprobación que importa no es «Facebook está»: es que ninguna plataforma nombrada por
nuestras propias fuentes quede sin clasificar.** Una entrada suelta se vuelve a olvidar; una lista
anclada a la fuente se pone roja sola. Cubre además el cruce en las dos direcciones, los
subdominios, y que `fbcdn.net` siga afuera.
⚠ **Nada de esto lo veía el typecheck ni ninguna tanda anterior:** no había código roto, había un
catálogo incompleto. **El catálogo era la única pieza del motor sin pruebas.**

### ⚠ La frase del observatorio decía de más — corregida

`observatorio/index.ts` rotulaba un dominio sin clasificar como *«no está catalogado en ningún
lado»*, y es más de lo que el sistema puede afirmar: el catálogo es **nuestro** y tiene un puñado
de entradas. Con doce, esa frase la disparaba `spotify.com`. Ahora dice **«no lo reconoce el
catálogo de lugares del sistema»**, que es la verdad. El motivo sigue valiendo igual —un lugar que
no reconocemos, con lift alto, es un hallazgo— pero se lee sin prometer una autoridad que no hay.

### 📌 Los números de la demo NO se movieron

El simulador emite `roblox.com`, `freefire.garena.com`, `minecraft.net`, `snapchat.com`,
`whatsapp.net`, `discord.com` y `telegram.org` (`simulador.ts:116`). **Facebook no está entre
ellos**, así que los días en que el sistema habla siguen siendo los mismos —17 / 12 / 14 / 20— y
el PDF de presentación y el gráfico siguen válidos sin regenerarlos.

### ✅ EL CATÁLOGO IMPORTADO — 43 servicios, 400 dominios (28/8, misma sesión)

**Él lo cerró en una línea:** *"¿cuál es el problema de colocar todas? OBVIO que es información
para análisis, siempre"*. Tenía razón y mi pregunta estaba mal planteada: **no había que elegir
cuáles entran, había que decidir en qué puerta cae cada una.**

📦 **Fuente: `github.com/nextdns/services`, licencia MIT**, bajado el 28/8. Vive en
`src/lib/senales/servicios.ts`; `plataformas.ts` lo consulta.

⚠ **No se importó a ciegas, y menos mal:** de los 404 dominios, **tres son basura de la fuente** —
`xboxlive.xom` (typo de `.com`), `youtube` sin dominio y `_spotify-connect._tcp.local`, que es
mDNS— y `ttvnw.net` viene repetido. Quedan **400 únicos**.

🔴 **La decisión que sostiene todo: dominios de USO vs. INFRAESTRUCTURA.** 127 de los 400 son CDN y
analítica (`rbxcdn.com`, `ttvnw.net`, `scdn.co`, `nflxvideo.net`). **Entran igual** —si no, el
observatorio los levantaría como lugares sin catalogar y llenaría los hallazgos con las texturas de
Roblox— pero van en `infraestructura` y se leen como **`sin_contacto`**. El motivo es el cruce:
`rbxcdn.com` no es un lugar donde alguien te escribe, y si contara como Roblox **la señal más
filosa del motor se dispararía porque el chico cargó una imagen**.

🔴 **El catálogo PROPIO se consulta primero, y el orden no es indiferente.** Ahí viven decisiones
tomadas —WhatsApp es destino (15/8), Snapchat va con los abiertos, Facebook y Messenger son
contacto abierto (28/8)—. Si la lista importada resolviera antes, un cambio de NextDNS podría
voltear una decisión nuestra en silencio. Hay cinco comprobaciones que lo verifican.

| Puerta | Servicios |
|---|---|
| `contacto_abierto` | **24** — Facebook, Messenger, Instagram, TikTok, Snapchat, Roblox, Minecraft, Fortnite, Twitch, Reddit, X, VK, Tumblr, Tinder, Xbox Live, PSN, Blizzard, LoL, + las 5 dudosas |
| `requiere_entrega` | **7** — WhatsApp, Telegram, Discord, Signal, Google Chat, Zoom, BeReal |
| `sin_contacto` | **12** — YouTube, Netflix, Spotify, Amazon, eBay, Disney+, HBO Max, Hulu, Prime Video, Vimeo, Dailymotion, ChatGPT |

⬜ **Siete marcadas `⬜ a revisar` en el archivo, y son decisión de Edgardo, no del código:** 9GAG,
BeReal, Imgur, Mastodon, Pinterest, Skype y Steam. **No es duda sobre si entran: es sobre en qué
puerta caen.** Están del lado que más señal produce, que es el conservador para un sistema que
cuida a un chico — pero una de más en `contacto_abierto` dispara el cruce sin motivo.

📌 **Lo que la fuente NO trae y por eso las regex propias no se borraron:** Free Fire —la #2 de la
región según el Informe LATAM— y los chats con extraños tipo Omegle.

### ✅ LA EVASIÓN YA TIENE DOMINIOS — `claseDeEvasion()` (28/8)

**Hasta hoy la señal de peso 1 sólo la emitía el simulador, ya etiquetada: el sistema no sabía
reconocer un solo dominio de VPN.**

🔴 **Dos clases, y mezclarlas saldría caro:** `vpn_o_proxy` es un **acto deliberado** —nadie termina
en NordVPN sin querer—; `dns_alternativo` **puede no ser del chico**, porque Firefox usa el DoH de
Cloudflare por su cuenta en varios países. Quien escriba la traducción de NextDNS decide el peso de
cada una; lo que este archivo no puede hacer es borrar la diferencia.
📌 **`dns.nextdns.io` no está y no puede estar:** es el nuestro. Hay una comprobación que lo mira.

⚖ **La lista es NUESTRA y corta, a propósito.** La buena del rubro es
`hagezi/dns-blocklists` (`doh-vpn-proxy-bypass`, **16.704 entradas, diaria**) y **NextDNS ya la
aplica** en *Block Bypass Methods* — pero es **GPL-3.0**, y esto se cobra: redistribuirla adentro no
se hace sin mirar la licencia con alguien que sepa. Con cuenta, la aportan ellos sin que nosotros
redistribuyamos nada.
📌 Los 35 dominios se verificaron por resolución DNS: **ninguno inventado.** Entre ellos
`1clickvpn.net`, que no salió de una lista sino de una sesión real — es la extensión que rompió el
login del curso el 27/8.

⚠ **Y hay que decirlo sin vueltas: nada de esto enciende el sistema.** Sin NextDNS,
`FuenteNextDNS.leer()` sigue devolviendo vacío y ningún dominio real llega hasta acá. Lo de hoy
mejora el simulador y el observatorio, y deja las piezas puestas.

### 🔴 EL ORDEN QUE QUEDÓ, decidido por él el 28/8

*"resumiendo hueco 1 y 2 van ahora, luego que veas el PDF hueco 3 y luego NextDNS"*.

1. ✅ **El catálogo** (hecho hoy) · ✅ **los dominios de evasión** (hecho hoy).
2. ⬜ **Leer el PDF de Kids Online Argentina 2025** (UNICEF/UNESCO, 291 escuelas, 20 jurisdicciones,
   9 a 17, representativo por edad, género y NSE) y ver si desagrega uso por edad. Si lo hace, entra
   como referencia poblacional y la vía absoluta deja de tener sólo dos señales.
   🔑 Trae además un dato que toca lo que ya usamos: **47% tuvo contacto con desconocidos**, contra
   el 60% del LATAM y el 40% de CHS. Es el único con muestra representativa argentina.
3. ⬜ **NextDNS.** 🔴 **Y la nota vieja decía mal que era una decisión permanente: era «no se
   conecta PARA EL CODERCUP» (19/8), y el CoderCup ya pasó.** Lo levantó él: *"PARA QUE el sistema
   funcione hay que tener NextDNS ¿o me equivoco?"* — **no se equivoca.** Sin cuenta, la fuente cae
   al simulador, el reloj no escala nunca y **el panel de una familia real no alerta jamás**.
   NextDNS no es un accesorio: es el único ojo del sistema. US$ 1,99/mes por familia.

⚠ **Lo que NO entra, y ya está investigado dos veces:** listas de material de abuso (IWF, Arachnid,
Safe Browsing) —el grooming pasa en las plataformas más populares— y los corpus de chats de
predadores, que rompen la regla 2.

### 🔴🔴 EL INFORME DE PERPLEXITY REPITIÓ EL MISMO ERROR QUE EN AGOSTO

Él lo trajo el 28/8. **Vuelve a afirmar que PhishTank, URLhaus y OISD *"contienen dominios
conocidos por alojar CSAM o sitios de grooming"*. Es FALSO, y ya estaba verificado acá desde el
18/8.** Re-verificado ese día contra `oisd.nl`: bloquea **ads, phishing, malware, spyware,
ransomware, cryptojacking y telemetría**, más una lista aparte de porno/gore. Ni una mención de
CSAM ni de grooming. Encima inventa que OISD significa *"Open Internet Safety Data"*: el sitio no
define la sigla en ningún lado.
📌 **Sirve para abrir puertas, no para cerrar decisiones** — la pista de la API de NextDNS fue la
que llevó a `nextdns/services`, que es de donde salió todo lo de arriba.

---

## 🤝 SANDRA ORTELLADO TRABAJA ACÁ DESDE EL 22/8 — Y LA UX/UI ES SUYA

**`SanOrtellado` en GitHub.** Psicóloga y desarrolladora; se ofreció sola y no cobró. Tiene
**permiso `write`**. 🔴 **Edgardo pidió expresamente que la UX/UI la haga ella y que nosotros no
toquemos nada de eso** — la apuesta es la relación profesional, no la velocidad del producto.

🔴 **`main` AHORA ESTÁ PROTEGIDA, y cambia cómo se publica:**

| | |
|---|---|
| PR obligatorio | **sí**, con **cero aprobaciones** (ella mergea sola, sin esperar a nadie) |
| `enforce_admins` | **false** — Edgardo (admin) **sigue pusheando directo a `main`** |
| Bloqueado | push forzado y borrado de `main` |

⚠ **`maintain` y `triage` no existen en repos personales.** Sólo hay `pull · push · admin`. La API
acepta el PATCH y lo guarda como `write` igual.
✅ **Para levantar el proyecto no hace falta ninguna clave:** sin Supabase cae al repositorio en
memoria y sin NextDNS al simulador. `npm run dev -- -p 3007`.

### 🔑 Lo que encontró, y es un diagnóstico y no una lista

No encontró **el «por qué» de la alerta, los estados ni qué señales mira el sistema** — **las tres
están construidas**. Lo que pidió como *"el cambio más importante"* es textual lo que ya genera el
sistema y esconde detrás de «Ver el mensaje». Miró a las 19:34; el arreglo de esa ruta se publicó a
las 17:26. **Lo tenía andando y no lo encontró igual.**
🔴 **Tercera vez en una semana con el mismo patrón:** el asistente a 1.865 px · «Ver el mensaje»
muerto cuatro días · el «por qué» invisible. **AntiGro tiene más de lo que muestra, y ese es el
problema de fondo.**
📌 Da en el clavo con nuestra propia norma en `Falta NEXTDNS_API_KEY`, `Falta CORREO_REMITENTE` y
`alcance 0.00`: es **jerga sin traducir**. ⚠ Pero ese bloque **no se borra** —es la honestidad del
sistema y sostiene el modo demo—: **se traduce**.

---

## 🎬 EL GUION DEL VIDEO — escrito el 22/8, falta grabarlo

📌 `docs/guion-video-codercup.md` (fuente) · `docs/guion-video/guion-impreso.html` (maqueta A4) ·
PDF en el Escritorio. **Sin commitear.**
🔴 **1:56 de 2:00.** La voz son **256 palabras contadas** (114 s a 135 p/m) + 2 s de negro. La
primera versión daba **2:19 y no entraba**. **Grabar la voz primero y cronometrarla.**
🔴 **El bloque del producto va con captura de pantalla REAL, no con clips generados** — es lo único
que prueba Ejecución. Y su punto 4 —«Ver el mensaje» abierto, con el «por qué» a la vista— **es el
corazón del video**, justo lo que Sandra no encontró sola.
⚠ La cifra de detenidos de la causa de Córdoba se mueve: la placa dice «al 22 de agosto de 2026».

---

## 🔴 LO PRIMERO, HOY: LA CUENTA DE ANTHROPIC NO TIENE CRÉDITO

**Toda la IA del sistema está caída por eso, y sólo por eso** — el asistente contesta el respaldo y
la escalada manda texto de respaldo. La clave está bien; lo que falta es plata en la cuenta.
**Hasta que se cargue, no tiene sentido mandarle el enlace a nadie a probar el asistente.**

🔴 **Al 22/8 sigue igual, y ya no parece el banco:** *"hice otros pagos sin problema pero la consola
de Anthropic no me recibe ahora mi cuenta"*. Verificado ese día contra producción —
`POST /api/demo/mensajes` devuelve **`origen: "respaldo"`** en los dos textos. **Es la forma más
rápida de comprobar si la IA volvió: si dice `respaldo`, sigue caída.**
📌 **Camino alternativo si no se destraba:** la **API de Gemini es gratuita y no pide tarjeta**.
Tocaría `redactar.ts`, `asistente.ts` y el control anti-invención. **No evaluado a fondo — Edgardo
no lo pidió todavía.**
📌 El detalle y por qué costó una sesión encontrarlo, en «EL ASISTENTE CAÍA AL RESPALDO».

---

## ✅ RESUELTO EL 21/8 — EL BARRIDO DE CIFRAS CONTRA LA FUENTE PRIMARIA

**El PDF oficial está descargado y leído entero, no citado de memoria.**
🔗 https://www.argentina.gob.ar/sites/default/files/2024/10/encuesta_nacional_grooming_-_ano_2021.pdf

🔑 **LA TRAMPA, y hay que entenderla UNA vez para no volver a caer:** las primeras ~30 páginas del
estudio son **estado del arte** — resúmenes de estudios AJENOS (ESET 2013, Digi Padres, Grooming
Argentina, El Litoral, una encuesta en 11 escuelas, UNESCO/CIPDH, Google). La medición propia del
Ministerio empieza recién en los resultados de la encuesta a hogares. **Todo lo citado antes de ahí
NO es del estudio, por más que esté adentro del PDF del estudio.**
📌 El detalle completo, cifra por cifra y con quién la dijo de verdad, está en «Las estadísticas que
sostienen el motor → Fuente 1», más abajo. **Ahí está todo, no reconstruirlo.**

### Empezó por dos cifras y terminó siendo seis

Edgardo lo autorizó en dos pasos: primero decidió qué hacer con el 43% (*«las dos cosas»*), y
cuando apareció que el 74,3% tenía el mismo defecto: *«corregí lo que se tenga que corregir»*.

> 🔴🔴 **CORRECCIÓN DEL 23/8/2026 — LA TABLA DE ABAJO ESTÁ MAL EN UN PUNTO CLAVE.**
> Se verificó contra la fuente primaria (prensa del informe, 4/11/2021): **el informe del CIPDH,
> en el marco de UNESCO, NO mide sólo bullying virtual.** Abarca ciberacoso, bullying virtual,
> **grooming y pornografía infantil**, y **el 86,7% de sus casos corresponde a grooming y
> pornografía infantil**. WhatsApp aparece en el **74,3% de esos casos** (el 25,7% restante se lo
> reparten Instagram, Facebook, Twitter, Zoom y Telegram).
> ➡ **El 74,3%, el 80%, el 90% y el 60% SE PUEDEN CITAR diciendo «de los casos»**, con la fuente al
> pie: *CIPDH-UNESCO, 2021*. Lo que corresponde es nombrar de quién son, no re-rotularlos.
> ⚠ **Salvedad honesta:** son cifras de **denuncias y causas judiciales** (6.000 denuncias en 2021,
> 25 causas por día, ~30.000 desde 2012) más una encuesta telefónica de 2.654 casos en familias con
> hijos de 5 a 15. «Más casos» mide en parte cuánto se denuncia, no sólo cuánto pasa.
> 🔴 **El 63% sigue estando mal** y esa fila es correcta: es de El Litoral (2018) y además choca con
> el «7 de cada 10» del informe LATAM. Ésa es la única que hay que cambiar.
> 📌 **PENDIENTE, no se tocó:** la nota falsa está copiada en `src/lib/ia/reglas.ts` (donde 74,3 /
> 80 / 90 quedaron EXCLUIDOS de `CIFRAS_CITABLES`, así que el asistente los trata como inventados y
> cae al respaldo), `src/app/guia/page.tsx:418`, `src/lib/motor/evaluar.ts:11`,
> `src/lib/motor/pesos.ts:232` y `:371`, `src/lib/datos/tipos.ts:132` y
> `src/lib/senales/plataformas.ts:39`.


| Decía el producto | Verdad | Qué se hizo |
|---|---|---|
| **74,3%** pasa por WhatsApp *(estudio)* | **UNESCO/CIPDH, y mide bullying virtual** | Entró lo que el estudio midió: **Facebook 52,8% · Instagram 33,1% · WhatsApp 30,7%** |
| **80%** de las víctimas son nenas | Ídem, bullying virtual | **66,3% femenino** (grooming, medido) |
| **90%** sufre acoso cotidiano durante meses | Ídem, bullying virtual | **43,5% acosado más de una vez**, contra 29,3% una sola |
| **60%** de los hechos no se denuncia | Ídem, bullying virtual | **37,3% no denunció** en ningún lado |
| **63%** no sabe qué es el grooming | **El Litoral, 6/4/2018** | Sale. Lo reemplazan **72,8%** (LATAM, n≈28.360) donde habla de chicos y **23,1%** (estudio) donde habla de la población |
| **43%** no habla con sus padres | **Encuesta en 11 escuelas** | **Se queda con la fuente dicha**, y con la redacción real: *«dijo no hablar sobre los riesgos en Internet»* |
| **56,4% · 35,4%** *(en `/guia`)* | **Grooming Argentina**, n=4.276 | Movidas al bloque «lo que el estudio cita de otros» |
| **73,9% · 62,9% · 31%** *(dossier)* | **ESET, 2013** | Reatribuidas. El argumento no cambia |

🔑 **El argumento fundacional NO se cayó, y salió más fuerte:** las tres plataformas donde el
estudio ubica el grooming —Facebook, Instagram y WhatsApp— **están las tres permitidas y las tres
cifradas**, así que un filtro de DNS no ve nada de lo que pasa adentro de ninguna. Antes el
argumento colgaba de un solo número; ahora cuelga de una propiedad.

⚠ **Los dos universos del «dos tercios» NO son el mismo, y es fácil escribirlo mal** (pasó el
21/8, copiando el dossier): el estudio dice *«dos tercios de los hogares en los que se utiliza
Internet»*, **no** «dos tercios de los hogares que tienen controles».

⬜ **LO ÚNICO QUE QUEDÓ ABIERTO, y es decisión de producto:** los **15 años** pesan 0,97 en
`factorEdad` apoyados **sólo en ESET**, mientras la medición propia del estudio pone la franja de
15 a 17 en apenas 14,5%. **Los pesos NO se movieron** —el dato de ESET sigue existiendo y sigue
sosteniendo lo mismo; lo que cambió es quién lo firma— y el comentario de `pesos.ts` lo deja
escrito. 📌 Antes de tocarlo: la edad **casi nunca mueve el DÍA** en que el sistema habla (1 de 24
combinaciones, medido el 15/8), así que el arreglo, si algún día hace falta, es `diasExigidos`.

🔧 **Tocados — 13 archivos del producto:** `asistente.ts` · `redactar.ts` · `cuestionario.ts` ·
`config.ts` · `tipos.ts` · `respaldo.ts` · `reglas.ts` · `reglas.prueba.ts` · `evaluar.ts` ·
`pesos.ts` · `plataformas.ts` · `observatorio/index.ts` · `recomendaciones.ts` · `guia/page.tsx` ·
`panel/page.tsx` · `Recorrido.tsx` · `adultos/baja/route.ts`.
🔧 **Y el dossier de las psicólogas**, que ya había salido con dos de estos errores: los dos HTML,
el PDF regenerado (Escritorio + `docs/`) y **el artifact republicado en la misma URL**.
✅ Typecheck limpio · **383 comprobaciones en verde** · `npm run build` compila.

🔴 **La lista blanca de `reglas.ts` se barrió también** — salieron `63`, `74,3`, `80` y `90`;
entraron las que el estudio midió. ⚠ **Esa lista sólo decide si un número está inventado. Quién lo
dice lo gobierna el corpus del asistente, y las dos cosas tienen que moverse juntas.**

---

## 🔴 EL BOTÓN DE LA HOME MENTÍA — encontrado el 21/8, por la pregunta de Edgardo

**Iba a mandarle el enlace del sitio a las psicólogas y preguntó lo correcto:** *"¿por qué el
enlace tiene que llevar `?i=<código>`? yo quiero pasarles el enlace de vercel"*. Al ir a mirarlo,
el enlace pelado **no servía para lo que él quería**, y encima el sistema lo decía al revés.

🔴 **El botón decía «Entrar o empezar» SIEMPRE**, y abría `/entrar` pelado, que desde el 17/8 sólo
ofrece el logueo. O sea: prometía *empezar*, llevaba a una pantalla donde empezar no se puede, y
**no había una sola línea que explicara por qué**. Una psicóloga que llegara por ahí quedaba
mirando un logueo sin salida.
⚠ **Ni el typecheck ni las tandas podían verlo:** no hay nada roto: hay un botón que dice una cosa
y una pantalla que hace otra. Se ve abriendo el enlace como lo abre una persona.

✅ **Arreglado propagando el código, no abriendo el registro:**

| Quién llega | Qué ve |
|---|---|
| `antigro.vercel.app` pelado | **«Entrar a mi familia»** → el logueo. Es la verdad, y no le cuenta al que pasa que el registro existe |
| `antigro.vercel.app/?i=<código>` | **«Entrar o empezar»** → `/entrar?i=…`, con la pestaña de crear cuenta |
| `antigro.vercel.app/entrar?i=<código>` | Directo a crear, como antes |

🔑 **Así se puede mandar el enlace del SITIO y no el de la puerta**, que es lo que él quería: ven el
sistema andando primero —el orden que el producto defiende en todos lados— y recién después la
puerta. 🔴 **Y el registro sigue cerrado con llave**: la pantalla sólo arrastra el código, quien
decide sigue siendo `/api/alta/hogar`. Una comprobación en la pantalla es una comodidad, **nunca la
cerradura**.

### ✅ `prueba-alta.mjs` — el alta de cero, que no la probaba nadie

**Su otra pregunta la destapó:** *"quiero estar tranquilo que ellas crean un correo y contraseña y
automáticamente ingresan"*. 🔴 **`prueba-entrar.mjs` NO contesta eso** —mira la puerta y a propósito
no escribe en la base—, así que **el camino que hace una persona la primera vez no estaba cubierto**.

Cubre: el botón de la home (con código y sin), que el código llegue a la puerta, que el botón no se
habilite sin aceptar los términos, **que cree la cuenta y entre sola sin volver a loguearse**, que
caiga en el recorrido y no en un panel vacío, que la sesión sirva en todo el sistema, y **que con
esas credenciales vuelva a entrar desde un navegador limpio** —sin esto, «entró» podría significar
sólo que la sesión de ese momento quedó abierta—.
🧹 **Borra la familia al terminar**, así se puede correr las veces que haga falta. ⚠ Igual gasta una
de las 40 altas del día.

    SITIO=https://antigro.vercel.app node prueba-alta.mjs

⚠ **En localhost falla y NO es el producto: es `UntrustedHost` de NextAuth.** Sin
`AUTH_TRUST_HOST=true` el `signIn` posterior al alta cae en `/api/auth/error`. En Vercel no pasa.
**Correrla con `AUTH_TRUST_HOST=true npx next start` o directamente contra producción.**

---

## 🔴 EL ASISTENTE NO SE ENCONTRABA — arreglado el 21/8

**Lo levantó Edgardo antes de mandar el enlace:** *"no se ve el botón para el agente en ninguna de
las pantallas"*. **Medido, y no era una impresión.**

| Qué pasaba | Medido |
|---|---|
| El asistente **no era un botón en ningún lado** | Es una sección en el medio del panel |
| En el teléfono arrancaba a | **1.865 px — 2,2 pantallas de scroll** |
| Arriba del panel había | sólo «Saltar al contenido» y «Salir» |
| En la home y en el recorrido | no existe ni se lo menciona |

⚠ **Y es justo lo que se les pide probar a las psicólogas.** Que la pieza más consultada del
producto fuera la más difícil de encontrar es un defecto de producto, no de estilo: **si no la
encuentran, el feedback no llega nunca.** Puede explicar por sí solo que hubiera cero charlas.

✅ **`BotonDelAsistente`** en `mi-familia/page.tsx`: **fijo abajo a la derecha y siempre visible**
(ver el cambio del 24/8 más abajo), baja hasta **el campo** —no hasta el título de la sección— y
**deja el cursor ahí**: el que lo toca viene a escribir, y en el teléfono eso abre el teclado solo.
Salta con `scrollIntoView` sobre `#pregunta-al-asistente` y `block: "center"`, que deja la caja en
el medio con el final de la charla arriba y el botón «Preguntar» abajo, los dos a la vista.
📌 Respeta `prefers-reduced-motion`. 📌 Sólo vive en `/mi-familia`: en la home no hay familia ni
informe, y en el recorrido todavía no hay nada que preguntar. 📌 **El `pb-28` del `<main>` es parte
de esto:** sin ese colchón, un botón fijo tapa para siempre la esquina de abajo del final de la
página.

⚠ **Cómo se comprueba, porque el typecheck no lo ve:** con `viewport` de teléfono, logueado y **con
una charla ya empezada** —que es donde se rompía—, que el botón se vea desde arriba de todo y no
desaparezca en ningún punto del scroll, que al tocarlo la caja quede a la vista con el botón
«Preguntar» incluido, que el foco quede en `#pregunta-al-asistente`, y que desde ahí el asistente
conteste de verdad.

### 🔴 Y ESE MISMO DÍA TITILABA EN EL TELÉFONO — arreglado

**Lo levantó Edgardo horas después de que se pusiera:** *"aparece y desaparece muy rápido el botón
flotante"*. Medido en pantalla de 390×664: **doce cambios de estado con seis movimientos de la
barra de direcciones, sin tocar el scroll.**

🔑 **La causa: apagar y encender eran la MISMA raya** —el borde de abajo de la pantalla—. En el
teléfono esa raya no se queda quieta: la barra del navegador se esconde al bajar y vuelve al subir,
y la pantalla crece y se achica sola entre 60 y 100 px. Parado en esa franja, cada movimiento del
dedo cruzaba la raya de ida y de vuelta. **En el monitor no pasa nunca, porque ahí la pantalla no
cambia de alto.**

✅ **Dos observadores en vez de uno, separados por media pantalla:**
- **Se apaga** cuando la sección llegó a la mitad de la pantalla (`rootMargin: "0px 0px -50% 0px"`)
  — o sea cuando de verdad la estás mirando, no cuando asoma un borde.
- **Vuelve** recién cuando la sección se fue del todo.

Entre las dos rayas el botón se queda como está. Ninguna barra de navegador mide media pantalla,
así que el vaivén ya no puede cruzar las dos. 📌 Sigue sin haber un `scroll` a mano.

**Medido después del arreglo:** 14 posiciones × 4 vaivenes de la barra = **1 solo cambio de estado
en total** (antes: 12 en una sola posición), y el que queda no titila, se acomoda una vez y se
queda. ✓ El botón se sigue viendo desde arriba de todo, se sigue apagando con el asistente a la
vista, vuelve cuando quedó atrás, y sigue dejando el cursor en `#pregunta-al-asistente`.

⚠ **La lección, que sirve para cualquier cosa fija en el teléfono:** un umbral apoyado en el borde
de la pantalla es un umbral que se mueve solo. Si algo prende y apaga por posición, las dos rayas
tienen que estar separadas — y separadas por más de lo que mide la barra del navegador.

### 🔴 Y EL 24/8 SE CAYÓ TODO EL PRENDER Y APAGAR — decisión de Edgardo

**Volvió a levantarlo probándolo con una charla ya empezada:** *"no te deja justo ahí sino arriba de
todo donde sólo se ve texto, se debe scrolear para encontrar esa caja"* y *"aparece y desaparece
cuando scroleás hacia arriba o hacia abajo, DEBERÍA estar fijo"*.

🔑 **Las dos quejas eran el MISMO bug, y el arreglo del 21/8 no lo había tocado: el código miraba la
SECCIÓN cuando lo que importa es el CAMPO.** `#asistente` arranca con el título, sigue con la charla
entera —que crece con cada respuesta— y recién al final tiene la caja de escribir. Con conversación
cargada, ese `id` marca un punto que puede quedar a varias pantallas de lo único que el que apretó
el botón vino a hacer. De ahí salían las dos cosas: **el salto** dejaba al lector mirando texto, y
**el apagado** se disparaba cuando el borde de arriba de la sección llegaba a media pantalla, con la
caja todavía dos pantallas más abajo. El botón se iba justo cuando más falta hacía y volvía recién
al pasar la sección de largo.

✅ **El botón ya no se esconde nunca.** Se cayeron el `useState` y los dos `IntersectionObserver`.
El salto va a `#pregunta-al-asistente`, no a `#asistente`.

⚠ **La lección del 21/8 sigue en pie y no se borra, pero servía para el problema equivocado:** no
había que afinar el umbral, había que preguntarse **qué elemento hay que observar**. Un umbral bien
calibrado sobre el elemento incorrecto sigue estando mal. Si algún día vuelve a hacer falta
esconderlo, lo que se observa es el campo.

---

## ✅ RESUELTO EL 21/8 — EL ASISTENTE CAÍA AL RESPALDO: LA CUENTA SE QUEDÓ SIN CRÉDITO

**Y la sesión anterior había escrito acá que era «el camino de la ruta». Era falso.** Queda anotado
porque el error de diagnóstico es más caro que el bug: se midió que por la librería andaba y por la
pantalla no, y de esa diferencia se dedujo una causa. La diferencia era el **momento**, no el
camino — el crédito se agotó entre una medición y la otra.

### Lo que era, con todas las letras

```
400 invalid_request_error
"Your credit balance is too low to access the Anthropic API.
 Please go to Plans & Billing to upgrade or purchase credits."
```

🔑 **La clave es válida.** Un 400 así ya pasó la autenticación: si la clave estuviera mal sería un
401 `authentication_error`. No hay nada que cambiar en Vercel ni en `.env.local`.
🔴 **Se cae TODA la capa de IA, no sólo el asistente:** `redactar.ts` también, o sea el mensaje al
chico y la lectura de los adultos que salen solos por la escalada. Ahí no hay nadie mirando una
pantalla, así que un sistema caído y uno andando se ven exactamente igual.
📌 **Lo único que lo destraba es cargar crédito en la cuenta de Anthropic.** Es plata, así que lo
decide Edgardo.

### 🔴 Por qué costó una sesión encontrarlo, y qué se cambió para que no vuelva a pasar

**La API decía la causa exacta en el texto del error, y ese texto no se escribía en ningún lado.**
Viajaba en `motivos`, que no se guarda en la base y que la pantalla no muestra. Todo lo que quedaba
era `causa: "falla"` — «se cayó la llamada» — que es cierto y no sirve para nada.

✅ **Ahora se escribe en el registro del servidor**, con una marca que se busca igual en la terminal
que en los registros de Vercel:
- `[asistente] ✗ se cayó la llamada al modelo · <motivo>`
- `[redactar] ✗ no se pudo pedir el texto · <motivo>`

**Antes de diagnosticar cualquier cosa del asistente: mirar esa línea.** `node leer-charlas.mjs`
dice QUE falló; el registro del servidor dice POR QUÉ.

### ✅ Y el mislabel del límite, arreglado — era la otra mitad del fantasma

`route.ts` devolvía `causa: "falla"` cuando lo que había pasado era el tope de 30 preguntas por
hora. O sea que **el sistema funcionando como se diseñó quedaba registrado igual que el sistema
roto**, que es justo la distinción por la que existe el campo. ✅ Ahora es una causa propia,
`limite`, y la pantalla y `leer-charlas.mjs` la dicen distinto.

📌 **Vive en la ruta y NO en `Redaccion`, a propósito:** el tope se aplica antes de que el modelo
llegue a existir, así que no es una causa de la capa de IA. Y **no se guarda en `charlas`** —esa
respuesta nunca llega a la base—, por eso la columna `causa` sigue aceptando sólo `control` y
`falla` y no hizo falta migración.

---

## ⚠ EL PANEL DE UNA FAMILIA REAL NUNCA ALERTA — encontrado el 21/8, sin tocar

**No es un bug: es la consecuencia, no dicha hasta ahora, de no conectar NextDNS para el CoderCup.**
Salió mientras Edgardo preguntaba qué iba a ver una psicóloga que se diera de alta.

| Quién pide las señales | Con qué escenario |
|---|---|
| `/api/mi-familia` | el que venga en `?escenario=`, y **si no viene, `normal`** |
| `mi-familia/page.tsx:223` | **manda el `fetch` pelado: nunca manda ninguno** |
| `/api/cron/revisar` | `"normal"` fijo |
| `/api/mi-familia/asistente` | `"normal"` fijo |

➡ **La ruta acepta el parámetro y la pantalla nunca se lo manda**, así que toda cuenta real cae en
`normal`, que es plano por diseño (intensidad 0,05). **Medido para el día 1, el 3 y el 7: «Sin
novedad» en los tres, 0 días fuera de lo habitual.** Y como el cron corre con el mismo escenario
fijo, **la escalada tampoco se dispara nunca** desde una familia de verdad.

🔑 **Dónde SÍ se ve el sistema alertando: la consola de la home**, que es pública y no pide cuenta.
Ahí se eligen los cuatro escenarios y el motor decide de verdad, con la misma regla.

⬜ **Decisión abierta, de producto y de Edgardo:** enganchar `?escenario=` en el `fetch` del panel
serían unas cinco líneas y permitiría ver el panel real alertando. **No se hizo, y el motivo no es
técnico:** el panel pasaría a mostrar una alerta que se elige desde la barra de direcciones, en un
producto cuyo argumento entero es que no afirma nada que no vio. **No tocarlo sin que él lo diga.**

---

## 🔴🔴 «VER EL MENSAJE» ESTABA MUERTO HACE CUATRO DÍAS — arreglado el 21/8

**Lo levantó Edgardo probando la consola:** *"en el simulador en cualquier variable el texto que se
envía es el mismo… no puede ser"*. **Tenía razón, y era peor que eso: no había ningún texto.**

`Consola.tsx` pedía `/api/mensajes`, **y esa ruta no existe desde el 17/8.** Devolvía 404 en los
cuatro escenarios; el `catch` de la consola dejaba `mensajes = {}` y la pantalla dibujaba los dos
cuadros con un guion. **El mismo guion siempre, en todos los escenarios.**

### 🔴 Cómo se rompió, porque el error de método es lo que hay que no repetir

La borró **la auditoría del 17/8**, con un motivo válido y un dato falso:

| | |
|---|---|
| El motivo, **cierto y sigue en pie** | era un `GET` público que llamaba a Opus 5 sin sesión ni límite — *«bastaba una etiqueta `img` para gastar en bucle»* |
| El dato, **falso** | «no la llamaba nadie». **La llamaba `Consola.tsx`, que es la home.** |

⚠ **Borrar código «que no llama nadie» exige buscar quién llama, no suponerlo.** Y la razón de que
nadie lo notara en cuatro días es la misma que ya había costado una sesión con `motivos`: **un
`catch` que no escribe en ningún lado convierte una función rota en una función silenciosa.**

### ✅ Cómo volvió

Está en **`/api/demo/mensajes`**, junto a la otra ruta pública de la demo, con las dos protecciones
que la auditoría pedía:
1. **Es `POST`.** Una etiqueta `img`, un `link` o un prefetch no la pueden disparar. Ése era el
   agujero concreto. ✓ Verificado: un `GET` devuelve **405**.
2. **Seis por minuto por IP**, mismo tope y mismo mecanismo que `/api/demo/telegram`.

📌 Sigue pública, y corresponde: la demo ES la home.
✅ **Y la consola ya no se come el error:** si no sale el texto, lo dice en pantalla. Un guion se
lee como «el sistema no tenía nada que decir» —que es una respuesta legítima del producto— y taparía
con ella una función caída.

### Lo que se ve ahora, medido

| Escenario | Estado | Mensaje |
|---|---|---|
| normal | en calma | **silencio** — el sistema no escribe, y es lo correcto |
| cambio_leve | en calma | **silencio** |
| persistente | patrón sostenido | «10 de los últimos 21 días quedaron fuera de lo habitual…» |
| evasion | patrón sostenido | «**13** de los últimos 21 días…» |

🔑 **Y una cosa que parece un defecto y no lo es: el mensaje AL CHICO es el mismo en `persistente`
y en `evasion`.** `redactarMensajeAlChico` recibe nombre, edad, género y estado — **nunca qué se
vio**. Es deliberado: al chico no se le cuenta lo que el sistema observó. Los dos escenarios dan
`patron_sostenido` en la misma banda de edad, así que el texto es el mismo con o sin crédito. **El
que sí cambia por escenario es el de los adultos, porque lleva el «por qué» adentro.**

⚠ Hoy los dos salen del respaldo, porque la cuenta no tiene crédito.

---

## 🔴 EL CAMPO DE LA PREGUNTA EN EL TELÉFONO — arreglado el 21/8

**Lo levantó Edgardo:** *"el espacio para la pregunta es muy chico en mobile, ocupa la mitad de la
pantalla, al ser mobile debería ocupar el ancho de la pantalla"*. **Medido: 196 px de 390, el
50 %.** El botón «Preguntar» se llevaba 114 px fijos de la fila y lo que quedaba no alcanzaba.

⚠ **Acá el campo chico se paga más caro que en cualquier otra pantalla del sistema:** el que
escribe es un padre asustado contando algo difícil, no alguien llenando un formulario. Un campo
donde no entra la pregunta empuja a escribir corto, **y una pregunta corta es una peor respuesta.**

### Lo que se cambió, y por qué son tres cosas y no una

| | Antes | Ahora |
|---|---|---|
| Ancho en teléfono | 196 px (50 % de la pantalla) | **300 px, la fila entera** (el botón va abajo) |
| Alto | un renglón, `<input>` | **`<textarea>` que crece de 2 a 6 renglones** |
| Letra en teléfono | 14 px | **16 px** |

🔴 **Lo del ancho solo no alcanzaba, y la foto lo mostró:** una pregunta normal de 61 caracteres
mide 471 px de texto. Aun a 300 px de ancho, en un renglón el arranque queda cortado y **no podés
releer lo que escribiste**. Por eso es `<textarea>`. Entran ~200 caracteres sin desplazar en
teléfono y ~260 en monitor; el tope de seis renglones existe para que el campo no se coma la charla
que tiene encima.

🔑 **Y los 16 px NO son estética: Safari de iOS hace zoom solo** cuando enfocás un campo con letra
de menos de 16 px, y ese zoom **queda puesto** y descoloca la pantalla entera. Es una parte de que
«el asistente se vea mal en el celular» que no se ve mirando el campo. De `sm` para arriba vuelve a
14, que es la medida del resto.

⚠ **El mismo defecto estaba en las otras cuatro pantallas con campos**, y una es la PRIMERA que
toca el que viene a probar: `/entrar`, `CampoDeClave.tsx`, el recorrido del alta y el login del
panel. ✅ Corregidas las cuatro. 📌 **La clase del campo está copiada en cuatro archivos** — por eso
el defecto estuvo en los cuatro. Si se toca una, tocarlas todas; unificarla en una constante
compartida es deuda anotada, no hecha.

### Dos detalles que sólo aparecen midiendo

1. **`scrollHeight` trae el relleno pero no el borde**, y con `border-box` el alto que se escribe sí
   lo incluye: sin sumarlo, el campo **se achica 1 px por lado** apenas escribís la primera letra.
2. **Poner el alto en `auto` para medir tira a cero a dónde estaba mirando el campo.** Pasado el
   tope de seis renglones, el teléfono dejaba de mostrar el renglón que estabas escribiendo — se
   escribía a ciegas. ⚠ **En el monitor no se ve**, porque ahí el campo es más ancho y casi nunca
   llega al tope. Ahora, si el cursor está al final, el campo lo sigue; si estás corrigiendo en el
   medio, se queda donde estaba.

📌 **Enter manda y Shift+Enter hace renglón**, como cuando era un `input`. En el teléfono no
molesta: ahí abajo está el botón, entero.

⚠ **Cómo se comprueba, porque el typecheck no ve nada de esto:** `viewport` de teléfono y de
monitor, que el campo se lleve la fila entera, que la letra sea de 16 px en teléfono, que crezca y
nunca se achique, que tenga tope, que pasado el tope se siga viendo lo último que escribís, que
Enter mande y que el botón flotante siga dejando el cursor en `#pregunta-al-asistente`.

---

## ✅ LEER LAS CHARLAS — `node leer-charlas.mjs` (21/8)

**Lo pidió Edgardo:** *"¿podemos hacer que queden registradas las preguntas y respuestas de las
psicólogas?"*. 🔑 **Registradas ya quedaban** desde el 16/8 en `charlas`; lo que no había era dónde
leerlas — el panel de administración no las muestra.

Agrupa por familia (cada psicóloga se crea la suya, así que una familia es una persona) y de cada
respuesta dice **si salió de la IA o del respaldo, y por qué**. 📌 `--frenadas` deja sólo las que
frenó el control. 🔴 **Esa distinción es el valor entero de la herramienta:** una respuesta del
respaldo no es una respuesta mala del asistente, **es una que el asistente no dio**, y confundirlas
haría corregir el prompt por algo que nunca escribió.

⬜ **Dos decisiones de Edgardo, pendientes:**
1. **«Borrar la charla» hace un `delete` de verdad.** Una tester que ordena su pantalla borra el
   material y no queda rastro. Fue una decisión de privacidad deliberada del 16/8: **no se toca sin
   que él lo diga.**
2. **Los términos no dicen nada del asistente ni de que la charla se guarda.** Si va a leer lo que
   escriben, lo honesto es avisarles. Con decírselo en el mensaje alcanza — son testers.

---

## 🔥 PARA ARRANCAR LA PRÓXIMA SESIÓN — al 2026-08-20, cierre

**Leer este bloque entero antes de tocar nada. Nada quedó a medias: árbol limpio.**

### ✅ LO DEL 20/8 — se cerró TODO lo chico del producto (ítems 10 a 14)

**Él lo pidió así:** *"antes quiero dejar al 100% el sistema, vamos por lo que falta"* — el video
queda para después, por decisión suya.

| Qué | Dónde |
|---|---|
| **La segunda puerta** de padres separados | `/api/mi-familia/hogar` (POST) + la sección «Las entradas» en el panel |
| **Cambiar la clave** | `/api/mi-familia/clave` + la sección «La clave de esta casa» |
| **El registro de accesos** | Migración 19: `accesos` + `usuarios.ultimo_acceso`. Sección «Qué se cambió en esta cuenta» |
| **Las reglas, aparte y probadas** | `src/lib/hogares.ts` + `npm run probar-hogares` (**34 comprobaciones**) |
| **El recorrido cuenta cómo se vinculan los adultos** | `Recorrido.tsx`, bloque «Cómo se conecta cada uno» |
| **El universo del observatorio se MIDE** | `repo.universoObservado()` — estaba escrito a mano |

🔴 **LA LÍNEA QUE SE ELIGIÓ EN EL REGISTRO, y conviene no perderla:** se registra lo que una casa
**APORTA o CAMBIA**, nunca lo que **MIRA**. Abrir el informe, leer al asistente o mirar la línea de
tiempo no deja rastro. Con padres separados un historial de lecturas deja de ser un registro y pasa
a ser vigilancia de uno sobre el otro — **AntiGro no puede hacerles a los padres lo que promete no
hacerle al chico**. Por eso son dos cosas y no una: `ultimo_acceso` (un dato, se pisa) y `accesos`
(los hechos que no dejan rastro en ningún otro lado).

🔑 **Y `ultimo_acceso` habilita lo único reversible:** una segunda puerta con el correo mal tipeado
se puede cerrar **mientras nadie haya entrado por ella**. En cuanto entran una vez, es de esa casa
y no se cierra — que es la regla del 18/8, ahora sostenida por la base y no por la buena voluntad
de una ruta.

⬜ **PENDIENTE SUYO, y es de él, no del código: la segunda puerta NO acepta términos.** Se guarda
`terminos_version = null` porque **quien la abre no puede aceptarlos por otro** — marcarla como que
aceptó sería inventar un consentimiento, lo mismo que la migración 14 se negó a hacer. Si quiere que
la otra casa los acepte al entrar por primera vez, es una pantalla más. ⚠ **Cuidado con portonearlo
en el `layout`:** las cuentas viejas tienen ese campo en null, **la sembrada incluida**, y un portón
mal puesto las deja a todas afuera de su propio panel.

🗓 **ENTREGA: domingo 23. NO hay congelamiento el jueves 20** — esa fecha era un colchón nuestro,
no de las bases, y Edgardo lo volteó el 19/8: *"tenemos margen con un buen colchón, no tiene
sentido que me autoimponga una soga al cuello"*. ⚠ Igual conviene no tocar motor, base ni entrega
de mensajes el último día: ahí un cambio no se ve fallar hasta que falla.

🔴 **LO PRIMERO DE LA PRÓXIMA SESIÓN: preguntarle cómo le fue con las psicólogas.** Les mandó el
enlace del alta el 19/8 para que probaran **el asistente**. Lo que traigan entra en
`src/lib/ia/recomendaciones.ts`, que es donde vive el consejo con fuente.

### Dónde está todo

| | |
|---|---|
| **Rama** | `fase-4-consola-y-observatorio`, y **`main` está sincronizada**. 🔴 Desde el 19/8 `main` ES producción: **un push ahí sale EN VIVO** |
| **En producción** | `8ec4bd9`, **promovido y verificado EN VIVO el 20/8** (`main` fast-forward → deploy automático). Las 33 comprobaciones del navegador corrieron **contra `antigro.vercel.app`**, no contra localhost |
| **La base** | ✅ 14 · 15 · 16 · 17 · 18 · **19** (el registro de accesos, aplicada y verificada el 20/8) |
| **Verificación** | `npm run probar` — **425 comprobaciones** en 12 tandas: 12 reglas + 11 sugerencias + 27 instalación + 23 turno + 15 tour + 91 términos + 73 cuestionario + 29 acuse + 33 escalada + 35 parte + 34 hogares + **42 plataformas**. **En verde** |
| **En el navegador** | **`node prueba-entrar.mjs`** (la puerta: el logueo que fallaba en silencio y el ojo, 13 · **no escribe en la base**) · `node prueba-navegador.mjs` (el cuestionario) · `node prueba-puertas.mjs` (las dos entradas y la clave, 33) · `node prueba-acuse-circuito.mjs` (el acuse contra el webhook real) · `npx tsx preguntas-dia-uno.mjs` (lee respuestas reales del asistente). 🔑 Las tres primeras aceptan `SITIO=https://antigro.vercel.app` |
| **Comprobado en vivo (19/8)** | `/` `/guia` `/terminos` `/entrar` dan 200 · **`/entrar` sin código NO dibuja «es mi primera vez» y con el enlace SÍ** (verificado en navegador) · el reloj da 401 sin secreto · el webhook 401 sin el suyo |
| **En la base de producción** | **Una sola familia** (la sembrada), un chico (Ana) y dos usuarios: `demo@antigro.app` y `mariana@ejemplo.ar`. **Cero accesos, cero observaciones.** Verificado el 20/8 después de probar en vivo |

### 🔴 LO QUE HAY QUE VIGILAR ESTA SEMANA

⚠ **Las psicólogas están creando familias de verdad en producción.** Cada alta que hagan queda en
la base. **Antes de grabar el video hay que limpiarlas** — `delete from familias where id = …`
cascadea a chicos, adultos y usuarios. Tiene que quedar sólo la sembrada.
📌 Tope: 40 altas por día en todo el sistema, 3 por minuto por IP. Con unas pocas personas sobra.

### ✅ EL CONSEJO DEL ASISTENTE YA TIENE FUENTE — 19/8, y salió de leer respuestas reales

🔴 **El desbalance que apareció:** las CIFRAS del asistente estaban todas citadas y **los CONSEJOS
no**. Cuando decía *"entrá por lo de afuera"* o *"no digas «no hables con desconocidos»"*, eso no
salía de ninguna fuente — era conocimiento general del modelo con la voz de AntiGro encima. Y es
la parte **más accionable** de todo lo que dice.

**Lo levantó Edgardo:** *"esas respuestas deberían estar validadas por gente con experiencia como
la que debe haber en la Asociación Argentina de Grooming o entes similares"*.

| Dónde | Qué |
|---|---|
| `src/lib/ia/recomendaciones.ts` | **28 recomendaciones TEXTUALES**, con organismo, enlace y fecha |
| `recomendacionesParaElPrompt()` | Se arma sola: nadie puede meter un consejo sin decir de dónde salió |
| El corpus (`asistente.ts`) | Sección propia + la regla de atribuir |

**Las dos fuentes, verificadas el 19/8:** Ministerio de Justicia de la Nación («Con Vos en la Web»,
actualizada 6/2026) y Ministerio Público de la PBA (Procuración General de la SCBA).

🔑 **Las tres que el asistente NO decía y son las que más se hacen mal:** *no borrar nada* del
teléfono (es la prueba), *no amenazar al acosador* (se asusta, borra todo y desaparece), y *no
interrogar al chico* cuando cuenta algo. Las tres van contra el instinto.
🔴 **Y una que vale por sí sola:** el Ministerio dice *"respetá la privacidad… no ingreses a
escondidas a sus cuentas"*. **Es el organismo diciendo lo mismo que las reglas 2 y 3.** Deja de
ser una postura nuestra.
📌 Se agregó también: **que no repita la misma sugerencia en cada respuesta.** De cuatro respuestas
medidas, tres terminaban empujando el cuestionario — una vez es útil, tres se lee como reclamo.

⚠ **El borde que sigue sin fuente, y conviene saberlo antes de que lo marque alguien:** ante «ya
borré las conversaciones» el asistente dice que WhatsApp suele guardar copia en Drive/iCloud. **Eso
no está en la guía oficial** — es conocimiento técnico del modelo. Es plausible y útil; no está
respaldado.

### 📌 DECIDIDO EL 19/8: NO se conecta NextDNS

**Es de él:** *"el jurado es gente que entiende bien todo esto, con una buena explicación y el
simulador se va a entender bien cómo funciona AntiGro"*.
🔑 **Y hay un argumento a favor que conviene no perder:** el simulador muestra **tres semanas en
veinte segundos**, con el sistema callado los primeros catorce días. Con datos reales de dos días
**no pasa nada** — que es justamente lo que el producto promete, y no se filma.
📌 Verificado igual, por si vuelve el tema: **plan gratuito de NextDNS = 300.000 consultas/mes**,
se reinicia el 1º, avisa a las 250k. 🔴 **Pasado el tope deja de FILTRAR y de REGISTRAR** — y el
registro es lo único que AntiGro usa, así que pasarse **lo deja ciego**. Pro: **US$ 1,99/mes**,
ilimitado. Ese es el costo por familia para el modelo de suscripción.
⚠ Y sigue en pie: **`FuenteNextDNS.leer()` devuelve vacío.** Falta traducir la analítica a las
cuatro señales, y eso se escribe mirando datos reales, no a ciegas.

⬜ **SIN DECIDIR, y lo está pensando él: si el chico recibe su propio parte.** Coherente con la
regla 3 y quizá lo más fuerte del producto para su confianza (*«seguimos sin leer tus mensajes»*),
pero también puede leerse como recordatorio de que lo miran. **No construir hasta que lo diga.**

### ✅ EL ACUSE DE RECIBO — construido el 19/8

**Lo pidió Edgardo el 16/8** —*"supongamos que al padre le robaron el celular, o que muy atareado
lo dejó pasar"*— y el 19 acordamos el orden: **el acuse primero, la escalada después, y el cron al
final.** El acuse es barato y sin él estamos ciegos: no se puede diseñar la escalada sin saber
cuántas veces pasa de verdad.

🔴 **El agujero que tapa:** `entregado` significaba **«el transporte aceptó el mensaje»**. Telegram
contestó `ok`. Teléfono robado, apagado, o la notificación deslizada sin leer: quedaba registrado
como entregado igual, y el panel lo mostraba como si alguien lo hubiera visto.

| Dónde | Qué |
|---|---|
| `src/lib/mensajeria/acuse.ts` | **Dueño del acuse**: el token, el callback, y `quienLoVio` |
| `avisar.ts` | Genera el token **sólo para `alerta_adultos`** |
| `telegram.ts` | Dibuja el botón, contesta el toque y lo saca después |
| `/api/telegram/webhook` | **Escucha `callback_query`**, que hasta hoy ni miraba |
| `respuestas.acuse_token` + `acusado_en` (migración 16) | Dónde queda |
| `npm run probar-acuse` (29) · `prueba-acuse-circuito.mjs` | Las dos verificaciones |

🔑 **El botón dice «Lo vi», no «OK»** — elegido por él. «OK» se lee como *«está bien / estoy de
acuerdo»*, y esto no es algo con lo que uno esté de acuerdo. «Lo vi» dice exactamente lo que el
sistema aprende: que esa persona lo vio. **No que se haga cargo, no que vaya a hacer algo.**

🔴 **LA REGLA, y él la afinó en dos pasos.** Primero la trajo contando —*"si enviamos tres mensajes
y dos contestan, no deberíamos pasar a la escalada"*— y cuando le mostré dónde se rompe la cerró
así: **«el acuse es de uno de los responsables»**.
🔑 **Dónde se rompe contar, que es el caso que está escrito como prueba:** tres mensajes, dos
acuses, **y que los dos sean el referente y el chico**. Contando, no se escala; y sin embargo
ningún progenitor lo vio, que es exactamente el caso para el que existe la escalada.
🔴 **Con UNO alcanza** — no es lista de asistencia. Y el acuse del referente **se registra igual**
porque es información, pero no cierra.
🔴 **El chico NO lleva botón, y es estructural.** El token se genera sólo para `alerta_adultos`, así
que no hay ninguna condición que alguien pueda invertir por error. Si su toque contara, el sistema
se callaría **porque lo vio la chica**, y eso da vuelta el producto entero.

🔴 **EL ERROR QUE APARECIÓ MIRANDO EL PANEL, y era grave:** `loVioUnResponsable` miraba la ventana
entera, así que **un acuse de hace dos días decía que el aviso de hoy estaba visto**. Con eso la
escalada no se dispararía nunca más después del primer acuse de la vida de esa familia. ✅ Ahora se
mira sólo la **última tanda** (`HORAS_DE_UNA_TANDA = 6`), y hay tres casos que lo comprueban.
**El acuse es de cada aviso, no de la persona para siempre.**

⚠ **«No acusó» y «nunca le llegó» NO son lo mismo**, y confundirlos haría que la escalada se
disparara por una configuración a medias disfrazada de desatención. 📌 Y ojo con un caso que
**no existe**: a un adulto sin canal conectado `avisar()` **no le registra ninguna fila** — eso el
panel lo dice en «Quiénes están», no acá. Lo que sí se registra con `entregado: false` es un
mensaje que salió y **el canal rechazó**.

✅ **La escalada y el cron se hicieron después, el mismo día** — ver los dos bloques de abajo.

### ✅ EL SISTEMA YA SE MANEJA SOLO — 19/8, y cierra el circuito

**Dos cosas que faltaban y colgaban del mismo reloj.**

#### 🔴 1. El primer aviso, que hasta hoy NO salía solo

`avisar()` se llamaba desde **un solo lugar**: `/api/alertas`, una ruta de administración con
sesión. O sea que en una casa de verdad el motor podía detectar el patrón perfectamente y **no se
lo contaba a nadie hasta que alguien entrara a pedirlo**. Al lado de lo construido el mismo día
quedaba absurdo: **la escalada tenía reloj propio y el aviso original no.** El sistema sabía
insistir sobre un aviso que no era capaz de mandar por su cuenta.

✅ Ahora lo manda el reloj. 🔑 **Una vez por EPISODIO, no una por día:** el estado se sostiene
varios días seguidos, y avisar en cada corrida sería la misma alerta todos los días —que es como
un sistema se apaga solo—. El episodio empezó hace `diasSostenidos` días; si no hubo aviso desde
entonces, se avisa.
📌 **Y eso es también lo que hace que el gasto sea chico:** las dos llamadas a Opus 5 se pagan
cuando hay algo nuevo que decir, no en cada corrida. Un chico en calma cuesta cero.
⚠ **Si la IA no pudo escribir, no se manda nada.** `redactar` ya cae al respaldo determinista
cuando el modelo falla o el control frena; un `null` significa que ni eso salió, y un aviso vacío
gasta la atención sin decir nada.

#### 🔴 2. EL PARTE — y el agujero que apareció construyéndolo

**Lo pidió Edgardo:** *"el sistema debe dar señales de vida regularmente, si no da señales de nada
los usuarios pueden pensar «¿esta porquería está funcionando?»… imaginate que pasaron 4 meses sin
nada que reportar"*.

🔴 **Y al ir a construirlo apareció algo más grave que lo comercial: el sistema NO SABÍA CUÁNDO
ESTABA CIEGO.** Si el perfil se desinstala, el chico cambia de teléfono o el filtro deja de
reportar, no llega ninguna señal — **y eso el motor lo leía exactamente igual que «todo
tranquilo»**. No había una sola línea que distinguiera las dos cosas.
➡ **Su pregunta no era sólo una duda del usuario: era razonable, porque el sistema no podía
contestarla.** Es el único fallo que **se disfraza de buena noticia**.

🔑 **Y eso da vuelta el argumento del parte.** Lo que prueba que el sistema sirve no es *«no pasó
nada»*: es *«miré 31 días, hubo actividad tarde el 6, el 9 y el 14, ninguna se sostuvo, y por eso
no te escribí»*. Convierte el silencio de **ausencia** en **trabajo hecho**.

| Dónde | Qué |
|---|---|
| `src/lib/motor/parte.ts` | `mirarSiEstaCiego`, `armarParte` y los dos textos. **Puro** |
| `src/lib/motor/dia.ts` | `diaLocal` se mudó acá: `parte.ts` tiene que cargarse con node pelado |
| `enviarParte` / `avisarDeLaCeguera` en `avisar.ts` | La entrega |
| `npm run probar-parte` (35) · `prueba-parte-envio.mjs` | Qué dice · que salga |

⚠ **LO QUE EL PARTE NO PUEDE SER: una alerta chiquita.** Sin botón, sin color de atención, y sin
sugerir que nadie haga nada. Si un padre ansioso lee «hubo tres noches tarde» y actúa sobre eso,
**rompimos la regla 5 con nuestro propio mensaje**. Por eso el parte dice SIEMPRE, con todas las
letras, por qué eso no ameritó escribirle — y hay una comprobación que lo verifica.
🔑 **El aviso de ceguera es lo contrario y es el ÚNICO mensaje del sistema que pide una acción**:
no es una novedad sobre el chico, es una avería. Y una avería que nadie arregla deja a la familia
creyendo que está protegida cuando no lo está.
📌 **`DIAS_PARA_SOSPECHAR_CEGUERA = 3`**, no uno: un chico puede pasar un día sin tocar el teléfono
y avisar por eso sería el mismo falso positivo que la regla 5 evita del otro lado.
📌 **Y «nunca hubo señales» NO es ceguera:** puede ser que el filtro no se haya instalado todavía.
Decirle a una familia recién dada de alta que su sistema «dejó de funcionar» sería una alarma de
avería sobre algo que nunca arrancó.
🔑 **Los dos van sólo a los responsables** — ni al referente ni al chico. Es mantenimiento de la
casa. ⬜ **Sin decidir, y lo dejó pensando él: si el chico recibe su propio parte.** Sería coherente
con la regla 3 y quizá lo más fuerte para su confianza (*«seguimos sin leer tus mensajes»*), pero
también puede leerse como un recordatorio de que lo miran.

⚠ **El orden del reloj no es indiferente:** ceguera → aviso → escalada → parte. Con el sistema
ciego no se alerta ni se escala ni se manda parte, porque todo eso se apoyaría en datos que no
llegaron. Y el parte va último: si el sistema ya habló, sería ruido encima de una conversación
abierta.

### ✅ LA ESCALADA Y EL RELOJ — construidos el 19/8, cerrando la tanda

**La política estaba decidida desde el 16/8 y no se volvió a discutir:** es la regla 5 aplicada a
la insistencia. Si el patrón se sigue sosteniendo, la razón para insistir sigue viva; **si el
patrón se cortó, NO se escala** aunque nadie haya acusado recibo — perseguir a un padre por un
aviso que ya no tiene sustento es cómo un sistema se gana el silenciado.

| Dónde | Qué |
|---|---|
| `src/lib/mensajeria/escalada.ts` | **Decide** (`decidirEscalada`, pura) y **escribe** el texto |
| `escalar()` en `avisar.ts` | Entrega. Sólo a los responsables activos con canal |
| `/api/cron/revisar` + `vercel.json` | **El reloj**, cada hora |
| `respuestas.clase = 'escalada_adultos'` (migración 17) | Clase aparte, no un aviso repetido |
| `npm run probar-escalada` (33) | Cada regla con su caso que escala y su caso que no |

🔴 **QUÉ ES LA «SEGUNDA LÍNEA» — corregido el 19/8, y la nota del 16 estaba equivocada.** Proponía
tres destinatarios nuevos: el otro canal de la persona, el otro adulto, y el referente. **Dos de
los tres no existen**, y se ve mirando el código: `avisar()` recorre `adultos` **entero**, así que
el aviso original **ya salió a todos**, referente incluido.
➡ **La escalada no suma destinatarios porque no queda ninguno por sumar.** Lo que suma es
**información nueva**: que el primer aviso no lo abrió nadie y que el patrón siguió igual.
🚫 **Y el referente NO recibe la escalada.** Lo único que le agregaría es *«los padres no lo
vieron»*, y eso es información sobre los padres — la misma asimetría que Edgardo cerró el 18/8.

🔑 **El texto es DETERMINISTA y no lo escribe el modelo**, por tres razones que se refuerzan: no
hay nada que interpretar (es un hecho de dos partes); cada texto generado son dos llamadas a Opus 5
y acá lo dispara un reloj sin que nadie lo pida; y si el modelo se cae, el respaldo saldría justo
cuando el sistema está insistiendo porque nadie miró.

⏱ **Los dos relojes, separados a propósito:** `HORAS_PARA_ESCALAR = 8` normalmente y
`HORAS_CON_EVASION = 2` — la excepción que marcó él, porque la evasión es un **acto deliberado**.
📌 **El orden de las preguntas en `decidirEscalada` no es indiferente:** primero se mira si el
patrón se cortó. Si la razón para insistir se murió, no hace falta saber nada más.
⚠ **Un canal roto NO es desatención:** si ningún aviso salió, no se escala — sería mandar otro
mensaje al mismo lugar que ya rechazó el primero. Se dice en el panel.

### 🔴 EL FRENO DEL RELOJ, y es lo más importante de esa ruta

**Si las señales son SIMULADAS, el reloj no escala.** Sin NextDNS configurado `obtenerFuente` cae
al simulador: escalar sobre eso sería mandarle un mensaje de verdad al teléfono de un padre de
verdad **por una actividad que nunca ocurrió**.
🔑 La consola de la home hace lo contrario y está bien —ahí lo simulado se muestra y nadie recibe
nada—. **La diferencia es que este reloj ENTREGA.**
📌 **Consecuencia hoy: en la demo el reloj corre y no escala nunca**, y lo dice
(`motivo: "fuente_simulada"`). Es correcto, y es otra razón para la cuenta de NextDNS.

⚠ **QUÉ HACE EL RELOJ Y QUÉ NO.** Sólo **escala avisos que ya salieron**. **NO manda el primer
aviso**: ése necesita dos llamadas a Opus 5, y hacerlo por familia en cada corrida es el gasto que
encontró la auditoría del 17/8. ➡ **El primer aviso sigue necesitando que alguien llame a
`/api/alertas`.** Que el sistema alerte solo es la decisión que sigue, y es de producto y de costo.

🔐 **Falla cerrado:** sin `CRON_SECRET` en el entorno, la ruta contesta 503 y no corre nadie. El
secreto ya está en Vercel (producción y preview) y en `.env.local`.
🔴 **EL RELOJ CORRE UNA VEZ POR DÍA, Y NO ES UNA ELECCIÓN: es el plan gratuito.** Con
`0 * * * *` **el deploy FALLA entero**, con este mensaje: *"Hobby accounts are limited to daily
cron jobs"*. No es que corra menos: no publica. Quedó en **`0 11 * * *`** (8 de la mañana en
Argentina), que es la hora útil: un aviso de la madrugada se escala a la mañana siguiente.
⚠ **La consecuencia hay que decirla: la espera de 8 horas y la de 2 con evasión quedan
aspiracionales.** El código las respeta, pero el reloj sólo pregunta una vez al día, así que en el
peor caso la escalada tarda ~24 h. **La lógica está bien; lo que falta es el pulso.**
✅ **RESUELTO EL 19/8 CON UN PINGER EXTERNO, y lo eligió Edgardo.** `.github/workflows/reloj.yml`
le pega a `/api/cron/revisar` **cada hora**, con el `CRON_SECRET` en los Secrets del repo.
Verificado a mano: HTTP 200 y la decisión correcta.
🔑 **El cron de Vercel se DEJA PUESTO igual** (`0 11 * * *`), y no es redundancia inútil: si GitHub
se cae o desactiva el workflow, queda un latido diario en vez de ninguno. **Llamar dos veces no
hace daño**: `decidirEscalada` no escala dos veces por la misma tanda (`yaSeEscalo`), así que la
ruta se puede llamar cuantas veces sea sin duplicar un solo mensaje.
🔴 **La trampa que hay que saber antes de que muerda: GitHub DESACTIVA los workflows programados a
los 60 días sin actividad en el repo.** Si algún día la escalada deja de salir y nadie tocó nada,
mirar ahí primero. ⚠ Y los `schedule` de GitHub **se atrasan entre 5 y 20 minutos**; acá no
importa, porque lo que se mide son horas.
⚠ **Y lo que NO se hizo: enganchar la escalada a una visita de página.** Una ruta que ENTREGA
mensajes colgada de un GET es exactamente lo que la auditoría del 17/8 borró.
📌 La otra salida, si algún día hace falta más precisión: **Vercel Pro, US$ 20/mes**, que desbloquea
el cron por hora nativo.
📌 Se usó `vercel.json` y no `vercel.ts` a propósito: `vercel.ts` es lo recomendado hoy pero pide
`@vercel/config`, y no se agrega una dependencia el día antes del congelamiento por tres líneas.

### ✅ EL CUESTIONARIO DEL ADULTO — construido el 19/8. Era lo próximo y ya está

**Las preguntas existían desde el 14/8 y el motor las consumía: lo que faltaba era la puerta.**
El panel decía *«nadie contestó el cuestionario todavía»* y no había ningún lado adonde ir —
**un cartel que señala un hueco y no ofrece cómo taparlo entrena a ignorar los carteles.**

| Dónde | Qué |
|---|---|
| `/mi-familia/cuestionario` | La pantalla: **firma → 9 preguntas, una por pantalla → confirmación** |
| `GET/POST /api/mi-familia/cuestionario` | Trae los firmantes y lo último de cada uno; guarda. 10 por hora por familia |
| `juntarObservaciones` en `motor/cuestionario.ts` | **La regla de juntar, ahora en UN solo lugar** |
| `observaciones.hogar` (migración 15) | El HECHO al lado de la DECLARACIÓN |
| `npm run probar-cuestionario` | 73 comprobaciones |
| `prueba-navegador.mjs` | El recorrido entero en el navegador |

🔴 **La firma va PRIMERO y se MUESTRA en el panel** — decidido por Edgardo el 18/8. Y se muestra
partida, que es lo que la hace honesta: *«desde tu casa»* **consta** (la sesión se abrió con la
credencial de esa casa); *«contestó Mariana»* es lo que esa persona **declaró**. La pantalla de la
firma explica la diferencia antes de pedirla, no después.
🔴 **Al terminar NO hay puntaje**, y hay una comprobación en el navegador que lo verifica: se
buscan porcentajes y decimales en el texto del cierre. Lo único numérico permitido es *«6 de 9
preguntas»*.
🔑 **«No sé / prefiero no contestar» está en todas, con el mismo peso visual que las demás.** Sin
esa salida el que no sabe marca «no / nunca», y eso es una mentira entrando al motor. Lo salteado
**no viaja como 0**: hay una prueba que comprueba que saltear y contestar «nunca» dan distinto.
📌 **Se trae puesto lo último que contestó esa misma persona.** Volver a contestar es lo normal —
la conducta de un chico cambia—, y arrancar de cero cada vez haría que la segunda vuelta costara
igual que la primera. Una tarea que cuesta se deja de hacer.

🔴 **HALLAZGO: el panel y el asistente NO se ponían de acuerdo, y nadie lo veía.** La regla de
juntar estaba escrita **dos veces**. El panel se quedaba con la última respuesta de cada adulto y
después tomaba la más alta por pregunta; **el asistente se salteaba el primer paso** y tomaba la
más alta de todo el historial. ➡ Alguien corregía su respuesta, el panel mostraba la corrección
y **el asistente le seguía hablando con la vieja**. Dos pantallas del mismo sistema diciendo cosas
distintas del mismo chico. ✅ Arreglado: la regla vive en `juntarObservaciones` y está probada.
🔑 **La lección:** una regla escrita en dos rutas no se puede probar, y por eso se desincronizó
sin que nada se pusiera rojo.

⚠ **Y volvió a aparecer un error viejo, en un lugar nuevo:** la firma mostraba la fecha en ISO
(`2026-08-19`). Es exactamente lo que ya se había corregido el 15/8 en la advertencia del perfil.
**Lo encontró el navegador, no el typecheck.** Ahora hay `fechaEnCriollo` y dice «hoy» / «ayer».

⚠ **El push NO publica.** Subir la rama genera una vista previa; producción cambia sólo con
`vercel promote`. Se confundió el 18/8 — ver «Cómo se publica, porque NO es automático» más abajo.

🔴 **CORREGIDO EL 18/8, y la nota vieja era FALSA.** Decía *"el promote lo tiene que correr Edgardo:
el clasificador lo frena siempre"*. **No es cierto y él lo marcó.** Revisando los transcripts:
**el asistente promovió OCHO veces** el 16 y el 17 (`cd ~/Desktop/Trabajos/antigro && npx vercel
promote <url> --yes`), con «Successfully created new deployment» en la salida.
🔑 **Lo que pasa de verdad: el clasificador es VARIABLE.** En esas sesiones frenó algunas veces y
dejó pasar otras. El 18/8 frenó cuatro seguidas… **y el quinto intento pasó**, con la producción
de esa misma noche. Que frene no significa que no se pueda: significa que hay que volver a probar.
⚠ **Entonces: intentarlo SIEMPRE, y no anunciarle de entrada que no se puede.** Si frena varias
veces seguidas, las salidas son el `! npx vercel promote …` en el chat, otra pestaña de la
terminal, o el botón «Promote to Production» del panel de Vercel.

### ⚖️ LOS TÉRMINOS DE USO Y EL MARCO LEGAL — 18/8, lo pidió Edgardo

**Salió de discutir las credenciales y terminó tocando el diseño entero.** Él lo propuso así:
*"se me ocurre que podemos crear un «Términos de uso», si lo aceptan nos daría cobertura"*.

🔴 **La corrección más importante, y va contra la intuición: un checkbox NO da esa cobertura.**
El **art. 37 de la Ley 24.240** tiene **por no convenidas** las cláusulas que limitan la
responsabilidad por daños. Se escriben, el usuario las acepta, y un juez las tacha dejando el
contrato en pie sin ellas. Y los derechos de un chico no los renuncia su padre tildando nada.
⚠ Verificado que sigue vigente: la Disposición 753/2025 derogó la Resolución 9/2004 (listados para
prepagas, telefonía y bancos). **No alcanza al art. 37.**

🔑 **Lo que sí protege, y de eso están hechos los términos:** describir con precisión qué hace el
sistema y qué no · **las declaraciones de quien se da de alta** («declaro que ejerzo la
responsabilidad parental»), que es lo único de un contrato de adhesión que traslada algo · y el
registro de quién accedió.

🔥 **EL HALLAZGO DE LA SESIÓN, y conviene que nadie lo pierda: la regla 1 dejó de ser sólo ética.**
La **Ley 25.326, art. 7 inc. 3** prohíbe *"la formación de archivos, bancos o registros que
almacenen información que **directa o indirectamente** revele datos sensibles"*, y el art. 2 mete
ahí *"información referente a la salud o a la vida sexual"*. ➡ Un registro que afirmara que un
chico está siendo víctima de grooming **sería un archivo prohibido**. Que AntiGro hable de señales
que merecen atención y nunca de un diagnóstico **no es prudencia: es lo único legal**.
📌 Y la **Ley 26.061, art. 10** respalda la regla 2: el chico tiene derecho a la vida privada, y
esos derechos *"no pueden ser objeto de injerencias arbitrarias o ilegales"*. **Leer los mensajes
sería una injerencia.** Esto va a la guía y probablemente al video.

**Dónde quedó todo:**

| Dónde | Qué |
|---|---|
| `src/lib/legal.ts` | **Las seis normas, con texto TEXTUAL, enlace y fecha de verificación.** Fuente única |
| `src/app/terminos/terminos.ts` | El contenido: 8 secciones, y las declaraciones aparte de lo que decimos nosotros |
| `src/app/terminos/page.tsx` | La pantalla. Enlazada al pie de la home |
| `npm run probar-terminos` | 79 comprobaciones |

🔴 **La comprobación que justifica la tanda entera: que no aparezca ninguna cláusula de exención.**
La tentación en cualquier sesión futura va a ser agregar un *"AntiGro no se responsabiliza por…"*.
Si alguien la escribe, la tanda se pone en rojo antes de que llegue a producción. ⚠ Y la lista NO
prohíbe «no detecta», «no puede», «no reemplaza»: **ésas describen el alcance real y hay que
escribirlas.** La diferencia es entre decir qué hace el producto y pretender que el daño no es de uno.

### ✅ LA ACEPTACIÓN — hecha el 18/8, y la base va PRIMERO

✅ **LA MIGRACIÓN 14 YA ESTÁ APLICADA A PRODUCCIÓN** (18/8, autorizada por él). `usuarios` tiene
`terminos_version` (text) y `terminos_en` (timestamptz). El SQL está en `schema.sql` § 14.
✅ **Verificado de punta a punta contra la base de producción:** se creó una cuenta con la
aceptación, quedó guardada como `2026-08-18` con su fecha y hora, **y la familia de prueba se
borró**. En producción quedan sólo `demo@antigro.app` (admin) y `mariana@ejemplo.ar`.
📌 Las dos cuentas viejas quedan en «no consta», que es la verdad: son anteriores a que hubiera
términos, y marcarlas como que aceptaron sería inventar un consentimiento.
🔑 **La base fue adelante del código, como manda la regla** — el insert del alta manda esas
columnas, así que promover primero habría roto el alta en vivo.

| Dónde | Qué |
|---|---|
| `/entrar` (modo crear) | **Las cinco declaraciones a la VISTA** + el tilde. El botón no se habilita sin él |
| `/api/alta/hogar` | Exige `terminos` y lo compara contra `VERSION_DE_LOS_TERMINOS`. Sin eso, no hay cuenta |
| `usuarios.terminos_version` + `terminos_en` | Dónde queda. Nullable: las cuentas viejas son anteriores a que hubiera términos, y marcarlas sería inventar un consentimiento |

🔑 **Se guarda la VERSIÓN, no un booleano.** «Aceptó» no dice QUÉ aceptó, y el texto va a cambiar.
Y `VERSION_DE_LOS_TERMINOS` **cambia cuando cambia el TEXTO, no cuando cambia el código**.
🔑 **Las declaraciones van a la vista y no detrás del enlace.** Son la única parte del documento
que compromete al que acepta; esconderlas atrás de un «leí y acepto» las volvería la letra chica
que estos términos no son. Salen de `SECCIONES`, así que agregar una la hace aparecer sola.
🔴 Si el texto cambió mientras alguien tenía la pantalla abierta, la ruta contesta **409** y le
pide recargar: lo que estaba leyendo ya no es lo que hay.

⚠ **`VERSION_DE_LOS_TERMINOS` vive en `src/lib/legal.ts`, NO en `terminos.ts`** — y no se
re-exporta aunque sería cómodo: `terminos.ts` lo carga node pelado para la tanda, y node no
resuelve el alias `@/`. Un re-export de valor rompe la tanda entera; los `import type` no.

📌 **Y se corrigió un texto que había quedado mal:** `/entrar` decía que la clave del hogar *"la
usan los dos"*. Vale para un matrimonio conviviente, **no para padres separados** — ahí quién la
tiene lo decide el responsable, y la otra casa tiene su propia entrada.

### 🔑 LAS CREDENCIALES, CERRADO EL 18/8 — con la ley al lado

**Se cerró conversando y él corrigió dos veces cómo yo lo estaba diciendo.**
🔴 **«La clave la comparte toda la casa» era MÍO y está mal dicho.** Es **una credencial por
hogar**, y quién la tiene **lo decide el responsable de esa casa**. Al panel entran progenitores o
tutores; **el referente nunca**.
🔴 **Y él plantea DOS escenarios, no una contradicción** —lo aclaró porque yo los leí como uno—:
matrimonio conviviente, donde *"la respuesta de uno es la de los dos"* y se recomienda contestar
juntos; y separados en malos términos, donde hay un responsable del día a día y el otro puede
tener régimen de visitas *"o directamente no aparecer"*.

🔑 **Cómo se junta con el diseño del 17/8, y la ley lo respalda:** el responsable decide si se abre
la segunda puerta; **abierta, no la puede cerrar** — es de la otra casa. Así el acceso a cómo está
un hijo no se usa como moneda de cambio.
📌 El respaldo: **CCyC art. 641 inc. b** (separados, el ejercicio es de ambos) y **art. 654**
(*"cada progenitor debe informar al otro sobre cuestiones de educación, salud y otras relativas a
la persona… del hijo"*). **Cómo está el hijo es exactamente eso.**
⚠ **Si hay medida judicial, esa manda.** Y AntiGro **no pide sentencias ni las puede verificar**:
lo dice y se corre. Pedirlas sería ponerse en un rol de juez que no tiene.

🔴 **El registro que pidió él** —*"tener un registro de quien interactuó que luego iría en el
informe"*— con una distinción que lo hace honesto: **desde qué casa se entró es un HECHO** (la
credencial es del hogar); **quién de las personas es una DECLARACIÓN**. Se guardan distinto y se
muestran distinto. Decir «verificado» sería afirmar lo que el sistema no puede sostener.

⬜ **Sin construir todavía:** la pantalla de la segunda puerta en `/mi-familia` y el registro de
accesos. ✅ **La firma del cuestionario se hizo el 19/8** — ver su bloque arriba.

### ✅ LAS PUERTAS DE LA CASA — construido el 20/8

**Cierra lo que el recorrido venía prometiendo desde el 17/8** —*"la segunda entrada se crea desde
el panel, cuando termines acá"*— y que ese panel no tenía.

| Dónde | Qué |
|---|---|
| `src/lib/hogares.ts` | **Las reglas, sin base y sin pantalla.** El tope de dos, el nombre de cada casa, cuándo se puede cerrar una puerta, el largo de la clave |
| `npm run probar-hogares` | **34 comprobaciones.** La que sostiene el diseño: *una puerta que la otra casa YA USÓ no se cierra* |
| `/api/mi-familia/hogar` | `POST` abre la segunda · `DELETE` cierra una que nadie usó |
| `/api/mi-familia/clave` | Cambia la de ESTA casa. Exige la actual. **5 por hora por puerta** |
| Panel: «Las entradas» · «La clave de esta casa» · «Qué se cambió en esta cuenta» | Las tres secciones nuevas |
| `node prueba-puertas.mjs` | El recorrido entero en el navegador, **33 comprobaciones**. Deja la base como la encontró |

🔴 **El diseño es de él, del 18/8, y la ley lo respalda:** el responsable decide si se abre la
segunda puerta, y **abierta, no la puede cerrar** (CCyC 641 inc. b y 654). Así el acceso a cómo está
un hijo no se usa como moneda de cambio. ⚠ Si hay medida judicial, esa manda: AntiGro no pide
sentencias ni las puede verificar.

🔑 **Lo único reversible es un error de tipeo**, y lo decide la base: `ultimo_acceso is null` va
adentro del propio `delete`, no en una consulta previa. Entre mirar y borrar hay un hueco, y en ese
hueco la otra casa puede haber entrado por primera vez. **La pantalla avisa ANTES**, no después: es
lo único de todo el panel que no se puede deshacer.

🔑 **Por qué el nombre de la casa se pide al abrir la segunda:** con una sola, `hogar` en null es el
caso normal y nadie tuvo que escribir «mi casa». Con dos, el nombre es **lo único que en el informe
distingue quién aportó qué**. Por eso el nombre propio se pide en el mismo formulario, y se guarda
ANTES de crear la otra puerta: si fallara al revés, quedarían dos casas y una sin nombre.

⚠ **El nombre de la casa ahora sale de la BASE, no de la sesión** (`/api/mi-familia`). El token dura
treinta días: leerlo de ahí mostraría el nombre viejo hasta el próximo ingreso. Se intenta además
refrescar la sesión (`unstable_update`), y **si eso no aplica no se rompe nada** — degrada a «la
casa», que es impreciso y no falso.

🔴 **Cambiar la clave toca UNA fila.** Con padres separados la otra puerta no se entera y sigue
entrando igual: es lo que el recorrido promete cuando dice que *ninguno puede dejar al otro afuera
cambiando la clave*. Si esto tocara las dos, esa promesa sería mentira y nadie se enteraría hasta
el día que pasara. **Y exige la clave actual:** la sesión prueba que alguien entró alguna vez, no
que sea el dueño hoy — un teléfono desbloqueado sobre la mesa alcanzaría.

📌 **La sesión NO se cierra al cambiar la clave.** El que la cambia está probando que es el dueño;
echarlo de su propio panel sería castigarlo por hacer lo correcto.

### 🔴🔴 LA PUERTA FALLABA EN SILENCIO — encontrado por Edgardo el 20/8

**Lo levantó él probando el alta:** *"nunca dijo «email y/o contraseña no coinciden» pero debería
decirlo"*. Tenía razón, y detrás del cartel que faltaba había algo bastante peor.

🔴 **NextAuth v5 devuelve `ok: true` con las credenciales RECHAZADAS.** Medido contra la pantalla:

```json
{"error":"CredentialsSignin","code":"credentials","status":200,"ok":true,"url":null}
```

**Es un cambio respecto de v4**, donde `ok` sí era `false`. Con la condición que había —`if
(res?.ok)`— una clave equivocada **se daba por buena**: se hacía `router.push("/mi-familia")`, el
middleware rebotaba a `/entrar` por no haber sesión, y la persona volvía a ver la pantalla de
logueo **muda**. Sin cartel, sin error en consola, sin nada. Se lee como que el botón no funciona.

✅ **Arreglado en las DOS puertas** (`/entrar` y `/panel/login`): manda `error`, no `ok`. **`ok` no
se mira más — mintió una vez y no hay forma de saber en qué otros casos miente.**

🔴 **Y había un segundo agujero, de la misma familia: `try { … } finally { … }` SIN `catch`.** Un
pedido cortado —el teléfono perdiendo señal, que es exactamente donde se usa esto— se iba por
arriba y dejaba la pantalla igual de muda. Ahora las dos dicen algo. **Regla: nunca dejar sin voz
al que está del otro lado.**

🔑 **Por qué no lo vio nada de lo que ya teníamos, y es la lección que importa:** el typecheck no
puede verlo —no hay nada mal tipeado— y `npm run probar` tampoco —no hay lógica rota—. **Cambió de
significado el contrato de una librería.** Eso sólo se ve escribiendo una clave mal y mirando la
pantalla. Por eso ahora hay `node prueba-entrar.mjs`.

⚠ **Y ojo con el diagnóstico apurado:** al principio dije que él no había visto el cartel porque le
faltaba el enlace de invitación (`/entrar` sin `?i=…` no dibuja «es mi primera vez»). Eso era cierto
y no era la causa. **Él insistió con que el mensaje nunca apareció, y ahí estaba el bug.**

### ✅ EL OJO EN LA CONTRASEÑA — 20/8, lo pidió Edgardo

`src/components/CampoDeClave.tsx`, y va en **los seis** campos de clave del sistema: la puerta de la
familia, la de administración, la que se le pone a la otra casa y las tres de cambiar la clave.

🔴 **No es una comodidad: es lo que evita quedarse afuera de la propia casa.** AntiGro **no manda
correos** —el remitente de Resend no tiene dominio verificado, Telegram es el único canal real— así
que una clave mal tipeada en el alta **no se recupera**. Un carácter de más y esa familia queda con
una cuenta cuya clave no es la que cree.

🔑 Arranca siempre oculta y no se acuerda de nada: ver la clave es una decisión de ese momento y de
esa pantalla. ⚠ **El botón es `type="button"`** — adentro de un `<form>`, uno sin tipo envía el
formulario, o sea que tocar el ojo mandaría el alta a medio escribir. Hay una comprobación que lo
mira.

### ✅ LA IMAGEN AL COMPARTIR EL ENLACE — 20/8, la pidió Edgardo

**No había ninguna.** `layout.tsx` declaraba `openGraph` completo —título, bajada, `siteName`,
`locale`, `url`— **sin `images`**, y `public/` tenía sólo `robots.txt`. El enlace se compartía
pelado: un renglón gris. Y ese enlace es el que se les manda a las psicólogas por WhatsApp y el que
va a ir a LinkedIn con el video del CoderCup.

| Dónde | Qué |
|---|---|
| `src/app/opengraph-image.tsx` | La imagen, 1200×630, generada con `next/og` |
| `src/app/twitter-image.tsx` | La misma, **reexportada**. Dos archivos que dibujan lo mismo se desincronizan |
| `layout.tsx` → `twitter.card` | 🔴 Sin `summary_large_image`, X la muestra CHICA aunque haya imagen |
| `config.ts` → `LO_QUE_CRUZA` | El *cómo*, que estaba sólo en el README y en `/guia` |

🔑 **Se genera, no es un archivo en `public/`, y eso esquiva de raíz las dos trampas de Sabiduría
para el Corazón** (ver [[project-spc-seo-indexacion]]):
1. **El JPEG progressive.** Allá una imagen correcta —200, `image/jpeg`, 1200×630, 32 KB— se
   compartía sin foto igual, y la única diferencia con las que andaban era la codificación. Acá sale
   **PNG**, donde eso no existe.
2. **El caché envenenado.** La regla era *«al reemplazarla se cambia el NOMBRE»*. Next le pone a la
   URL un **hash de su propio contenido** (`/opengraph-image?375194832d…`): cambia el archivo y
   cambia la URL sola. **Ya no hay que acordarse de nada.**

⚠ **Las tipografías se leen de `node_modules/geist` en tiempo de BUILD**, y si fallara la imagen
sale igual con la de por defecto. Fea, pero un build caído el día antes de la entrega es peor.
📌 Las dos rutas quedan **estáticas** (`○` en la salida del build): se generan una vez y no cuestan
nada en vivo.

🔴 **Lo que se corrigió del primer intento, y vale para cualquier vista previa:** la imagen decía
**tres veces lo mismo** — el titular *«sin leer un solo mensaje»*, la bajada repitiéndolo, y el pie
con *«la red · los adultos · las estadísticas oficiales»* que también estaba en el medio. **Una
vista previa se mira un segundo.** Quedó: qué (titular) → cómo (bajada) → dónde (la dirección).

### ⚠ DOS TRAMPAS DE LA PRUEBA EN EL NAVEGADOR — costaron media hora el 20/8

**Las dos hicieron que una prueba dijera «roto» sobre algo que andaba perfecto.** Van acá porque
cualquiera de las dos vuelve sola la próxima vez que se escriba una prueba de pantalla.

🔴 **1. Un localizador de texto agarra el REGISTRO.** `getByText("Casa de papá")` no matcheaba sólo
la entrada: también el `· Casa de papá` de la línea *«Se cerró una entrada que nadie había usado»*.
Entonces la prueba esperaba que el texto desapareciera, el texto seguía ahí **porque el cierre había
funcionado**, y el resultado se leía como que no se había cerrado. ✅ Se acota a la sección:
`locator("section", { hasText: "Las entradas" })`.

🔴 **2. Un `429` no es un fallo del producto: es el tope andando.** Los topes son **5 por hora**
(`segunda-puerta:<familia>`, `cerrar-puerta:<familia>`, `clave:<usuario>`) y **correr la prueba dos
veces seguidas los agota**. Contra producción la puerta no se abría y parecía un error grave.
✅ Ahora la prueba mira la respuesta y lo dice con todas las letras en vez de contarlo como fallo.
🔑 **Y para volver a correrla sin esperar la hora**, se borran esas tres claves de `frecuencia` —
**esas tres, nombradas una por una, nunca la tabla entera**.

⚠ **Y la de siempre, que volvió a aparecer: `waitForTimeout` no sirve contra la red.** Tres segundos
alcanzan en localhost y no contra producción. **Se espera la condición, no el reloj.**

### ✅ EL REGISTRO DE ACCESOS — migración 19, del 20/8

Lo pidió él el 18/8: *"tener un registro de quien interactuó que luego iría en el informe"*.

🔴 **La línea que lo hace defendible: se registra lo que una casa APORTA o CAMBIA, nunca lo que
MIRA.** Abrir el informe, leer al asistente o mirar la línea de tiempo **no deja rastro**, y es una
decisión y no un olvido: con padres separados un historial de lecturas —*«entró a las tres de la
mañana»*— deja de ser un registro y pasa a ser vigilancia entre ellos.

Por eso son **dos cosas distintas**:

1. **`usuarios.ultimo_acceso`** — un DATO, no un historial: se pisa. Contesta «¿la otra casa está
   participando?» sin dejar reconstruir a qué hora entra nadie. Y es lo que habilita cerrar una
   segunda puerta mal tipeada.
2. **`accesos`** — los cinco hechos que **no dejan rastro en ningún otro lado**: abrió la segunda
   puerta, cerró una, cambió la clave, dio de baja a un adulto, borró la charla. La lista es cerrada
   y la base la vuelve a exigir con un `check`.

📌 **El cuestionario NO está en esa lista** aunque sea un aporte: ya firma en `observaciones`, se
muestra en el panel y entra al motor. Contarlo dos veces haría que el panel diga una cosa y el
informe otra. **Hay una comprobación que lo verifica**, para que nadie lo agregue sin ver lo que
está duplicando.

🔑 **Se anota QUE se cambió la clave, nunca nada DE la clave** — ni un fragmento, ni el largo. Hay
una comprobación en el navegador que lo mira.

### 🚫 EL REFERENTE NO ENTRA AL PANEL — NUNCA. Cerrado por Edgardo el 18/8

**Lo dijo sin lugar a dudas y cierra una pregunta que yo había dejado abierta como si fuera
negociable:** *"el referente no puede entrar nunca, es alguien que está para apoyar al chico,
llegado el caso, y de acuerdo a lo que hable con el chico debería informar a sus padres"*.

🔴 **El motivo NO es de permisos, es de confianza, y va en las dos direcciones:**
1. Si el referente ve el informe de los padres, **puede devolverle esa información al chico sin
   querer**. Y ahí se pierde lo único que hace útil al referente: que el chico le hable.
2. Y al revés — si los padres se enteran de que el referente le pasó al chico información privada
   de ellos, se rompe también de ese lado.

🔑 **Entonces el referente es un canal de UNA sola dirección: recibe, no consulta.** Recibe los
avisos que le corresponden y —idea de él, 18/8— **material y orientación cada tanto**, para que
sepa qué hacer cuando el chico le hable. Lo que fluye hacia arriba es distinto: si de esa charla
sale algo, **el referente informa a los padres**, hablando, no por el sistema.

⚠ **Corrección de algo que yo había escrito mal:** que el referente no conteste el cuestionario
**no es un hueco que el motor «extrañe»**. La regla de quedarse con la respuesta más alta se
sostiene sola entre progenitores y tutores —dos padres, y sobre todo dos casas, ven pedazos
distintos del mismo chico—. El comentario de `/api/mi-familia/route.ts` que justificaba esa regla
con el referente **estaba equivocado y ya se corrigió**.

⬜ **Queda como pieza para después del 23: el material periódico para el referente.**

### 📋 EL CUESTIONARIO — qué es y qué no, según él (18/8)

🔑 **Para qué está, textual: *"conocer los patrones de conducta del chico, que es de donde nos
apoyamos principalmente"*.** No es un test de riesgo de una persona ni un puntaje sobre un chico.
📌 Y encaja con lo que ya hace el motor: las señales de red y el cuestionario miran **lo mismo**
—cómo se está comportando ese chico— desde dos lados. Por eso el motor lo llama «el segundo ojo».
🔴 **Al terminar NO se muestra ningún puntaje.** Un número sobre un chico es lo que la regla 1
prohíbe decir y lo que la **Ley 25.326 art. 7 inc. 3** prohíbe registrar. Se dice que la respuesta
entró y que el informe pasa a estar mirado con los dos ojos.
⚠ `APORTE_MAXIMO_ADULTOS = 0,7` en `evaluar.ts`: el cuestionario **no puede disparar solo una
alerta**. Si alguna vez se decide que tiene que pesar más, la perilla es ésa.

### 🎨 EL PDF, REDISEÑADO EL 18/8 — y la regla que lo gobierna de ahora en más

**Edgardo lo frenó:** *"el PDF está bastante feíto, letra muy chica"*. 🔴 **Tenía razón y la causa
era mía y acumulada:** yo venía achicando la tipografía sesión tras sesión para que el contenido
entrara en tres carillas. Peor: **el documento se venía imprimiendo con el texto cortado en
silencio** (`.page` tiene alto fijo y `overflow:hidden`), y la página 2 —que nadie tocó ese día—
también se cortaba, así que el defecto **estaba en el PDF que ya circuló**.

🔴 **LA REGLA, y reemplaza al método viejo: si el contenido no entra, el contenido pasa a otra
página. NUNCA se comprime la tipografía para forzar una carilla menos.**

✅ Se escribió primero `docs/presentacion/filosofia-de-diseno.md` («Registro Paciente») y de ahí
salió el sistema: **cuatro tamaños de letra y ninguno más**, cuerpo 10,4 pt, márgenes de 20 mm,
medida de línea acotada, **un solo acento reservado**, y **una pregunta por carilla**. Quedó en
**10 páginas**, verificadas una por una.

⚠ **Cómo verificar que NO se corta** —y hay que hacerlo siempre, porque el fallo es mudo—: servir
`antigro.html` (`python3 -m http.server`) y comparar `clientHeight` contra `scrollHeight` de cada
`.page`. Mirar sólo el HTML no alcanza: hay que renderizar el PDF a imagen (`pdftoppm -png`).

📌 El generador se partió en cuatro archivos: `cabecera.py` (datos y gráfico), `estilos.py` (el
sistema), `paginas.py` (el contenido) y `armar_pdf.py` (arma e imprime).

⬜ **Falta seguir puliendo** — él lo dio por buen camino, no por terminado.

### ✅ EL RECORRIDO DE ALTA — hecho al final del 17/8

**Es lo que estaba primero en la lista y ya está.** Lo definió Edgardo describiendo la secuencia
de producción —*"accede al enlace, elige la suscripción, paga la suscripción y luego el sistema
lo lleva en un recorrido de pantallas para cargar los datos"*— y la del CoderCup, que es la misma
sin el pago: *"abre el enlace, llega al panel de logueo, crea credenciales, y accede al mismo
recorrido pero sin pagar. **Ve el simulador y luego la carga de datos**"*.

🔴 **El alta dejó de ser una herramienta de administración: la familia se da de alta sola.**
Hasta hoy `/entrar` decía con todas las letras que no había «crear cuenta» y argumentaba bien
—un alta trae decisiones que no se toman en un formulario—. **El argumento era correcto y por eso
la solución no fue agregar un botón: fue construir el recorrido**, donde esas decisiones viven
una por pantalla.

| Dónde | Qué |
|---|---|
| `/entrar` | Dos puertas a la vista: «ya tengo cuenta» y «es mi primera vez» |
| `/api/alta/hogar` | Crea familia + credencial. **Pública y escribe** → límite de 3 por minuto por IP |
| `/alta` + `Recorrido.tsx` | Las cinco pantallas |
| `/api/alta/datos` | Carga chico y adultos. La familia sale de la SESIÓN, nunca del cuerpo |

**Las cinco pantallas, y el orden no es casual:** simulador → el chico → la casa y los adultos →
**la conversación con el chico** → la instalación.

🔑 **El simulador va ANTES de pedir un solo dato.** Nadie carga la edad de su hijo en un sistema
que todavía no vio funcionar. Se reusa `Consola` tal cual, que ya estaba verificada.
🔑 **La regla 4 dejó de ser la única sin implementar.** La conversación con el chico es la cuarta
pantalla y va **antes** de la instalación a propósito. No hay nada que tildar: el sistema no puede
comprobar que la charla pasó y no finge que sí.

⚠ **Se presta a UNA confusión y ya pasó (17/8):** Edgardo entendió que *el asistente* iba a tener
esa conversación con el chico. **No.** Es una pantalla **para los padres**, que los guía sobre qué
contarle. Confirmado por él: *"que los padres guiados tengan esa explicación, perfecto"*.
🔴 El asistente **habla sólo con los adultos**. El chico recibe orientación por su canal cuando el
motor habla, y eso es otra cosa.
📌 **El pago se nombra y NO se simula.** La pantalla dice que en el producto terminado la
suscripción ya estaría paga y que acá no se cobra nada. Un checkout falso es exactamente lo que
este producto no se puede permitir.

✅ **Cierra el agujero de la auditoría:** el alta ya crea la cuenta. Una familia dada de alta hoy
entra a su panel.
🔑 **Y `/mi-familia` manda al recorrido si la familia no tiene chico** (en el `layout`): entre
crear la credencial y cargar los datos hay un rato en que la familia existe y está hueca, y ahí un
panel vacío no le explica nada a nadie.

⚠ **Lo que apareció probándolo en el navegador y NO en el typecheck:** la cuenta nace con el
nombre provisorio de la familia, así que el panel saludaba «entraste como Mi familia» debajo de un
encabezado que decía «Familia Gómez». `cargarDatosDeLaFamilia` ahora actualiza los dos.

✅ **Verificado de punta a punta contra la Supabase de producción** (crear credencial → recorrido
→ panel propio), y **las tres familias de prueba se borraron**: en producción queda sólo la
sembrada.

### 🔐 EL ENLACE DEL JURADO ESTÁ CERRADO CON LLAVE (17/8)

**Lo levantó Edgardo apenas quedó hecho el recorrido**, y tenía razón: *"si les damos el enlace
para que ingresen directo, y de repente alguien lo consigue, puede hacer explotar el sistema"*.

🔴 **El agujero lo abrió el recorrido mismo:** hasta ese momento **ninguna ruta pública escribía**.
Y el problema no es la basura en la base, es la plata — cada cuenta creada llega al asistente, que
son llamadas a Opus 5. El asistente ya tiene su tope, pero es **por familia**, así que sin freno en
el alta alcanza con crear familias para multiplicarlo.

**Tres capas, y el ORDEN importa:**

| | Qué frena | Dónde |
|---|---|---|
| 1 | Martilleo — 3 por minuto **por IP** | `tomarTurno("alta:<ip>")` |
| 2 | **Código de invitación**, el que viaja en el enlace | `CODIGO_DE_INVITACION` |
| 3 | **Tope global**: 40 altas por día en todo el sistema | `tomarTurno("altas:global")` |

🔴 **El código se comprueba ANTES del tope global, y no es un detalle.** Al revés, cualquiera sin
código quemaría el cupo del día pegándole a la ruta y el jurado encontraría la puerta cerrada sin
que nadie hubiera entrado.
🔑 **El tope global existe porque el código va escrito adentro del enlace**, y un enlace que
circula se copia. Es el techo del gasto, pase lo que pase.
🔴 **Sin `CODIGO_DE_INVITACION` en el entorno, las altas quedan CERRADAS** — la lección de la
auditoría aplicada de entrada: fallar cerrado.
📌 **Y la pestaña «es mi primera vez» sólo aparece con el enlace bueno** (`/entrar?i=<código>`).
Una dirección pelada muestra únicamente el logueo: si la puerta no abre, no se dibuja.

⚠ **El código está en Vercel (producción y preview) y en `.env.local`. NO se escribe acá** — este
archivo vive en un repositorio público, que es exactamente lo que encontró la auditoría.
**Para armar el enlace del jurado, sacalo de `.env.local`.**

### 📖 LA GUÍA Y EL TOUR — pedidos por Edgardo el 17/8

Son **dos cosas distintas porque resuelven dos momentos distintos**, y conviene no fusionarlas.

**`/guia`** — *"orientada a destacar las capacidades del sistema, sus proyecciones y de dónde
salen sus recursos"*. Escrita para **quien evalúa**, no para una familia: qué hace, qué
explícitamente NO hace, qué hay que instalar, hacia dónde va, y la fuente de cada cifra.
🔴 **La sección más importante es «Lo que NO hace».** Un sistema que sólo enumera capacidades se
lee como un folleto; éste se sostiene en que dice dónde termina. Si hay que recortar, esa sección
es la última que se toca.
🔑 Separa lo que dicen los estudios de **los números que elegimos nosotros**. Ningún estudio
publica coeficientes de riesgo, y presentarlos como si vinieran de ahí sería inventar autoridad.
📌 **«Hacia dónde va» son los cuatro temas de «DESPUÉS DEL 23»**, contados como dirección del
proyecto y nunca como algo que ya hace.

**El tour** (`src/app/_demo/Tour.tsx`) — *"una guía de varios pasos con unos carteles, cortitos"*.
Seis carteles sobre la consola. Arranca solo la primera vez, se cierra con Escape o con la cruz,
**y no vuelve** (queda anotado en el navegador); el botón «Guía rápida» lo trae de nuevo.

🔑 **El texto vive aparte en `pasos-del-tour.ts`**, por dos razones que se refuerzan: es contenido,
y así se puede probar — las tandas corren con node pelado, que no lee `.tsx`.
🔴 **`LARGO_MAXIMO` (130) no es estilo: si un cartel no entra, se reescribe el cartel.** Un cartel
que hay que leer con ganas se cierra sin leer, y ocupa la pantalla en los primeros diez segundos,
que es lo único que un jurado va a mirar seguro.
🔴 **El segundo cartel dice que no se leen los mensajes, y va segundo a propósito:** si alguien
abandona después de dos, eso es lo que se tiene que llevar. **Hay una comprobación que lo
verifica**, para que nadie lo reordene sin ver lo que está moviendo.
📌 Las anclas son `id` reales de la pantalla, y `probar-tour` comprueba que existan — un `id` mal
escrito no rompe nada, hace que ese cartel deje de señalar **callado**.

### ⬜ Lo que queda del recorrido

1. **La segunda puerta de padres separados.** El recorrido pregunta si el chico vive en una casa o
   en dos y explica qué significa, pero **la segunda credencial todavía no se crea desde ahí** —
   `crearHogar` ya la sabe hacer (`familiaId` + `hogar`, con el chequeo de que quien la pide ya
   está en esa familia). Falta la pantalla en `/mi-familia`.
2. **El canal de los adultos.** El recorrido los carga sin destino: se vinculan después, por QR,
   desde el panel. Coherente con cómo funciona Telegram, pero el recorrido no lo cuenta.
3. **Cambiar la clave.** No existe en ningún lado, ni antes ni ahora.

### 📊 El turno escolar — medido, no supuesto

✅ En el modelo, en el motor, en la base y con `npm run probar-turno` (23 comprobaciones).
Corre la **hora** de referencia de la madrugada, igual que la edad; no toca ningún peso.

🔴 **Y hay que decir lo que la medición dio: el turno NO mueve el día en que el sistema habla.**
Barrido de los 4 escenarios × 3 edades × 6 turnos: el día no cambió en ninguno. Mueve el puntaje
~0,02 en el persistente y ~0,004 en la evasión.
🔑 **Es exactamente el mismo resultado que dio la edad el 15/8, y por el mismo motivo:** el
puntaje sube ~0,06 por día cerca del umbral y el salto diario se come la diferencia. **Si alguna
vez hace falta que mueva el día, la perilla es `diasExigidos` en `evaluar.ts`, no este
corrimiento.**
📌 **Su valor real no es adelantar el aviso: es que el sistema deje de suponer un horario que no
conoce.** De ahí salió —de la corrección del 16/8, cuando el asistente afirmaba que la madrugada
«desordena el descanso»—, y ahí es donde sirve: en el asistente y en la escalada.

### ✅ Los números del motor, re-verificados el 17/8

**Normal y cambio leve nunca hablan · persistente `atencion` el 14 y HABLA el 20 · evasión HABLA
el 12 · persistente con cuestionario alto habla el 17.**

⚠ **Si alguna nota vieja dice que el persistente habla el 17, está desactualizada** — son los
números del 14/8, de antes de la rampa de confianza. Este archivo y `docs/presentacion/serie.json`
siempre tuvieron el 20 bien, **así que el PDF que circuló está bien.**

### 🗺 El mapa, para no buscar

**Pantallas** — `/` es la consola de demostración (la home ES la demo) · `/entrar` es la puerta
**y el registro** · `/alta` es el recorrido de alta · `/mi-familia` es el panel de los padres ·
`/panel` es la administración.

| Dónde | Qué hay |
|---|---|
| `src/lib/motor/` | **Decide.** `evaluar.ts` es el corazón; `pesos.ts` los números; `perfil.ts`, `modus-operandi.ts` y `cuestionario.ts` alrededor |
| `src/lib/senales/` | **De dónde salen los datos.** Interfaz única: `nextdns.ts` o `simulador.ts`, y el sistema no sabe cuál |
| `src/lib/datos/` | **Dónde se guardan.** Interfaz única otra vez: `supabase.ts` o `memoria.ts`. `tipos.ts` es el modelo |
| `src/lib/ia/` | **Escribe.** `redactar.ts` los avisos, `asistente.ts` la charla, `reglas.ts` el control, `respaldo.ts` lo determinista |
| `src/lib/mensajeria/` | **Entrega.** Telegram, correo, WhatsApp y el transporte de ensayo. `avisar.ts` decide a quién |
| `src/lib/instalacion.ts` | **Qué instala la familia** y en qué aparato (17/8) |
| `src/lib/limite.ts` | **El límite de frecuencia**, en Postgres (17/8) |
| `src/app/alta/` | **El recorrido de alta** (17/8). `Recorrido.tsx` son las cinco pantallas |
| `src/lib/observatorio/` | Estadística propia con *lift*. Anda; falta contarlo, no construirlo |
| `*.prueba.ts` | Las tres tandas. Se corren con `npm run probar` |

🔑 **Las dos interfaces únicas —señales y datos— son lo que sostiene el modo demo.** Sin NextDNS y
sin Supabase el sistema anda igual y **lo dice en pantalla**. No romperlas.

### 🔴 Cómo se publica, porque NO es automático

```
git push origin fase-4-consola-y-observatorio     # genera la vista previa
npx vercel ls                                     # se copia la URL «Ready»
npx vercel promote <url-de-la-preview> --yes      # esa misma build pasa a producción
```

🔑 **Promover la preview es mejor que `vercel --prod`:** publica el artefacto ya construido y
verificado, sin recompilar.
⚠ **El alias tarda hasta un minuto en cambiar.** Comprobar enseguida da resultados viejos y
confunde — pasó dos veces el 17/8. Esperar y volver a mirar.
🔴 **CAMBIÓ EL 19/8: YA SE MERGEÓ A `main`, y ahora un push a `main` SALE EN VIVO SOLO.**
Se hizo antes de lo previsto por un motivo concreto: **GitHub sólo corre los workflows programados
desde la rama por defecto**, y sin eso el pinger de la escalada quedaba inerte —ni siquiera se
podía disparar a mano—. Se pudo hacer sin riesgo porque **la rama entera ya estaba promovida y
verificada**: la única diferencia con lo que corría era el YAML del reloj, que no toca la
aplicación. El merge fue *fast-forward* y disparó un deploy automático que quedó sano.
⚠ **La regla de ahora en más: se sigue trabajando en `fase-4-consola-y-observatorio`**, que genera
vistas previas. **A `main` se mergea a propósito, nunca de paso** — ahí cualquier cosa sale en vivo,
trabajo a medias incluido.

### 🔑 Cómo se aplica SQL a producción — costó encontrarlo

**El MCP de Supabase NO sirve acá.** Ve un proyecto `antigro` que es `aqfqfhptwvkpavstjohn` —otro,
pausado—; el de producción es `xlwgwpojbmakzmlrzgmw`, el del Marketplace de Vercel, y esa cuenta
no está en el MCP.

Lo que sí sirve: `POSTGRES_URL_NON_POOLING` de `.env.local`, con `pg`.
⚠ **Hay que sacarle el `?sslmode=require`** — `pg` lo lee como `verify-full` y falla contra el
certificado de Supabase.
🔑 **Todo dentro de una transacción.** El 17/8 una migración frenó a mitad de camino y se revirtió
entera: a mitad, el esquema no es coherente con ninguna versión del código.
✅ **La base va adelante del código**, salvo cuando la migración es destructiva — ahí va el código
primero, listo para promover, y se achica la ventana.

### Cuentas para probar

🔴 **Las claves NO se escriben acá, y este archivo es la razón:** el repositorio es público y hasta
el 17/8 estaban las tres en este mismo lugar. Ver «LA AUDITORÍA DEL 17/8».

- **Panel de la familia:** `mariana@ejemplo.ar`. Clave en `.env.local` (`CUENTAS_DE_PRUEBA_CLAVE`).
  ⚠ **Carla ya NO tiene cuenta** — es la referente, y desde el 17/8 el referente no entra al panel.
  Es la familia **inventada**: Ana, Mariana y Carla no existen.
- **Panel de administración:** `ADMIN_EMAIL` con `ADMIN_PASSWORD`, los dos en `.env.local`.
- 🔑 **Y desde el recorrido, cualquiera se hace la suya en `/entrar`.** Es lo que va a hacer el
  jurado. ⚠ **Eso escribe en la Supabase de producción**: cada prueba deja una familia de verdad.
  Las tres del 17/8 se borraron (`delete from familias where id = …`, que cascadea a chicos,
  adultos y usuarios). **Conviene revisar antes de grabar** que no haya quedado basura.

### Qué pasó el 17/8, en orden

1. **🔐 La auditoría** — la pidió él. El repo público tenía las claves de producción adentro, tres
   rutas llamaban a Opus 5 sin sesión y no había un solo límite de frecuencia. Todo cerrado y
   verificado. → sección «LA AUDITORÍA DEL 17/8».
2. **🏠 El hogar** — una clave por casa, el referente afuera del panel, sin privacidad entre padres,
   nada obligatorio. Deja atrás varias decisiones del 16. → sección «EL HOGAR».
3. **📡 La instalación** — qué se instala y dónde. Va en el aparato del chico, no en el router.
   → sección «LA INSTALACIÓN».
4. **✅ Dos tandas de pruebas nuevas**, `probar-sugerencias` y `probar-instalacion`, por la misma
   regla de siempre: cada regla entra con su caso que pasa y su caso que se frena.
5. **✅ El recorrido de alta**, con `probar-turno` — la quinta tanda. → bloque de arriba.

### ⬜ Lo que sigue, en este orden

1. ~~**El alta desde el panel.**~~ ✅ **HECHO el 17/8**, y no quedó «desde el panel»: la familia se
   da de alta sola, en un recorrido de pantallas. Ver el bloque «EL RECORRIDO DE ALTA» arriba, que
   incluye lo que quedó pendiente de él.
2. ~~**La aceptación de los términos en el alta.**~~ ✅ **HECHA el 18/8**, con la migración 14 ya
   aplicada y verificada contra producción. ✅ **Promovido el 18/8.**
3. ~~**El cuestionario del adulto.**~~ ✅ **HECHO el 19/8** — pantalla, ruta, migración 15
   aplicada, 73 comprobaciones y el recorrido verificado en el navegador. Ver el bloque «EL
   CUESTIONARIO DEL ADULTO» arriba. ✅ **Promovido y verificado en vivo el 19/8** (`8a7316e`).
4. ~~**El acuse de recibo y la escalada.**~~ ✅ **HECHOS los tres el 19/8**: acuse, escalada y el
   reloj. Ver sus bloques arriba. ✅ **Y el 19/8 a la noche, el primer aviso automático y el
   parte** — el circuito quedó cerrado de punta a punta sin que intervenga nadie.
5. ~~**El consejo del asistente con fuente.**~~ ✅ **HECHO el 19/8** — 28 recomendaciones
   textuales de dos organismos. Ver su bloque arriba. ⏳ **Esperando lo que traigan las psicólogas.**

**Y a partir de acá, lo que de verdad queda. El producto está en ~92%:**

6. 🔴 **EL VIDEO DE 2 MINUTOS.** Es lo único que no se puede saltear: **Claridad son 25 puntos y
   decide DOS VECES**, porque hay un filtro previo sobre la explicación escrita. 🔴 Regla de él:
   *"el trailer lo vemos al final, recién cuando tengamos el sistema operativo"*. ⚠ El guion que
   hay en `docs/` **todavía es el de Criterio Térmico** y hay que reescribirlo entero.
7. **Cómo se filma el QR.** ⚠ Escanear en vivo es frágil y ya le falló a él. Recomendación: tres
   teléfonos ya logueados, filmados.
8. **El modelo de suscripción EN PALABRAS.** No es código. Ya está el costo: **US$ 1,99/mes por
   familia** (NextDNS Pro). Falta qué incluye, por familia o por chico, cuántos referentes.
9. ⚠ **Verificar las cifras en fuente antes de que entren al video.** Sólo la Línea 137 y
   Wisniewski están verificadas; el resto vino de modelos.

**~~Lo chico que falta del producto~~ — ✅ CERRADO ENTERO EL 20/8:**

10. ~~**La segunda puerta de padres separados.**~~ ✅ **HECHA.** Ver «LAS PUERTAS DE LA CASA» abajo.
11. ~~**Cambiar la clave.**~~ ✅ **HECHO**, con la clave actual exigida y tope de 5 por hora.
12. ~~**El registro de accesos.**~~ ✅ **HECHO** — migración 19, con la línea aporta/cambia vs. mira.
13. ~~**El recorrido no cuenta cómo se vinculan los adultos.**~~ ✅ **HECHO**, y era peor de lo que
    decía la ficha: el que terminaba el recorrido se iba **creyendo que el sistema ya les había
    escrito**, y no les escribió nadie.
14. **El observatorio: la acumulación.** 🔑 **Revisado el 20/8 y se decidió NO construirla, con
    motivo:** hoy las señales de la familia sembrada son **simuladas**, así que acumularlas sería
    fabricar un hallazgo — exactamente el error que el módulo existe para evitar. `analizar()` sigue
    escrita y probada, y la ruta lo dice. ✅ **Lo que sí se arregló:** el universo (`{chicos: 1}`)
    estaba **escrito a mano**, y dejaba de ser cierto el primer día que alguien se diera de alta.
    Ahora se mide contra la base.

📌 Y hay **cuatro temas parqueados con acuerdo para después del 23** — ver «DESPUÉS DEL 23».

### ⚠ Lo que le toca a él, no al código

- 🔴 **LO QUE TRAIGAN LAS PSICÓLOGAS.** Les mandó el enlace del alta el 19/8 para que probaran el
  asistente. **Preguntárselo apenas arranque la sesión.** Lo que digan entra en
  `recomendaciones.ts`. 📌 Él quiere además validación de la Asociación Argentina de Grooming o
  un ente similar — eso es de más largo plazo y no llega para el 23.
- ~~Decidir si saca una cuenta de NextDNS.~~ ✅ **Decidido el 19/8: NO se conecta.** Ver arriba.
- **Leer las respuestas del asistente con calma.** Es el único que puede decir si el registro está
  bien, y va a ser lo más citado del producto. 🔑 `npx tsx preguntas-dia-uno.mjs` se las imprime, y
  las preguntas se cambian editando el archivo.
- **Activar la verificación en dos pasos de Telegram.** Ese bot es por donde AntiGro entrega todo.
- ⬜ **Decidir si el chico recibe su propio parte.** Lo está pensando.

### 🔑 Por qué el asistente NO transmite mientras escribe

Lo natural en un chat es que el texto aparezca palabra por palabra. Acá **no se puede**: el control
tiene que ver el texto **entero** antes de que salga. Transmitiendo, una frase que no debía decirse
ya estaría en la pantalla del padre cuando el control la frena. **No "arreglar" esto agregando
streaming sin volver a discutirlo.**

---

## 🏠 EL HOGAR — rediseño del 17/8, y deja atrás varias cosas del 16

**Lo trajo Edgardo entero, corrigiendo el modelo que habíamos construido el día anterior.**
✅ En producción y verificado. Migración aplicada, `npm run probar` en verde.

### 🔴 Las cuatro correcciones, con sus palabras

| Lo que estaba | Lo que es ahora |
|---|---|
| Una cuenta por adulto | **Una clave por HOGAR** |
| La charla del asistente, de cada adulto | **De la familia: entre padres no hay nada separado** |
| El referente con acceso al panel | **Afuera del panel.** Recibe avisos y sabe que está |
| Mínimo dos adultos, exigido | **Nada obligatorio: se sugiere, con el porqué** |

1. **No hay privacidad entre padres.** *"Es el hijo, los dos son igual de responsables, los dos
   van a querer saber cómo está. Es una locura pensar privacidad entre padres."*
   ⚠ Yo había leído mal «privado de los padres» como privacidad *entre* ellos. Es **frente al
   referente**. Sobre esa lectura equivocada armé toda una distinción; se cayó entera.
2. **Una clave por casa.** *"En la práctica los padres no van a aceptar tener cada uno una clave
   diferente, es decirles que cada uno se maneja por separado."*
   🔑 Y hay una razón más dura que la fricción: **una clave que los dos conocen no protege nada.**
   Sostener la charla privada era prometer algo que el sistema no podía cumplir.
3. **El referente no entra al panel**, pero *"sí debe saber que es parte del sistema"*.
4. **Nada se exige.** *"Tampoco podemos exigir padres y referentes, siempre sugerimos."*

📌 Y la frase que ordena todo: *"no podemos pensar que solo existe un solo escenario: dos padres
y un referente"*.

### 🔑 Padres separados: UN panel con DOS puertas

*"No puede haber dos panel, uno en cada casa. Es un solo panel con acceso en cada casa."*

Dos filas en `usuarios` de la **misma** familia, con distinto `hogar`. Ven exactamente lo mismo
—alertas, informe, charla—; lo único que se duplica es la entrada. ⚠ Y eso resuelve algo que una
clave compartida entre separados no resuelve: **ninguno puede dejar al otro afuera cambiándola.**

📌 `hogar` en `null` **no es un dato faltante**: es la casa única, que es el caso normal.

### ✅ Lo que arregló de paso: dos carteles que mentían

- **A un hogar con un solo progenitor le decía «hacen falta al menos 2 adultos responsables».**
  Es falso: esa familia no está incompleta. Ahora es una sugerencia con su porqué, en gris y no
  en naranja de alerta, y **sólo aparece si además no hay referente**.
- 🔴 **Y había un cartel imposible de apagar.** La regla vieja pedía que algún adulto tuviera la
  marca «lo eligió el chico». Pero a los 8 años el referente lo eligen los padres —eso está
  decidido y es correcto—, así que la marca va en `false` con todo derecho y la familia veía para
  siempre un faltante que sólo se resolvía haciendo lo que a esa edad no corresponde.
  **Un cartel que no se puede apagar entrena a ignorar los carteles.**

### 🔑 El perfil de NextDNS pasó de la familia al CHICO

Salió de la otra mitad de la conversación: *"si el sistema está activo en una casa (configurado el
DNS) cuando vaya a la otra casa el sistema no va a funcionar"*.

**Ya estaba resuelto en Red Familiar y las piezas están hechas.** De su `CLAUDE.md`:
*"NextDNS — es la única opción que protege los celulares fuera del hogar. Pi-hole: cubre
únicamente la red del hogar"*. En `rodos-3/public/tools/` hay `internet-segura-ios.mobileconfig`,
`guia-android.html`, `internet-segura-windows.bat` y `guia-router.html`, más el bloqueo de
desinstalación (Screen Time, Family Link, cuenta estándar).

➡ **El filtro va en el DISPOSITIVO del chico, no en el router.** La instalación en el router es
la que se rompe cuando el chico cambia de casa. La del aparato viaja con él.

🔴 **Y arregla algo más grande que las dos casas:** el router no ve datos móviles, y ahí vive la
señal de madrugada, que es una de las dos únicas absolutas. Con instalación sólo en el router el
motor queda ciego a la hora que más significa, **y ni se entera**. En Red Familiar la protección
fuera del hogar era el abono más caro; **acá no puede ser un extra, es el piso**.

🔑 Si el filtro es del aparato del chico, el perfil es del chico. Colgado de la familia, dos
hermanos compartían perfil y sus señales se mezclaban en una sola lectura.

### 📌 Lo que cambió en la base y en el código

- `adultos.rol` — `progenitor` | `referente`. **No se deduce del `vinculo`**: una abuela puede ser
  la tutora y un padre puede ser el referente que eligió el chico.
- `usuarios` cuelga de `familia_id` + `hogar`; se fue `adulto_id`. Índice único por casa.
- `charlas.adulto_id` pasa a opcional y **no se filtra por él**.
- `chicos.nextdns_profile_id`; la de `familias` quedó marcada en desuso.
- `faltantesDeAlta` → `loQueImpideTrabajar` (sin chico, lo único duro) + `sugerenciasParaLaFamilia`.
- ⚠ **La migración BORRA la cuenta de quien quedó como referente**, y eso ES el cambio, no un
  efecto colateral. En la familia sembrada se llevó la de Carla. Frenó sola la primera vez, en el
  índice único, al encontrar dos cuentas en la misma casa: se revirtió entera y se le agregó el
  paso de consolidación.

### ✅ `npm run probar-sugerencias` — 11 casos

Misma regla que `probar-reglas`: **cada sugerencia entra con el caso que la dispara y el caso que
NO la dispara.** Acá el riesgo es el de siempre con el signo cambiado — una sugerencia que aparece
cuando no corresponde le está diciendo a una familia que está incompleta. `npm run probar` corre
las dos tandas.

---

## 📡 LA INSTALACIÓN — hecha el 17/8, y cierra el hueco del 15/8

✅ En producción: `/api/mi-familia/instalacion` y la sección «Cómo queda andando» del panel.
✅ `npm run probar-instalacion`, 27 comprobaciones.

**Hasta hoy AntiGro no le decía a la familia que había algo que instalar.** El sistema entero se
apoya en ver la actividad de red del chico, y nadie le explicaba cómo hacer que la vea.

### 🔴 Va en el APARATO del chico, no en el router — y no es una preferencia

El router **no ve datos móviles**. La madrugada es una de las dos únicas señales absolutas del
motor, y un chico a las 3 de la mañana está tanto en el WiFi como en su plan de datos.

⚠ **Instalado sólo en el router, AntiGro queda ciego a la hora que más significa y NI SE ENTERA:**
no recibir nada se lee exactamente igual que estar todo tranquilo. Por eso la advertencia del
router es el texto más importante de `instalacion.ts`, y el router va **último** en la lista — es
el lugar donde la gente lo pondría por instinto, y es el peor.

### 🔴 De Red Familiar se hereda la MECÁNICA, no el contenido

Corrección de lo que yo había dicho: sus cuatro archivos (`rodos-3/public/tools/`) **apuntan a
Cloudflare Family** (`1.1.1.3`), no a NextDNS — eran las herramientas gratuitas de la landing.
Cloudflare Family filtra bien y **no reporta nada**, así que para AntiGro no sirve: el motor no
lee lo que se bloqueó, lee lo que pasó. Lo aprovechable es la forma, que está bien.

### 🔴 Los endpoints, verificados contra la fuente y NO de memoria

| Para | Formato | Fuente |
|---|---|---|
| Apple (`.mobileconfig`) | `https://dns.nextdns.io/<id>` — el id en la **ruta** | apple.nextdns.io |
| Android (DNS privado) | `<id>.dns.nextdns.io` — el id de **subdominio** | help.nextdns.io |

⚠ **Son al revés uno del otro**, y por eso hay pruebas letra por letra: un DNS mal escrito **no da
error**. El aparato pregunta a otro lado, la familia queda creyendo que está protegida y el motor
no recibe una sola señal.

### 🔑 Todo camino termina en la comprobación

`https://test.nextdns.io/` devuelve `{"status":"unconfigured"}` o el id del perfil. **Es un paso de
la instalación, no un consejo del final**, justamente porque el fallo es silencioso.

### 📌 Decisiones que conviene no revertir sin pensarlas

- **El orden del texto:** primero qué NO es (no se instala una app, no se leen mensajes), después
  el paso técnico. Al revés, un padre siente que le piden poner un espía en el teléfono del hijo.
  Contado así, **la instalación misma es la regla 3 vuelta un acto concreto**.
- **`PayloadRemovalDisallowed` va en `false`.** Trabarlo desde el perfil no sirve —se saca
  reseteando— y contradice la regla 3. Si la familia quiere trabarlo, es Screen Time, y es una
  decisión de ellos.
- **La etiqueta del aparato NUNCA lleva el nombre del chico.** Viaja a un tercero; con «telefono»
  alcanza. Hay una prueba que lo comprueba.
- **Los UUID del perfil son estables:** si cambiaran en cada descarga, los perfiles se apilarían
  en el iPhone en vez de reemplazarse.
- **Sin `nextdnsProfileId` no se entrega archivo** (409) y la pantalla dice por qué. Un archivo con
  identificador vacío daría una instalación que parece hecha y no reporta nada.

### ⬜ Lo que queda

1. **Engancharlo al alta**, cuando el alta exista: hoy vive en el panel, que es donde una familia
   ya adentro lo va a buscar.
2. **La cuenta de NextDNS.** Sin perfil real no hay nada que instalar de verdad — hoy la pantalla
   lo dice con todas las letras en vez de disimularlo.
3. **El alta desde el panel**, que sigue siendo lo próximo, y ahora con más carga: crear la cuenta
   del hogar, preguntar si el chico vive en una casa o en dos, cargar el rol de cada adulto y
   mostrar esta instalación.

---

## 🔐 LA AUDITORÍA DEL 17/8 — qué estaba abierto y cómo se cerró

La pidió Edgardo antes de seguir construyendo: *"qué te parece si hacemos una auditoría, debug,
seguridades, código muerto"*. Fue la decisión correcta y encontró algo grave.

### 🔴 1. El repositorio es PÚBLICO y tenía adentro las claves de producción

`github.com/Edgardo-Lamas/antigro` es público. Las tres cuentas de producción abrían con claves
que estaban escritas en archivos versionados. Se comprobó contra el hash real de la base: las
tres abrían.

| Cuenta | Dónde estaba escrita |
|---|---|
| **la de administración** — abre `/panel` | `src/auth.ts`, como valor por defecto del modo demo |
| `mariana@ejemplo.ar` | este `CLAUDE.md`, en dos lugares |
| `carla@ejemplo.ar` | ídem |

🔑 **Lo que hay que aprender, porque es lo único que evita que vuelva a pasar:** la clave de
administración **no la eligió nadie**. Era el valor por defecto que `auth.ts` usaba cuando no hay
base —parecía inofensivo, es "modo demo"— y cuando el 16/8 se sembró la cuenta en `usuarios` se
sembró **con ese valor**. Un valor por defecto que abre una puerta se termina filtrando al lugar
donde no tenía que estar. Por eso ahora, si faltan `ADMIN_EMAIL`/`ADMIN_PASSWORD`, **no entra
nadie**: fallar cerrado.

✅ Claves rotadas, valores por defecto sacados del código, claves fuera de este archivo.
⚠ **Las claves viejas quedaron en el historial de git.** Están rotadas, así que ya no sirven —
pero se leen. Reescribir el historial no vale la pena a cuatro días del congelamiento.

### 🔴 2. Tres rutas abiertas llamaban a Opus 5 sin pedir sesión y sin ningún límite

**No había un solo límite de frecuencia en todo el sistema**, y cada texto redactado son dos
llamadas a Opus 5.

| Ruta | Qué era | Qué se hizo |
|---|---|---|
| `GET /api/mensajes` | pública, 2 llamadas por pedido. Un **GET**: bastaba una etiqueta `<img>` o un rastreador para gastar en bucle | **borrada** — no la llamaba nadie |
| `POST /api/alertas` | pública, 2 llamadas **+ mensajes de verdad** a los teléfonos de una familia | **cerrada con sesión de admin** |
| `POST /api/demo/telegram` | es el botón de la home, tiene que seguir siendo pública | **límite por IP**: 6 por minuto |

📌 En `/api/alertas` la IA escribía **antes** de que `avisar()` decidiera si repetía: aunque el
mensaje se omitiera por «ya se avisó hoy», las dos llamadas ya se habían pagado.
🔑 No se borró como la otra porque ahí vive la única llamada a `avisar()`, que es la salida real
del sistema y de la que va a colgar la escalada.

### 🔴 3. `/familia/[token]` entregaba los códigos de vinculación a cualquiera

Sin sesión, `GET /api/familia/<token>` devolvía el código de vinculación del chico y de cada
adulto. Con ese código, cualquiera aprieta «Iniciar» en el bot y **se mete en el canal de esa
familia**. Es exactamente el ataque que la vinculación por código de un solo uso viene a evitar
—y `/api/mi-familia/qr` está escrito con ese cuidado; esta ruta, de la fase 1, no.

✅ Borradas la ruta y la pantalla. `/entrar` + `/mi-familia` ya las habían reemplazado.
🔴 **Y el token de una familia es una CREDENCIAL.** Con él se piden avisos por `/api/alertas`.
⚠ **No se filma.** `/panel` ahora lo muestra tapado y sin enlace, justamente por el video.

### 🔴 4. Al sacar esa pantalla quedó al descubierto: el alta no crea cuentas

`POST /api/panel/familias` crea la familia, los chicos y los adultos, **pero ninguna fila en
`usuarios`**. Las de Mariana y Carla se sembraron a mano el 16/8. O sea que **una familia dada de
alta hoy no puede entrar a `/mi-familia`** — el enlace `/familia/<token>` tapaba el hueco.

➡ **Esto es requisito del alta desde el panel, que es lo próximo que se construye.** Sin crear la
cuenta, el alta no termina en ningún lado.

### 🟡 5. Lo demás

- ✅ `coberturaDelProceso()` borrada: no la llamaba nadie. El texto que la explicaba se quedó,
  porque el argumento sirve.
- ✅ `MINIMO_ADULTOS` se importaba de dos lugares distintos.
- ⚠ `.env.local.respaldo-16-08` sigue en la carpeta. Está fuera de git —nunca se filtró—, pero es
  una copia entera de los secretos, y desde la rotación tiene claves viejas. **Borrarlo.**
- 📌 `npm audit` marca 2 críticas y 4 altas. **Las críticas no aplican:** son de OAuth en
  `@auth/core` y acá se usa sólo Credentials, sin OAuth y sin proveedor de correo. Las de `next`
  piden saltar a la 16, que es romper cosas a cuatro días del congelamiento. `npm audit fix` a
  secas —sin `--force`— arregla `@auth/core`, `nanoid` y `ws` sin romper nada.
- 🔴 **Un error mío del informe, corregido:** dije que el esquema no encendía RLS. **Sí lo
  enciende**, en las nueve tablas. Lo busqué en mayúsculas y está escrito en minúsculas. Se
  verificó además contra la base: con la clave `anon` y con la `publishable`, las tablas devuelven
  vacío.

### ✅ Lo que la auditoría encontró BIEN, y conviene no romperlo

- **La autorización del panel de la familia.** La familia sale de la sesión, nunca del navegador,
  y cada ruta lo comprueba por su cuenta.
- **No hay XSS.** El texto del asistente se arma como elementos de React; el único
  `dangerouslySetInnerHTML` es el SVG del QR que dibuja el propio servidor.
- **El webhook de Telegram valida el secreto** antes de tocar nada.
- **La clave `anon` de Supabase nunca sale al navegador:** está en el entorno y ningún código
  la usa.
- Cabeceras de seguridad puestas, y `next@14.2.35` ya está por encima del bypass de middleware.

### ✅ Todo aplicado y verificado contra producción el 17/8

| Qué | Cómo se comprobó |
|---|---|
| **Claves rotadas** | Se entró a producción con la nueva y con la publicada: **la publicada ya no entra, la nueva sí** |
| **`frecuencia` + `tomar_turno`** | Aplicadas. Con tope 3: los pedidos 1-3 pasan, el 4 y el 5 se frenan, y una ventana vencida arranca de cero |
| **RLS** | Encendido en las **diez** tablas, `frecuencia` incluida. `tomar_turno` por PostgREST con service role anda; con `anon` da 401 |
| **Las rutas** | `/api/mensajes` 404 · `/api/familia/<token>` 404 · `/familia/<token>` 404 · `POST /api/alertas` sin sesión 401 |
| **Lo que tiene que seguir andando** | home 200 · `/entrar` 200 · `/panel` y `/mi-familia` 307 · el QR de la demo devuelve su SVG |
| **`npm audit fix`** | Sin `--force`. De 6 a 2: **las dos críticas se fueron**. Las que quedan son de `postcss` dentro de `next` y sólo se arreglan saltando a Next 16 |

🔑 **Se pudo aplicar el SQL sin pasar por el panel de Supabase**, y conviene saberlo para la
próxima: el MCP **no** sirve —ve un proyecto `antigro` que es `aqfqfhptwvkpavstjohn`, otro,
pausado; el de producción es `xlwgwpojbmakzmlrzgmw`, el del Marketplace—. Lo que sí sirve es
`POSTGRES_URL_NON_POOLING` de `.env.local`, con `pg`. ⚠ Hay que **sacarle el `?sslmode=require`**
a la cadena: `pg` lo trata como `verify-full` y falla contra el certificado de Supabase.

✅ **`.env.local.respaldo-16-08` borrado.** Antes se comprobó que no se perdía nada: ninguna
variable existía sólo ahí, y de las 13 había 9 idénticas. Las 4 que diferían estaban todas
muertas — la clave publicada, `VERCEL_OIDC_TOKEN` (se renueva solo) y las dos de Supabase, que
📌 **apuntaban a `aqfqfhptwvkpavstjohn`**: el respaldo era la configuración de antes de
provisionar por el Marketplace. Es el mismo proyecto abandonado que ve el MCP.

**No queda nada pendiente de la auditoría.**

📌 **El build tira un aviso, es previo a la auditoría y es inofensivo:** `bcryptjs` carga `crypto`,
que el Edge Runtime no soporta, y el middleware arrastra `auth.ts` entero. **No se ejecuta nunca
ahí** —`authorize()` sólo corre en el servidor, el middleware apenas lee el JWT— y el middleware
anda (comprobado: `/panel` y `/mi-familia` devuelven 307). Sacarlo pide partir la configuración de
auth en dos archivos, que es un refactor de la autenticación a cuatro días del congelamiento.

---

## 📌 El cierre del 16/8 — histórico

⚠ **Esto ya no es «lo próximo»: quedó atrás con el 17/8.** Se conserva porque explica de dónde
salieron varias decisiones, pero **si algo de acá contradice al bloque de arriba, gana el de
arriba.** Cómo se publica, las cuentas y lo que sigue viven ahora en «PARA ARRANCAR LA PRÓXIMA
SESIÓN».

### Lo que quedó andando el 16/8

| | |
|---|---|
| **Supabase** | Provisionado **por el Marketplace de Vercel** (`supabase-beige-flower`), esquema aplicado, producción usándolo |
| **El cupo del QR** | Arreglado y **verificado con un teléfono real**: QR → Iniciar → cupo 1/3 → aviso entregado |
| **El panel de la familia** | `/entrar` + `/mi-familia`: informe del motor, quiénes están, QR por referente, baja con motivo |
| **El asistente** | Se acuerda de la charla, la retoma y la borra. Probado contra *"decime que no es nada"* |
| **El observatorio** | Estadística propia con **lift**, sin esperar volumen. Ya funciona — falta **contarlo**, no construirlo |
| **El bot** | Ya se llama **AntiGro** (tenía una pe de más) |

### ✅ La segunda vuelta del asistente — hecha el 16/8 a la noche

**La charla se guarda y se retoma** y se borra de un toque.
🔴 **«Es de cada adulto» quedó SIN EFECTO el 17/8**: es de la familia. Ver «EL HOGAR». Lo que salió de ahí y no estaba previsto:

- 🔴 **El control frenaba de más, y de la peor manera:** el asistente escribía *Si te dijera
  "quedate tranquila"…* para **negarse** a decirlo, y el control lo leía como si lo estuviera
  diciendo. Tiraba al respaldo la mejor respuesta del día, y justo ante la pregunta que un padre
  asustado hace primero. Ahora la regla distingue **decir una frase de nombrarla**.
- ✅ **Quedaron doce casos escritos:** `npm run probar-reglas`. Tres veces el mismo tipo de error
  y ninguna la encontró el typecheck — **toda regla nueva entra con su caso que pasa y su caso
  que se frena.**
- 🔴 **El respaldo ahora dice POR QUÉ no puede contestar más**, con los días del motor adelante.
  Corrección suya, y desarmó de paso un cartel que mentía sobre la causa.
- 🔴 **«La madrugada desordena el descanso» era falso y estaba en tres lados**, el PDF incluido.
  Lo volteó él. Tirando de ese hilo apareció que el asistente explicaba **dos de las cuatro
  señales al revés**.
- 📌 El asistente sigue sin ver el cuestionario más que resumido dentro de la lectura.

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
   El 72,8% de los chicos no sabe qué es el grooming (Informe Grooming LATAM, n≈28.360): la
   conversación de alta ya resuelve parte del problema antes de que el sistema haga nada.
5. **No se alerta por un evento. Se alerta por persistencia.** Al 43,5% de las víctimas la
   acosaron más de una vez, contra un 29,3% una sola. Un pico aislado es ruido.

---

## Qué construye el sistema

**Tres entradas → una lectura → dos salidas.**

| Entrada | Qué aporta | De dónde sale |
|---|---|---|
| Señales de red | El **cuándo** | Simulador (hoy) o NextDNS (mañana) |
| Cuestionario a los adultos | El **cómo está** | Indicadores conductuales documentados |
| Estadísticas | **Cuánto pesa cada cosa** | Estudio del Ministerio de Justicia, 2023, y el Informe Grooming LATAM |

**Salidas:** alerta con contexto a los adultos responsables (mínimo dos), y orientación al
propio chico en su canal, con el texto que corresponde a su edad.

### El hallazgo que define el diseño

**Los indicadores de grooming están documentados pero son conversacionales.** Toda la
investigación seria detecta leyendo mensajes. Un filtro DNS ve dominio y hora.
🔴 **El estudio nacional ubica el grooming en Facebook (52,8%), Instagram (33,1%) y WhatsApp
(30,7%)**: las tres permitidas y las tres cifradas. Para un filtro, un pedido de fotos a un chico
de 12 y la tarea del colegio son el mismo evento.
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
| ~~Dashboard por token~~ | 🔴 **BORRADO el 17/8**: entregaba los códigos de vinculación sin sesión. Lo reemplazan `/entrar` + `/mi-familia` |
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

- `tipos.ts` — Familia, Chico (edad, género y **su** `nextdnsProfileId`), AdultoResponsable (con
  `rol` y `elegidoPorElChico`), Hogar, Canal, Respuesta y ObservacionDelAdulto.
  🔴 **`faltantesDeAlta()` ya no existe** (17/8): se partió en `loQueImpideTrabajar()` —sin chico,
  lo único duro— y `sugerenciasParaLaFamilia()`, que aconseja con el porqué. Ver «EL HOGAR».
- `memoria.ts` — el modo demo. Siembra la familia con token `demo`: Ana de 12, la madre
  (progenitora) y una tía **referente**, elegida por ella. 🔑 Un solo progenitor a propósito: es
  el caso que el sistema trataba como incompleto hasta el 17/8. **Es una sola instancia por proceso**, si no cada pedido perdería lo
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

La evasión es absoluta porque es un acto deliberado — da igual si es el día 2 o el 200. La
madrugada, porque **se compara contra la EDAD y no contra la historia de ese chico**.

### 🔴 «Desordena el descanso» era falso — lo volteó Edgardo el 16/8

Durante dos días el sistema dijo, en el informe, en el prompt del asistente y en el PDF que ya
circuló, que la actividad de madrugada *"desordena el descanso por sí sola: al otro día no
descansó para la escuela"*. Su objeción, y es correcta:

> *"¿qué tal si el chico está de vacaciones, al otro día hasta cualquier hora y descansa bien, o
> si el chico va a la escuela por la tarde, duerme hasta el mediodía? En los dos casos está
> descansado."*

🔑 **El sistema no conoce los horarios de esa casa.** Ve la hora de la actividad y nada más.
Afirmar el descanso era **afirmar algo que no se ve** — la misma familia de error que el "volumen
de mensajes" del 14/8, y encima escrita por nosotros y no por el modelo.

⚠ **Y no hacía falta.** Lo que sostiene a la madrugada como absoluta nunca fue el daño que causa:
es que **no depende de conocer al chico**, porque la referencia es la edad. Eso es justo lo que
importa cuando el abuso empezó antes que el sistema. La justificación vieja era una
racionalización de una decisión que ya estaba bien tomada por otro motivo.

📌 **Ahora, cuando hubo madrugada, el informe dice el límite en voz alta:** que no sabe si está de
vacaciones, si entra a la mañana o si va al turno tarde.

### 🔎 Lo que se chequeó el 16/8 y NO se pudo confirmar

Edgardo planteó la hipótesis con la honestidad de marcarla como tal: *"supongo (debemos chequear
y confirmar) tomamos ese dato porque se supone que es donde más atacan los depredadores"*.
**Se chequeó y no se confirmó.** La
[guía para padres del Ministerio de Justicia](https://www.argentina.gob.ar/justicia/convosenlaweb/situaciones/guia-para-padres-familias-y-docentes-grooming)
no menciona horarios de conexión ni hábitos de sueño, y no apareció estadística que sostenga que
el contacto se concentra de madrugada. 🔴 **Así que no se afirma en ningún lado.** Reemplazar una
justificación sin fuente por otra sin fuente habría sido el mismo error con mejor cara.

Lo que **sí** tiene respaldo, y es de nivel `organismo` (sin cifra detrás): el
[MPBA](https://www.mpba.gov.ar/grooming) incluye *"observar cambios de humor y horarios de
conexión"* en su lista oficial de recomendaciones a adultos. Alcanza para mirar el horario. No
alcanza para explicar por qué.

### 🔴 El asistente explicaba DOS de las cuatro señales al revés

Salió de tirar del hilo anterior. El prompt estable decía *"las dos primeras se comparan contra la
historia del propio chico"* enumerando volumen y **madrugada**, y *"las dos últimas no se comparan
contra nada"* enumerando **plataforma nueva** y evasión. El código dice lo contrario: absolutas
son madrugada y evasión; relativas, volumen y plataforma nueva.

⚠ O sea que a un padre le venía explicando mal la mitad del mecanismo, y con la autoridad del
sistema. **Ninguna prueba lo iba a encontrar**: el control mira lo que el asistente afirma, no si
el corpus describe bien el motor. Lección: cuando cambie `CLASE_DE_SENAL`, se revisa el prompt en
el mismo commit.

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

⚠ **Y choca con nuestra otra fuente:** el Estudio nacional argentino (2023) mide **Facebook 52,8%,
Instagram 33,1% y WhatsApp 30,7%**; el británico pone a Snapchat primero con 48% y a
Facebook/Messenger en 12%. No es que uno esté mal — **el ranking de plataformas es propio de cada
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
fuentes (66,3% femenino y 72,3% de 12 a 14 en el estudio nacional; franja 9 a 13 en el LATAM). Que **cada acosador** persiga un perfil consistente es una
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

---

## ⬜ EL CONTEXTO DEL CHICO — qué se carga en el alta, decidido el 16/8

**Salió de la corrección de la madrugada:** el sistema no sabe a qué hora se levanta ese chico, y
por eso no puede afirmar nada sobre su descanso. Edgardo cerró el hueco enseguida: *"la
información del cuestionario debe darle al asistente información del chico, por ejemplo si va al
colegio por la mañana, por la tarde, si es un colegio mixto, público, etc."*

### 🔑 El turno escolar NO es una pregunta del cuestionario — es dato del alta

Son dos cosas de naturaleza distinta y conviene no mezclarlas:

| | Qué es | Dónde vive |
|---|---|---|
| **Cuestionario** | Observación **periódica**: *"¿con qué frecuencia viste X?"*, 0 a 3. Se vuelve a contestar | `observaciones` |
| **Turno escolar** | Dato **fijo** del chico, como la edad y el género | El alta, junto al `Chico` |

✅ **Y se enchufa solo en un mecanismo que ya existe y ya está probado.** Hoy `horaDeReferencia`
corre la hora de la madrugada **según la edad** (22 h a los 10, 01 h a los 17). Si el chico entra
al colegio a las 7, se corre para el otro lado; si va al turno tarde, también. **Mismo principio
que ya funciona: se mueve la hora, no se toca el peso.** Ver `factorMadrugada` en `pesos.ts`.

### Las vacaciones son un período, no una constante

Un interruptor en el panel —*"estamos de vacaciones"*— es más honesto que deducirlo de un
calendario. Sin eso, un chico de vacaciones acumula madrugadas que no significan lo mismo.

### 🔴 Lo demás es CONTEXTO, nunca puntaje — acordado

Colegio mixto o público, padres separados, chico que vive con tíos o abuelos: **no mueven ningún
número.** Palabras de Edgardo: *"claro que lo que te dije debe sumar a contexto no puntaje. Ahí es
donde el sistema debe ser un sabueso/inspector"*. El porqué completo está en la sección
«DESPUÉS DEL 23», punto 2 — lo documentado no es la forma de la familia, es si el chico puede
hablar con alguien.

**Dónde sí sirve ese contexto, sin hacer daño:**

- **El asistente**, para no dar consejo estúpido. Si el que pregunta es el abuelo, *"hablá con tu
  hija"* no sirve.
- **La escalada.** Si los padres están separados y viven en casas distintas, la segunda línea es
  naturalmente la otra casa.
- **El cuestionario**, que ya tiene la maquinaria: cada indicador lleva su `procedencia` y dice
  cuando no hay fuente primaria. Si algún día un dato se gana un peso, entra por ahí y documentado.

---

## ⬜ EL ACUSE DE RECIBO Y LA ESCALADA — diseñado el 16/8, sin construir

**Lo planteó Edgardo:** *"tenemos que crear un método que confirme que el padre recibió el
alerta, y si no lo recibió actuar de alguna manera… supongamos que al padre le robaron el celular,
o que muy atareado lo dejó pasar. Debería contestar al sistema de alguna manera, y si no hubo
respuesta el sistema debería activar una segunda línea de alertas."*

### 🔴 El agujero, medido

**Hoy `Respuesta.entregado` significa «el transporte aceptó el mensaje».** Telegram devolvió `ok`.
Si el teléfono está robado, apagado, o el padre deslizó la notificación sin leer, queda registrado
como entregado igual. **No tenemos ni el dato para saber con qué frecuencia pasa.**

### Las cuatro piezas, y cuál no existe

| Pieza | Estado |
|---|---|
| **El acuse** | Botón bajo el aviso en Telegram (`callback_query`). ⚠ El webhook hoy **sólo escucha `message`**, no toques de botón. En correo, un enlace que pegue en nuestro servidor |
| **Dónde se guarda** | `Respuesta` necesita `acusadoEn` + un token de un solo uso. Dos columnas |
| **Un reloj** | 🔴 **No existe nada.** AntiGro nunca se despierta solo: todo pasa cuando alguien abre una página o cuando Telegram nos golpea. Hace falta un cron (**no hay `vercel.json` ni `vercel.ts`**) |
| **La política** | Decidida abajo |

### 🔑 La política: cuelga de la PERSISTENCIA, no de un cronómetro

**Es la regla 5 aplicada a la insistencia.** *No se alerta por un evento, se alerta por
persistencia* — y lo mismo vale para volver a golpear:

- El aviso sale con patrón sostenido. Nadie acusa recibo.
- **Si el patrón se sigue sosteniendo, el sistema escala.** La razón para insistir sigue viva.
- **Si el patrón se cortó, no escala.** Perseguir a un padre por un aviso que ya no tiene sustento
  es exactamente cómo se gana el silenciado.

🔑 **Hay dos relojes y mezclarlos es la trampa:** el de *«¿lo vieron?»* corre en **horas**; el de
*«¿sigue pasando?»* corre en **días**. La escalada cuelga del segundo; el primero sólo dispara la
pregunta.

⚠ **Una excepción:** la **evasión del filtro**. Es la señal más fuerte y es un acto deliberado. Un
patrón sostenido *con evasión* y sin nadie que acuse recibo es el caso donde esperar un día entero
se siente mal.

### 🔴 Qué es la «segunda línea», que no es obvio

**El aviso ya sale a los dos adultos como mínimo.** Que a uno le roben el celular no es el
problema — el otro lo recibió. El caso que duele es que **ninguno de los dos acuse**. Tres
candidatas, y no dan lo mismo:

1. El **otro canal de la misma persona** (Telegram cayó → correo).
2. Un mensaje **distinto** al otro adulto: *«a Mariana le avisamos hace ocho horas y no lo vio»*.
3. El **referente que eligió el chico**, si es un tercero fuera de los dos.

📌 **La escalera tiene techo, porque AntiGro no denuncia.** Arriba de todo está el panel
diciéndolo fuerte y **el chico, que ya recibió lo suyo por su canal sin depender de ningún
adulto** — eso ya está construido y es justamente contra este escenario.

### ⚠ Toca una regla ya escrita, y tiene que ser consciente

`avisar.ts` dice: *"no se repite el aviso — un sistema que manda la misma alerta todos los días se
apaga solo, y el día que tenga algo nuevo para decir nadie lo va a leer"*. Escalar por silencio no
es repetir a ciegas, pero roza esa regla: **que el cambio sea deliberado y quede escrito ahí.**

### 📌 Recomendación de orden

**El acuse primero, la escalada después.** El botón es barato y sin él estamos ciegos: no se puede
diseñar la escalada sin saber cuántas veces pasa de verdad.

---

## 🔎 LAS TRES CONSULTAS EXTERNAS — 2026-08-17/18

**Edgardo consultó por su cuenta a Perplexity, Gemini y Manus** sobre cómo alimentar un sistema
de alerta temprana de grooming, sin contarles nada de AntiGro. Los tres devolvieron arquitecturas
completas. 🔴 **Guardado a pedido suyo: *"andá guardando estos datos, que venimos bien"*.**

### 🔑 Lo que más vale: convergieron con decisiones que ya habíamos tomado

**Ninguno sabía nada del proyecto**, y aun así los tres describieron piezas que ya están
construidas. En un dominio donde ni él ni yo somos la fuente, esto es la mejor validación externa
disponible antes de hablar con un especialista.

| Lo que propusieron | Lo que ya teníamos | Desde |
|---|---|---|
| «Un solo factor aislado no genera alerta» | La regla de persistencia | 14/8 |
| Escala ponderada de riesgo | `en_calma` · `atencion` · `patron_sostenido` | 14/8 |
| Metadatos de red sin leer contenido | Regla 2 | fase 0 |
| Cuestionario a los padres, base psicológica | La segunda entrada, 9 indicadores | 14/8 |
| Etapas del grooming, detectar **progresiones** | `modus-operandi.ts` (SGM) | 15/8 |
| Aviso a adultos con derivación a protocolos | Las dos salidas + 137 y GAPP | 14/8 |
| «cuándo y cuánto, no qué se dice» | Nuestra formulación, casi textual | — |
| **«Nunca etiquetar a una persona como depredador»** | **Regla 1** | fase 0 |
| «Mostrar siempre por qué se generó la alerta» | `lectura.porQue` | 14/8 |
| Restar incertidumbre del puntaje | El `alcance`, que atenúa las relativas | 15/8 |

🔴 **Y Manus recomendó como «mejor siguiente pieza» construir un motor de correlación con reglas
ponderadas, que reciba eventos, reduzca falsos positivos y devuelva nivel, explicación y
recomendaciones.** Eso es exactamente `src/lib/motor/`, y está hecho desde el 14/8 con pruebas.

### ✅ Lo genuinamente nuevo, y vale

1. **🔑 LA EDAD DEL DOMINIO — lo mejor que salió de las tres.** Hoy `plataforma_nueva` significa
   **nueva para ese chico**; nadie mira si el dominio es nuevo *en internet*. Un chat registrado
   hace tres semanas no es Roblox, y el motor hoy los trata igual.
   · Fuente: WHOIS, o la API de VirusTotal (`docs.virustotal.com/reference/whois`).
   · Es metadato puro: no toca contenido, no rompe ninguna regla.
   · 🔑 **Se potencia con el observatorio:** dominio nuevo **+** aparece en varias casas **+**
     público homogéneo es mucho más que cada cosa por separado.
2. **Acortadores de URL.** No los clasificamos. Es la forma típica de mandar un enlace tapando a
   dónde va.
3. **Screen Time / Digital Wellbeing** — `DeviceActivity` + `FamilyControls` en Apple,
   `UsageStatsManager` en Android. Ver la sección propia más abajo.
4. **NCMEC, Interpol, Europol, UFECI** como fuentes de taxonomía. UFECI es argentina y engancha
   con «la vía policial-judicial» que ya estaba parqueada. 📌 NCMEC define *online enticement*
   como categoría paraguas — buen término, y citable.
5. **La ley argentina de protección de datos personales.** Citamos la 26.904 y la 27.590 y **no**
   la de datos personales, tratando datos de un menor. Es un hueco nuestro.
6. **Reputación de dominio (VirusTotal, PhishTank, abuse.ch).** ⚠ Con la salvedad de abajo.

### 🔴 Lo que NO pasa, y por qué — con nuestras reglas, no con una opinión

- **Cruzar el registro de ofensores sexuales (NSOPW / Offenders.io) con la ubicación por IP.**
  Falla la **regla 1**. No sabemos quién es el contacto —no leemos mensajes—, así que no hay
  ningún nombre que cruzar; la IP llega a nivel ciudad; y el registro es de EE.UU.
  🔑 **Manus lo confirma sin que se lo pregunten:** *"nunca etiquetar a una persona como
  «depredador»"*.
- **BERT / RoBERTa afinados para detectar grooming.** Falla la **regla 2**: esos modelos reciben
  texto. «Detectar el contexto sin leer cada palabra» es humo.
- **OSINT sobre los perfiles del chico** (PII expuesta, EXIF, ubicación visible). No falla ninguna
  regla escrita, pero **es una intrusión de otra naturaleza** — mirarle las redes. Merece
  discusión propia, no un descarte al pasar. Manus le da peso 20 y Gemini una capa entera.

### ⚠ Los errores que traían, verificados

🔴 **Perplexity afirmó que PhishTank, URLhaus y OISD «contienen dominios conocidos por alojar CSAM
o sitios de grooming». Es FALSO** y se verificó: URLhaus es distribución de *malware*, PhishTank
es *phishing*, OISD es malware/C2/phishing. Ninguna tiene que ver con abuso infantil.
📌 Es el mismo patrón que en Criterio Térmico, donde Perplexity inventó normas IRAM dos veces.
**Sirven para abrir puertas, no para cerrar decisiones.**

🔑 **Y Manus lo dice bien, que es la lectura correcta:** *"la reputación DNS permite detectar
phishing, malware o infraestructura sospechosa, pero **no identifica grooming directamente**;
debe ser una señal contextual de peso bajo"*.

⚠ **La lista que sí existe es la IWF** (Internet Watch Foundation): 500 a 800 URLs, actualizada
dos veces por día, sólo para miembros y licenciatarios, con cuota. **Pero resuelve otro problema:**
es material que *muestra* abuso, y a esos sitios entra el agresor, no el chico groomeado.

⚠ Varios indicadores que presentaban como «detectables» **no son visibles por DNS**: regalos
digitales, transacciones, borrado de historial, que el contacto busque perfiles de menores,
introducción progresiva de temas sexuales, amenazas. Son contenido, o pasan dentro de una app.

### 🔴 GROK — la cuarta consulta, y la más rigurosa. Es sobre todo una advertencia

**Contesta la pregunta de fondo con un no:** *"no hay bases de datos públicas detalladas de
perfiles de depredadores accesibles para sistemas civiles o comerciales"*. Los repositorios de
NCMEC e Interpol (ICSE) están restringidos a investigadores policiales. **Cuarta confirmación
independiente de que cruzar registros de ofensores no es un camino.**

📌 **Lo que sí hay, y es lo que ya usamos:** estadísticas agregadas, tipologías de alto nivel
derivadas de causas judiciales, y listas verificadas de dominios. Nada comparable «perfil contra
perfil».

#### 🔑 Y trae un hallazgo NUEVO que nos toca el diseño

**Save the Children** analiza sentencias judiciales (2023-2024) y da perfiles estadísticos:
víctimas de ~13 años, mayoría nenas — **eso ya lo teníamos**. Pero sobre los agresores dice dos
cosas que no teníamos:

1. 🔴 **«Mayoritariamente hombres, muchos SIN ANTECEDENTES».** Esto no es un dato de color: **es
   la razón de fondo por la que cruzar registros de ofensores no protegería a nadie.** Si buena
   parte no tiene antecedentes, no está en ningún registro. Nuestro camino —patrones de conducta,
   no identidades— no es sólo el más limpio legalmente: **es el único que alcanza a ese grupo.**
2. ⚠ **«Proporción creciente del entorno familiar o conocido».** Es incómodo y toca el diseño del
   referente: el adulto de confianza podría ser el problema. **No se resuelve antes del 23**, pero
   queda anotado — hoy el sistema supone que el referente es seguro por definición.

⚠ **Verificar en fuente antes de publicar cualquiera de las dos.** Vienen de un modelo, no del
informe. Si van al PDF o al video, primero se busca el documento de Save the Children.

#### ⚖ La advertencia legal, y hay que tomarla

*"Cualquier sistema que procese datos DNS de menores, perfiles de niños o contexto familiar entra
en territorio altamente regulado… consentimiento parental explícito"*, y recomienda **consultar
abogados especializados en protección de datos de menores** antes de construir.
📌 Encaja con el hueco que ya detectamos: **no citamos la ley argentina de datos personales.**

#### 📚 Fuentes que nombra y que podemos usar

**NCMEC CyberTipline** (el canal de reporte, y la fuente de *online enticement*) · **Save the
Children** (sentencias) · **IWF** e **INHOPE** · **National Juvenile Online Victimization Study**
(EE.UU.) · Ministerio del Interior de España, Policía Nacional (BIT) y Guardia Civil (GDT).
⚠ **Datasets académicos** (Perverted Justice, PAN 2012): son de chats y **para investigación**, no
para producción. Leerlos implicaría contenido — no entran.

📌 **Y coincide con nuestra prioridad de siempre:** *"el mayor impacto real sigue estando en
facilitar el reporte a las tip lines oficiales"*. Es lo que hace `RECURSOS` en `config.ts` con la
Línea 137 y GAPP.

### 🏆 LA QUINTA (Claude en claude.ai) — la más completa, y trae el respaldo que faltaba

#### 🔴 EL HALLAZGO MÁS IMPORTANTE DE LAS CINCO CONSULTAS

**Pamela Wisniewski (UCF/Vanderbilt) y su línea de trabajo, revisada por pares:** las apps de
control parental *"hacen poco para mantener seguros a los adolescentes"* y **pueden dañar la
confianza entre padre e hijo y reducir la capacidad del menor de responder a una amenaza**. En un
estudio de 74 apps Android, **el 89% de las funciones eran de control y sólo el 11% apoyaban la
autorregulación del adolescente**. Y el dato que lo cierra: la involucración parental y la
supervisión directa se asociaron con **menos** victimización — **pero NO el uso de apps de
control**.
Referencias: Park, Akter, Badillo-Urquiola & Wisniewski 2024 (IEEE Security & Privacy),
*"de control parental invasivo a soluciones centradas en el adolescente para la resiliencia
digital"*; y CHI 2026, *"From Vulnerable to Resilient"*, sobre cybergrooming y resiliencia.

🔑 **Esto no nos corrige: nos respalda, y es lo mejor que teníamos sin saberlo.** Cada decisión que
Edgardo tomó por criterio propio cae del lado que la investigación recomienda:

| Decisión suya | Lo que dice la literatura |
|---|---|
| **Regla 3** — el chico sabe desde el minuto cero | Transparencia con el adolescente por diseño |
| **Regla 4** — la charla de alta es la primera intervención | «Involucración parental directa», lo único que se asoció a menos victimización |
| **Al chico también le llega el mensaje**, no sólo a los adultos | Enfoque centrado en el adolescente, no en el control |
| **El referente lo elige el chico** (11+) | Autonomía evolutiva, comunidad |
| **No se leen los mensajes** | Minimización de datos |

➡ **Esto va al video y al PDF.** Es la diferencia entre «otro control parental» y un sistema
diseñado sobre lo que la investigación dice que funciona. ⚠ Verificar las citas en fuente antes de
publicarlas.

#### 🇦🇷 Datos argentinos nuevos y citables

🔴 **Línea 137 — Equipo Niñ@s contra la Explotación Sexual y Grooming** (Programa Las Víctimas
contra las Violencias): **823 consultas entre enero y octubre de 2022; el 38% (309) eran de
grooming. De esas 309: el 59% de las víctimas tenía entre 12 y 17 años, el 22% entre 6 y 11, y el
76% eran mujeres.**
🔑 Es dato **argentino, oficial y del organismo al que ya derivamos**. Encaja con nuestras bandas
de edad y con el factor de género que ya usamos. **Lo mejor para sumar al PDF.**

Otros: **NCMEC CyberTipline — 80.524 reportes de *online enticement* en 2022, +82%** interanual ·
**Thorn: 1 de cada 3 (33%) chicos de 9 a 12 reportó una interacción sexual online**; sextorsión en
1 de cada 5 adolescentes, con autolesión en el 15% que **casi se triplica al 28% en jóvenes
LGBTQ+** · **IWF: +360% de imágenes autogeneradas de chicos de 7 a 10 años** (H1 2020 vs H1 2022).

#### ⚠ 60% de los agresores eran conocidos por la víctima (estudio IBSEAC 2023)

🔴 **Segunda fuente independiente del mismo hallazgo** — Grok lo trajo vía Save the Children. Dos
fuentes distintas apuntando a lo mismo ya no es un dato suelto.
➡ **Toca el diseño del referente y no está resuelto.** Hoy el sistema supone que el adulto de
confianza es seguro por definición. No se arregla antes del 23; **no puede perderse.**

#### 🔴 ECH está cerrando la ventana del DNS — y nuestra arquitectura ya lo contesta

**ECH (Encrypted Client Hello, RFC 9858, fines de 2024)** cifra el ClientHello y elimina la última
fuga que quedaba: hasta ahora, aun con DNS cifrado, el hostname se veía en el SNI. Con ECH, un
observador de red sólo ve **IP de destino** (inútil detrás de CDN) y **volumen/tiempo**.

🔑 **Pero eso mata la observación pasiva, no la nuestra.** El informe lo dice con todas las letras:
*"lo realista es operar el **resolver** que el dispositivo usa, no espiar tráfico cifrado ajeno"*.
**Eso es exactamente AntiGro**: el perfil de NextDNS en el aparato del chico nos hace *ser* el
resolver, así que las consultas nos llegan cifrado o no.
⚠ **El agujero que sí tenemos sigue siendo el mismo:** una app o navegador con su propio DoH pasa
de largo nuestro perfil — y desaparecer se lee igual que estar tranquilo. Es el hueco que taparía
Screen Time.

#### ✅ Otras dos que nos validan

- **Los LLMs sobre-marcan grooming**: un estudio de 2024 probó 6 modelos sobre 3.840 respuestas y
  **marcan grooming en interacciones inofensivas**. ➡ Es exactamente por lo que la IA acá **no
  decide**: decide el motor y `reglas.ts` revisa lo que sale.
- **Arquitectura de Bark**: alerta + fragmento + categoría, **nunca la transcripción completa**.
  Nosotros hacemos aún menos —ni fragmento, porque no hay contenido—, y es la misma filosofía.

#### 🔴 El perfil de vulnerabilidad: lo que decidimos el 16/8 tiene respaldo legal

El SGM describe que la etapa de selección apunta a chicos *inseguros, solitarios, con baja
autoestima, no cercanos a sus padres, de hogares monoparentales, con falta de supervisión*. **Y el
informe advierte en la misma página** que usar identidad LGBTQ+, nivel socioeconómico o estructura
familiar **como features de riesgo es éticamente problemático y potencialmente ilegal**: convierte
características protegidas en predictores. Bajo el **AI Act** europeo, inferir datos sensibles y
perfilar menores cae en categorías prohibidas o de alto riesgo.
➡ **Es la decisión de Edgardo del 16/8, palabra por palabra:** *"debe sumar a contexto no
puntaje"*. Ahora tiene marco legal detrás, no sólo criterio.

#### ⚖ Lo legal, con el artículo preciso

**Ley 25.326, art. 2: la vida sexual es dato sensible; art. 7: nadie puede ser obligado a darlos.**
Un sistema que infiere riesgo sexual de un menor **trata datos sensibles de un menor** — el punto
más delicado de todos. Hay reforma en curso alineada al RGPD (proyectos 2024-2025).
**Observación General 25 (CRC/C/GC/25, 2021):** primer documento que reconoce los derechos del
niño online, y protege **su privacidad incluso frente a la vigilancia de sus padres**.
**Ley 26.904** (art. 131 CP) y **Ley 27.458** (Día Nacional, 13/11) ya las citamos.

#### 📌 Buena parte de ese informe describe OTRO producto — y conviene tenerlo claro

Las secciones de corpus (PAN12, ChatCoder2, Perverted-Justice), de modelos en español
(BETO/RoBERTuito) y de APIs de moderación **suponen un sistema que lee las conversaciones**. Ese
no es AntiGro: rompe la regla 2. **No hay que leerlo como una hoja de ruta que estamos ignorando** —
describe la otra mitad del campo, la que decidimos no pisar.
⚠ Dato útil igual: **no existe corpus de grooming publicado en español**, y los que hay son de
2012, en inglés y de **operaciones señuelo** (adultos haciéndose pasar por chicos), no de víctimas
reales. Si alguna vez alguien nos pregunta por qué no clasificamos texto, ésa es la respuesta corta.

#### ⚠ Lo que hay que verificar antes de publicar cualquiera de estas cifras

Vienen de un modelo, no de los informes. **Antes de que vayan al PDF o al video, se busca el
documento.** El propio informe marca dos con cautela: los «45 minutos / 19 segundos» de grooming en
gaming salen de **Crisp**, una firma comercial citada por WeProtect; y varias cifras provienen de
ONGs que mezclan investigación con *advocacy* (Thorn, WeProtect, Grooming Argentina).

### 📱 Screen Time / Digital Wellbeing — la decisión es de Edgardo

🔴 **Acá me equivoqué el 18/8 y él me lo marcó.** Dije que exigir una app «es exactamente lo que le
prometemos que no hacemos», y **es falso: en el celular del chico SÍ instalamos algo** —el perfil
de NextDNS—, y lo pusimos ahí justamente porque el router no ve los datos móviles. Usé un
argumento que contradice nuestra propia decisión, y venía de rechazar tres sugerencias seguidas.

**La diferencia real es de grado, no de género:** un perfil de DNS es una **configuración**; Screen
Time exige una **app** que corre en el aparato.

🔑 **Y tiene un argumento fuerte a favor que hay que registrar:** nuestro DNS tiene un agujero real
—un navegador con DoH propio, o una app con IP fija, **desaparece de nuestra vista**— y desaparecer
se lee **igual que estar todo tranquilo**, que es el fallo silencioso que más nos importa. Screen
Time tapa justo ese hueco: ve tiempo de uso por app aunque el DNS no vea nada.

Costo: app, permiso especial de Apple (`FamilyControls`), y cambia lo que se le cuenta al chico.
⚠ En Apple los datos de `DeviceActivityReport` están pensados para **no salir del aparato**, así
que probablemente haya que calcular ahí. `developer.apple.com/documentation/screentimeapidocumentation/`

### 📌 Los cuatro límites que propuso Manus — tres ya son nuestros

No leer mensajes privados ✅ · **no grabar teclado, pantalla, cámara ni micrófono** (nunca hizo
falta decirlo porque no tenemos app; si alguna vez hay una, esto se escribe) · procesar
localmente lo posible · mostrar siempre por qué se generó la alerta ✅ y nunca etiquetar a una
persona ✅.

---

## 🗓 DESPUÉS DEL 23 — parqueado con acuerdo, no olvidado

**Los cuatro los trajo Edgardo el 16/8 y él mismo los mandó a después de la presentación.** No
entran antes del congelamiento del jueves 20; quedan escritos para no volver a pensarlos de cero.

### 1. La investigación de verdad, por la vía policial-judicial

🔑 **El dato es de una psicóloga que le comentó a Edgardo** que este material se consigue en
**esferas policiales y judiciales**, no en la web abierta. Encaja con lo poco que encontramos: el
único estudio de factores de riesgo que apareció está armado sobre **sentencias** (20 sentencias
españolas, 65 víctimas —
[Revista de Psicología, COP Madrid, 2023](https://journals.copmadrid.org/apj/art/apj2023a9)).

⚠ **Reconocido el 16/8: la investigación que hicimos no alcanza.** Es de fuentes abiertas y de
muestras chicas. Vale para sostener lo que el producto afirma hoy; no vale para fundar pesos
nuevos.

### 2. El perfil de vulnerabilidad — **contexto, nunca puntaje**

Edgardo planteó usar escuela mixta o pública, padres separados, chico que vive con tíos o abuelos.
**Acordado el 16/8: eso suma al contexto, no al puntaje** — palabras suyas: *"claro que lo que te
dije debe sumar a contexto no puntaje. Ahí es donde el sistema debe ser un sabueso/inspector"*.

🔴 **Y hay un motivo fuerte además del acuerdo: lo documentado no es la forma de la familia, es si
el chico puede hablar con alguien.** El estudio de arriba enumera edad, sexo, tiempo en internet,
discapacidad intelectual, historia previa de abuso, autoestima y **comunicación familiar
deficiente** — y **no aborda** estructura familiar ni tipo de escuela. Un puntaje que suba porque
el chico vive con la abuela convierte a AntiGro de *"percibe señales"* en *"clasifica chicos"*, le
dice eso a una abuela con autoridad de sistema, y no tiene con qué respaldarlo.

📌 El factor mejor documentado **ya está resuelto en el producto y sin puntuar a nadie**: el 43%
que dice no hablar sobre los riesgos en Internet con sus padres es exactamente *"comunicación
familiar deficiente"*, y la respuesta de AntiGro no es un score, es **el segundo adulto que elige
el chico**.

⬜ Dos factores documentados que hoy NO usamos y merecen discusión seria: **historia previa de
abuso** —engancha con el punto ciego del 14/8, el chico que ya venía siendo acosado antes del
alta— y **discapacidad intelectual**. Los dos son delicados de preguntar en un alta.

### 3. El informe para que el padre denuncie

**Preguntado por Edgardo el 16/8. NO existe, y no hay que confundirlo con el de la sección de
abajo** (ese es AntiGro reportando un **dominio** a la UFECI; este es un padre yendo a denunciar
por **su** hijo).

🔑 Lo que lo haría útil no es una conclusión —el sistema no afirma, regla 1— sino **el registro
fechado**: qué se observó, en qué días, y qué es lo que el sistema explícitamente NO puede ver.
`senalesQueLaSostienen` existe justamente para que cada cosa dicha se pueda mostrar.
⚠ Y un informe así **no es prueba** (mismo argumento que abajo): es una cronología que ordena la
denuncia. Presentarlo como prueba quema la credibilidad ante la única oficina que hace falta.

### 4. El mismo motor para bullying

**Lo levantó Edgardo el 16/8:** *"si esto sale bien el mismo motor puede servir para casos de
bullying"*.

✅ **La arquitectura transfiere y ya está construida así:** tres entradas detrás de interfaces,
persistencia en vez de eventos, el control sobre lo generado, dos adultos, el chico enterado.
🔴 **Los números NO transfieren.** Los pesos salen de estudios de grooming y los indicadores del
cuestionario tienen `procedencia` documentada para grooming. El bullying además pasa en buena
parte **en la escuela**, donde la red no ve nada. Habría que volver a fundar pesos e indicadores.
📌 Por eso el PDF de presentación **no dice nada de bullying**, y esa decisión se mantiene: se
puede contar como dirección del proyecto, no como algo que ya hace.

---

## Modelo de datos

- **Familia**
- **Chico** — `edad` y `género` son **datos del motor**, no adornos: cambian el peso de las
  señales y cambian el texto del mensaje.
- **Adultos responsables — mínimo dos**, cada uno con su canal.
  📌 Propuesta abierta: que **uno de los dos lo elija el chico** (una tía, un hermano mayor).
  El 43% de los chicos dice no hablar sobre los riesgos en Internet con sus padres (encuesta en
  11 escuelas, citada en el estudio nacional), así que el segundo adulto no es redundancia
  técnica: es alguien a quien de verdad le va a escribir.
- **Canal del chico**, separado del de los adultos.
- **Canales configurables al contratar:** Telegram, correo, WhatsApp. La capa de mensajería es
  indiferente al canal.
- **Registro de señales y respuestas con fecha** — sin esto no se puede medir persistencia.
- **La charla del adulto con el asistente** (tabla `charlas`, agregada el 16/8 a la noche).
  🔴 Es la **única** tabla con texto de una conversación, y no contradice la regla 2: lo que
  nunca se guarda es lo que escribió **el chico**. Esto es un adulto preguntándole al sistema.
  🔴 **Era de cada adulto hasta el 16/8; desde el 17 es de la FAMILIA** —entre padres no hay nada
  separado, ver «EL HOGAR»— y **se borra entero de un toque**,
  con `delete` de verdad. Se puede borrar porque no entra a ningún cálculo; las señales y las
  observaciones no se pueden, porque de ahí sale la lectura.

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

🔴 **`faltantesDeAlta()` dejó de existir el 17/8** — ver «EL HOGAR». Lo que sigue vale para
entender de dónde salió, no para lo que hace hoy.
🔑 **Contaba sólo adultos ACTIVOS.** Era lo que hacía visible el hueco: la
baja no se traba nunca, pero la familia que queda con uno solo lo ve escrito en pantalla hasta
que lo cubra. Verificado en el navegador el 16/8.

🔴 **REESCRITO EL 19/8, y la versión vieja decía dos cosas mal.** Decía *«gana el que vio MÁS»* —
lenguaje de competencia, que Edgardo marcó: *"no es una competencia"*— y justificaba la regla con
el referente, que **no contesta el cuestionario ni entra al panel**.
🔑 **Lo que hace de verdad `juntarObservaciones` (en `src/lib/motor/cuestionario.ts`):** de cada
adulto vale su **última** respuesta, y de cada **PREGUNTA** queda la más alta, venga de quien
venga. Es por pregunta y no por persona: el padre puede quedar arriba en los horarios y la madre
en los regalos. **Nadie gana.** El porqué es que nadie ve el día entero de un chico — que un
adulto no haya visto algo no prueba que no pasó, prueba que no estaba delante. Promediar partiría
al medio una observación real por la ausencia del otro.
⚠ **Sólo puede subir, nunca bajar**, y se acepta: subestimar es peor que mirar de más. Desde el
18/8 se puede ver de dónde vino, porque la firma se muestra.

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
`mariana@ejemplo.ar` y `carla@ejemplo.ar`. 🔴 **La clave va en `.env.local`, nunca acá:** este
archivo se publica. Ver «LA AUDITORÍA DEL 17/8».

✅ **Los tres que faltaban acá ya están:** el asistente (16/8), el alta —que no quedó «desde el
panel», la familia se da de alta sola— (17/8) y **el cuestionario del adulto (19/8)**.

### Quién tiene cuenta

| Quién | Entra con contraseña | Recibe por su canal |
|---|---|---|
| **Los progenitores** | 🔴 **una sola clave, del HOGAR** (cambió el 17/8) | ✅ |
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
  que sostiene el 43% que dice no hablar sobre los riesgos en Internet con sus padres.
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
| Los casos del control | `src/lib/ia/reglas.prueba.ts` · `npm run probar-reglas` |
| La ruta (`GET` la charla · `POST` pregunta · `DELETE` la borra) | `/api/mi-familia/asistente` |
| La pantalla y el dibujo del markdown | `src/app/mi-familia/page.tsx` |
| Dónde vive la charla | tabla `charlas` (esquema, sección 11) |

### ✅ La charla se guarda y se retoma (16/8, a la noche)

**Era lo primero de la segunda vuelta y ya está.** Un padre pregunta a las dos de la mañana,
cierra el navegador y vuelve al otro día: antes volvía a arrancar de cero la conversación más
difícil que va a tener, y el asistente no se acordaba de nada.

- 🔴 **SIN EFECTO desde el 17/8 — era de cada adulto, ahora es de la familia.** Ver «EL HOGAR».
  Se conserva el texto para saber qué se pensó y por qué se cambió. Verificado con
  las dos cuentas: Carla ve la suya, Mariana ve cero.
- **Se borra entero de un toque**, con confirmación en la propia pantalla y un `delete` de
  verdad. Que la charla se guarda, y que es suya, se dice **en la pantalla** y no en una
  política que nadie lee.
- 🔴 **La historia dejó de venir del navegador: sale de la base.** Antes viajaba en el pedido
  y, si bien no podía fabricar hallazgos, sí permitía inventarle al asistente turnos que nunca
  dijo —*"vos me dijiste que no era nada"*— y arrancar desde ahí. **Del cliente hoy sale sólo
  la pregunta**, igual que la lectura ya se recalculaba en el servidor.
- 📌 El modelo ve los últimos 12 turnos; la pantalla trae 60. Que el asistente no tenga presente
  algo de hace tres días no quiere decir que el adulto no pueda releerlo.

### ⏱ La espera dice por qué espera

El modelo tarda entre 10 y 18 segundos medidos, y **no transmite mientras escribe a propósito**
(ver arriba). Ese rato ya no dice "Pensando…": dice que la respuesta se escribe entera porque el
control tiene que verla completa antes de que salga, y cuenta los segundos de verdad.

🔑 Es la única parte del producto donde la garantía se explica justo en el momento en que se
está cumpliendo. ⚠ Nada de barra de progreso: nadie sabe cuánto falta, y este es el peor sistema
donde acostumbrar a alguien a creerle a un número inventado.

### 🔴 Decir una frase no es lo mismo que nombrarla — el error del 16/8 a la noche

**Es la tercera vez que el control frena de más, y la peor.** El asistente escribió:

> No te lo puedo decir… Si te dijera **"quedate tranquila"**, te lo estaría diciendo con voz de
> sistema, y esa frase, dicha en la casa equivocada, es la que hace que alguien deje de mirar.

Estaba **citando la frase prohibida para negarse a decirla**, que es exactamente lo que el prompt
le pide. El control la leyó como si la estuviera diciendo y tiró al respaldo la mejor respuesta
del día — ante *"decime que no es nada"*, que es la primera pregunta de un padre asustado.
Después apareció una segunda forma: *Con eso no se construye un "quedate tranquila"*.

**Cómo quedó:** una frase se perdona sólo si está **entrecomillada** y en la **misma oración**,
antes, hay algo que la desactiva (una negación o un condicional). El límite es la oración y no
una cantidad de caracteres: *«No sé qué decirte. Quedate tranquila.»* tiene que seguir frenándose.
Y ahora se miran **todas** las apariciones de cada patrón, no la primera: alcanzaba con nombrar
la frase antes de decirla para que la segunda pasara sin que nadie la mirara.

⚠ **El agujero que queda, escrito para que se vea:** *«no sé qué decirte, pero "quedate
tranquila"»* pasa. Se aceptó a sabiendas — el modelo no está tratando de burlar el control, y el
error que sí apareció dos veces en pruebas reales es el otro.

📌 **Lo que el control frena queda en el registro del servidor**, con el motivo y el texto
entero. Sin eso, desde afuera un asistente demasiado estricto y uno roto se parecen: los dos
contestan el respaldo.

📌 **La cita se dibuja como cita.** Cuando el asistente escribe con `>` es porque le está dando
al padre la frase para decirle al chico — lo más útil que contesta— y se veía el signo colgando
adelante de la única línea que el padre va a copiar.

### 🔴 El respaldo dice POR QUÉ no puede contestar más — lo corrigió Edgardo el 16/8

> *"¿por qué no se le puede contestar más ampliamente? No es capricho, el sistema no tiene en un
> día datos suficientes para analizar. Esto es una realidad y por eso no va a inventar."*

Tenía razón en lo que importa: **una negativa sin motivo se lee como una política del producto, y
una política se discute.** Un límite real, con el número adelante, se entiende — y entenderlo es
lo que hace que el padre confíe en lo que el sistema **sí** dice.

Ahora el respaldo trae la lectura y escribe *"el sistema lleva **1 día** conociendo a Ana… con
eso alcanza para mirar, no para sacar conclusiones, y por eso el sistema no las inventa"*. El
número sale del motor (`lectura.perfil.diasObservados`), así que la frase es cierta con un día y
con trescientos.

⚠ **Lo que ese texto NO hace es mentir sobre la causa de esa vez.** El respaldo salta porque
falló la llamada o porque el control frenó lo que se escribió, y ninguna de las dos es la falta
de historia. Por eso van separadas: primero que esta vez no se pudo, y aparte —porque es verdad
siempre— cuánta historia hay. **Inventar la causa acá sería el error que el producto entero
existe para no cometer.**

📌 **Y el cartel de la pantalla dice cuál de las dos fue** (`causa`: `control` o `falla`, columna
en `charlas` para que siga siendo cierto al recargar). Decía "el control no dejó pasar lo que
escribió el modelo" incluso cuando se había caído la llamada: el mismo error una capa más
arriba, y encima colgándose un mérito que no hubo.

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

🔴 **Y volvió a pasar esa misma noche, dos veces más.** Por eso ahora existe
`npm run probar-reglas`: **toda regla nueva entra con su caso que pasa y su caso que se frena.**
La mitad de arriba de esa lista importa tanto como la de abajo.

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

🔑 **Y un dato que tiene que ordenar el consejo: el 43% de los chicos dice no hablar sobre los
riesgos en Internet con sus padres** (encuesta en 11 escuelas, citada en el estudio nacional).** O sea que el consejo de manual —"hablá con tu hija"— tiene casi
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

Las bandas salen de los datos: el estudio nacional midió **72,3% entre 12 y 14 años** y un 14,5%
entre 6 y 11; la franja más vulnerable va de 9 a 13 (Grooming LATAM, 2025); y ESET —citado en el
estado del arte del estudio— pone el grueso entre 11 y 15, con un segundo grupo entre 7 y 10.

⚠ **Estas bandas de MENSAJE no son las bandas de `factorEdad`, y está bien que no lo sean.**
Acá se decide *cómo se le habla*; en `pesos.ts` se decide *cuánto pesa*. Cambiar una no obliga a
cambiar la otra.

| Banda | Cómo se le habla | A quién se lo deriva |
|---|---|---|
| **7–10** | Corto y concreto, una idea por mensaje, sin abstracciones | Directo al adulto de confianza |
| **11–13** | Se explica el mecanismo; se nombra el grooming como delito | Adulto de confianza + Línea 137 |
| **14–17** | De igual a igual, nada que suene a reto ni a control | El adulto que eligió él, Línea 137, denuncia |

⚠ **Guardarraíl de género:** se diferencia sólo **qué tipo de riesgo se enfatiza**, y sólo donde
hay dato que lo respalde (**66,3% de las víctimas de grooming fue de género femenino**). El tono y
el respeto son iguales para todos. Si el mensaje suena distinto según si es varón o mujer más allá
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

Del **Estudio nacional sobre conocimiento y experiencias sobre acoso sexual a NNyA mediante TIC**,
Ministerio de Justicia y Derechos Humanos de la Nación, Dirección Nacional de Política Criminal,
2023. **Unidad de relevamiento: el hogar.**
🔗 https://www.argentina.gob.ar/sites/default/files/2024/10/encuesta_nacional_grooming_-_ano_2021.pdf

🔴 **ESTE DOCUMENTO TIENE DOS MITADES Y HAY QUE LEERLAS DISTINTO.** Las primeras ~30 páginas son
**estado del arte**: resúmenes de estudios AJENOS (ESET, Digi Padres, Grooming Argentina, El
Litoral, una encuesta en 11 escuelas, UNESCO/CIPDH, Google). La **medición propia** empieza recién
en los resultados de la encuesta a hogares. ⚠ **Todo lo citado antes de ahí NO es del estudio, por
más que esté adentro de su PDF** — el barrido del 21/8 encontró cuatro cifras del producto mal
atribuidas por exactamente este motivo.

#### ✅ Lo que el estudio MIDIÓ

- **57,5%** de los hogares con internet tiene controles adultos sobre su uso. 🔑 Y **en dos tercios
  de los hogares donde se usa internet, los adultos conocen poco o nada de lo que hacen ahí los
  chicos**. ⚠ Son dos universos distintos: el segundo **no** es «dos tercios de los que tienen
  controles». 📌 El estudio se contradice —dice *dos tercios* en la síntesis y *tres de cada
  cuatro* en la conclusión—; se usa **dos tercios**, que es lo más conservador.
- **23,1%** conoce el nombre con el que se denomina el acoso sexual a chicos en internet.
- **27,6%** de los que se contactaron con desconocidos recibió comentarios eróticos o sexuales sin
  solicitarlos · **8,3%** de los hogares recibió o le solicitaron imágenes de chicos en situaciones
  sexuales.
- **4,4%** de los hogares con internet y chicos tuvo una víctima de grooming; **1,9%** en los doce
  meses previos.
- Dónde ocurrió: **Facebook 52,8% · Instagram 33,1% · WhatsApp 30,7%**.
- **72,3%** de las víctimas tenía 12 a 14 años · **14,5%** de 6 a 11 · **14,5%** de 15 a 17.
- **66,3%** femenino · **33,7%** masculino.
- Al **43,5%** la acosaron más de una vez; al **29,3%**, una sola.
- **37,3%** no se denunció en ningún lado (33,4% policía · 18,4% organismo judicial · 9,2% fiscalía).
- **61,4%** de las familias no sabía quién era el agresor.
- ⚠ **TODO lo referido a víctimas sale de una base de 23 casos**, y el propio estudio aclara que con
  esa cantidad no publica cruces por no ser estadísticamente significativos. **Se cita con esa
  salvedad, siempre.**

#### ⚠ Lo que el estudio CITA de otros — y el producto daba por propio

| Cifra | De quién es de verdad |
|---|---|
| Argentina 2º de América Latina en ciberacoso infantil · **74,3% por WhatsApp** · **80%** nenas · **90%** acoso cotidiano durante meses · **60%** no se denuncia | **CIPDH-UNESCO, 2021.** 🔴 **Acá decía «miden bullying virtual, no grooming» y es FALSO** — verificado el 23/8 contra la fuente: el informe cubre grooming y **el 86,7% de sus casos SON grooming y pornografía infantil**. Se citan «de los casos», con la fuente al pie. Ver la corrección arriba |
| **56,4%** habla con desconocidos · **35,4%** pedido de fotos | **Grooming Argentina**, n=4.276, 2019-2020 |
| **63%** no sabe qué es el grooming | **El Litoral**, nota del 6/4/2018 |
| **43%** dijo no hablar sobre los riesgos en Internet con sus padres | **Encuesta en 11 escuelas** de una ciudad |
| **73,9%** denunciaría · **62,9%** borraría al agresor · **31%** prohibiría · grueso de víctimas **11 a 15** y segundo grupo **7 a 10** | **ESET Latinoamérica, 2013** |
| **40%** no está familiarizado con el control parental | **Google** |
| **60%** recibió solicitud de contacto de desconocidos | **Digi Padres**, 2019 |

📌 **Marco legal, que sí es del documento:** delito desde 2013 — **Ley 26.904**, art. 131 CP, 6
meses a 4 años. Programa Nacional desde 2020 — **Ley 27.590 «Mica Ortega»**.
📌 Recursos a los que se deriva: **Línea 137** y la app **GAPP** de Grooming Argentina.

### Fuente 2 — Informe Grooming LATAM (14 países, 2024/2025) · **incorporada el 15/8/2026**

Red Grooming LATAM (impulsada por Grooming Argentina), presentado en mayo de 2025.
**n≈28.360 encuestas anónimas a NNyA de 9 a 17 años en 14 países.**
https://groomingarg.org/informe-grooming-latam

🔑 **Es más grande y más nueva que la fuente 1, y coincide con ella.** Dos estudios
independientes, dos años y muestras distintas, misma dirección: eso es más fuerte que cualquiera
de los dos solo.

| | LATAM 2025 | Lo comparable en el PDF del Ministerio |
|---|---|---|
| No sabe qué es el grooming | **72,8%** | 63% — ⚠ **es de El Litoral (2018)**, no del estudio |
| Habla con desconocidos | **60,0%** | 56,4% — ⚠ **es de Grooming Argentina**, no del estudio |

⚠ **La tabla se conserva porque las cifras coinciden y eso vale**, pero la columna derecha NO es
medición del Ministerio: son dos estudios que el Ministerio resume. Lo que el Ministerio sí midió
sobre conocimiento es otro número y otra pregunta: **23,1% conoce el nombre** del acoso sexual a
chicos en internet.

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
- 🔴 **`npm run probar` antes de cada commit que toque lógica.** Corre las tres tandas:

  | | Qué cuida |
  |---|---|
  | `probar-reglas` (12) | Que el control del asistente no frene de más ni de menos |
  | `probar-sugerencias` (11) | Que no se le diga a una familia que está incompleta cuando no lo está |
  | `probar-instalacion` (27) | Que los endpoints de DNS estén letra por letra |

  🔑 **Las tres existen por el mismo motivo: son errores que el typecheck NO ve.** Una regla que
  frena de más deja al padre sin respuesta; una sugerencia de más le dice a una familia que le
  falta algo; un DNS mal escrito no da error y deja al motor ciego. **Toda regla nueva entra con
  su caso que pasa y su caso que se frena** — sin el segundo no se sabe si la condición hace algo.
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
- 🔴 **Este archivo se pudre solo.** Corregirlo en la MISMA sesión en que se corrige el código, y
  cuando contradiga al código, **gana el código**. El 17/8 quedaron varias secciones del 16 que
  decían lo contrario de lo que hace hoy el sistema; están marcadas donde aparecen, no borradas,
  porque saber qué se pensó antes y por qué se cambió vale más que un archivo prolijo.
- 🔴 **El repositorio es PÚBLICO.** Nunca una clave, un token ni un identificador de perfil acá.
  Ya pasó una vez y abría el panel de administración de producción.
