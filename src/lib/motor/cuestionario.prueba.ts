/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL CUESTIONARIO, CON SUS CASOS — `npm run probar-cuestionario`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Acá el error tampoco se ve**, y es la misma familia de fallo que en la
 *  instalación. Si la regla de juntar respuestas se rompe, nadie ve una
 *  excepción: el motor sigue devolviendo una lectura perfectamente creíble,
 *  hecha con la respuesta equivocada. Eso ya pasó — hasta el 19/8 el asistente
 *  y el panel juntaban distinto y nadie se enteró.
 *
 *  Y hay una segunda clase de comprobación que no es técnica: **que las
 *  preguntas sigan siendo preguntas.** La tentación de cualquier sesión futura
 *  va a ser agregar una que afirme algo sobre un chico. La Ley 25.326 art. 7
 *  inc. 3 prohíbe registrar datos que directa o indirectamente revelen la vida
 *  sexual de una persona: una pregunta que afirme, guardada con nombre y fecha,
 *  es exactamente ese registro.
 */

import {
  ESCALA,
  INDICADORES,
  VALOR_MAXIMO,
  evaluarObservaciones,
  juntarObservaciones,
} from "./cuestionario.ts";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

/* ── 1 · La regla de juntar. Lo que se rompió una vez ───────────────────── */

const AYER = "2026-08-18T10:00:00.000Z";
const HOY = "2026-08-19T10:00:00.000Z";

comprobar(
  "de un mismo adulto vale la ÚLTIMA respuesta, no la más alta",
  juntarObservaciones([
    { adultoId: "mama", fecha: AYER, respuestas: { horarios: 3 } },
    { adultoId: "mama", fecha: HOY, respuestas: { horarios: 0 } },
  ]).horarios === 0,
  "Si esto da 3, alguien que corrige su respuesta no puede corregirla nunca.",
);

comprobar(
  "y vale la última aunque vengan desordenadas",
  juntarObservaciones([
    { adultoId: "mama", fecha: HOY, respuestas: { horarios: 0 } },
    { adultoId: "mama", fecha: AYER, respuestas: { horarios: 3 } },
  ]).horarios === 0,
);

comprobar(
  "entre adultos distintos queda la respuesta más alta",
  juntarObservaciones([
    { adultoId: "mama", fecha: HOY, respuestas: { regalos: 0 } },
    { adultoId: "papa", fecha: HOY, respuestas: { regalos: 3 } },
  ]).regalos === 3,
  "Que un adulto no lo haya visto no es prueba de que no pasó: es que no estaba.",
);

/* 🔴 La que explica que NO es una competencia entre personas: el máximo se toma
   POR PREGUNTA, así que dos adultos pueden quedar arriba en preguntas
   distintas. Si alguna vez se implementara «gana el que vio más» como persona,
   este caso se pone en rojo. */
{
  const juntas = juntarObservaciones([
    { adultoId: "mama", fecha: HOY, respuestas: { horarios: 3, regalos: 0 } },
    { adultoId: "papa", fecha: HOY, respuestas: { horarios: 0, regalos: 3 } },
  ]);
  comprobar(
    "el máximo es por PREGUNTA, no por persona: nadie gana entero",
    juntas.horarios === 3 && juntas.regalos === 3,
    `dio horarios=${juntas.horarios}, regalos=${juntas.regalos}`,
  );
}

comprobar(
  "no se promedia: una observación real no se parte al medio",
  juntarObservaciones([
    { adultoId: "mama", fecha: HOY, respuestas: { pedido_de_fotos: 0 } },
    { adultoId: "papa", fecha: HOY, respuestas: { pedido_de_fotos: 2 } },
  ]).pedido_de_fotos === 2,
);

comprobar("sin observaciones no inventa ninguna respuesta", Object.keys(juntarObservaciones([])).length === 0);

/* ── 2 · La ausencia no es calma ────────────────────────────────────────── */

comprobar(
  "sin respuestas el aporte es 0 y `respondidas` es 0",
  evaluarObservaciones({}).puntaje === 0 && evaluarObservaciones({}).respondidas === 0,
);

/* 🔴 La diferencia que sostiene el «prefiero no contestar» de la pantalla: una
   pregunta salteada NO puede contar lo mismo que una contestada «nunca». Si
   alguna vez se manda 0 por lo salteado, este caso lo dice. */
{
  const salteada = evaluarObservaciones({ regalos: 2 });
  const contestadaEnCero = evaluarObservaciones({ regalos: 2, horarios: 0 });
  comprobar(
    "saltear una pregunta NO es lo mismo que contestarla «nunca»",
    salteada.puntaje > contestadaEnCero.puntaje,
    `salteada=${salteada.puntaje.toFixed(3)} vs contestada en 0=${contestadaEnCero.puntaje.toFixed(3)}`,
  );
  comprobar("y se cuentan distinto", salteada.respondidas === 1 && contestadaEnCero.respondidas === 2);
}

