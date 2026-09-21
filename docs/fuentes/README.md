# Fuentes para la trazabilidad del motor — España y Europa

Bajadas el **2026-08-31**. Al lado de cada PDF hay un `.txt` con el texto extraído (`pdftotext -layout`),
para poder buscar dentro sin abrir el PDF.

> 🔑 **Para qué están.** Hoy los pesos del motor (`src/lib/motor/pesos.ts`) salen del criterio propio.
> Con esto cada peso puede llevar **de dónde sale**, y una organización externa puede auditar el
> criterio **sin ver un solo dato de un chico**.
>
> ⚠ **Son marco de referencia, no el mecanismo.** El punto de comparación sigue siendo el propio
> chico y su línea base. Estos datos no la reemplazan: explican **por qué un desvío importa**.
> (Decidido el 24/8 al escribir el correo de Faro Digital — el error de entonces fue redactar como si
> el sistema cotejara contra una tabla.)

---

## 1. `interior-grooming-policial.pdf` — LA MÁS ÚTIL PARA EL MOTOR

**«Investigaciones policiales por delitos de online child sexual grooming en España»**
Soldino Garmendia, G. Jusue Moñino, Carbonell y otros · publicado por el **Ministerio del Interior** ·
48 páginas.

Es un estudio cuantitativo sobre **investigaciones policiales reales**, con las variables codificadas
una por una. Las que valen para el motor:

- **Duración del delito** — meses entre el inicio y el final del *iter criminis*.
- **Duración de la conversación** — días entre el primer y el último mensaje del chat.
- Distancia y tiempo de viaje entre groomer y víctima.
- Duración media de las investigaciones policiales: **96 días**.

➡ Es la única fuente que da **tiempos medidos del proceso de captación**, que es justo lo que el motor
necesita para saber cuánto tiene que sostenerse un desvío antes de significar algo.
🔴 El servidor está detrás de Cloudflare: **no se baja con `curl`, hay que usar el navegador.**

## 2. `savethechildren-tras-la-pantalla-2026.pdf`

**«Tras la pantalla: violencia sexual contra la infancia en el entorno digital»** · Save the Children ·
enero 2026 · 13 páginas. Análisis de **23 sentencias / 28 casos** de online grooming en España 2023-2024.

- Chicas: **68,6 %** de las víctimas (edad media **13 años**; picos a los 13 y 15, 25 % cada uno).
- Denuncias por delitos sexuales digitales contra menores: **954 en 2022 → 1.078 en 2024**.
- 🔑 **Agresores del entorno familiar: del 3,3 % (2021-22) al 25 % (2023-24).**

➡ Ese último dato **valida las dos decisiones más discutibles de AntiGro** con una fuente española y
judicial: que el sistema **no lea los mensajes**, y que **la persona de confianza la elija el chico**.
📌 También está en catalán (`Darrere la pantalla`) y euskera (`Pantailaren atzean`).

## 3. `eu-kids-online-v-espana-2026.pdf`

**«EU Kids Online V: experiencias digitales de la infancia y la adolescencia en España»** ·
Garmendia, Martinez, Larrañaga, Casado, Jimenez, Olveira (UPV/EHU) · Report Nº 2, 2026 · 62 páginas.
Encuesta a menores de **10 a 16 años** hecha en 2025.

➡ Da la **línea base de uso normal**: qué hace un chico español a cada edad. Sirve para no marcar como
desvío lo que a esa edad es corriente.
🔑 **Es la única con microdatos:** EU Kids Online es una red académica que comparte datasets con
investigadores. **A esta se le PIDE el dato, no sólo se la cita.**

## 4. `europol-iocta-2026.pdf`

**IOCTA 2026 — «The evolving threat landscape»** · Europol · 11ª edición, publicado el 2026-04-28 ·
44 páginas. Tiene un capítulo entero de explotación sexual infantil online.
➡ Marco europeo y volumen. Es la cita con más peso institucional de las cuatro.

---

## Lo que NO está bajado y hay que ir a buscar

| Qué | Dónde | Por qué importa |
|---|---|---|
| **INCIBE / IS4K** | `incibe.es/menores` | Es el **Safer Internet Centre oficial de España** (redes INSAFE e INHOPE, cofinanciado por la Comisión Europea, proyectos SIC-SPAIN 5.0). Línea **017: 138.003 consultas en 2025, +40 % vs 2024**; más de 3.000 menores por ciberacoso y extorsión sexual. **Es la puerta institucional en España.** |
| **WeProtect Global Alliance** | [Survey of technology companies](https://www.weprotect.org/survey-of-tech-companies/) (2021) · verificado en fuente el **2026-09-21** | 🔑 **De las 32 empresas que respondieron la encuesta, el 87 % usa hash-matching de imágenes y sólo el 37 % usa herramientas para detectar grooming.** El hueco que ataca AntiGro, dicho por otro. 🔴 **La base son 32 empresas encuestadas en 2021, NO «las tecnológicas»**: decirlo sin la base es sobregeneralizar, y es el mismo error que ya nos costó el 90 % de UNESCO/CIPDH. |
| **Fundación ANAR** | informe anual | Teléfono del menor. |
| **INHOPE** | 57 líneas en 52 países | Red de denuncia, sede en Ámsterdam. |
| **BIK+** | `digital-strategy.ec.europa.eu` | Estrategia europea: el paraguas de financiación de toda la red. |

## URLs de origen

- Interior: `interior.gob.es/opencms/pdf/archivos-y-documentacion/documentacion-y-publicaciones/publicaciones-descargables/seguridad-ciudadana/Informe-investigaciones-online-child-sexual-grooming_pdfWEB.pdf`
- Save the Children: `savethechildren.es/sites/default/files/2026-01/Tras_la_pantalla_0.pdf`
- EU Kids Online V: `ehu.eus/documents/d/eukidsonline/informe-eu_kids_spain_2026-pdf`
- Europol IOCTA: `europol.europa.eu/cms/sites/default/files/documents/IOCTA-2026.pdf`
