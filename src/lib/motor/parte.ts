/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL PARTE — la señal de vida, y la ceguera
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  **Lo pidió Edgardo el 19/8, y con el argumento correcto:** *"si no da señales
 *  de nada los usuarios pueden pensar «¿esta porquería está funcionando?».
 *  Imaginate que pasaron 4 meses sin nada que reportar"*.
 *
 *  🔴 **Y al ir a construirlo apareció algo más grave que lo comercial: hasta
 *  hoy AntiGro NO SABÍA CUÁNDO ESTABA CIEGO.** Si el perfil se desinstala, el
 *  chico cambia de teléfono o el filtro deja de reportar, **no llega ninguna
 *  señal — y eso el motor lo leía exactamente igual que «todo tranquilo»**. No
 *  había una sola línea que distinguiera las dos cosas.
 *  ➡ Así que su pregunta no era sólo una duda del usuario: **era razonable,
 *  porque el sistema no podía contestarla.**
 *
 *  🔑 **Y eso da vuelta el argumento del parte.** Lo que prueba que el sistema
 *  sirve no es *«no pasó nada»*: es *«miré 31 días, hubo actividad tarde el 6,
 *  el 9 y el 14, ninguna se sostuvo, y por eso no te escribí»*. Convierte el
 *  silencio de **ausencia** en **trabajo hecho**.
 *
 *  ⚠ **LO QUE EL PARTE NO PUEDE SER: una alerta chiquita.** Sin botón, sin
 *  color de atención, y sin sugerir que nadie haga nada. Si un padre ansioso lee
 *  «hubo tres noches tarde» y actúa sobre eso, rompimos la regla 5 —que existe
 *  para que nadie se alarme por un pico suelto— **con nuestro propio mensaje**.
 *  Por eso el parte dice SIEMPRE, con todas las letras, por qué eso no ameritó
 *  escribirle.
 */

import type { SenalDeRed } from "@/lib/senales/tipos";
import { diaLocal } from "./dia.ts";

/**
 * Cuántos días sin una sola señal hacen sospechar que el filtro se cayó.
 *
 * 📌 Tres, y no uno: un chico puede pasar un día sin tocar el teléfono —está en
 * el campo, se quedó sin batería, se lo sacaron de castigo— y avisar por eso
 * sería el mismo falso positivo que la regla 5 evita del otro lado.
 */
export const DIAS_PARA_SOSPECHAR_CEGUERA = 3;

/** Cada cuánto sale el parte. Doce al año es señal de vida; 52 es ruido. */
export const DIAS_ENTRE_PARTES = 30;

export interface Ceguera {
  /** 🔴 `true` = hace días que no llega nada Y antes sí llegaba. */
  ciego: boolean;
  /** Último día con alguna señal, `null` si nunca hubo ninguna. */
  ultimoDiaConSenal: string | null;
  diasSinSenal: number;
  /**
   * 🔑 **Un chico sin señales NO siempre está ciego.** Si nunca llegó ninguna,
   * el filtro puede no haberse instalado todavía — y eso es otra cosa, con otra
   * respuesta: no es «se rompió», es «falta ponerlo». Confundirlos haría que
   * una familia recién dada de alta reciba una alarma de avería.
   */
  nuncaHuboSenales: boolean;
}

/**
 * ¿El sistema dejó de ver?
 *
 * 🔴 **Es lo contrario de todo lo demás que hace el motor.** El resto mira lo
 * que llegó; esto mira lo que dejó de llegar. Y es la única clase de fallo que
 * **se disfraza de buena noticia**: cero señales se lee igual que un chico
 * tranquilo, y por eso hay que buscarlo a propósito.
 */
export function mirarSiEstaCiego(senales: SenalDeRed[], hasta: Date): Ceguera {
  if (senales.length === 0) {
    return {
      ciego: false,
      ultimoDiaConSenal: null,
      diasSinSenal: 0,
      nuncaHuboSenales: true,
    };
  }

  const ultima = senales.reduce((max, s) => (s.fecha > max ? s.fecha : max), senales[0].fecha);
  const dias = Math.floor(
    (new Date(diaLocal(hasta)).getTime() - new Date(diaLocal(ultima)).getTime()) /
      (24 * 60 * 60 * 1000),
  );

  return {
    ciego: dias >= DIAS_PARA_SOSPECHAR_CEGUERA,
    ultimoDiaConSenal: diaLocal(ultima),
    diasSinSenal: Math.max(0, dias),
    nuncaHuboSenales: false,
  };
}

/* ── El parte ─────────────────────────────────────────────────────────────── */

export interface Parte {
  diasMirados: number;
  senalesQueLlegaron: number;
  /** Días distintos en que hubo alguna señal. */
  diasConAlgo: number;
  /** Cuántas veces apareció cada cosa, para poder contarlo sin interpretarlo. */
  nochesTarde: number;
  plataformasNuevas: number;
  saltosDeVolumen: number;
  evasiones: number;
  /** 🔴 Cuánto fue lo más largo que algo se sostuvo. Es el porqué del silencio. */
  rachaMasLarga: number;
  /** Si hubo aviso en el período. */
  huboAviso: boolean;
}

/**
 * Qué decir del período. **Cuenta, no interpreta.**
 *
 * 🔑 La diferencia importa: «hubo 3 noches con actividad tarde» es un hecho;
 * «tu hijo se está acostando tarde» es una conclusión sobre una persona, y esa
 * no la saca el sistema (regla 1). El parte llega hasta el hecho y ahí se para.
 */
