import { NextResponse } from "next/server";
import { repositorio } from "@/lib/datos";
import { avisar, avisarDeLaCeguera, enviarParte, escalar } from "@/lib/mensajeria/avisar";
import { redactarLecturaParaAdultos, redactarMensajeAlChico } from "@/lib/ia";
import { quienLoVio } from "@/lib/mensajeria/acuse";
import { obtenerFuente } from "@/lib/senales";
import { refrescarLaLista } from "@/lib/senales/refresco";
import { revisarCentros } from "@/lib/centros/revisar";
import { tomarTurno } from "@/lib/limite";
import {
  DIAS_ENTRE_PARTES,
  armarParte,
  evaluar,
  juntarObservaciones,
  mirarSiEstaCiego,
  VENTANA_DIAS,
} from "@/lib/motor";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL RELOJ — lo único del sistema que se despierta solo
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Hasta el 19/8 AntiGro NUNCA se despertaba solo.** Todo pasaba cuando
 *  alguien abría una página o cuando Telegram nos golpeaba. Sin esto, la
 *  escalada era una función que nadie iba a llamar: el silencio de un adulto no
 *  genera ningún pedido, y justamente por eso hay que ir a mirarlo.
 *
 *  ⚠ **QUÉ HACE Y QUÉ NO, porque la diferencia es de plata y hay que tenerla
 *  clara.** Este reloj **sólo escala avisos que ya salieron**. NO manda el
 *  primer aviso: ése necesita que la IA escriba dos textos —son llamadas a
 *  Opus 5— y hacerlo por cada familia en cada corrida es exactamente el gasto
 *  que encontró la auditoría del 17/8. El texto de la escalada, en cambio, es
 *  determinista: cuesta cero. Ver `escalada.ts`.
 *  📌 **La consecuencia, dicha de frente: el PRIMER aviso sigue necesitando que
 *  alguien llame a `/api/alertas`.** Que el sistema alerte solo es la decisión
 *  que sigue, y es de producto y de costo, no de código.
 *
 *  🔐 **Cerrado, y falla cerrado.** Vercel manda `Authorization: Bearer
 *  <CRON_SECRET>`. **Sin `CRON_SECRET` en el entorno no corre nadie** — es la
 *  lección de la auditoría aplicada de entrada: una ruta que hace cosas y se
 *  abre sola cuando falta una variable es una ruta abierta.
 */

export const dynamic = "force-dynamic";
/* 🔴 300 y no 60 — auditoría del 24/9. El coordinador espera a que terminen las
   revisiones de todas las familias, y cada una puede tardar lo que tardan dos
   textos del modelo. Ver «UNA FAMILIA POR EJECUCIÓN» abajo. */
export const maxDuration = 300;

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * 🔑 Cuántas familias se revisan a la vez. Cada una es una ejecución aparte con
 * su propio reloj; el tope existe para no abrir cientos de conexiones juntas.
 */
const FAMILIAS_A_LA_VEZ = 10;

/** Lo que el reloj cuenta de cada familia. */
interface Revisada {
  familia: string;
  chico: string;
  escalo: boolean;
  /** El de `escalada.ts`, o `fuente_simulada` si el reloj se frenó antes. */
  motivo: string;
  aQuienes?: number;
}

/* ─────────────────────────────────────────────────────────────────────────────
   🔴 UNA FAMILIA POR EJECUCIÓN — auditoría del 24/9
   ─────────────────────────────────────────────────────────────────────────────

   **Hasta ese día el reloj recorría las familias de a una, en una sola
   ejecución de 60 segundos.** Una familia que tiene que recibir su primer aviso
   pide dos textos al modelo, y cada uno tarda entre 10 y 18 segundos. Con dos o
   tres familias en esa situación la misma hora, la ejecución se cortaba — y como
   el orden era siempre el mismo, **las familias del final no se revisaban
   nunca, y los centros, que iban últimos, tampoco.** Sin error a la vista: esas
   familias simplemente no recibían el aviso.

   ➡ Ahora hay un **coordinador** —el pedido de siempre, sin parámetros— que
   lista las familias activas y le pide a esta misma ruta que revise **cada una
   en su propia ejecución** (`?familia=<id>`), de a `FAMILIAS_A_LA_VEZ`. Una
   familia lenta ya no le come el tiempo a las demás, y una que falla no tapa al
   resto: queda contada como `no_se_pudo_revisar`.

   🔐 Cada pedido interno lleva el mismo `CRON_SECRET`: la ruta sigue cerrada
   para todo el que no lo tenga. */

