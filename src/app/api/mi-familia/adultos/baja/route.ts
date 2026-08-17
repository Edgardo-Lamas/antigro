import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  canalListo,
  repositorio,
  sugerenciasParaLaFamilia,
} from "@/lib/datos";
import { EDAD_PARA_ELEGIR_REFERENTE } from "@/lib/config";
import { transporteDe } from "@/lib/mensajeria";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DAR DE BAJA A UN ADULTO RESPONSABLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **No lleva ninguna traba, y lo marcó Edgardo el 16/8:** el referente se
 *  muda, fallece, pierde el teléfono, o el chico simplemente lo quiere cambiar.
 *  Ninguna de esas es una excepción rara: es la vida normal de una familia.
 *  Un sistema que dificulta el reemplazo termina con un referente que ya no
 *  existe, que es peor que no tener ninguno.
 *
 *  Por eso acá **no se niega ninguna baja.** Lo que se hace es decir qué quedó:
 *  vuelven las `sugerencias`, con el porqué de cada una.
 *
 *  🔴 **Y desde el 17/8 eso ya no es «te falta algo».** El mínimo de dos dejó de
 *  ser una exigencia — *"tampoco podemos exigir padres y referentes, siempre
 *  sugerimos"*. Una familia que queda con un solo adulto no está rota; le
 *  conviene sumar otro, y el sistema le explica para qué.
 *
 *  🔑 **Y si al referente lo había elegido el chico, el chico se entera.** Ese
 *  segundo adulto existe justamente porque el 43% de los chicos no habla de
 *  estos temas con sus padres. Una baja silenciosa convertiría a AntiGro en un
 *  sistema que trabaja *sobre* el chico en vez de *para* él — que es la línea
 *  que el producto entero se comprometió a no cruzar.
 */

export const dynamic = "force-dynamic";

const Pedido = z.object({
  adultoId: z.string().min(1),
  motivo: z.enum(["se_mudo", "fallecio", "perdio_el_telefono", "lo_cambio_el_chico", "otro"]),
});

export async function POST(req: Request) {
  const sesion = await auth();
  const usuario = sesion?.user as { rol?: string; familiaId?: string | null } | undefined;

  if (!sesion || usuario?.rol !== "adulto" || !usuario.familiaId) {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const parsed = Pedido.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "parametros_invalidos" }, { status: 400 });
  }
  const { adultoId, motivo } = parsed.data;

  /* 🔴 Acá había una traba —«nadie se da de baja a sí mismo»— y se sacó el
     17/8. Existía porque la cuenta colgaba de la persona: borrarse era quedarse
     sin acceso en el mismo movimiento. Desde que la clave es del HOGAR eso no
     puede pasar: dar de baja a un adulto no toca ninguna puerta.

     🔑 Y no se pone ninguna en su lugar. Es la regla de Edgardo: el referente
     se muda, fallece, pierde el teléfono o el chico lo quiere cambiar, y
     *"tiene que estar abierta esa posibilidad de cambio"*. Lo que el sistema
     hace no es frenar: es decir qué quedó, con el motivo escrito. */

  const repo = repositorio();
  const antes = await repo.familiaPorId(usuario.familiaId);
  if (!antes) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });

  const objetivo = antes.adultos.find((a) => a.id === adultoId);
  if (!objetivo) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });
  if (!objetivo.activo) {
    return NextResponse.json({ error: "ya_estaba_de_baja" }, { status: 409 });
  }

  const dadoDeBaja = await repo.darDeBajaAdulto(usuario.familiaId, adultoId, motivo);
  if (!dadoDeBaja) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });

  /* ── El aviso al chico ────────────────────────────────────────────────── */
  const chico = antes.chicos.find((c) => c.activo) ?? antes.chicos[0];
  let avisoAlChico: { intentado: boolean; entregado: boolean; motivo?: string } = {
    intentado: false,
    entregado: false,
  };

  if (objetivo.elegidoPorElChico && chico) {
    if (!canalListo(chico.canal)) {
      avisoAlChico = {
        intentado: false,
        entregado: false,
        motivo: "El chico todavía no conectó su canal.",
      };
    } else {
      /* ⚠ El texto no explica el motivo ni juzga a nadie. Dice qué cambió y
         que puede elegir de nuevo, que es lo único que le corresponde saber
         al sistema — el porqué se lo cuenta su familia, no un mensaje. */
      const texto =
        `Hola, ${chico.nombre}. Te aviso algo de AntiGro: ${objetivo.nombre} ya no es ` +
        "la persona de confianza que tenías anotada acá.\n\n" +
        "Como a esa persona la habías elegido vos, te lo digo a vos también. " +
        "Cuando quieras podés elegir a otra: no tiene que ser alguien de tu casa.";

      const transporte = await transporteDe(chico.canal.tipo);
      const resultado = await transporte.enviar({
        canal: chico.canal.tipo,
        destino: chico.canal.destino,
        texto,
      });

      avisoAlChico = {
        intentado: true,
        entregado: resultado.entregado,
        motivo: resultado.detalle ?? undefined,
      };

      // Queda registrado con fecha, igual que cualquier otra cosa que el
      // sistema le haya dicho a alguien.
      await repo.registrarRespuesta({
        chicoId: chico.id,
        fecha: new Date().toISOString(),
        clase: "orientacion_chico",
        canal: chico.canal.tipo,
        destino: chico.canal.destino,
        texto,
        senalesQueLaSostienen: [],
        entregado: resultado.entregado,
      });
    }
  }

  const despues = await repo.familiaPorId(usuario.familiaId);
  const activos = despues?.adultos.filter((a) => a.activo) ?? [];

  return NextResponse.json({
    ok: true,
    dadoDeBaja: {
      id: dadoDeBaja.id,
      nombre: dadoDeBaja.nombre,
      motivo: dadoDeBaja.bajaMotivo,
      rol: objetivo.rol,
      elegidoPorElChico: objetivo.elegidoPorElChico,
    },
    avisoAlChico,
    adultosActivos: activos.length,
    /* Sugerencias, no faltantes: lo que quedó se dice con su porqué, sin
       decirle a nadie que su familia está incompleta. */
    sugerencias: despues ? sugerenciasParaLaFamilia(despues, EDAD_PARA_ELEGIR_REFERENTE) : [],
  });
}
