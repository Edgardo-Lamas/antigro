/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOS AVISOS AL CENTRO, CON SUS CASOS — `npm run probar-centros`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Lo que se rompe acá no da error: le llega a una institución.** Un aviso
 *  de más moviliza a una comunidad por nada; uno que deja adivinar de quién se
 *  trata expone a un chico ante su escuela. Las dos cosas se ven como que anduvo.
 *
 *  Cada regla entra con el caso que avisa y el caso que no.
 */

import {
  ALUMNOS_MINIMOS_EN_EL_CENTRO,
  ALUMNOS_MINIMOS_POR_LUGAR,
  filasDelCentro,
  patronesDelCentro,
  textoDelAviso,
  type AlumnoObservado,
} from "./patrones.ts";
import type { SenalDeRed } from "../senales/tipos.ts";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

/* Un centro mixto de diez alumnos, de 8 a 15 años. */
function centroMixto(conAlerta: string[] = []): AlumnoObservado[] {
  const base: [string, number, AlumnoObservado["genero"]][] = [
    ["a1", 8, "nena"],
    ["a2", 9, "varon"],
    ["a3", 11, "nena"],
    ["a4", 12, "varon"],
    ["a5", 12, "nena"],
    ["a6", 13, "varon"],
    ["a7", 14, "nena"],
    ["a8", 15, "varon"],
    ["a9", 10, "nena"],
    ["a10", 11, "varon"],
  ];
  return base.map(([chicoId, edad, genero]) => ({
    chicoId,
    edad,
    genero,
    conAlerta: conAlerta.includes(chicoId),
  }));
}

let n = 0;
function vio(chicoId: string, dominio: string, dia = "2026-09-10"): SenalDeRed {
  n++;
  return {
    id: `s${n}`,
    chicoId,
    fecha: `${dia}T21:00:00.000Z`,
    tipo: "plataforma_nueva",
    intensidad: 0.5,
    contexto: { dominio },
    fuente: "nextdns",
  };
}

const dominiosAvisados = (r: ReturnType<typeof patronesDelCentro>) =>
  r.avisables.map((a) => a.hallazgo.dominio);

/* ── 1. Los pisos de privacidad ────────────────────────────────────────── */

{
  const chico = centroMixto().slice(0, ALUMNOS_MINIMOS_EN_EL_CENTRO - 1);
  const senales = chico.map((a) => vio(a.chicoId, "chat-secreto.top"));
  const r = patronesDelCentro(chico, senales);
  comprobar(
    `🔴 con menos de ${ALUMNOS_MINIMOS_EN_EL_CENTRO} alumnos el centro no recibe NADA, aunque todos vean lo mismo`,
    r.avisables.length === 0,
    `avisó: ${dominiosAvisados(r).join(", ")}`,
  );
}

{
  const alumnos = centroMixto();
  const senales = ["a1", "a4"].map((id) => vio(id, "chat-secreto.top"));
  const r = patronesDelCentro(alumnos, senales);
  comprobar(
    `🔴 con ${ALUMNOS_MINIMOS_POR_LUGAR - 1} alumnos en el mismo sitio NO se avisa: se podría adivinar quiénes son`,
    r.avisables.length === 0,
  );
}

/* ── 2. El caso que tiene que avisar ───────────────────────────────────── */

{
  const alumnos = centroMixto();
  const senales = [
    vio("a1", "chat-secreto.top", "2026-09-08"),
    vio("a4", "chat-secreto.top", "2026-09-10"),
    vio("a7", "chat-secreto.top", "2026-09-12"),
  ];
  const r = patronesDelCentro(alumnos, senales);
  comprobar(
    "🔑 tres alumnos en un sitio que nadie reconoce, en pocos días → se avisa",
    dominiosAvisados(r).includes("chat-secreto.top"),
    `avisó: ${JSON.stringify(dominiosAvisados(r))}`,
  );
  const aviso = r.avisables[0];
  comprobar(
    "el porqué dice que el sitio no es conocido",
    Boolean(aviso?.porQue.includes("no es un sitio conocido")),
    aviso?.porQue,
  );
}

/* ── 3. La vida normal no es un patrón ─────────────────────────────────── */

{
  const alumnos = centroMixto();
  const todos = alumnos.map((a) => a.chicoId);
  const senales = [
    ...todos.map((id) => vio(id, "whatsapp.net")),
    ...todos.map((id) => vio(id, "youtube.com")),
    ...todos.map((id) => vio(id, "roblox.com")),
  ];
  const r = patronesDelCentro(alumnos, senales);
  comprobar(
    "WhatsApp, YouTube y Roblox en toda la escuela → ningún aviso",
    r.avisables.length === 0,
    `avisó: ${dominiosAvisados(r).join(", ")}`,
  );
}

/* ── 4. El perfil angosto se mide contra el centro ─────────────────────── */

