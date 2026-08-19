import { NextResponse } from "next/server";
import { repositorio } from "@/lib/datos";
import { escalar } from "@/lib/mensajeria/avisar";
import { quienLoVio } from "@/lib/mensajeria/acuse";
import { obtenerFuente } from "@/lib/senales";
import { evaluar, juntarObservaciones, VENTANA_DIAS } from "@/lib/motor";

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
export const maxDuration = 60;

const DIA_MS = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const esperado = process.env.CRON_SECRET;
  if (!esperado) {
    return NextResponse.json({ error: "cron_sin_secreto" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${esperado}`) {
    return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
  }

  const repo = repositorio();
  const ahora = new Date();
  const desde = new Date(ahora.getTime() - VENTANA_DIAS * DIA_MS);
  const ventana = { desde: desde.toISOString(), hasta: ahora.toISOString() };

  /* 📌 Se listan y después se pide cada una completa: `listarFamilias()` trae
     la cabecera, y el motor necesita chicos y adultos. Con una familia sembrada
     no importa; el día que sean muchas, esto es lo primero que hay que mirar. */
  const cabeceras = await repo.listarFamilias();
  const revisadas: {
    familia: string;
    chico: string;
    escalo: boolean;
    /** El de `escalada.ts`, o `fuente_simulada` si el reloj se frenó antes. */
    motivo: string;
    aQuienes?: number;
  }[] = [];

  for (const cabecera of cabeceras) {
    if (!cabecera.activo) continue;

    const datos = await repo.familiaPorId(cabecera.id);
    if (!datos) continue;
    const { familia, chicos, adultos } = datos;

    const chico = chicos.find((c) => c.activo);
    if (!chico) continue;

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
      revisadas.push({
        familia: familia.nombre,
        chico: chico.nombre,
        escalo: false,
        motivo: "fuente_simulada",
      });
      continue;
    }

    const senales = await fuente.leer({
      chicoId: chico.id,
      desde: ventana.desde,
      hasta: ventana.hasta,
    });

    const respuestas = await repo.respuestasDe(chico.id, ventana.desde, ventana.hasta);
    const observaciones = await repo.observacionesDe(chico.id, ventana.desde, ventana.hasta);

    const lectura = evaluar({
      chico: { edad: chico.edad, genero: chico.genero },
      senales,
      hasta: ahora,
      observaciones: juntarObservaciones(observaciones),
      diasObservados: Math.max(
        1,
        Math.floor((ahora.getTime() - new Date(chico.creado).getTime()) / DIA_MS) + 1,
      ),
    });

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

    const { decision, emitidos } = await escalar({
      chico,
      adultos,
      lectura,
      quienLoVio: vio,
      yaSeEscalo,
      ahora,
    });

    revisadas.push({
      familia: familia.nombre,
      chico: chico.nombre,
      escalo: decision.escala,
      motivo: decision.motivo,
      ...(decision.escala ? { aQuienes: emitidos.length } : {}),
    });
  }

  /* 📌 Devuelve el detalle de cada familia, y no un «ok». Un reloj que corre en
     silencio y no cuenta qué decidió es imposible de auditar después: la
     escalada que no salió y la que no correspondía se ven igual. */
  return NextResponse.json({
    ok: true,
    corrida: ahora.toISOString(),
    revisadas,
    escaladas: revisadas.filter((r) => r.escalo).length,
  });
}
