/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL OBSERVATORIO — las estadísticas propias del sistema
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **De Edgardo, 15/8/2026:** *"nosotros, si el sistema escala, podemos
 *  producir datos, estadísticas, incluso saber si un sitio es peligroso si ya lo
 *  vimos en otro chico"*. Y después, cuando planteé esperar a tener volumen:
 *  *"no esperar a tener volumen, que se sepa que AntiGro busca ser efectivo, y
 *  por otro lado es un argumento para posicionarnos mejor"*.
 *
 *  🔴 **Tenía razón en no esperar, y hay una razón técnica además de la
 *  comercial.** Yo objeté que con pocas familias el dato no vale. Está mal, y lo
 *  que lo desarma es un hallazgo de la literatura: los acosadores en línea
 *  **contactan a muchos chicos a la vez**. La revisión de estrategias de grooming
 *  pre y post internet (Child Abuse & Neglect, nov. 2021; PubMed 34801848) lo
 *  llama *"spray and prey"*: la tecnología les permite chatear simultáneamente
 *  con cualquier cantidad de chicos, en cualquier lugar y momento.
 *
 *  ➡ **Si un mismo acosador toca a muchos chicos a la vez, entonces el mismo
 *  lugar aparece en varios chicos a la vez.** El dato no necesita escala para
 *  significar algo: necesita simultaneidad, y la simultaneidad la pone el
 *  atacante. Dos chicos que nunca se cruzaron, con el mismo dominio nuevo la
 *  misma semana, ya es una coincidencia que pide explicación.
 *
 *  ─── 🔴 LAS DOS TRAMPAS, RESUELTAS ACÁ ────────────────────────────────────
 *
 *  1. **Contar no sirve.** El dominio más frecuente antes de una alerta va a ser
 *     WhatsApp, siempre, porque WhatsApp está en todos los chicos — alertados y
 *     no alertados. Contar aprendería que lo peligroso es lo popular. Por eso no
 *     se cuenta: se mide **cuánto más aparece en los chicos con alerta que en
 *     todos los demás** (`lift`), que es otra pregunta.
 *
 *  2. **La privacidad es la licencia para existir.** Acá NO se guarda "el chico
 *     A pasó por este dominio". Se guarda, por dominio, **cuántos chicos
 *     distintos** lo vieron — un número, sin identidad. En cuanto un dato
 *     identificable de un chico sirviera para juzgar a otro, se cae la regla 2 y
 *     se cae el producto entero.
 */

import { fueraDelRadar, nombreDeLugar, puertaDe, type Puerta } from "@/lib/senales/plataformas";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  🔑 LA HOMOGENEIDAD DEL PERFIL — idea de Edgardo, 15/8/2026
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Textual: *"supongamos que el sistema detecta que en la misma dirección están
 *  conectados 10 chicos… y supongamos que son todas nenas de 10 años, esto ya es
 *  un patrón grave"*.
 *
 *  🔴 **Y es más fuerte que el `lift`, porque discrimina donde el volumen no
 *  puede.** Un lugar legítimo y popular tiene un público **diverso**: Roblox
 *  tiene chicos de 7 a 17, varones y nenas. Un canal armado para captar tiene un
 *  público **angosto**: misma banda de edad, mismo género. La señal no es que
 *  haya muchos chicos — es que sean **todos parecidos**.
 *
 *  Eso vuelve al observatorio útil incluso contra un dominio que nadie vio nunca
 *  y del que no hay ninguna alerta previa: no hace falta saber qué es el sitio
 *  para notar que su público es imposible.
 *
 *  ⚠ **Lo que sostiene esto y lo que no.** Que las víctimas se concentran en un
 *  perfil está en las dos fuentes del proyecto (66,3% femenino y 72,3% de 12 a
 *  14 en el estudio nacional; franja 9 a 13 en el LATAM). Que
 *  **cada acosador** persiga un perfil consistente es una inferencia razonable
 *  pero **no la verifiqué en fuente**: no se afirma. Igual el detector no depende
 *  de eso — mide contra la diversidad esperable de una plataforma, sea cual sea
 *  el motivo de la concentración.
 *
 *  🔴 **Guardarraíl de privacidad, y acá es más filoso que en el resto:** con
 *  pocos chicos, un casillero de "nenas de 10" con un solo integrante es casi
 *  una identidad. Por eso el perfil **no se computa por debajo de
 *  `CHICOS_PARA_PERFIL`**, y nunca se devuelven los casilleros: sólo el índice.
 */

/** Piso para siquiera mirar el perfil. Debajo de esto, un casillero identifica. */
export const CHICOS_PARA_PERFIL = 5;

/** Desde qué concentración el público deja de parecer el de un lugar normal. */
export const HOMOGENEIDAD_ALTA = 0.8;

