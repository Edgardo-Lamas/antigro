/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL ACUSE DE RECIBO, CON SUS CASOS — `npm run probar-acuse`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Acá se prueba una REGLA DE PRODUCTO, no una función.** La definió
 *  Edgardo el 19/8 conversándola: *"si enviamos tres mensajes y dos contestan,
 *  no deberíamos pasar a la escalada"*, y después la cerró más fino: **"el
 *  acuse es de uno de los responsables"**.
 *
 *  🔑 **La diferencia entre las dos versiones NO es un detalle, y por eso hay
 *  un caso escrito para cada una.** Contar acuses se rompe con un escenario
 *  concreto: tres mensajes, dos acuses, y que los dos sean el referente y el
 *  chico. Ahí ningún progenitor lo vio — que es exactamente el caso para el
 *  que existe la escalada. Si alguien vuelve a implementarlo contando, el caso
 *  «dos acuses y ninguno responsable» se pone en rojo.
 *
 *  ⚠ Y el error de acá **no se ve**, como en todas las tandas de este
 *  proyecto: una regla mal puesta no lanza ninguna excepción. O el sistema
 *  insiste sobre un padre que ya está mirando, o se queda callado cuando nadie
 *  miró. Las dos se ven igual desde afuera: nada en la pantalla.
 */

import {
  ETIQUETA_DEL_ACUSE,
  callbackDelAcuse,
  nuevoTokenDeAcuse,
  quienLoVio,
  tokenDeUnToque,
} from "./acuse.ts";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

/* ── Los personajes ─────────────────────────────────────────────────────── */

const MADRE = { nombre: "Mariana", rol: "progenitor", activo: true, canal: { destino: "111" } };
const PADRE = { nombre: "Jorge", rol: "progenitor", activo: true, canal: { destino: "222" } };
const TIA = { nombre: "Carla", rol: "referente", activo: true, canal: { destino: "333" } };

const AYER = "2026-08-18T10:00:00.000Z";
const HOY = "2026-08-19T10:00:00.000Z";

function aviso(destino: string, acusadoEn: string | null, entregado = true) {
  return {
    clase: "alerta_adultos",
    destino,
    fecha: AYER,
    entregado,
    acuseToken: `tok-${destino}`,
    acusadoEn,
  };
}

/* ── 1 · La regla, y el caso que la separa de contar ─────────────────────── */

comprobar(
  "nadie acusó → NO lo vio ningún responsable",
  quienLoVio([aviso("111", null), aviso("222", null), aviso("333", null)], [MADRE, PADRE, TIA])
    .loVioUnResponsable === false,
);

comprobar(
  "con UNO de los responsables alcanza: no es lista de asistencia",
  quienLoVio([aviso("111", HOY), aviso("222", null), aviso("333", null)], [MADRE, PADRE, TIA])
    .loVioUnResponsable === true,
);

/* 🔴 EL CASO QUE JUSTIFICA LA TANDA ENTERA. Tres mensajes, DOS acuses — y la
   regla tiene que decir que NO lo vio nadie responsable, porque los dos que
   acusaron son el referente y… nadie más. Contando, esto daría «no escalar». */
comprobar(
  "DOS acuses pero ninguno de un responsable → sigue sin verlo nadie",
  quienLoVio([aviso("111", null), aviso("222", null), aviso("333", HOY)], [MADRE, PADRE, TIA])
    .loVioUnResponsable === false,
  "Si esto da true, la regla volvió a CONTAR acuses en vez de mirar quién los dio.",
);

comprobar(
  "el acuse del referente igual queda registrado: es información, no ruido",
  quienLoVio([aviso("333", HOY)], [TIA]).avisos[0].acusadoEn === HOY,
);

comprobar(
  "y el referente nunca figura como responsable",
  quienLoVio([aviso("333", HOY)], [TIA]).avisos[0].esResponsable === false,
);

/* 🔴 Un progenitor dado de baja ya no cierra el circuito. Se fue de la familia;
   que su teléfono viejo reciba y alguien apriete no significa que un
   responsable esté mirando. */
comprobar(
  "un progenitor dado de baja NO cierra el circuito",
  quienLoVio([aviso("111", HOY)], [{ ...MADRE, activo: false }]).loVioUnResponsable === false,
);

/* ── 1 bis · El acuse es DE CADA AVISO, no de la persona para siempre ────── */

/* 🔴 **Encontrado mirando el panel el 19/8, y era grave.** Con el historial
   entero, un acuse de hace dos días decía «un responsable lo vio» mientras el
   aviso de hoy seguía sin abrir. Con eso **la escalada no se disparaba nunca
   más** una vez que alguien había acusado recibo alguna vez.
   Por eso `loVioUnResponsable` mira sólo la ÚLTIMA TANDA. */
function enFecha(destino: string, fecha: string, acusadoEn: string | null) {
  return { clase: "alerta_adultos", destino, fecha, entregado: true, acusadoEn };
}

{
  const historia = quienLoVio(
    [
      // Anteayer se le avisó y lo confirmó.
      enFecha("111", "2026-08-17T10:00:00.000Z", "2026-08-17T10:05:00.000Z"),
      // Hoy se le avisó de nuevo y NO lo confirmó.
      enFecha("111", "2026-08-19T10:00:00.000Z", null),
    ],
    [MADRE],
  );

  comprobar(
    "un acuse VIEJO no cierra el aviso de hoy",
    historia.loVioUnResponsable === false,
    "Si esto da true, la escalada no se dispara nunca más despues del primer acuse de la vida.",
  );
  comprobar("y la última tanda es sólo el aviso de hoy", historia.ultimaTanda.length === 1);
  comprobar("pero el historial entero se conserva para mostrarlo", historia.avisos.length === 2);
}

