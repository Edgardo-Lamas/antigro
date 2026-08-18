
ESTILOS = """
  /* ══════════════════════════════════════════════════════════════════════
     REGISTRO PACIENTE — el sistema. Ver `filosofia-de-diseno.md`.

     🔴 CUATRO TAMAÑOS DE LETRA Y NINGUNO MÁS. Si algo no entra, va a otra
        página. La letra chica es una falta de respeto disfrazada de elegancia.
     ══════════════════════════════════════════════════════════════════════ */

  :root {
    --papel:      #FBFAF7;   /* papel cálido, nunca blanco puro */
    --tinta:      #191E24;
    --tinta-media:#46525E;
    --apagado:    #8B949D;
    --linea:      #E4E0D8;
    --linea-fina: #EFECE5;

    /* 🔑 UN acento, y se reserva. Tres veces por página, no treinta. */
    --petroleo:   #0D6B6A;
    --petroleo-claro: #EAF2F1;
    --ambar:      #B87118;
    --ambar-claro:#FBF2E3;
    --gris:       #D3CEC4;

    /* Los cuatro tamaños. */
    --t-display:  33pt;
    --t-titulo:   15.5pt;
    --t-cuerpo:   10.4pt;
    --t-nota:     8.4pt;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page { size: A4; margin: 0; }

  body {
    font-family: Charter, "Iowan Old Style", Palatino, Georgia, serif;
    color: var(--tinta); background: var(--papel);
    font-size: var(--t-cuerpo); line-height: 1.58;
    -webkit-font-smoothing: antialiased;
  }

  /* 🔴 Márgenes anchos y NO negociables. Achicarlos para ganar una línea es
     exactamente lo que arruinó la versión anterior. */
  .page {
    width: 210mm; height: 297mm; padding: 20mm 22mm 16mm;
    background: var(--papel); overflow: hidden;
    page-break-after: always; display: flex; flex-direction: column;
    position: relative;
  }
  .page:last-child { page-break-after: auto; }

  /* ── Tipografía ──────────────────────────────────────────────────── */

  .display {
    font-family: "Avenir Next", "Helvetica Neue", sans-serif;
    font-size: var(--t-display); font-weight: 600; line-height: 1.04;
    letter-spacing: -.026em; color: var(--tinta);
  }
  h2 {
    font-family: "Avenir Next", "Helvetica Neue", sans-serif;
    font-size: var(--t-titulo); font-weight: 600; line-height: 1.24;
    letter-spacing: -.012em; color: var(--tinta);
  }
  .kicker {
    font-family: "Avenir Next", "Helvetica Neue", sans-serif;
    font-size: 7.2pt; font-weight: 600; letter-spacing: .19em;
    text-transform: uppercase; color: var(--apagado);
  }
  /* 🔑 La medida: nunca más de ~65 caracteres. El ojo se pierde al volver. */
  p { max-width: 152mm; }
  p + p { margin-top: 3.2mm; }
  strong { font-weight: 600; }
  em { font-style: italic; }
  .nota { font-size: var(--t-nota); line-height: 1.5; color: var(--tinta-media); }
  .suave { color: var(--tinta-media); }

  /* ── Ritmo vertical ──────────────────────────────────────────────── */
  .sec { margin-top: 11mm; }
  .sec > h2 { margin-top: 2.4mm; }
  .sec > p, .sec > .nota { margin-top: 3.4mm; }
  .respiro { flex: 1; }

  hr.regla {
    border: 0; border-top: .6pt solid var(--linea); margin: 3mm 0 0;
  }
  hr.gruesa {
    border: 0; border-top: 2pt solid var(--tinta); margin: 3mm 0 0;
  }

  /* ── Encabezado y pie corridos ───────────────────────────────────── */
  .cinta {
    display: flex; justify-content: space-between; align-items: baseline;
    padding-bottom: 2.4mm; border-bottom: .6pt solid var(--linea);
  }
  .pie {
    display: flex; justify-content: space-between; align-items: baseline;
    padding-top: 3mm; border-top: .6pt solid var(--linea);
    font-family: "Avenir Next", sans-serif; font-size: 7.2pt;
    letter-spacing: .05em; color: var(--apagado);
  }

  /* ── Cifras: la lámina de datos ──────────────────────────────────── */
  .cifras {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 8mm 9mm; margin-top: 6mm;
  }
  .cifra .n {
    font-family: "Avenir Next", sans-serif; font-size: 25pt; font-weight: 500;
    letter-spacing: -.02em; color: var(--petroleo); line-height: 1;
    display: block;
  }
  .cifra .d {
    display: block; margin-top: 2.2mm; font-size: var(--t-nota);
    line-height: 1.42; color: var(--tinta-media); max-width: 46mm;
  }

  /* ── Bloque destacado: se usa poco, por eso pesa ─────────────────── */
  .destacado {
    border-left: 2.2pt solid var(--petroleo); padding: 1mm 0 1mm 6mm;
    margin-top: 6mm;
  }
  .destacado.alerta { border-left-color: var(--ambar); }

  .marco {
    border: .6pt solid var(--linea); background: #fff;
    padding: 6mm 7mm; margin-top: 6mm;
  }

  /* ── Listas ──────────────────────────────────────────────────────── */
  ul { list-style: none; }
  .lista li {
    padding-left: 6mm; text-indent: -6mm; margin-top: 2.6mm;
    max-width: 152mm;
  }
  .lista li::before { content: "—"; color: var(--petroleo); margin-right: 2.6mm; }
  .lista.densa li { margin-top: 2mm; font-size: var(--t-nota); line-height: 1.48; }

  /* ── Dos columnas para pares dato→decisión ───────────────────────── */
  .pares { margin-top: 5mm; }
  .par {
    display: grid; grid-template-columns: 62mm 1fr; gap: 7mm;
    padding: 3.4mm 0; border-top: .6pt solid var(--linea-fina);
    align-items: start;
  }
  .par:first-child { border-top: 0; }
  .par .dato { font-weight: 600; line-height: 1.4; }
  .par .dato b {
    font-family: "Avenir Next", sans-serif; color: var(--petroleo);
    font-weight: 600;
  }
  .par .dec { font-size: var(--t-nota); line-height: 1.5; color: var(--tinta-media); }

  /* ── Rejilla de dos columnas ─────────────────────────────────────── */
  .dos { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm 9mm; margin-top: 5mm; }
  .item { }
  .item .n {
    font-family: "Avenir Next", sans-serif; font-size: 9pt; font-weight: 600;
    display: block; padding-bottom: 1.6mm; border-bottom: .6pt solid var(--linea);
  }
  .item .d { display: block; margin-top: 2.4mm; font-size: var(--t-nota);
             line-height: 1.48; color: var(--tinta-media); }
  .item.fuerte .n { color: var(--petroleo); border-bottom-color: var(--petroleo); }

  /* ── El gráfico ──────────────────────────────────────────────────── */
  .grafico { margin-top: 7mm; }
  .fila {
    display: grid; grid-template-columns: 54mm 1fr 26mm; gap: 6mm;
    align-items: end; padding: 3.6mm 0; border-top: .6pt solid var(--linea-fina);
  }
  .fila.destacada {
    background: var(--petroleo-claro); margin: 0 -5mm; padding: 3.6mm 5mm;
    border-top-color: var(--petroleo);
  }
  .fila-nom { font-weight: 600; line-height: 1.3; font-size: 9.6pt; }
  .fila-desc { font-size: 7.6pt; line-height: 1.34; color: var(--apagado); margin-top: 1mm; }
  .barras { display: flex; align-items: flex-end; gap: 1.1mm; height: 13mm; }
  .barras i { flex: 1; display: block; border-radius: .4mm .4mm 0 0; }
  .fila-badge { text-align: right; }
  .badge {
    font-family: "Avenir Next", sans-serif; font-size: 7pt; font-weight: 600;
    padding: 1.2mm 2.4mm; display: inline-block; white-space: nowrap;
    border-radius: 1mm;
  }
  .badge-hab { background: var(--petroleo); color: #fff; }
  .badge-cal { background: var(--gris); color: #5C564C; }
  .eje {
    display: grid; grid-template-columns: 54mm 1fr 26mm; gap: 6mm;
    margin-top: 2.4mm;
  }
  .eje-dias {
    display: flex; justify-content: space-between;
    font-family: "Avenir Next", sans-serif; font-size: 7pt; color: var(--apagado);
  }
  .leyenda {
    display: flex; gap: 7mm; margin-top: 5mm; flex-wrap: wrap;
    font-size: 7.6pt; color: var(--tinta-media);
  }
  .leyenda span { display: flex; align-items: center; gap: 2mm; }
  .leyenda b { width: 3mm; height: 3mm; display: inline-block; border-radius: .5mm; }

  /* ── Cita ────────────────────────────────────────────────────────── */
  .cita {
    border-left: 2.2pt solid var(--ambar); padding: 1mm 0 1mm 6mm; margin-top: 6mm;
    font-style: italic; color: var(--tinta-media); max-width: 148mm;
  }
  .cita .aut {
    display: block; margin-top: 2mm; font-style: normal;
    font-family: "Avenir Next", sans-serif; font-size: 7.4pt; color: var(--apagado);
  }

  /* ── Contacto ────────────────────────────────────────────────────── */
  .contacto {
    display: flex; justify-content: space-between; align-items: baseline;
    padding-top: 4mm; margin-top: 6mm; border-top: 2pt solid var(--tinta);
  }
  .contacto .q {
    font-family: "Avenir Next", sans-serif; font-size: 12pt; font-weight: 600;
  }
  .contacto .m { font-size: var(--t-nota); color: var(--petroleo); }
"""