export async function GET(req: Request) {
  const esperado = process.env.CRON_SECRET;
  if (!esperado) {
    return NextResponse.json({ error: "cron_sin_secreto" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${esperado}`) {
    return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
  }

  const ahora = new Date();
  const url = new URL(req.url);
  const unaFamilia = url.searchParams.get("familia");

  /* ── Una sola familia: lo que pide el coordinador ─────────────────────── */
  if (unaFamilia) {
    /* 🔑 El cron de Vercel y el de GitHub pueden coincidir en la misma hora.
       Sin este cerrojo, dos corridas podían ver «todavía no se avisó» a la vez y
       mandar el mismo aviso dos veces. Cinco minutos alcanzan para que la
       primera termine; la segunda cuenta que se la salteó. */
    const cerrojo = await tomarTurno(`reloj:${unaFamilia}`, 5 * 60, 1);
    if (!cerrojo.permitido) {
      return NextResponse.json({
        revisada: { familia: unaFamilia, chico: "", escalo: false, motivo: "otra_corrida_en_curso" },
      });
    }
    const revisada = await revisarUnaFamilia(unaFamilia, ahora);
    return NextResponse.json({ revisada });
  }

  /* ── El coordinador ───────────────────────────────────────────────────── */
  const cabeceras = (await repositorio().listarFamilias()).filter((c) => c.activo);

  const revisarPorSeparado = async (id: string): Promise<Revisada | null> => {
    try {
      const res = await fetch(`${url.origin}/api/cron/revisar?familia=${encodeURIComponent(id)}`, {
        headers: { authorization: `Bearer ${esperado}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return ((await res.json()) as { revisada: Revisada | null }).revisada;
    } catch (e) {
      /* 🔴 Se cuenta, no se traga: una familia que no se pudo revisar es una
         familia que esta hora no tuvo quién la mire. */
      console.error(`[reloj] ✗ no se pudo revisar la familia ${id}:`, e);
      return { familia: id, chico: "", escalo: false, motivo: "no_se_pudo_revisar" };
    }
  };

  const familias = async () => {
    const resultados: (Revisada | null)[] = [];
    for (let i = 0; i < cabeceras.length; i += FAMILIAS_A_LA_VEZ) {
      const tanda = cabeceras.slice(i, i + FAMILIAS_A_LA_VEZ);
      resultados.push(...(await Promise.all(tanda.map((c) => revisarPorSeparado(c.id)))));
    }
    return resultados.filter((r): r is Revisada => r !== null);
  };

  /* 🔑 Los centros ya no van al final, esperando a que terminen las familias:
     corren al mismo tiempo. Lo que se le avisa a un centro es un agregado de sus
     alumnos, nunca lo de una casa. Ver `centros/revisar.ts`, que tiene el mismo
     freno con señales simuladas.
     🔑 Y de paso, que la lista de categorías no envejezca en un mes tranquilo.
     Viene apagado: sin `DEPLOY_HOOK_UT1` no hace nada y lo dice. Ver
     `senales/refresco.ts`. */
  const [revisadas, listaDeCategorias, centros] = await Promise.all([
    familias(),
    refrescarLaLista(),
    revisarCentros(ahora),
  ]);

  /* 📌 Devuelve el detalle de cada familia, y no un «ok». Un reloj que corre en
     silencio y no cuenta qué decidió es imposible de auditar después: la
     escalada que no salió y la que no correspondía se ven igual. */
  return NextResponse.json({
    ok: true,
    corrida: ahora.toISOString(),
    revisadas,
    escaladas: revisadas.filter((r) => r.escalo).length,
    noRevisadas: revisadas.filter((r) => r.motivo === "no_se_pudo_revisar").length,
    listaDeCategorias,
    centros,
  });
}

/**
 * Lo que el reloj hace con UNA familia: ¿está ciego? → ¿hay que avisar? →
 * ¿hay que insistir? → ¿toca el parte? Devuelve `null` si la familia no tiene
 * nada que revisar (no existe o no tiene chico).
 */
async function revisarUnaFamilia(familiaId: string, ahora: Date): Promise<Revisada | null> {
  const repo = repositorio();
  const desde = new Date(ahora.getTime() - VENTANA_DIAS * DIA_MS);
  const ventana = { desde: desde.toISOString(), hasta: ahora.toISOString() };

  const datos = await repo.familiaPorId(familiaId);
  if (!datos || !datos.familia.activo) return null;
  const { familia, chicos, adultos } = datos;

  const chico = chicos.find((c) => c.activo);
  if (!chico) return null;

  /* ── 🔴 EL FRENO MÁS IMPORTANTE DE ESTA RUTA ─────────────────────────
     **Si las señales son SIMULADAS, el reloj no escala.** Y no es una
     precaución de más: sin NextDNS configurado, `obtenerFuente` cae al
     simulador y devuelve datos inventados. Escalar sobre eso sería mandarle
     un mensaje de verdad al teléfono de un padre de verdad **por una
     actividad que nunca ocurrió**.

     🔑 La consola de la home hace lo contrario y está bien: ahí lo simulado
     se muestra en pantalla y nadie recibe nada. La diferencia es que este
     reloj ENTREGA, y lo que se entrega no puede ser inventado. */
  const { fuente, simulada } = await obtenerFuente("normal");

  if (simulada) {
    return {
      familia: familia.nombre,
      chico: chico.nombre,
      escalo: false,
      motivo: "fuente_simulada",
    };
  }

  const senales = await fuente.leer({
    chicoId: chico.id,
    desde: ventana.desde,
    hasta: ventana.hasta,
  });

  const respuestas = await repo.respuestasDe(chico.id, ventana.desde, ventana.hasta);
  const observaciones = await repo.observacionesDe(chico.id, ventana.desde, ventana.hasta);

  /* 🔑 Sale del ALTA, nunca de las señales: para una fuente, «no hubo
     desviaciones» y «todavía no lo miramos» son indistinguibles. */
  const diasDesdeElAlta = Math.max(
    1,
    Math.floor((ahora.getTime() - new Date(chico.creado).getTime()) / DIA_MS) + 1,
  );

  const lectura = evaluar({
    chico: { edad: chico.edad, genero: chico.genero },
    senales,
    hasta: ahora,
    observaciones: juntarObservaciones(observaciones),
    diasObservados: diasDesdeElAlta,
  });

  /* ══ 1 · ¿EL SISTEMA DEJÓ DE VER? ═══════════════════════════════════
     🔴 Va primero porque es el único fallo que **se disfraza de buena
     noticia**: sin señales el motor lee calma, así que si esto no se mira a
     propósito, nadie se entera nunca. Y mientras dure, todo lo demás que
     calcule el sistema no significa nada. */
  const ceguera = mirarSiEstaCiego(senales, ahora);

  if (ceguera.ciego) {
    /* Una sola vez por episodio: se avisa mientras no se haya avisado desde
       que se dejó de ver. Repetirlo cada día lo convertiría en ruido. */
    const yaAviso = respuestas.some(
      (r) => r.clase === "aviso_de_ceguera" && r.fecha >= (ceguera.ultimoDiaConSenal ?? ""),
    );

    if (!yaAviso) {
      const emitidos = await avisarDeLaCeguera({ chico, adultos, ceguera, ahora });
      return {
        familia: familia.nombre,
        chico: chico.nombre,
        escalo: false,
        motivo: "ciego_avisado",
        aQuienes: emitidos.length,
      };
    } else {
      return { familia: familia.nombre, chico: chico.nombre, escalo: false, motivo: "ciego" };
    }

    /* ⚠ Y se corta acá. Con el sistema ciego no se alerta, no se escala y no
       se manda parte: todo eso se apoyaría en datos que no llegaron. */
  }

  const vio = quienLoVio(respuestas, adultos);

  /* 🔑 ¿Ya se insistió por ESTA tanda? Se deduce del registro fechado, igual
     que `yaSeAviso()`: si el registro es la fuente de verdad para decidir,
     también lo es para no repetir. Una escalada posterior al último aviso es
     la escalada de ese aviso. */
  const ultimoAviso = vio.ultimaTanda.reduce<string | null>(
    (max, a) => (max === null || a.fecha > max ? a.fecha : max),
    null,
  );
  const yaSeEscalo =
    ultimoAviso !== null &&
    respuestas.some((r) => r.clase === "escalada_adultos" && r.fecha >= ultimoAviso);

  /* ══ 2 · EL PRIMER AVISO, QUE HASTA HOY NO SALÍA SOLO ═══════════════
     🔴 Hasta el 19/8 `avisar()` se llamaba desde UN solo lugar: una ruta de
     administración. O sea que el motor podía detectar el patrón perfectamente
     y **no se lo contaba a nadie hasta que alguien entrara a pedirlo**. Al
     lado de la escalada quedaba absurdo: el sistema sabía insistir sobre un
     aviso que no era capaz de mandar por su cuenta.

     🔑 **Y se manda UNA VEZ POR EPISODIO, no una por día.** El estado se
     sostiene varios días seguidos; avisar en cada corrida sería la misma
     alerta todos los días, que es como un sistema se apaga solo. El episodio
     empezó hace `diasSostenidos` días: si no hubo aviso desde entonces, se
     avisa. Eso es también lo que hace que el gasto sea chico — las dos
     llamadas al modelo se pagan cuando hay algo nuevo que decir, no siempre. */
  if (lectura.estado === "patron_sostenido") {
    const empezo = new Date(
      ahora.getTime() - Math.max(1, lectura.diasSostenidos) * DIA_MS,
    ).toISOString();
    const yaAviso = respuestas.some((r) => r.clase === "alerta_adultos" && r.fecha >= empezo);

    if (!yaAviso) {
      const [paraLosAdultos, paraElChico] = await Promise.all([
        redactarLecturaParaAdultos({
          nombreDelChico: chico.nombre,
          edad: chico.edad,
          lectura,
          pais: familia.pais,
        }),
        redactarMensajeAlChico({
          nombre: chico.nombre,
          edad: chico.edad,
          genero: chico.genero,
          estado: lectura.estado,
          pais: familia.pais,
        }),
      ]);

      /* 🔴 Si la IA no pudo escribir, NO se manda nada. `redactar` ya cae al
         respaldo determinista cuando el modelo falla o el control frena, así
         que un `null` acá significa que ni siquiera eso salió — y un aviso
         vacío es peor que ninguno: gasta la atención sin decir nada. */
      if (!paraLosAdultos) {
        return {
          familia: familia.nombre,
          chico: chico.nombre,
          escalo: false,
          motivo: "no_se_pudo_redactar",
        };
      }

      const emitidos = await avisar({
        familia,
        chico,
        adultos,
        lectura,
        textos: { paraLosAdultos: paraLosAdultos.texto, paraElChico: paraElChico?.texto ?? null },
        ahora,
      });

      return {
        familia: familia.nombre,
        chico: chico.nombre,
        escalo: false,
        motivo: "aviso_mandado",
        aQuienes: emitidos.filter((e) => e.resultado.entregado).length,
      };
    }
  }

  const { decision, emitidos } = await escalar({
    chico,
    adultos,
    lectura,
    quienLoVio: vio,
    yaSeEscalo,
    ahora,
    pais: familia.pais,
  });

  if (decision.escala) {
    return {
      familia: familia.nombre,
      chico: chico.nombre,
      escalo: true,
      motivo: decision.motivo,
      aQuienes: emitidos.length,
    };
  }

  /* ══ 3 · EL PARTE ════════════════════════════════════════════════════
     **Lo pidió Edgardo:** *"si no da señales de nada los usuarios pueden
     pensar «¿esta porquería está funcionando?»"*. Sale una vez por mes,
     **haya o no novedades** — de ahí que sea un parte y no un reporte.
     🔑 Va último a propósito: si hubo aviso, escalada o ceguera, el sistema
     ya habló y el parte sería ruido encima de una conversación abierta. */
  const ultimoParte = respuestas
    .filter((r) => r.clase === "parte_periodico")
    .reduce<string | null>((max, r) => (max === null || r.fecha > max ? r.fecha : max), null);

  const tocaParte =
    ultimoParte === null
      ? diasDesdeElAlta >= DIAS_ENTRE_PARTES
      : ahora.getTime() - new Date(ultimoParte).getTime() >= DIAS_ENTRE_PARTES * DIA_MS;

  if (tocaParte) {
    const parte = armarParte({
      senales,
      diasMirados: Math.min(diasDesdeElAlta, DIAS_ENTRE_PARTES),
      rachaMasLarga: lectura.diasSostenidos,
      huboAviso: respuestas.some((r) => r.clase === "alerta_adultos"),
    });
    const emitidosParte = await enviarParte({ chico, adultos, parte, ahora });

    return {
      familia: familia.nombre,
      chico: chico.nombre,
      escalo: false,
      motivo: "parte_mandado",
      aQuienes: emitidosParte.length,
    };
  }

  return {
    familia: familia.nombre,
    chico: chico.nombre,
    escalo: false,
    motivo: decision.motivo,
  };
}
