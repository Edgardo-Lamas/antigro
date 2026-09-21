/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  POR QUÉ CAMINO SALIÓ — `npm run probar-regla`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Esta tanda existe porque la consola dejó de decir sólo el resultado y
 *  empezó a mostrar la cuenta.** El desplegable «Por qué el sistema dice esto» publica, en
 *  pantalla y delante de quien quiera verificarlo, cuál de las cinco reglas
 *  decidió el estado y cuántos días sostenidos le hacían falta a esa lectura.
 *
 *  🔑 **Y un cartel que explica mal es peor que no tener cartel.** Si el motor
 *  dijera «racha y umbral» sobre una lectura que en realidad salió por evasión,
 *  el sistema estaría afirmando algo falso justo en el lugar donde promete que
 *  no inventa nada. No tira ningún error: miente en silencio.
 *
 *  Por eso acá no se prueba que la cuenta dé. Se prueba que **el motivo que el
 *  motor declara sea compatible con el estado que devolvió**, en las 252
 *  combinaciones de escenario × cuestionario × día que la consola puede
 *  producir moviendo perillas.
 */

import { evaluar } from "./evaluar.ts";
import {
  DIAS_SOSTENIDOS_MINIMOS,
  EVASIONES_PARA_HABLAR,
  PUNTAJE_PARA_HABLAR,
  type Estado,
  type ReglaDelMotor,
} from "./evaluar.ts";
import { VENTANA_DIAS } from "./pesos.ts";
import { FuenteSimulador, type Escenario } from "../senales/simulador.ts";

const DIA_MS = 24 * 60 * 60 * 1000;

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

/* Los mismos tres juegos de respuestas que ofrece la consola. */
const RESPUESTAS: Record<string, Record<string, number>> = {
  sin_responder: {},
  bajo: {
    desconocidos: 1,
    noviazgo_en_juego: 0,
    pedido_de_fotos: 0,
    sabe_que_es_grooming: 3,
    cambio_de_animo: 0,
    esconde_pantalla: 1,
    se_aisla: 0,
    regalos: 0,
    horarios: 1,
  },
  alto: {
    desconocidos: 3,
    noviazgo_en_juego: 2,
    pedido_de_fotos: 2,
    sabe_que_es_grooming: 0,
    cambio_de_animo: 3,
    esconde_pantalla: 2,
    se_aisla: 2,
    regalos: 1,
    horarios: 3,
  },
};

const ESCENARIOS: Escenario[] = ["normal", "cambio_leve", "persistente", "evasion"];

/** Qué estado puede tener cada regla. Es el contrato que la pantalla publica. */
const ESTADO_ESPERADO: Record<ReglaDelMotor, Estado> = {
  evasion_repetida: "patron_sostenido",
  racha_y_umbral: "patron_sostenido",
  cambio_sin_racha: "atencion",
  solo_los_adultos: "atencion",
  sin_novedad: "en_calma",
};

interface Corrida {
  escenario: Escenario;
  adultos: string;
  dia: number;
  lectura: ReturnType<typeof evaluar>;
}

/* ── El barrido completo: lo que la consola puede producir ──────────────── */

const fin = new Date();
fin.setHours(23, 59, 59, 999);
const inicio = new Date(fin.getTime() - (VENTANA_DIAS - 1) * DIA_MS);
inicio.setHours(0, 0, 0, 0);

const corridas: Corrida[] = [];

for (const escenario of ESCENARIOS) {
  const fuente = new FuenteSimulador(escenario);
  for (const adultos of Object.keys(RESPUESTAS)) {
    for (let dia = 0; dia < VENTANA_DIAS; dia++) {
      const hasta = new Date(inicio.getTime() + dia * DIA_MS);
      hasta.setHours(23, 59, 59, 999);
      const senales = await fuente.leer({
        chicoId: "prueba",
        desde: inicio.toISOString(),
        hasta: hasta.toISOString(),
      });
      corridas.push({
        escenario,
        adultos,
        dia,
        lectura: evaluar({
          chico: { edad: 12, genero: "nena" },
          senales,
          hasta,
          observaciones: RESPUESTAS[adultos],
          diasObservados: dia + 1,
        }),
      });
    }
  }
}

const donde = (c: Corrida) => `${c.escenario} · adultos ${c.adultos} · día ${c.dia + 1}`;

console.log(`\n── ${corridas.length} corridas ──\n`);

/* ── 1. 🔴 El motivo nunca contradice al estado ─────────────────────────── */

