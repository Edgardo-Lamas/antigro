import { NextResponse } from "next/server";
import { z } from "zod";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { cambiarEstadoDelCentro, crearCentro } from "@/lib/centros/datos";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL ALTA DE UN CENTRO EDUCATIVO — sólo la administración (23/9)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 Un centro llega por una licencia acordada antes, así que no hay alta
 *  pública: lo crea la administración, con cuántas licencias tiene y la cuenta
 *  de su coordinador. El centro después reparte su enlace entre sus familias.
 *
 *  🔐 Cerrada con sesión de administración, igual que `/api/panel/familias`.
 */

export const dynamic = "force-dynamic";

function esAdmin(sesion: Session | null) {
  return (sesion?.user as { rol?: string })?.rol === "admin";
}

const CLAVE_MINIMA = 8;

const Alta = z.object({
  nombre: z.string().trim().min(2, "Falta el nombre del centro.").max(120),
  pais: z.enum(["ES", "AR"]),
  licencias: z.number().int().min(1, "Al menos una licencia.").max(5000),
  coordinador: z.string().trim().min(2, "Falta quién coordina.").max(100),
  email: z.string().email("Ese correo no parece válido.").max(254),
  clave: z.string().min(CLAVE_MINIMA, `La clave necesita al menos ${CLAVE_MINIMA} caracteres.`),
});

export async function POST(req: Request) {
  if (!esAdmin(await auth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = Alta.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const alta = await crearCentro(parsed.data);
  if (!alta.ok) {
    return NextResponse.json(
      {
        error:
          alta.motivo === "email_tomado"
            ? "Ese correo ya tiene una cuenta en el sistema."
            : "Sin base de datos no se puede crear un centro: su cuenta no sobreviviría a un reinicio.",
      },
      { status: alta.motivo === "email_tomado" ? 409 : 503 },
    );
  }

  return NextResponse.json({ ok: true, centro: { id: alta.centro.id, nombre: alta.centro.nombre } });
}

const Estado = z.object({ id: z.string().uuid(), activo: z.boolean() });

/** Pausa o reactiva un centro. Pausado, su cuenta no abre y su distintivo dice «no vigente». */
export async function PATCH(req: Request) {
  if (!esAdmin(await auth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const parsed = Estado.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  await cambiarEstadoDelCentro(parsed.data.id, parsed.data.activo);
  return NextResponse.json({ ok: true });
}