/* ── 3 · El indicador que se invierte ───────────────────────────────────── */

comprobar(
  "«hablaron de grooming» se invierte: el riesgo está en el NO",
  evaluarObservaciones({ sabe_que_es_grooming: 0 }).puntaje >
    evaluarObservaciones({ sabe_que_es_grooming: 3 }).puntaje,
);

/* ── 4 · Los límites del puntaje ────────────────────────────────────────── */

/* ⚠ **Ojo con «todo en 3»: NO es el peor caso.** `sabe_que_es_grooming` se
   invierte —contestar «seguido» significa que hablaron del tema, y eso RESTA—,
   así que llenar todo con el valor más alto da 0,91 y no 1. La primera versión
   de esta prueba se equivocó justamente ahí. El peor caso es el otro. */
{
  const todoEnTres = Object.fromEntries(INDICADORES.map((i) => [i.id, VALOR_MAXIMO]));
  const p = evaluarObservaciones(todoEnTres).puntaje;
  comprobar("nada se pasa de 1", p <= 1, `dio ${p}`);
  comprobar(
    "«todo en 3» NO es el peor caso: hablar de grooming resta",
    p < 1,
    `dio ${p} — si diera 1, la inversión dejó de aplicarse`,
  );
}

{
  const peorCaso = Object.fromEntries(
    INDICADORES.map((i) => [i.id, i.id === "sabe_que_es_grooming" ? 0 : VALOR_MAXIMO]),
  );
  const p = evaluarObservaciones(peorCaso).puntaje;
  comprobar("el peor caso posible da exactamente 1", p === 1, `dio ${p}`);
}

comprobar(
  "un id que no existe no ensucia el puntaje",
  evaluarObservaciones({ inventado: 3 }).puntaje === 0,
);

/* ── 5 · Que las preguntas sigan siendo preguntas ───────────────────────── */

comprobar("hay al menos 8 indicadores", INDICADORES.length >= 8);

comprobar(
  "los ids son únicos",
  new Set(INDICADORES.map((i) => i.id)).size === INDICADORES.length,
);

for (const i of INDICADORES) {
  comprobar(`«${i.id}» declara de dónde sale`, Boolean(i.procedencia?.clase));
  comprobar(`«${i.id}» pesa algo`, i.peso > 0);
  comprobar(`«${i.id}» es una pregunta`, i.pregunta.trim().endsWith("?"));
  comprobar(`«${i.id}» trae ayuda para el que duda`, i.ayuda.trim().length > 10);

  /* Cada clase tiene que traer lo suyo. `observable` sin nota sería una
     pregunta presentada como si tuviera respaldo, que es lo contrario de lo
     que esa clase significa. */
  const p = i.procedencia;
  comprobar(
    `«${i.id}» trae cita o nota según su clase`,
    p.clase === "observable" ? p.nota.length > 10 : p.cita.length > 10,
  );
}

/* 🔴 La comprobación que justifica la tanda entera, y es la hermana de la de
   los términos: NINGUNA pregunta puede afirmar que al chico le está pasando
   algo. Se pregunta por hechos que el adulto puede ver; el sistema nunca
   afirma. Si alguien escribe «¿tu hijo está siendo víctima de…?», esto se pone
   en rojo antes de que llegue a producción. */
const AFIRMACIONES_PROHIBIDAS = [
  "está siendo",
  "es víctima",
  "fue víctima",
  "lo están groomeando",
  "abusado",
  "depredador",
];

for (const i of INDICADORES) {
  const texto = `${i.pregunta} ${i.ayuda}`.toLowerCase();
  const encontrada = AFIRMACIONES_PROHIBIDAS.find((f) => texto.includes(f));
  comprobar(
    `«${i.id}» no afirma nada sobre el chico`,
    encontrada === undefined,
    encontrada ? `dice «${encontrada}»` : undefined,
  );
}

/* ── 6 · La escala ──────────────────────────────────────────────────────── */

comprobar("la escala arranca en 0", ESCALA[0].valor === 0);
comprobar("la escala termina en VALOR_MAXIMO", ESCALA[ESCALA.length - 1].valor === VALOR_MAXIMO);
comprobar(
  "la escala no tiene huecos",
  ESCALA.every((op, i) => op.valor === i),
);

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
