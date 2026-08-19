/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA ESCALADA, CON SUS CASOS — `npm run probar-escalada`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Acá los dos errores posibles son igual de graves y ninguno se ve.**
 *  Escalar de más persigue a un padre que ya está mirando y enseña a ignorar al
 *  sistema; escalar de menos deja un aviso sin abrir el día que importaba. Las
 *  dos se ven igual desde afuera: nada en la pantalla, ninguna excepción.
 *
 *  Por eso **cada regla entra con su caso que escala y su caso que no** — la
 *  misma norma que el resto del proyecto. Sin el segundo no se sabe si la
 *  condición hace algo.
 */

import {
  HORAS_CON_EVASION,
  HORAS_PARA_ESCALAR,
  decidirEscalada,
  textoDeLaEscalada,
} from "./escalada.ts";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

const AHORA = new Date("2026-08-19T20:00:00.000Z");
const haceHoras = (h: number) => new Date(AHORA.getTime() - h * 60 * 60 * 1000).toISOString();

function aviso(opciones: { hace: number; acusado?: boolean; entregado?: boolean; responsable?: boolean }) {
  return {
    destino: "111",
    nombre: "Mariana",
    esResponsable: opciones.responsable ?? true,
    fecha: haceHoras(opciones.hace),
    entregado: opciones.entregado ?? true,
    acusadoEn: opciones.acusado ? haceHoras(opciones.hace - 1) : null,
  };
}

function situacion(opciones: {
  estado?: string;
  evasiones?: number;
  avisos?: ReturnType<typeof aviso>[];
  yaSeEscalo?: boolean;
}) {
  const avisos = opciones.avisos ?? [aviso({ hace: 10 })];
  return decidirEscalada({
    lectura: {
      estado: (opciones.estado ?? "patron_sostenido") as "patron_sostenido",
      evasionesRecientes: opciones.evasiones ?? 0,
    },
    quienLoVio: {
      avisos,
      ultimaTanda: avisos,
      loVioUnResponsable: avisos.some((a) => a.esResponsable && a.acusadoEn !== null),
      hayAvisosQueNoSalieron: avisos.some((a) => !a.entregado),
    },
    yaSeEscalo: opciones.yaSeEscalo ?? false,
    ahora: AHORA,
  });
}

/* ── 1 · El caso que escala ──────────────────────────────────────────────── */

{
  const d = situacion({});
  comprobar("nadie lo vio, el patrón sigue y pasaron las horas → ESCALA", d.escala === true, d.motivo);
  comprobar("y el motivo lo dice", d.motivo === "nadie_lo_vio_y_el_patron_sigue");
}

/* ── 2 · 🔴 Lo que NUNCA escala: el patrón se cortó ──────────────────────── */

/* Es la regla 5 aplicada a la insistencia, y va PRIMERO en la función a
   propósito: si la razón para insistir se murió, no importa nada más. */
for (const estado of ["en_calma", "atencion"]) {
  const d = situacion({ estado });
  comprobar(
    `con estado «${estado}» NO escala, aunque nadie lo haya visto`,
    d.escala === false && d.motivo === "el_patron_se_corto",
    d.motivo,
  );
}

comprobar(
  "y el patrón cortado gana incluso sobre la evasión",
  situacion({ estado: "en_calma", evasiones: 3 }).motivo === "el_patron_se_corto",
);

/* ── 3 · La regla de Edgardo: el acuse es de un responsable ──────────────── */

comprobar(
  "si un responsable lo vio, NO escala",
  situacion({ avisos: [aviso({ hace: 10, acusado: true })] }).motivo === "lo_vio_un_responsable",
);

/* 🔴 El acuse del referente NO frena la escalada. Es el mismo caso que separa
   la regla de contar acuses, acá del otro lado del sistema. */
comprobar(
  "el acuse de alguien que NO es responsable no frena nada",
  situacion({
    avisos: [aviso({ hace: 10 }), aviso({ hace: 10, acusado: true, responsable: false })],
  }).escala === true,
  "Si esto no escala, volvió a contar acuses en vez de mirar quién los dio.",
);

/* ── 4 · Los dos relojes ─────────────────────────────────────────────────── */

