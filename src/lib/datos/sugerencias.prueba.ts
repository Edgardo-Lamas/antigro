/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LAS SUGERENCIAS, CON SUS CASOS — `npm run probar-sugerencias`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 Existe por la misma lección que `reglas.prueba.ts`: tres veces seguidas un
 *  control frenó de más y **ninguna la encontró el typecheck**. Acá el riesgo es
 *  el mismo con el signo cambiado — una sugerencia que aparece cuando no
 *  corresponde le está diciendo a una familia que está incompleta, que es
 *  exactamente lo que Edgardo mandó a sacar el 17/8.
 *
 *  🔴 **La regla: cada sugerencia entra con el caso que la dispara y el caso que
 *  NO la dispara.** Sin el segundo no se sabe si la condición hace algo.
 */

import {
  loQueImpideTrabajar,
  sugerenciasParaLaFamilia,
  type AdultoResponsable,
  type Chico,
  type FamiliaCompleta,
} from "./tipos.ts";

const EDAD_PARA_ELEGIR = 11;

function chico(edad: number, conCanal = true): Chico {
  return {
    id: "c1",
    familiaId: "f1",
    nombre: "Ana",
    edad,
    genero: "nena",
    canal: { tipo: "telegram", destino: conCanal ? "123456" : "", codigo: "ANA123" },
    activo: true,
    creado: new Date().toISOString(),
  };
}

function adulto(
  nombre: string,
  rol: AdultoResponsable["rol"],
  opciones: { elegido?: boolean; activo?: boolean } = {},
): AdultoResponsable {
  return {
    id: `a-${nombre}`,
    familiaId: "f1",
    nombre,
    vinculo: rol === "progenitor" ? "madre" : "tia_tio",
    rol,
    elegidoPorElChico: opciones.elegido ?? false,
    canal: { tipo: "correo", destino: `${nombre}@ejemplo.ar` },
    activo: opciones.activo ?? true,
    creado: new Date().toISOString(),
  };
}

function familia(chicos: Chico[], adultos: AdultoResponsable[]): FamiliaCompleta {
  return {
    familia: {
      id: "f1",
      nombre: "Familia de prueba",
      token: "t",
      activo: true,
      creado: new Date().toISOString(),
    },
    chicos,
    adultos,
  };
}

interface Caso {
  nombre: string;
  familia: FamiliaCompleta;
  /** Un pedazo de texto que TIENE que aparecer entre las sugerencias. */
  sugiere?: string;
  /** Un pedazo de texto que NO puede aparecer. */
  noSugiere?: string;
  impide?: boolean;
}

const CASOS: Caso[] = [
  /* ── El caso que motivó todo el cambio ─────────────────────────────────── */
  {
    nombre: "un solo progenitor y ningún referente: se sugiere sumar a alguien",
    familia: familia([chico(12)], [adulto("Mariana", "progenitor")]),
    sugiere: "Sumar un adulto de confianza",
  },
  {
    nombre: "🔴 un solo progenitor CON referente: no se le dice nada",
    familia: familia(
      [chico(12)],
      [adulto("Mariana", "progenitor"), adulto("Carla", "referente", { elegido: true })],
    ),
    noSugiere: "Sumar un adulto de confianza",
  },
  {
    nombre: "dos progenitores sin referente: tampoco se le dice nada",
    familia: familia(
      [chico(12)],
      [adulto("Mariana", "progenitor"), adulto("Jorge", "progenitor")],
    ),
    noSugiere: "Sumar un adulto de confianza",
  },

  /* ── El cartel imposible del chico chico ───────────────────────────────── */
  {
    nombre: "🔴 a los 8 NO se sugiere que elija el chico — era un cartel que no se apagaba",
    familia: familia(
      [chico(8)],
      [adulto("Mariana", "progenitor"), adulto("Carla", "referente", { elegido: false })],
    ),
    noSugiere: "a quién elegiría",
  },
  {
    nombre: "a los 14 sí se sugiere, porque ya tiene edad de elegir",
    familia: familia(
      [chico(14)],
      [adulto("Mariana", "progenitor"), adulto("Carla", "referente", { elegido: false })],
    ),
    sugiere: "a quién elegiría",
  },
  {
    nombre: "a los 14, si el referente ya lo eligió él, no se repite",
    familia: familia(
      [chico(14)],
      [adulto("Mariana", "progenitor"), adulto("Carla", "referente", { elegido: true })],
    ),
    noSugiere: "a quién elegiría",
  },

  /* ── El canal del chico ────────────────────────────────────────────────── */
  {
    nombre: "sin canal del chico se sugiere conectarlo",
    familia: familia([chico(12, false)], [adulto("Mariana", "progenitor")]),
    sugiere: "Conectar el canal",
  },
  {
    nombre: "con canal conectado, no",
    familia: familia([chico(12, true)], [adulto("Mariana", "progenitor")]),
    noSugiere: "Conectar el canal",
  },

  /* ── La baja no cambia lo que se exige, pero sí lo que se sugiere ──────── */
  {
    nombre: "un referente dado de baja no cuenta: vuelve la sugerencia de sumar",
    familia: familia(
      [chico(12)],
      [adulto("Mariana", "progenitor"), adulto("Carla", "referente", { activo: false })],
    ),
    sugiere: "Sumar un adulto de confianza",
  },

  /* ── Lo único que sigue siendo duro ────────────────────────────────────── */
  {
    nombre: "🔴 sin chico SÍ impide trabajar — es la única condición dura que quedó",
    familia: familia([], [adulto("Mariana", "progenitor")]),
    impide: true,
  },
  {
    nombre: "con chico no impide nada, ni con un solo adulto",
    familia: familia([chico(12)], [adulto("Mariana", "progenitor")]),
    impide: false,
  },
];

let fallaron = 0;

for (const caso of CASOS) {
  const sugerencias = sugerenciasParaLaFamilia(caso.familia, EDAD_PARA_ELEGIR);
  const textos = sugerencias.map((s) => `${s.que} ${s.porQue}`).join(" | ");
  const impedimentos = loQueImpideTrabajar(caso.familia);

  let bien = true;
  const detalles: string[] = [];

  if (caso.sugiere && !textos.includes(caso.sugiere)) {
    bien = false;
    detalles.push(`esperaba que sugiriera "${caso.sugiere}" y no lo hizo`);
  }
  if (caso.noSugiere && textos.includes(caso.noSugiere)) {
    bien = false;
    detalles.push(`sugirió "${caso.noSugiere}" y no correspondía`);
  }
  if (caso.impide !== undefined && impedimentos.length > 0 !== caso.impide) {
    bien = false;
    detalles.push(caso.impide ? "no marcó impedimento y debía" : "marcó impedimento y no debía");
  }

  /* 🔴 Una sugerencia sin porqué se lee como una exigencia disfrazada. Vale
     para todas, así que se comprueba siempre y no caso por caso. */
  for (const s of sugerencias) {
    if (!s.porQue?.trim()) {
      bien = false;
      detalles.push(`la sugerencia "${s.que}" vino sin porqué`);
    }
  }

  console.log(`${bien ? "✓" : "✗"} ${caso.nombre}`);
  if (!bien) {
    fallaron++;
    for (const d of detalles) console.log(`    ${d}`);
    console.log(`    salió:    ${textos || "(ninguna)"}`);
  }
}

console.log(`\n${CASOS.length - fallaron} de ${CASOS.length}`);
if (fallaron > 0) process.exit(1);
