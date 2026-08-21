# El documento de presentación para profesionales — 21/8/2026

Lo pidió Edgardo para mandárselo **antes del enlace** a un grupo de psicólogas y a un
experto en **Psicología del Testimonio** que escribió varios libros.

| Archivo | Qué es |
|---|---|
| `dossier-impreso.html` | La fuente del **PDF** (A4, 6 páginas con portada). Se renderiza con Playwright, ver abajo |
| `dossier-web.html` | La fuente de la **versión web**, publicada como artifact |
| `AntiGro-presentacion-profesional.pdf` | La salida, la misma copia que está en el Escritorio |

🔗 **Artifact publicado:** https://claude.ai/code/artifact/9b59f4e1-161a-4222-bd48-d59ba986b5fb
⚠ Para actualizarlo hay que republicar **pasando esa URL**; si no, se crea otro artifact distinto.

## Cómo se vuelve a generar el PDF

```js
// con playwright instalado (npm i playwright --no-save)
await pag.goto("file://<ruta>/dossier-impreso.html");
await pag.pdf({ path: "…/AntiGro - presentacion profesional.pdf", format: "A4",
  printBackground: true, margin: { top:"18mm", bottom:"16mm", left:"17mm", right:"17mm" } });
```

## 🔴 Lo que hay que saber antes de tocarlo

**Todas las cifras se verificaron el 21/8 contra la fuente primaria**, y esa verificación
terminó encontrando **seis cifras mal atribuidas en el producto** — ver «EL BARRIDO DE CIFRAS» en
el `CLAUDE.md`. El documento dice, en su encabezado, que sólo lleva cifras verificadas: **si se
agrega una sin verificar, esa frase pasa a ser mentira.**

🔴 **Y dos de esas seis estaban en ESTE documento, en la versión que ya salió el 21/8:** el
*74,3% por WhatsApp* atribuido al estudio (es UNESCO/CIPDH y mide bullying virtual) y el
*73,9% / 62,9% / 31%* de qué haría un adulto (es ESET, 2013). También decía «dos tercios de **esos**
hogares» cuando el estudio dice «dos tercios de los hogares **en los que se utiliza Internet**» —
son dos universos distintos. **Las tres corregidas**, con el PDF regenerado y el artifact
republicado en la misma URL.
⚠ Se agregó además la salvedad que un lector profesional va a buscar: **las cifras sobre víctimas
del estudio salen de una base de 23 casos**, y el propio estudio aclara que con esa cantidad no
publica cruces.

📌 Las citas de Wisniewski también estaban mezcladas: el **89% / 11%** es de **CSCW 2017**
(74 apps Android) y el hallazgo sobre victimización es de **CHI 2018** (215 pares
padre/hijo), no del paper de IEEE de 2024.

🔑 La paleta del gráfico pasó el validador de la skill `dataviz`. La original **no pasaba**:
el ámbar y la terracota de AntiGro tienen ΔE 12,9 en visión normal —por debajo de 15— así
que costaba distinguirlos incluso sin daltonismo. Los tres estados del gráfico
(`#9AA5B1`, `#D89B33`, `#9E2F1B`) están re-escalonados y validados. **Si se cambian, hay que
volver a correr el validador.**
