/**
 * Prueba el ENVÍO del parte y del aviso de ceguera de punta a punta, contra el
 * repositorio en memoria y el transporte de ensayo.
 *
 * 🔑 `probar-parte` prueba QUÉ dice; esto prueba que SALGA y quede registrado.
 * Corre con tsx porque necesita resolver el alias `@/`, que node pelado no sabe.
 */
process.env.NODE_ENV = "test";
const { enviarParte, avisarDeLaCeguera } = await import("./src/lib/mensajeria/avisar.ts");
const { armarParte } = await import("./src/lib/motor/parte.ts");
const { repositorio } = await import("./src/lib/datos/index.ts");

let fallaron = 0;
const ok = (n, c, d) => { console.log(`${c ? "✓" : "✗"} ${n}`); if (!c) { fallaron++; if (d) console.log(`    ${d}`); } };

const repo = repositorio();
console.log(`(almacenamiento: ${repo.clase})`);

const chico = { id: "c1", familiaId: "f1", nombre: "Ana", edad: 12, genero: "nena",
  canal: { tipo: "telegram", destino: "" }, activo: true, creado: new Date().toISOString() };

const adultos = [
  { id: "a1", familiaId: "f1", nombre: "Mariana", vinculo: "madre", rol: "progenitor",
    elegidoPorElChico: false, activo: true, canal: { tipo: "correo", destino: "m@ejemplo.ar" } },
  { id: "a2", familiaId: "f1", nombre: "Carla", vinculo: "tia_tio", rol: "referente",
    elegidoPorElChico: true, activo: true, canal: { tipo: "correo", destino: "c@ejemplo.ar" } },
  { id: "a3", familiaId: "f1", nombre: "Jorge", vinculo: "padre", rol: "progenitor",
    elegidoPorElChico: false, activo: false, canal: { tipo: "correo", destino: "j@ejemplo.ar" } },
];

const ahora = new Date();

/* ── El parte ── */
const parte = armarParte({ senales: [], diasMirados: 30, rachaMasLarga: 0, huboAviso: false });
const emitidos = await enviarParte({ chico, adultos, parte, ahora });

ok("el parte sale", emitidos.length > 0);
ok("va SÓLO a los responsables activos: uno, no tres", emitidos.length === 1, `salieron ${emitidos.length}`);
ok("y ese es Mariana", emitidos[0]?.paraQuien === "Mariana");
ok("el referente NO lo recibe", !emitidos.some((e) => e.paraQuien === "Carla"));
ok("el progenitor dado de baja tampoco", !emitidos.some((e) => e.paraQuien === "Jorge"));
ok("queda con su clase", emitidos[0]?.clase === "parte_periodico");

/* 🔴 Sin botón: el acuse es para las alertas, y de ahí cuelga la escalada. */
const guardadas = await repo.respuestasDe("c1", new Date(ahora.getTime() - 86400000).toISOString(), new Date(ahora.getTime() + 86400000).toISOString());
const elParte = guardadas.find((r) => r.clase === "parte_periodico");
ok("el parte queda registrado", Boolean(elParte));
ok("y NO lleva token de acuse", !elParte?.acuseToken,
   "Con botón, un parte sin abrir se pareceria a una alerta sin abrir.");

/* ── La ceguera ── */
const ceg = await avisarDeLaCeguera({
  chico, adultos, ahora,
  ceguera: { ciego: true, ultimoDiaConSenal: "2026-08-14", diasSinSenal: 5, nuncaHuboSenales: false },
});
ok("el aviso de ceguera sale", ceg.length === 1);
ok("con su clase propia", ceg[0]?.clase === "aviso_de_ceguera");
ok("y dice que el sistema no está mirando", /NO está mirando/i.test(ceg[0]?.texto ?? ""));

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
process.exit(fallaron ? 1 : 0);