{
  /* Al revés: la tanda de hoy SÍ está confirmada, aunque la vieja no. */
  const alReves = quienLoVio(
    [
      enFecha("111", "2026-08-17T10:00:00.000Z", null),
      enFecha("111", "2026-08-19T10:00:00.000Z", "2026-08-19T10:05:00.000Z"),
    ],
    [MADRE],
  );
  comprobar("y si lo confirmó HOY, sí cierra", alReves.loVioUnResponsable === true);
}

{
  /* 🔑 Una tanda es una corrida de `avisar()`: los adultos reciben con segundos
     de diferencia y tienen que quedar juntos. */
  const mismaTanda = quienLoVio(
    [
      enFecha("111", "2026-08-19T10:00:00.000Z", null),
      enFecha("222", "2026-08-19T10:00:04.000Z", "2026-08-19T11:00:00.000Z"),
    ],
    [MADRE, PADRE],
  );
  comprobar(
    "dos adultos avisados con segundos de diferencia son UNA tanda",
    mismaTanda.ultimaTanda.length === 2,
    `quedaron ${mismaTanda.ultimaTanda.length}`,
  );
  comprobar("y con que uno de los dos confirme, alcanza", mismaTanda.loVioUnResponsable === true);
}

/* ── 2 · El chico no entra acá NUNCA ─────────────────────────────────────── */

/* 🔴 Su mensaje es `orientacion_chico` y se filtra antes de mirar nada. Si su
   toque contara, el sistema dejaría de insistir porque lo vio la chica. */
{
  const conElChico = quienLoVio(
    [
      aviso("111", null),
      { clase: "orientacion_chico", destino: "999", fecha: AYER, entregado: true, acusadoEn: HOY },
    ],
    [MADRE],
  );
  comprobar(
    "la orientación al chico no cuenta como aviso a un adulto",
    conElChico.avisos.length === 1,
    `quedaron ${conElChico.avisos.length}`,
  );
  comprobar(
    "y su «acuse» NO frena la escalada",
    conElChico.loVioUnResponsable === false,
    "Si esto da true, el sistema se calla porque lo vio el chico. Es lo contrario del producto.",
  );
}

/* ── 3 · «No acusó» ≠ «nunca le llegó» ───────────────────────────────────── */

comprobar(
  "un aviso que NO salió se marca aparte",
  quienLoVio([aviso("111", null, false)], [MADRE]).hayAvisosQueNoSalieron === true,
);

comprobar(
  "y si salieron todos, no se marca",
  quienLoVio([aviso("111", null, true)], [MADRE]).hayAvisosQueNoSalieron === false,
);

/* ⚠ El caso que hay que poder distinguir: nadie acusó, pero es porque a nadie
   le llegó. Escalar acá sería escalar por un problema de configuración
   disfrazado de desatención. */
{
  const nadieRecibio = quienLoVio([aviso("111", null, false), aviso("222", null, false)], [MADRE, PADRE]);
  comprobar(
    "nadie acusó Y nadie recibió: las dos cosas se pueden ver por separado",
    nadieRecibio.loVioUnResponsable === false && nadieRecibio.hayAvisosQueNoSalieron === true,
  );
}

/* ── 4 · Un aviso a alguien que ya no está en la familia ─────────────────── */

comprobar(
  "un destino que no coincide con ningún adulto no rompe nada",
  quienLoVio([aviso("777", null)], [MADRE]).avisos[0].nombre === null,
);

comprobar("sin avisos, no lo vio nadie", quienLoVio([], [MADRE]).loVioUnResponsable === false);

/* ── 5 · El token ────────────────────────────────────────────────────────── */

const token = nuevoTokenDeAcuse();

comprobar("el token no es adivinable: no es un número corto", token.length >= 16);
comprobar("dos tokens seguidos no se repiten", nuevoTokenDeAcuse() !== nuevoTokenDeAcuse());
comprobar("ida y vuelta del callback", tokenDeUnToque(callbackDelAcuse(token)) === token);

/* 🔴 Telegram topea `callback_data` en 64 BYTES. Si se pasa, el botón no se
   dibuja y el acuse deja de existir **sin ningún error**. */
comprobar(
  "el callback entra en los 64 bytes de Telegram",
  Buffer.byteLength(callbackDelAcuse(token), "utf8") <= 64,
  `mide ${Buffer.byteLength(callbackDelAcuse(token), "utf8")}`,
);

comprobar("un toque que no es un acuse devuelve null", tokenDeUnToque("otra_cosa") === null);
comprobar("un callback vacío devuelve null", tokenDeUnToque("") === null);
comprobar("un prefijo sin token devuelve null", tokenDeUnToque("vi:") === null);
comprobar("y undefined también", tokenDeUnToque(undefined) === null);

/* ── 6 · Lo que dice el botón ────────────────────────────────────────────── */

/* 🔴 Decidido por Edgardo el 19/8: dice «Lo vi», NO «OK». «OK» se lee como
   «está bien / estoy de acuerdo», y esto no es algo con lo que uno esté de
   acuerdo. «Lo vi» dice exactamente lo que el sistema aprende: que esa persona
   lo vio. No que se haga cargo, no que vaya a hacer algo. */
comprobar("el botón dice «Lo vi»", ETIQUETA_DEL_ACUSE === "Lo vi");
comprobar(
  "y no dice OK, ni «entendido», ni nada que suene a hacerse cargo",
  !/^(ok|entendido|de acuerdo|listo|me hago cargo)$/i.test(ETIQUETA_DEL_ACUSE),
);

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