/** Ventana en la que dos apariciones cuentan como "a la vez". */
export const VENTANA_SIMULTANEIDAD_DIAS = 14;

/**
 * Cuántos chicos distintos hacen falta para que el observatorio diga algo.
 *
 * 📌 Dos, y no es poco: son dos casas que no se conocen. Con uno solo no hay
 * nada que comparar y el sistema estaría opinando sobre una casualidad.
 */
export const CHICOS_MINIMOS = 2;

/**
 * Cuánto más frecuente tiene que ser un dominio entre los alertados para que
 * valga la pena mirarlo. 📌 Decisión de producto: 2 = aparece el doble.
 */
export const LIFT_MINIMO = 2;

/**
 * Lo que se guarda por dominio. **Números, nunca chicos.**
 *
 * ⚠ `chicosQueLoVieron` es un CONTEO de chicos distintos, no una lista de
 * quiénes. El tipo está escrito así a propósito: si mañana alguien quisiera
 * guardar los ids, tendría que cambiar el tipo, y ahí se ve lo que está
 * haciendo. Un guardarraíl que se nota es mejor que un comentario.
 */
export interface FilaDelObservatorio {
  dominio: string;
  puerta: Puerta;
  /** Chicos distintos en los que apareció. */
  chicosQueLoVieron: number;
  /** De ésos, cuántos terminaron con patrón sostenido. */
  chicosConAlerta: number;
  /** Primera y última vez que se lo vio, en día local. Para la simultaneidad. */
  primeraVez: string;
  ultimaVez: string;
  /**
   * 🔑 Cuántos chicos por casillero de perfil (`"9-13|nena"`, `"14-17|varon"`…).
   *
   * ⚠ **Conteos, nunca chicos.** Y sólo se usa por encima de
   * `CHICOS_PARA_PERFIL`: con pocos, un casillero es casi una identidad.
   */
  porPerfil?: Record<string, number>;
}

export interface Universo {
  /** Total de chicos observados por el sistema. El denominador. */
  chicos: number;
  /** De ésos, cuántos tuvieron patrón sostenido alguna vez. */
  chicosConAlerta: number;
}

export interface Hallazgo {
  dominio: string;
  nombre: string;
  puerta: Puerta;
  chicosQueLoVieron: number;
  chicosConAlerta: number;
  /**
   * Cuántas veces más frecuente es este dominio entre los chicos con alerta que
   * en la población entera. 1 = igual de frecuente; 3 = el triple.
   */
  lift: number;
  /** Apareció en varios chicos dentro de la ventana de simultaneidad. */
  simultaneo: boolean;
  /** Nadie lo tiene catalogado: ni juego, ni mensajería, ni red conocida. */
  fueraDelRadar: boolean;
  /**
   * 0 a 1 — qué porción de los chicos cae en un mismo casillero de perfil.
   * `null` cuando hay muy pocos para mirarlo sin identificar a nadie.
   * 1 = todos iguales (diez nenas de 10). 0,3 = público diverso, como un juego.
   */
  homogeneidad: number | null;
  /** El casillero dominante, en criollo. Sólo si la homogeneidad es alta. */
  perfilDominante: string | null;
  /** 🔴 Qué tan poco se puede confiar todavía. Ver `solidez`. */
  solidez: "insuficiente" | "indicio" | "consistente";
  porQue: string;
}

/**
 * 🔴 **Cuánto se le puede creer a esta fila, dicho antes de que alguien la use.**
 *
 * Un observatorio que informa un hallazgo sin decir sobre cuántos casos se apoya
 * es peor que no tenerlo: alguien lo va a citar. Con dos chicos esto es un
 * indicio que sirve para mirar, no una conclusión que sirva para publicar.
 */
function solidezDe(chicos: number): Hallazgo["solidez"] {
  if (chicos < CHICOS_MINIMOS) return "insuficiente";
  if (chicos < 5) return "indicio";
  return "consistente";
}

/**
 * Qué tan parecidos entre sí son los chicos que vieron este lugar.
 *
 * Devuelve la porción que cae en el casillero más grande, y cuál es. `null` si
 * hay tan pocos que mirarlo sería señalar a alguien (ver `CHICOS_PARA_PERFIL`).
 */
function homogeneidadDe(fila: FilaDelObservatorio): {
  valor: number | null;
  dominante: string | null;
} {
  if (fila.chicosQueLoVieron < CHICOS_PARA_PERFIL || !fila.porPerfil) {
    return { valor: null, dominante: null };
  }

  const casilleros = Object.entries(fila.porPerfil);
  const total = casilleros.reduce((a, [, n]) => a + n, 0);
  if (total === 0) return { valor: null, dominante: null };

  const [clave, mayor] = casilleros.reduce((a, b) => (b[1] > a[1] ? b : a));
  const valor = mayor / total;

  return {
    valor: Number(valor.toFixed(2)),
    dominante: valor >= HOMOGENEIDAD_ALTA ? enCriollo(clave) : null,
  };
}