comprobar(
  `antes de las ${HORAS_PARA_ESCALAR} horas NO escala`,
  situacion({ avisos: [aviso({ hace: HORAS_PARA_ESCALAR - 1 })] }).motivo === "todavia_es_temprano",
);

comprobar(
  `justo en las ${HORAS_PARA_ESCALAR} horas SÍ escala`,
  situacion({ avisos: [aviso({ hace: HORAS_PARA_ESCALAR })] }).escala === true,
);

/* ⚠ La excepción que marcó Edgardo: la evasión es un acto deliberado y esperar
   ocho horas se siente mal. */
comprobar(
  `con evasión escala a las ${HORAS_CON_EVASION} horas`,
  situacion({ evasiones: 2, avisos: [aviso({ hace: HORAS_CON_EVASION })] }).escala === true,
);

comprobar(
  "sin evasión, esas mismas horas todavía son pocas",
  situacion({ evasiones: 0, avisos: [aviso({ hace: HORAS_CON_EVASION })] }).escala === false,
);

comprobar(
  "y con evasión, antes de esas horas tampoco escala",
  situacion({ evasiones: 2, avisos: [aviso({ hace: HORAS_CON_EVASION - 1 })] }).escala === false,
);

comprobar(
  "la espera que se aplicó queda a la vista",
  situacion({ evasiones: 1 }).esperaHoras === HORAS_CON_EVASION &&
    situacion({ evasiones: 0 }).esperaHoras === HORAS_PARA_ESCALAR,
);

/* ── 5 · ⚠ Un canal roto NO es desatención ──────────────────────────────── */

comprobar(
  "si ningún aviso salió, NO escala: es un canal roto",
  situacion({ avisos: [aviso({ hace: 10, entregado: false })] }).motivo === "ningun_aviso_salio",
  "Insistir acá sería mandar otro mensaje al mismo lugar que ya rechazó el primero.",
);

comprobar(
  "pero si al menos uno salió, sí escala",
  situacion({ avisos: [aviso({ hace: 10, entregado: false }), aviso({ hace: 10 })] }).escala === true,
);

/* ── 6 · Una sola vez por tanda ──────────────────────────────────────────── */

/* 🔑 Es lo que hace que la escalada no contradiga la regla de `avisar()`: un
   sistema que manda lo mismo todos los días se apaga solo. */
comprobar(
  "no se escala dos veces por el mismo aviso",
  situacion({ yaSeEscalo: true }).motivo === "ya_se_escalo",
);

/* ── 7 · Sin aviso no hay nada que escalar ───────────────────────────────── */

{
  const d = situacion({ avisos: [] });
  comprobar("sin ningún aviso, no escala", d.escala === false && d.motivo === "no_hubo_aviso");
  comprobar("y no inventa horas", d.horasDesdeElAviso === null);
}

/* ── 8 · El texto ───────────────────────────────────────────────────────── */

const texto = textoDeLaEscalada("Ana", 9, false);

comprobar("nombra al chico", texto.includes("Ana"));
comprobar("dice que el primero no lo abrió nadie", /no lo abrió/i.test(texto));
comprobar("dice que el patrón sigue", /se sigue viendo/i.test(texto));
comprobar("deriva a la Línea 137", texto.includes("137"));

/* 🔴 Regla 1: no afirma nada. Ni diagnostica ni tranquiliza ni reprocha. */
for (const prohibida of [
  "está siendo",
  "es víctima",
  "grooming",
  "quedate tranquil",
  "no es nada",
  "tu culpa",
  "deberías haber",
]) {
  comprobar(`el texto no dice «${prohibida}»`, !texto.toLowerCase().includes(prohibida));
}

comprobar(
  "con evasión, lo nombra",
  /esquivar el filtro/i.test(textoDeLaEscalada("Ana", 3, true)),
);
comprobar(
  "y sin evasión, no lo inventa",
  !/esquivar el filtro/i.test(texto),
);

comprobar("una hora se dice en singular", textoDeLaEscalada("Ana", 1, false).includes("hace una hora"));
comprobar("y nunca dice «hace 0 horas»", !textoDeLaEscalada("Ana", 0.2, false).includes("hace 0"));

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
