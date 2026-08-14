import { NextResponse } from "next/server";
import { z } from "zod";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { baseDeDatos, generarToken } from "@/lib/supabase";

/** Alta y baja de familias. El chico y los adultos responsables entran en la fase 1. */

function esAdmin(sesion: Session | null) {
  return (sesion?.user as { rol?: string })?.rol === "admin";
}

const AltaSchema = z.object({
  nombre: z.string().min(1).max(100),
  nextdns_profile_id: z.string().max(50).optional(),
  notas: z.string().max(500).optional(),
});

const BajaSchema = z.object({
  id: z.string(),
  activo: z.boolean(),
});

const FAMILIAS_DEMO = [
  { id: "demo-1", nombre: "Familia de prueba", token: "demo", activo: true, notas: "", created_at: new Date().toISOString() },
];

export async function GET() {
  if (!esAdmin(await auth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = baseDeDatos();
  if (!db) return NextResponse.json({ familias: FAMILIAS_DEMO, demo: true });

  const { data } = await db.from("familias").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ familias: data ?? [], demo: false });
}

export async function POST(req: Request) {
  if (!esAdmin(await auth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = AltaSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const token = generarToken();
  const db = baseDeDatos();
  if (!db) return NextResponse.json({ familia: { ...parsed.data, token }, demo: true });

  const { data, error } = await db
    .from("familias")
    .insert({ ...parsed.data, token })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ familia: data, demo: false });
}

export async function PATCH(req: Request) {
  if (!esAdmin(await auth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = BajaSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const db = baseDeDatos();
  if (!db) return NextResponse.json({ ok: true, demo: true });

  const { id, activo } = parsed.data;
  await db.from("familias").update({ activo }).eq("id", id);
  return NextResponse.json({ ok: true, demo: false });
}