const contradictorias = corridas.filter(
  (c) => ESTADO_ESPERADO[c.lectura.reglaQueDecidio] !== c.lectura.estado,
);
comprobar(
  "🔴 el motivo que declara el motor coincide con el estado, en las " +
    corridas.length +
    " corridas",
  contradictorias.length === 0,
  contradictorias
    .slice(0, 3)
    .map((c) => `${donde(c)}: dice «${c.lectura.reglaQueDecidio}» y está en ${c.lectura.estado}`)
    .join(" | "),
);

/* ── 2. Las cinco reglas se usan: ninguna quedó muerta ──────────────────── */

const vistas = new Set(corridas.map((c) => c.lectura.reglaQueDecidio));
for (const r of ["evasion_repetida", "racha_y_umbral", "cambio_sin_racha", "sin_novedad"] as const) {
  comprobar(`la regla «${r}» se alcanza moviendo perillas`, vistas.has(r));
}
/* 📌 `solo_los_adultos` no aparece acá y no es un error: pide que la red no
   haya visto NADA y que el cuestionario venga fuerte, y los cuatro escenarios
   del simulador producen alguna señal. Se prueba aparte, abajo. */

/* ── 3. 🔴 La evasión es camino propio: habla SIN racha ─────────────────── */

const porEvasion = corridas.filter((c) => c.lectura.reglaQueDecidio === "evasion_repetida");
comprobar(
  "🔴 la evasión repetida habla aunque la racha no llegue: es un acto deliberado",
  porEvasion.length > 0 && porEvasion.some((c) => c.lectura.diasSostenidos < c.lectura.diasExigidos),
  `${porEvasion.length} corridas por evasión`,
);
comprobar(
  "…y cada una tiene de verdad los intentos que declara",
  porEvasion.every((c) => c.lectura.evasionesRecientes >= EVASIONES_PARA_HABLAR),
);

/* ── 4. 🔴 «Racha y umbral» cumple LAS DOS, nunca una sola ──────────────── */

const porRacha = corridas.filter((c) => c.lectura.reglaQueDecidio === "racha_y_umbral");
comprobar(
  "🔴 «racha y umbral» nunca sale con una sola de las dos condiciones",
  porRacha.every(
    (c) => c.lectura.diasSostenidos >= c.lectura.diasExigidos && c.lectura.puntaje >= PUNTAJE_PARA_HABLAR,
  ),
  `${porRacha.length} corridas`,
);

/* ── 5. Los días exigidos: la coincidencia adelanta, pero no regala ─────── */

comprobar(
  `sin coincidencia de los adultos, se exigen los ${DIAS_SOSTENIDOS_MINIMOS} días completos`,
  corridas
    .filter((c) => c.adultos === "sin_responder")
    .every((c) => c.lectura.diasExigidos === DIAS_SOSTENIDOS_MINIMOS),
);

const conAltos = corridas.filter((c) => c.adultos === "alto");
comprobar(
  "🔑 cuando los adultos marcan lo mismo que ve la red, se adelanta",
  conAltos.every((c) => c.lectura.diasExigidos < DIAS_SOSTENIDOS_MINIMOS),
  `exigidos: ${[...new Set(conAltos.map((c) => c.lectura.diasExigidos))].join(", ")}`,
);

comprobar(
  "🔴 …pero nunca baja de 4: la persistencia sigue mandando",
  corridas.every((c) => c.lectura.diasExigidos >= 4),
);

/* ── 6. 🔴 «Sólo los adultos» no sube nunca a patrón sostenido ──────────── */

const sinRed = evaluar({
  chico: { edad: 12, genero: "nena" },
  senales: [],
  hasta: fin,
  observaciones: RESPUESTAS.alto,
  diasObservados: 40,
});
comprobar(
  "🔴 sin una sola señal de red, el cuestionario fuerte habla…",
  sinRed.estado === "atencion" && sinRed.reglaQueDecidio === "solo_los_adultos",
  `${sinRed.estado} · ${sinRed.reglaQueDecidio}`,
);
comprobar(
  "🔴 …pero NO sube a patrón sostenido: eso lo sostiene el registro, no una impresión",
  sinRed.estado !== "patron_sostenido",
);

/* ── 7. En calma, el motor no declara ningún motivo ─────────────────────── */

comprobar(
  "una lectura en calma declara «sin novedad» y nada más",
  corridas
    .filter((c) => c.lectura.estado === "en_calma")
    .every((c) => c.lectura.reglaQueDecidio === "sin_novedad"),
);

console.log(fallaron === 0 ? "\ntodo bien" : `\n${fallaron} fallaron`);
process.exit(fallaron === 0 ? 0 : 1);
