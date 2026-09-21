/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOS LUGARES DENTRO DEL MOTOR — `npm run probar-lugares`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Esta tanda cubre el cableado del 21/9: qué le hace al motor la categoría del
 *  lugar que vino anotada en la señal.
 *
 *  🔴 **La comprobación que más importa no es que un sitio de citas hable: es
 *  que WhatsApp NO.** Para UT1 WhatsApp es `chat`, que pesa y adelanta el aviso;
 *  para nosotros es un destino, no un lugar de riesgo —es donde habla con la
 *  familia—, y eso se decidió mirando el producto el 15/8. Si la lista de afuera
 *  pudiera pisar esa decisión, **un cambio de ellos aceleraría las alertas de
 *  todas las familias sin que nadie se entere.**
 *
 *  📌 Sin índice de categorías (`datos/ut1.bin`), la tanda avisa y no falla: ese
 *  archivo se genera al compilar y no se versiona.
 */

import { anotarLugares, estadoDelIndice } from "../senales/categorias.ts";
import type { ContextoDeSenal } from "../senales/tipos.ts";
import { crearSenal, type SenalDeRed } from "../senales/tipos.ts";
import { queEsEsteLugar } from "../senales/categorias.ts";
import { analizar, conLaEdad, type FilaDelObservatorio } from "../observatorio/index.ts";
import { armarParte } from "./parte.ts";
import { evaluar, tituloDeLaLectura, DIAS_SOSTENIDOS_MINIMOS } from "./evaluar.ts";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

if (!estadoDelIndice().disponible) {
  console.log("⚠ No hay índice de categorías, así que esta tanda no corre.");
  console.log("  Se genera con: npm run ut1");
  process.exit(0);
}

const DIA_MS = 24 * 60 * 60 * 1000;
const fin = new Date();
fin.setHours(23, 59, 59, 999);

/** Una señal de lugar nuevo, hace `haceDias` días, a las 2:14 de la mañana. */
function lugar(dominio: string, haceDias = 1): SenalDeRed {
  const fecha = new Date(fin.getTime() - haceDias * DIA_MS);
  fecha.setHours(2, 14, 0, 0);
  return crearSenal({
    id: `prueba-${dominio}-${haceDias}`,
    chicoId: "prueba",
    fecha: fecha.toISOString(),
    tipo: "plataforma_nueva",
    intensidad: 0.5,
    contexto: { dominio },
    fuente: "simulador",
  });
}

/**
 * Una señal con el lugar **ya anotado a mano**, para probar el motor sin colgarse
 * de qué dominio concreto está hoy en la lista de UT1.
 *
 * 🔑 Los casos con dominio real de abajo prueban la ANOTACIÓN; éstos prueban qué
 * hace el MOTOR con lo anotado. Mezclarlos haría que un cambio de la lista
 * rompiera una prueba del motor, que no tiene nada que ver.
 */
function anotada(contexto: ContextoDeSenal, haceDias = 1): SenalDeRed {
  const base = lugar("lugar-de-prueba.example", haceDias);
  return { ...base, contexto: { ...base.contexto, ...contexto } };
}

function leer(senales: SenalDeRed[]) {
  return evaluar({
    chico: { edad: 12, genero: "nena" },
    senales: anotarLugares(senales),
    hasta: fin,
    diasObservados: 40,
  });
}

/* ── 1. Los que hablan a la primera ──────────────────────────────────────── */

const citas = leer([lugar("tinder.com")]);

comprobar(
  "🔑 un solo día con un sitio de citas alcanza: el sistema habla",
  citas.estado === "patron_sostenido" && citas.reglaQueDecidio === "lugar_que_habla_solo",
  `estado: ${citas.estado} · regla: ${citas.reglaQueDecidio}`,
);