/** `"9-13|nena"` → `"nenas de 9 a 13 años"`. */
function enCriollo(clave: string): string {
  const [banda, genero] = clave.split("|");
  const quien = genero === "nena" ? "nenas" : genero === "varon" ? "varones" : "chicos";
  return `${quien} de ${banda.replace("-", " a ")} años`;
}

function diasEntre(a: string, b: string): number {
  const ms = new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime();
  return Math.abs(ms) / (24 * 60 * 60 * 1000);
}

/**
 * El cálculo entero. Recibe lo agregado y devuelve lo que merece mirarse.
 *
 * 🔑 Es una función pura sobre agregados: no toca la base, no sabe de chicos y
 * se puede probar con números a mano. Eso no es prolijidad — es lo que permite
 * que alguien discuta el criterio sin leer el resto del sistema.
 */
export function analizar(filas: FilaDelObservatorio[], universo: Universo): Hallazgo[] {
  if (universo.chicos === 0) return [];

  /* La frecuencia base de CUALQUIER dominio entre los alertados. Sin esto, el
     lift no tiene contra qué compararse y volvemos a contar popularidad. */
  const proporcionAlertados = universo.chicosConAlerta / universo.chicos;

  return filas
    .map((f): Hallazgo => {
      const enAlertados = f.chicosQueLoVieron > 0 ? f.chicosConAlerta / f.chicosQueLoVieron : 0;

      /* lift = qué proporción de los chicos que vieron este dominio terminó con
         alerta, dividido por la proporción de alertados en general.
         Si el dominio no cambia nada, da 1. */
      const lift = proporcionAlertados > 0 ? enAlertados / proporcionAlertados : 0;

      const simultaneo =
        f.chicosQueLoVieron >= CHICOS_MINIMOS &&
        diasEntre(f.primeraVez, f.ultimaVez) <= VENTANA_SIMULTANEIDAD_DIAS;

      const raro = fueraDelRadar(f.dominio);
      const solidez = solidezDe(f.chicosQueLoVieron);
      const homo = homogeneidadDe(f);

      const motivos: string[] = [];
      /* 🔑 Va primero porque es el motivo más fuerte de los tres: un lugar
         legítimo y popular tiene público diverso. Diez nenas de 10 y nadie más
         no es el público de ningún juego. */
      if (homo.dominante) {
        motivos.push(
          `de los ${f.chicosQueLoVieron} chicos que lo vieron, el ` +
            `${Math.round((homo.valor ?? 0) * 100)}% son ${homo.dominante} — un lugar legítimo ` +
            `y popular tiene público diverso, y éste no lo tiene`,
        );
      }
      if (lift >= LIFT_MINIMO) {
        motivos.push(
          `aparece ${lift.toFixed(1)} veces más entre los chicos con alerta que en el resto`,
        );
      }
      if (simultaneo) {
        motivos.push(
          `apareció en ${f.chicosQueLoVieron} chicos distintos en menos de ` +
            `${VENTANA_SIMULTANEIDAD_DIAS} días, que es la forma que tiene un mismo acosador ` +
            `de tocar a varios a la vez`,
        );
      }
      /* ⚠ Decía «no está catalogado en ningún lado», y era más de lo que el
         sistema puede afirmar: el catálogo es NUESTRO, tiene un puñado de
         entradas, y afuera quedan lugares perfectamente conocidos. Corregido el
         28/8 para que diga lo que de verdad se sabe. El motivo sigue valiendo
         igual —un lugar que no reconocemos, con lift alto, es un hallazgo— pero
         ahora se lee sin prometer una autoridad que no hay detrás. */
      if (raro) motivos.push("no lo reconoce el catálogo de lugares del sistema");

      return {
        dominio: f.dominio,
        nombre: nombreDeLugar(f.dominio),
        puerta: puertaDe(f.dominio),
        chicosQueLoVieron: f.chicosQueLoVieron,
        chicosConAlerta: f.chicosConAlerta,
        lift: Number(lift.toFixed(2)),
        simultaneo,
        fueraDelRadar: raro,
        homogeneidad: homo.valor,
        perfilDominante: homo.dominante,
        solidez,
        porQue: motivos.length > 0 ? motivos.join(" · ") : "sin nada que lo destaque",
      };
    })
    .filter((h) => h.lift >= LIFT_MINIMO || h.simultaneo || h.perfilDominante !== null)
    /* Primero lo que nadie tiene catalogado: un dominio conocido con lift alto
       es información; uno DESCONOCIDO con lift alto es un hallazgo. */
    .sort((a, b) => {
      if (a.fueraDelRadar !== b.fueraDelRadar) return a.fueraDelRadar ? -1 : 1;
      return b.lift - a.lift;
    });
}
