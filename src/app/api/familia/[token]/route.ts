import { NextResponse } from "next/server";
import { faltantesDeAlta, repositorio } from "@/lib/datos";
import { obtenerFuente, type Escenario } from "@/lib/senales";

/**
 * Lo que ve un adulto responsable entrando con su enlace privado.
 *
 * 📌 Devuelve las señales de la ventana pedida y quién es quién en la familia.
 * La lectura —qué significa esto, si hay que decir algo o no— es el motor, y
 * llega en la fase 2.
 */

export const dynamic = "force-dynamic";

const DIAS = 21;
const ESCENARIOS_VALIDOS = ["normal", "cambio_leve", "persistente", "evasion"];

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const url = new URL(req.url);
  const pedido = url.searchParams.get("escenario") ?? "normal";
  const escenario = (ESCENARIOS_VALIDOS.includes(pedido) ? pedido : "normal") as Escenario;

  const repo = repositorio();
  const datos = await repo.familiaPorToken(params.token);

  if (!datos) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });
  if (!datos.familia.activo) return NextResponse.json({ error: "inactivo" }, { status: 403 });

  const chico = datos.chicos.find((c) => c.activo) ?? datos.chicos[0];

  /* ── Las señales, por la interfaz única ── */
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - DIAS * 24 * 60 * 60 * 1000);
  const ventana = { desde: desde.toISOString(), hasta: hasta.toISOString(), dias: DIAS };

  const { fuente, simulada, motivo } = await obtenerFuente(escenario);
  const senales = chico
    ? await fuente.leer({ chicoId: chico.id, desde: ventana.desde, hasta: ventana.hasta })
    : [];

  // Queda registrado con fecha: sin eso no se puede medir persistencia.
  if (senales.length > 0) await repo.registrarSenales(senales);

  return NextResponse.json({
    familia: {
      nombre: datos.familia.nombre,
      faltantes: faltantesDeAlta(datos),
    },
    chico: chico
      ? { id: chico.id, nombre: chico.nombre, edad: chico.edad, genero: chico.genero }
      : null,
    adultos: datos.adultos.map((a) => ({
      nombre: a.nombre,
      vinculo: a.vinculo,
      elegidoPorElChico: a.elegidoPorElChico,
      canal: a.canal.tipo,
    })),
    almacenamiento: repo.clase,
    ventana,
    fuente: { id: fuente.id, nombre: fuente.nombre, simulada, motivo },
    escenario,
    senales,
    actualizado: new Date().toISOString(),
  });
}
