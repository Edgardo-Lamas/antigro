/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL PARTE Y LA CEGUERA, CON SUS CASOS — `npm run probar-parte`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **La ceguera es el único fallo del sistema que se DISFRAZA DE BUENA
 *  NOTICIA.** Cero señales se lee igual que un chico tranquilo, así que si esta
 *  detección se rompe, no hay ningún síntoma: el panel muestra calma, el motor
 *  no alerta, y la familia queda creyendo que está protegida.
 *
 *  ⚠ Y del parte hay que cuidar lo contrario: **que no se convierta en una
 *  alerta chiquita.** Si dice «3 noches tarde» sin decir por qué eso no ameritó
 *  escribir, un padre ansioso actúa sobre un pico suelto — que es exactamente
 *  lo que la regla 5 existe para evitar.
 */

import {
  DIAS_PARA_SOSPECHAR_CEGUERA,
  armarParte,
  mirarSiEstaCiego,
  textoDeLaCeguera,
  textoDelParte,
} from "./parte.ts";
import type { SenalDeRed, TipoDeSenal } from "@/lib/senales/tipos";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

const HOY = new Date("2026-08-19T20:00:00");
const haceDias = (d: number) =>
  new Date(HOY.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

const senal = (dias: number, tipo: TipoDeSenal = "volumen"): SenalDeRed => ({
  id: `s-${dias}-${tipo}`,
  chicoId: "c1",
  fecha: haceDias(dias),
  tipo,
  intensidad: 0.5,
  fuente: "simulador",
});

/* ── 1 · La ceguera ─────────────────────────────────────────────────────── */

comprobar(
  "con señales de hoy, no está ciego",
  mirarSiEstaCiego([senal(0)], HOY).ciego === false,
);

comprobar(
  `a los ${DIAS_PARA_SOSPECHAR_CEGUERA} días sin nada, está ciego`,
  mirarSiEstaCiego([senal(DIAS_PARA_SOSPECHAR_CEGUERA)], HOY).ciego === true,
);

/* 📌 Un día sin señales NO es ceguera: el chico puede haber estado en el campo,
   sin batería, o con el teléfono guardado. Avisar por eso sería el mismo falso
   positivo que la regla 5 evita del otro lado. */
comprobar(
  "un solo día sin señales NO es ceguera",
  mirarSiEstaCiego([senal(1)], HOY).ciego === false,
);

comprobar(
  "dos días tampoco",
  mirarSiEstaCiego([senal(2)], HOY).ciego === false,
);

/* 🔴 EL CASO QUE SEPARA DOS COSAS QUE NO SON LO MISMO. Un chico que nunca tuvo
   señales puede simplemente no tener el filtro instalado todavía. Decirle a una
   familia recién dada de alta que su sistema «dejó de funcionar» es una alarma
   de avería sobre algo que nunca arrancó. */
{
  const nuevo = mirarSiEstaCiego([], HOY);
  comprobar("sin NINGUNA señal nunca, NO se reporta ceguera", nuevo.ciego === false);
  comprobar("y se dice que es otra cosa", nuevo.nuncaHuboSenales === true);
  comprobar("y no se inventa una última fecha", nuevo.ultimoDiaConSenal === null);
}

comprobar(
  "cuenta bien los días sin señal",
  mirarSiEstaCiego([senal(5)], HOY).diasSinSenal === 5,
  `dio ${mirarSiEstaCiego([senal(5)], HOY).diasSinSenal}`,
);

/* 🔑 Se mira la señal MÁS RECIENTE, no la primera. Un chico con señales viejas
   y actividad de hoy no está ciego. */
comprobar(
  "vale la señal más reciente, no la más vieja",
  mirarSiEstaCiego([senal(30), senal(0)], HOY).ciego === false,
);

/* ── 2 · El parte cuenta, no interpreta ─────────────────────────────────── */

{
  const p = armarParte({
    senales: [senal(1, "madrugada"), senal(3, "madrugada"), senal(3, "plataforma_nueva")],
    diasMirados: 30,
    rachaMasLarga: 1,
    huboAviso: false,
  });

  comprobar("cuenta las noches tarde", p.nochesTarde === 2);
  comprobar("cuenta los lugares nuevos", p.plataformasNuevas === 1);
  comprobar("cuenta las señales totales", p.senalesQueLlegaron === 3);
  /* Dos señales del mismo día cuentan como UN día. */
  comprobar("agrupa por día, no por señal", p.diasConAlgo === 2, `dio ${p.diasConAlgo}`);
  comprobar("no inventa evasiones", p.evasiones === 0);
}

/* ── 3 · 🔴 El parte NO puede ser una alerta chiquita ────────────────────── */

const conMovimiento = textoDelParte(
  "Ana",
  armarParte({
    senales: [senal(1, "madrugada"), senal(4, "madrugada"), senal(9, "madrugada")],
    diasMirados: 30,
    rachaMasLarga: 1,
    huboAviso: false,
  }),
);

comprobar("dice cuántos días miró", /30 días/.test(conMovimiento));
comprobar("cuenta lo que vio", /3 veces con actividad tarde/.test(conMovimiento));

/* 🔴 LA COMPROBACIÓN QUE JUSTIFICA LA TANDA. Sin esta frase, el parte es una
   lista de motivos de preocupación sin contexto. */
comprobar(
  "dice POR QUÉ eso no ameritó escribir",
  /se sostuvo/i.test(conMovimiento) && /por eso no te escribimos/i.test(conMovimiento),
  "Sin esto, un padre ansioso actúa sobre un pico suelto.",
);

comprobar(
  "aclara que no hay que hacer nada",
  /no hace falta que hagas nada/i.test(conMovimiento),
);

comprobar(
  "y dice con todas las letras que NO es una alerta",
  /no es una alerta/i.test(conMovimiento),
);

/* 📌 Si SÍ hubo aviso, no corresponde decir «por eso no te escribimos» —
   le escribimos. */
comprobar(
  "si hubo aviso, no dice que no se escribió",
  !/por eso no te escribimos/i.test(
    textoDelParte("Ana", armarParte({ senales: [senal(1)], diasMirados: 30, rachaMasLarga: 6, huboAviso: true })),
  ),
);

/* Regla 1: el parte no afirma nada sobre el chico. */
for (const prohibida of ["está siendo", "es víctima", "grooming", "riesgo", "peligro", "quedate tranquil"]) {
  comprobar(`el parte no dice «${prohibida}»`, !conMovimiento.toLowerCase().includes(prohibida));
}

/* ── 4 · El parte sin nada que contar ───────────────────────────────────── */

{
  const vacio = textoDelParte(
    "Ana",
    armarParte({ senales: [], diasMirados: 30, rachaMasLarga: 0, huboAviso: false }),
  );
  comprobar("un parte sin señales igual se emite", vacio.length > 50);
  comprobar(
    "y sugiere revisar el filtro, sin dramatizar",
    /revisar que el filtro siga puesto/i.test(vacio),
  );
  comprobar("no felicita a nadie", !/felicit|excelente|muy bien/i.test(vacio));
}

/* ── 5 · El aviso de ceguera SÍ pide una acción ─────────────────────────── */

const aviso = textoDeLaCeguera("Ana", {
  ciego: true,
  ultimoDiaConSenal: "2026-08-14",
  diasSinSenal: 5,
  nuncaHuboSenales: false,
});

comprobar("dice hace cuánto", /5 días/.test(aviso));
comprobar("dice desde cuándo", /2026-08-14/.test(aviso));
comprobar("nombra las causas posibles sin elegir una", /filtro se haya sacado/i.test(aviso));

/* 🔴 Lo más importante del mensaje: que el silencio no es calma. */
comprobar(
  "dice que estar ciego se ve igual que estar tranquilo",
  /igual que estar todo tranquilo/i.test(aviso),
);
comprobar("y manda a la instalación", /instalación/i.test(aviso));

/* ⚠ Y no habla del chico: habla del sistema. Es una avería, no una novedad. */
comprobar(
  "no dice nada sobre la conducta del chico",
  !/tu hijo|su hijo|conducta|comportamiento/i.test(aviso),
);

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