comprobar(
  "🔑 y no esperó ninguna racha: es un camino propio, como la evasión",
  citas.diasSostenidos < DIAS_SOSTENIDOS_MINIMOS,
  `días sostenidos: ${citas.diasSostenidos} de ${DIAS_SOSTENIDOS_MINIMOS}`,
);

const espia = leer([lugar("mspy.com")]);
comprobar(
  "🔑 el software espía también habla solo — no es conducta del chico, es alguien sobre él",
  espia.reglaQueDecidio === "lugar_que_habla_solo",
  `regla: ${espia.reglaQueDecidio}`,
);

/* ── 2. 🔴🔴 Y el catálogo propio no se pisa ─────────────────────────────── */

const wpp = leer([lugar("whatsapp.com"), lugar("whatsapp.com", 2)]);

comprobar(
  "🔴🔴 WhatsApp NO hace hablar al sistema, aunque UT1 lo llame chat",
  wpp.reglaQueDecidio !== "lugar_que_habla_solo" && wpp.lugaresQuePesaron.length === 0,
  `regla: ${wpp.reglaQueDecidio} · pesaron: ${wpp.lugaresQuePesaron.length}`,
);

comprobar(
  "🔴 ni le adelanta los días exigidos a nadie",
  wpp.diasAdelantadosPorLugar === 0 && wpp.diasExigidos === DIAS_SOSTENIDOS_MINIMOS,
  `adelanto: ${wpp.diasAdelantadosPorLugar} · exigidos: ${wpp.diasExigidos}`,
);

const snap = leer([lugar("snapchat.com")]);
comprobar(
  "🔴 lo mismo con Snapchat, que también es una decisión nuestra",
  snap.reglaQueDecidio !== "lugar_que_habla_solo",
  `regla: ${snap.reglaQueDecidio}`,
);

/* ── 3. 🔴 phishing y malware: hablan por cómo llegaron, no por aparecer ─── */

/* El acortador va ANTES y cerca: eso es un clic en un enlace que le mandaron, y
   el filtro no ve el clic pero ve la secuencia. */
const acortador = anotada(
  { categoria_del_lugar: "shortener", que_hace: "pesa_y_adelanta", lugar_es: "acortador de enlaces" },
  3,
);
const engano = anotada(
  {
    categoria_del_lugar: "phishing",
    que_hace: "habla_a_la_primera",
    lugar_es: "sitio de engaño",
    condicion_del_lugar: "despues_de_un_enlace",
  },
  3,
);
const solo = evaluar({
  chico: { edad: 12, genero: "nena" },
  senales: [engano],
  hasta: fin,
  diasObservados: 40,
});
comprobar(
  "🔴 un dominio de engaño suelto no habla: puede ser un rastreador incrustado",
  solo.reglaQueDecidio !== "lugar_que_habla_solo",
  `regla: ${solo.reglaQueDecidio}`,
);

const conEnlace = evaluar({
  chico: { edad: 12, genero: "nena" },
  senales: [{ ...acortador, fecha: new Date(new Date(engano.fecha).getTime() - 60_000).toISOString() }, engano],
  hasta: fin,
  diasObservados: 40,
});

comprobar(
  "🔑 el mismo dominio de engaño, detrás de un acortador, SÍ habla: es un clic en un enlace",
  conEnlace.reglaQueDecidio === "lugar_que_habla_solo",
  `regla: ${conEnlace.reglaQueDecidio}`,
);

const alReves = evaluar({
  chico: { edad: 12, genero: "nena" },
  senales: [{ ...acortador, fecha: new Date(new Date(engano.fecha).getTime() + 60_000).toISOString() }, engano],
  hasta: fin,
  diasObservados: 40,
});

comprobar(
  "🔴 y al revés no: si el acortador vino DESPUÉS, no explica cómo llegó",
  alReves.reglaQueDecidio !== "lugar_que_habla_solo",
  `regla: ${alReves.reglaQueDecidio}`,
);

/* ── 4. Los que pesan y adelantan ────────────────────────────────────────── */

