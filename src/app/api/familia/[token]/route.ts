import { NextResponse } from "next/server";
import { baseDeDatos } from "@/lib/supabase";
import { obtenerFuente, type Escenario } from "@/lib/senales";

/**
 * Lo que ve un adulto responsable entrando con su enlace privado.
 *
 * 📌 Fase 0: devuelve las señales crudas de la ventana pedida, tal como las
 * entrega la fuente activa. La lectura —qué significa esto, si hay que decir
 * algo o no— es el motor, y llega en la fase 2.
 */

export const dynamic = "force-dynamic";

const DIAS = 21;
const ESCENARIOS_VALIDOS = ["normal", "cambio_leve", "persistente", "evasion"];

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const { token } = params;
  const url = new URL(req.url);
  const pedido = url.searchParams.get("escenario") ?? "normal";
  const escenario = (ESCENARIOS_VALIDOS.includes(pedido) ? pedido : "normal") as Escenario;

  /* ── Quién es esta familia ── */
  let nombre = "Familia de prueba";
  let demo = true;

  const db = baseDeDatos();
  if (db) {
    const { data: familia } = await db
      .from("familias")
      .select("nombre, activo")
      .eq("token", token)
      .single();

    if (!familia) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });
    if (!familia.activo) return NextResponse.json({ error: "inactivo" }, { status: 403 });

    nombre = familia.nombre;
    demo = false;
  }

  /* ── Las señales, por la interfaz única ── */
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - DIAS * 24 * 60 * 60 * 1000);

  const { fuente, simulada, motivo } = await obtenerFuente(escenario);
  const senales = await fuente.leer({
    chicoId: token,
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
  });

  return NextResponse.json({
    nombre,
    demo,
    ventana: { desde: desde.toISOString(), hasta: hasta.toISOString(), dias: DIAS },
    fuente: { id: fuente.id, nombre: fuente.nombre, simulada, motivo },
    escenario,
    senales,
    actualizado: new Date().toISOString(),
  });
}