{
  /* Un colegio de primaria solo de niñas: todas son «nenas de 7 a 10». */
  const alumnos: AlumnoObservado[] = ["n1", "n2", "n3", "n4", "n5", "n6"].map((id, i) => ({
    chicoId: id,
    edad: 7 + (i % 4),
    genero: "nena",
    conAlerta: false,
  }));
  const senales = ["n1", "n2", "n3", "n4", "n5"].map((id) => vio(id, "roblox.com"));
  const r = patronesDelCentro(alumnos, senales);
  comprobar(
    "🔴 en un colegio solo de niñas, que las niñas usen Roblox NO es un público angosto",
    r.avisables.length === 0,
    `avisó: ${dominiosAvisados(r).join(", ")}`,
  );
}

{
  /* Centro mixto de doce: seis nenas de 7 a 10 que son la mitad… y un juego
     conocido al que van cinco de ellas y nadie más. */
  const alumnos: AlumnoObservado[] = [
    ...["n1", "n2", "n3", "n4", "n5"].map((id) => ({
      chicoId: id,
      edad: 9,
      genero: "nena" as const,
      conAlerta: false,
    })),
    ...["v1", "v2", "v3", "v4", "v5", "v6", "v7"].map((id, i) => ({
      chicoId: id,
      edad: 12 + (i % 4),
      genero: (i % 2 ? "varon" : "nena") as AlumnoObservado["genero"],
      conAlerta: false,
    })),
  ];
  const senales = ["n1", "n2", "n3", "n4", "n5"].map((id) => vio(id, "roblox.com"));
  const r = patronesDelCentro(alumnos, senales);
  comprobar(
    "🔑 cinco nenas de 9 en un lugar al que no va nadie más, en un centro donde son minoría → se avisa",
    dominiosAvisados(r).includes("roblox.com"),
    `avisó: ${JSON.stringify(dominiosAvisados(r))}`,
  );
  comprobar(
    "y el porqué nombra el grupo, no a nadie",
    Boolean(r.avisables[0]?.porQue.includes("nenas de 7 a 10 años")),
    r.avisables[0]?.porQue,
  );
}

/* ── 5. Las alertas de las casas deciden, pero no se cuentan ───────────── */

{
  const alumnos = centroMixto(["a2", "a5"]);
  const senales = ["a2", "a5", "a8"].map((id) => vio(id, "tiktok.com"));
  const r = patronesDelCentro(alumnos, senales);
  comprobar(
    "un sitio conocido que se concentra en alumnos con alerta → se avisa",
    dominiosAvisados(r).includes("tiktok.com"),
    `avisó: ${JSON.stringify(dominiosAvisados(r))}`,
  );
  const aviso = r.avisables.find((a) => a.hallazgo.dominio === "tiktok.com");
  comprobar(
    "🔴 pero el texto NO le cuenta al centro que en esas casas sonó un aviso",
    Boolean(aviso) && !/alerta|aviso a la familia|avisó/i.test(aviso!.porQue),
    aviso?.porQue,
  );
}

{
  const alumnos = centroMixto(["a2"]);
  const senales = ["a2", "a5", "a8"].map((id) => vio(id, "tiktok.com"));
  const r = patronesDelCentro(alumnos, senales);
  comprobar(
    "con UN solo alumno con alerta, un sitio conocido no alcanza para avisar",
    !dominiosAvisados(r).includes("tiktok.com"),
  );
}

/* ── 6. La identidad se pierde al agregar ──────────────────────────────── */

{
  const alumnos = centroMixto();
  const senales = [
    vio("a1", "x.top"),
    vio("a1", "x.top", "2026-09-11"),
    vio("a1", "x.top", "2026-09-12"),
    vio("desconocido", "x.top"),
    { ...vio("a2", "x.top"), contexto: {} },
  ];
  const filas = filasDelCentro(alumnos, senales);
  comprobar(
    "el mismo alumno tres veces cuenta como UNO",
    filas[0]?.chicosQueLoVieron === 1,
    JSON.stringify(filas),
  );
  comprobar(
    "🔴 ninguna fila lleva un identificador de alumno",
    !JSON.stringify(filas).includes('"a1"') && !JSON.stringify(filas).includes("a1"),
    JSON.stringify(filas),
  );
}

/* ── 7. El texto ───────────────────────────────────────────────────────── */

{
  const alumnos = centroMixto();
  const senales = ["a1", "a4", "a7"].map((id) => vio(id, "chat-secreto.top"));
  const r = patronesDelCentro(alumnos, senales);
  const texto = textoDelAviso({
    centro: "Colegio de prueba",
    aviso: r.avisables[0],
    ventanaDias: 21,
    ayuda: "Línea de Ayuda en Ciberseguridad de INCIBE, 017",
    material: "INCIBE y la Fundación ANAR",
  });
  comprobar("🔴 el aviso no dice «grooming» ni «acoso»", !/grooming|acos/i.test(texto), texto);
  comprobar(
    "🔴 ni afirma que el sitio sea peligroso",
    !/es peligroso|es un sitio peligroso|está en peligro/i.test(texto),
    texto,
  );
  comprobar("dice cuántos alumnos, en número", texto.includes("3 alumnos distintos"), texto);
  comprobar(
    "y dice con todas las letras que no identifica a nadie",
    texto.includes("no identifica a ningún alumno ni a ninguna familia"),
  );
  comprobar("nombra dónde pedir ayuda", texto.includes("017"));
}

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