export function armarParte(entrada: {
  senales: SenalDeRed[];
  diasMirados: number;
  rachaMasLarga: number;
  huboAviso: boolean;
}): Parte {
  const { senales, diasMirados, rachaMasLarga, huboAviso } = entrada;
  const cuantas = (tipo: string) => senales.filter((s) => s.tipo === tipo).length;

  return {
    diasMirados,
    senalesQueLlegaron: senales.length,
    diasConAlgo: new Set(senales.map((s) => diaLocal(s.fecha))).size,
    nochesTarde: cuantas("madrugada"),
    plataformasNuevas: cuantas("plataforma_nueva"),
    saltosDeVolumen: cuantas("volumen"),
    evasiones: cuantas("evasion"),
    rachaMasLarga,
    huboAviso,
  };
}

/* ── Los textos, deterministas ────────────────────────────────────────────── */

/**
 * 🔴 **No lo escribe el modelo**, por el mismo motivo que la escalada: no hay
 * nada que interpretar —son cuentas—, lo dispara un reloj sin que nadie lo pida,
 * y sale una vez por mes por familia. Que un resumen mensual cueste dos llamadas
 * a Opus 5 por casa es exactamente el gasto que encontró la auditoría del 17/8.
 */
export function textoDelParte(chico: string, parte: Parte): string {
  const enCriollo = (n: number, singular: string, plural: string) =>
    `${n} ${n === 1 ? singular : plural}`;

  const partes: string[] = [
    `Parte de AntiGro sobre ${chico}.`,
    "",
    `Miramos ${enCriollo(parte.diasMirados, "día", "días")}.`,
  ];

  if (parte.senalesQueLlegaron === 0) {
    /* ⚠ Cero señales con el filtro andando es raro pero posible —un chico que
       casi no usa el teléfono—. No se dramatiza y no se felicita a nadie. */
    partes.push(
      "",
      "No llegó ninguna señal en todo el período. Si el teléfono se usó normalmente, " +
        "conviene revisar que el filtro siga puesto.",
    );
  } else {
    const vistos: string[] = [];
    if (parte.nochesTarde > 0) {
      vistos.push(enCriollo(parte.nochesTarde, "vez con actividad tarde", "veces con actividad tarde"));
    }
    if (parte.plataformasNuevas > 0) {
      vistos.push(enCriollo(parte.plataformasNuevas, "lugar nuevo", "lugares nuevos"));
    }
    if (parte.saltosDeVolumen > 0) {
      vistos.push(enCriollo(parte.saltosDeVolumen, "salto de uso", "saltos de uso"));
    }
    if (parte.evasiones > 0) {
      vistos.push(
        enCriollo(parte.evasiones, "intento de saltar el filtro", "intentos de saltar el filtro"),
      );
    }

    partes.push(
      "",
      vistos.length > 0
        ? `Lo que vimos: ${vistos.join(", ")}, en ${enCriollo(parte.diasConAlgo, "día", "días")} distintos.`
        : `Hubo actividad en ${enCriollo(parte.diasConAlgo, "día", "días")}, sin nada que se apartara de lo habitual.`,
    );
  }

  /* 🔴 **La parte que hace que esto no sea una alerta chiquita.** Sin esto, un
     padre lee «3 noches tarde» y actúa sobre un pico suelto — que es
     exactamente lo que la regla 5 existe para evitar. */
  if (!parte.huboAviso) {
    partes.push(
      "",
      parte.rachaMasLarga > 0
        ? `Nada de eso se sostuvo: lo más largo duró ${enCriollo(parte.rachaMasLarga, "día", "días")}. ` +
          "Por eso no te escribimos. El sistema avisa cuando algo se repite, no cuando pasa una vez."
        : "Nada de eso se sostuvo en el tiempo, y por eso no te escribimos. El sistema avisa " +
          "cuando algo se repite, no cuando pasa una vez.",
    );
  }

  partes.push(
    "",
    "Esto no es una alerta y no hace falta que hagas nada. Es para que sepas que el sistema " +
      "está mirando.",
  );

  return partes.join("\n");
}

/**
 * El aviso de que el sistema dejó de ver.
 *
 * 🔴 **Este SÍ pide una acción, y es el único de los dos que la pide.** No es
 * una novedad sobre el chico: es una avería del sistema, y una avería que nadie
 * arregla deja a la familia creyendo que está protegida cuando no lo está.
 */
export function textoDeLaCeguera(chico: string, ceguera: Ceguera): string {
  return (
    `AntiGro dejó de recibir datos de ${chico}.\n\n` +
    `La última señal llegó hace ${ceguera.diasSinSenal} días` +
    (ceguera.ultimoDiaConSenal ? ` (el ${ceguera.ultimoDiaConSenal}).` : ".") +
    "\n\n" +
    "Puede ser que el filtro se haya sacado del teléfono, que el teléfono haya cambiado, " +
    "o que se esté usando otra conexión.\n\n" +
    "🔴 Mientras esto siga así, el sistema NO está mirando. Y eso desde afuera se ve igual " +
    "que estar todo tranquilo, por eso te avisamos.\n\n" +
    "En tu panel está la instalación para volver a ponerlo."
  );
}