const chat = evaluar({
  chico: { edad: 12, genero: "nena" },
  senales: [
    anotada({ categoria_del_lugar: "chat", que_hace: "pesa_y_adelanta", lugar_es: "chat con desconocidos" }, 1),
    anotada({ categoria_del_lugar: "chat", que_hace: "pesa_y_adelanta", lugar_es: "chat con desconocidos" }, 2),
  ],
  hasta: fin,
  diasObservados: 40,
});

comprobar(
  "un chat que nosotros no teníamos catalogado pesa y adelanta los días exigidos",
  chat.diasAdelantadosPorLugar > 0 && chat.diasExigidos < DIAS_SOSTENIDOS_MINIMOS,
  `adelanto: ${chat.diasAdelantadosPorLugar} · exigidos: ${chat.diasExigidos} de ${DIAS_SOSTENIDOS_MINIMOS}`,
);

comprobar(
  "🔴 pero no habla solo: adelanta, no decide",
  chat.reglaQueDecidio !== "lugar_que_habla_solo",
  `regla: ${chat.reglaQueDecidio}`,
);

comprobar(
  "🔴 y nunca baja de cuatro días: la persistencia sigue mandando",
  chat.diasExigidos >= 4,
  `exigidos: ${chat.diasExigidos}`,
);

/* ── 5. El título que lee una persona ───────────────────────────────────── */

comprobar(
  "🔴 el título dice qué apareció, no «el patrón se sostiene» — no hubo ningún patrón",
  tituloDeLaLectura(citas) === "Apareció un lugar catalogado como sitio de citas",
  `salió: ${tituloDeLaLectura(citas)}`,
);

comprobar(
  "y cuando sí hubo patrón, el título no cambia",
  tituloDeLaLectura({ estado: "patron_sostenido", reglaQueDecidio: "racha_y_umbral" }) ===
    "El patrón se sostiene",
);

/* ── 6. ⚠ Cómo se dice: hecho fechado, sin interpretación ───────────────── */

const frase = citas.porQue[0];

comprobar(
  "⚠ el porqué arranca con el hecho fechado: qué consultó y cuándo",
  /^el teléfono consultó/i.test(frase) && /a las \d\d:\d\d/.test(frase),
  frase,
);

comprobar(
  "⚠ y avisa que el filtro ve la consulta, no la visita",
  frase.includes("no que el chico haya entrado"),
  frase,
);

comprobar(
  "⚠ no dice «tu hijo», ni afirma que esté pasando algo",
  !/tu hijo|está siendo|seguro que|probablemente/i.test(citas.porQue.join(" ")),
);

comprobar(
  "🔴 y el cierre no dice que se sostuvo un patrón que no existió",
  citas.loQueNoSeVe.some((l) => l.includes("no hace falta ver dos veces")) &&
    !citas.loQueNoSeVe.some((l) => l.includes("un cambio que se sostuvo")),
  citas.loQueNoSeVe[citas.loQueNoSeVe.length - 1],
);

/* ── 7. Otro riesgo: va al parte, no a la alerta ─────────────────────────── */

const apuestas = [anotada({ categoria_del_lugar: "gambling", que_hace: "va_al_parte", lugar_es: "apuestas" })];
const conApuestas = evaluar({
  chico: { edad: 12, genero: "nena" },
  senales: apuestas,
  hasta: fin,
  diasObservados: 40,
});

comprobar(
  "🔴 las apuestas NO disparan una alerta: la alerta no se gasta",
  conApuestas.reglaQueDecidio !== "lugar_que_habla_solo" && conApuestas.estado !== "patron_sostenido",
  `estado: ${conApuestas.estado} · regla: ${conApuestas.reglaQueDecidio}`,
);

const parte = armarParte({ senales: apuestas, diasMirados: 30, rachaMasLarga: 0, huboAviso: false });

