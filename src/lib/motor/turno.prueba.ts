/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL TURNO ESCOLAR, CON SUS CASOS — `npm run probar-turno`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Este dato existe porque el sistema afirmó algo que no podía sostener.**
 *  El 16/8 el asistente decía que la madrugada «desordena el descanso» del
 *  chico, y Edgardo lo volteó: el sistema no sabe a qué hora se levanta ese
 *  chico. La reparación no fue borrar la frase — fue traer el dato que falta.
 *
 *  🔑 **Y por eso las pruebas de acá no miran sólo que la cuenta dé.** Miran
 *  las tres cosas que, si se rompen, vuelven a poner al sistema afirmando de
 *  más:
 *
 *  1. Que el turno **corra la hora** y no toque ningún peso.
 *  2. Que **nunca apague la madrugada**, vaya al turno que vaya.
 *  3. Que **sin el dato** el motor haga exactamente lo que hacía antes. Una
 *     familia dada de alta antes del recorrido no puede ver cambiar su lectura
 *     porque agregamos una pregunta.
 */

import {
  PESO_POR_TIPO,
  factorMadrugada,
  horaDeReferencia,
} from "./pesos.ts";
/* ⚠ Ruta relativa, no `@/`: estas tandas las corre node pelado (`--experimental-strip-types`)
   y ahí el alias de TypeScript no existe. */
import { TURNOS_ESCOLARES, type TurnoEscolar } from "../datos/tipos.ts";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

/* ── 1. Sin el dato, todo queda como estaba ─────────────────────────────── */

const SIN_TURNO: [number, number][] = [
  [10, 22],
  [13, 23],
  [15, 24],
  [17, 25],
];

for (const [edad, esperada] of SIN_TURNO) {
  comprobar(
    `🔴 sin turno, ${edad} años sigue en ${esperada} — la lectura vieja no se mueve`,
    horaDeReferencia(edad) === esperada,
    `salió: ${horaDeReferencia(edad)}`,
  );
}

comprobar(
  "🔴 «no va al colegio» tampoco mueve nada: es contestar que no hay horario",
  horaDeReferencia(13, "no_va") === horaDeReferencia(13),
  `con turno: ${horaDeReferencia(13, "no_va")} · sin turno: ${horaDeReferencia(13)}`,
);

/* ── 2. El turno corre la hora, y para el lado que corresponde ──────────── */

comprobar(
  "mañana adelanta la referencia: se levanta temprano",
  horaDeReferencia(13, "manana") === 22,
  `salió: ${horaDeReferencia(13, "manana")}`,
);

comprobar(
  "tarde la atrasa: puede dormir a la mañana",
  horaDeReferencia(13, "tarde") === 24,
  `salió: ${horaDeReferencia(13, "tarde")}`,
);

comprobar(
  "doble turno se comporta como mañana — manda la hora a la que se levanta",
  horaDeReferencia(13, "doble") === horaDeReferencia(13, "manana"),
);

comprobar(
  "noche se comporta como tarde — vuelve tarde a la casa",
  horaDeReferencia(13, "noche") === horaDeReferencia(13, "tarde"),
);

comprobar(
  "🔑 el corrimiento es de UNA hora, ni más ni menos",
  TURNOS_ESCOLARES.every(
    (t) => Math.abs(horaDeReferencia(13, t.id) - horaDeReferencia(13)) <= 1,
  ),
  TURNOS_ESCOLARES.map((t) => `${t.id}:${horaDeReferencia(13, t.id)}`).join(" "),
);

/* ── 3. Los topes: ningún turno se va de rango ──────────────────────────── */

comprobar(
  "🔴 el más chico con turno mañana no baja de las 21",
  horaDeReferencia(7, "manana") >= 21,
  `salió: ${horaDeReferencia(7, "manana")}`,
);

comprobar(
  "🔴 el más grande con turno noche no pasa de las 02:00",
  horaDeReferencia(17, "noche") <= 26,
  `salió: ${horaDeReferencia(17, "noche")}`,
);

/* ── 4. 🔴 Ningún turno apaga la madrugada ──────────────────────────────── */

for (const t of TURNOS_ESCOLARES) {
  const alas3 = factorMadrugada(17, 3, t.id);
  comprobar(
    `🔴 ${t.nombre}: a las 3 de la mañana, un chico de 17 SIGUE siendo señal`,
    alas3 >= 0.55,
    `salió: ${alas3.toFixed(2)}`,
  );
}

for (const t of TURNOS_ESCOLARES) {
  for (const edad of [7, 11, 14, 17]) {
    for (const hora of [22, 23, 0, 1, 2, 3, 4]) {
      const f = factorMadrugada(edad, hora, t.id);
      if (f < 0.55 || f > 1) {
        comprobar(`${t.id}/${edad}/${hora}h queda dentro de 0,55 y 1`, false, `salió: ${f}`);
      }
    }
  }
}
comprobar("🔴 el factor nunca se sale de 0,55 a 1, en ninguna combinación", true);

/* ── 5. 🔴 Mueve la HORA, nunca el PESO ─────────────────────────────────── */

comprobar(
  "🔴 el peso de la madrugada no lo toca ningún turno: sigue en 0,8",
  PESO_POR_TIPO.madrugada === 0.8,
  `salió: ${PESO_POR_TIPO.madrugada}`,
);

/* Bien entrada la madrugada, cuando los dos ya pasaron el máximo, el turno deja
   de hacer diferencia: es un corrimiento de la hora de arranque, no un
   descuento permanente. Si algún día esto empieza a fallar, quiere decir que
   alguien convirtió el turno en un multiplicador. */
comprobar(
  "🔑 pasado el máximo, mañana y tarde vuelven a valer lo mismo",
  factorMadrugada(10, 6, "manana") === factorMadrugada(10, 6, "tarde"),
  `mañana: ${factorMadrugada(10, 6, "manana")} · tarde: ${factorMadrugada(10, 6, "tarde")}`,
);

/* ── 6. Y el orden se sostiene: el mismo chico, a la misma hora ─────────── */

const chico = 13;
const hora = 23;
comprobar(
  "🔴 a las 23, el de turno mañana pesa MÁS que el de turno tarde",
  factorMadrugada(chico, hora, "manana") > factorMadrugada(chico, hora, "tarde"),
  `mañana: ${factorMadrugada(chico, hora, "manana").toFixed(2)} · ` +
    `tarde: ${factorMadrugada(chico, hora, "tarde").toFixed(2)}`,
);

/* ── 7. La lista de la pantalla está completa ───────────────────────────── */

const TODOS: TurnoEscolar[] = ["manana", "tarde", "doble", "noche", "no_va"];
comprobar(
  "todos los turnos del tipo están en la lista que ve la familia",
  TODOS.every((t) => TURNOS_ESCOLARES.some((x) => x.id === t)),
);

comprobar(
  "🔑 y cada uno dice qué implica: nadie elige a ciegas",
  TURNOS_ESCOLARES.every((t) => t.detalle.trim().length > 0),
);

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