comprobar(
  "🔑 pero el parte sí lo cuenta, como hecho fechado: el sistema no se calla",
  parte.otrosRiesgos.length === 1 && parte.otrosRiesgos[0].esto === "apuestas",
  `otros riesgos: ${JSON.stringify(parte.otrosRiesgos)}`,
);

/* ── 8. Lo que no vino anotado se comporta como antes ───────────────────── */

const sinAnotar = evaluar({
  chico: { edad: 12, genero: "nena" },
  senales: [lugar("tinder.com")],
  hasta: fin,
  diasObservados: 40,
});

comprobar(
  "🔑 una señal sin anotar no cambia ninguna lectura vieja",
  sinAnotar.reglaQueDecidio !== "lugar_que_habla_solo" && sinAnotar.lugaresQuePesaron.length === 0,
  `regla: ${sinAnotar.reglaQueDecidio}`,
);

/* ── 9. El observatorio: qué deja de ser «un lugar que no conoce nadie» ──── */

const queEsAfuera = (dominio: string) => {
  const l = queEsEsteLugar(dominio);
  return l ? { esto: l.esto, daLineaBase: l.hace === "linea_base" } : null;
};

function fila(dominio: string): FilaDelObservatorio {
  const hoy = new Date().toISOString().slice(0, 10);
  return {
    dominio,
    puerta: "desconocida",
    chicosQueLoVieron: 10,
    chicosConAlerta: 5,
    primeraVez: hoy,
    ultimaVez: hoy,
    porPerfil: { "9-13|nena": 10 },
  };
}

const universo = { chicos: 100, chicosConAlerta: 20 };
const sinLista = analizar([fila("poki.com"), fila("badoo.com")], universo);
const conLista = analizar([fila("poki.com"), fila("badoo.com")], universo, queEsAfuera);

const juegoSin = sinLista.find((h) => h.dominio === "poki.com");
const juegoCon = conLista.find((h) => h.dominio === "poki.com");

comprobar(
  "🔴 sin la lista, un juego que nosotros no teníamos catalogado era «no lo reconoce nadie»",
  juegoSin?.fueraDelRadar === true,
  `salió: ${juegoSin?.fueraDelRadar}`,
);

comprobar(
  "🔑 con la lista deja de serlo: es vida normal, no un hallazgo",
  juegoCon?.fueraDelRadar === false && juegoCon?.queEsAfuera === "juegos",
  `fuera del radar: ${juegoCon?.fueraDelRadar} · qué es: ${juegoCon?.queEsAfuera}`,
);

const citasCon = conLista.find((h) => h.dominio === "badoo.com");
comprobar(
  "🔴 pero estar catalogado como sitio de citas NO lo vuelve conocido: lo vuelve peor",
  citasCon?.fueraDelRadar === true && citasCon?.porQue.includes("sitio de citas"),
  `fuera del radar: ${citasCon?.fueraDelRadar} · porqué: ${citasCon?.porQue}`,
);

/* ── 10. La edad del dominio: contexto, nunca hallazgo ───────────────────── */

const nuevos = new Map([["badoo.com", { dias: 11, nuevo: true }]]);
const conEdad = conLaEdad(conLista, nuevos);

comprobar(
  "🔑 un dominio recién registrado suma el dato cuando el hallazgo ya se sostenía",
  conEdad.find((h) => h.dominio === "badoo.com")?.porQue.includes("se registró hace 11 días") === true,
  conEdad.find((h) => h.dominio === "badoo.com")?.porQue,
);

const soloNuevo = conLaEdad(
  [{ ...conLista[0], fueraDelRadar: false, perfilDominante: null, simultaneo: false, porQue: "sin nada que lo destaque" }],
  new Map([[conLista[0].dominio, { dias: 3, nuevo: true }]]),
);

comprobar(
  "🔴 pero un dominio nuevo SOLO no es nada: se registran miles por día",
  soloNuevo[0].porQue === "sin nada que lo destaque",
  soloNuevo[0].porQue,
);

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
