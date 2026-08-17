import { NextResponse } from "next/server";
import { z } from "zod";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { repositorio, EDAD_MAXIMA, EDAD_MINIMA } from "@/lib/datos";

/** Alta de familias: el chico con su edad y su género, y los adultos con su canal. */

function esAdmin(sesion: Session | null) {
  return (sesion?.user as { rol?: string })?.rol === "admin";
}

const CanalSchema = z.object({
  tipo: z.enum(["telegram", "correo", "whatsapp"]),
  destino: z.string().min(1).max(254),
});

const ChicoSchema = z.object({
  nombre: z.string().min(1).max(80),
  edad: z
    .number()
    .int()
    .min(EDAD_MINIMA, `La edad va de ${EDAD_MINIMA} a ${EDAD_MAXIMA} años.`)
    .max(EDAD_MAXIMA, `La edad va de ${EDAD_MINIMA} a ${EDAD_MAXIMA} años.`),
  genero: z.enum(["nena", "varon", "otro"]),
  canal: CanalSchema,
  /** 🔑 Del chico, no de la familia: el filtro va en su dispositivo. */
  nextdnsProfileId: z.string().max(50).optional(),
});

const AdultoSchema = z.object({
  nombre: z.string().min(1).max(80),
  vinculo: z.enum(["madre", "padre", "tia_tio", "hermano_a", "abuelo_a", "otro"]),
  /**
   * 🔴 Quién entra al panel. No se deduce del `vinculo`: una abuela puede ser
   * la tutora y un padre puede ser el referente que eligió el chico.
   */
  rol: z.enum(["progenitor", "referente"]),
  elegidoPorElChico: z.boolean(),
  canal: CanalSchema,
});

const AltaSchema = z.object({
  nombre: z.string().min(1).max(100),
  notas: z.string().max(500).optional(),
  chicos: z.array(ChicoSchema).min(1, "Hay que cargar al menos un chico."),
  /**
   * ─────────────────────────────────────────────────────────────────────────
   * 🔴 ACÁ SE EXIGÍAN DOS ADULTOS, Y SE SACÓ EL 17/8
   * ─────────────────────────────────────────────────────────────────────────
   *
   * La regla vieja pedía un mínimo de dos y que alguno tuviera la marca «lo
   * eligió el chico». Las dos se cayeron, por dos motivos distintos:
   *
   * 1. Un hogar con un solo progenitor **no está incompleto**: es otra forma
   *    de familia, y el alta no puede negarse a darla. *"Tampoco podemos
   *    exigir padres y referentes, siempre sugerimos."*
   * 2. A un chico de 8 el referente lo eligen los padres, así que esa marca va
   *    en `false` con todo derecho. Exigirla dejaba afuera exactamente a las
   *    familias más chicas.
   *
   * 🔑 Lo que sí hace el sistema es sugerir, con el porqué escrito. Ver
   * `sugerenciasParaLaFamilia`, y `ADULTOS_SUGERIDOS` en `tipos.ts`, que ahora
   * es un consejo y no una puerta.
   */
  adultos: z.array(AdultoSchema).min(1, "Hay que cargar al menos un adulto."),
});

const BajaSchema = z.object({ id: z.string(), activo: z.boolean() });

export async function GET() {
  if (!esAdmin(await auth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const repo = repositorio();
  return NextResponse.json({
    familias: await repo.listarFamilias(),
    demo: repo.clase === "memoria",
  });
}

export async function POST(req: Request) {
  if (!esAdmin(await auth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = AltaSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalle: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }

  const repo = repositorio();
  const alta = await repo.crearFamilia(parsed.data);

  return NextResponse.json({
    familia: alta.familia,
    chicos: alta.chicos.length,
    adultos: alta.adultos.length,
    demo: repo.clase === "memoria",

    /**
     * 🔴 **Este alta todavía no deja a la familia adentro, y hay que decirlo.**
     *
     * Hasta el 17/8 devolvía `enlace: /familia/<token>`, una pantalla que se
     * abría sin cuenta. Esa pantalla se borró —entregaba los códigos de
     * vinculación a cualquiera que tuviera el token—, y al sacarla quedó al
     * descubierto algo que el enlace tapaba: **el alta crea la familia, los
     * chicos y los adultos, pero no crea ninguna cuenta en `usuarios`.** Las de
     * Mariana y Carla se sembraron a mano.
     *
     * O sea que una familia dada de alta por acá hoy no puede entrar a
     * `/mi-familia`. No es un error de esta ruta: es la mitad que falta, y le
     * toca al alta desde el panel, que es lo próximo que se construye.
     */
    puedenEntrar: false,
    falta: "Los adultos todavía no tienen cuenta: el alta no crea usuarios.",
  });
}

export async function PATCH(req: Request) {
  if (!esAdmin(await auth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = BajaSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const repo = repositorio();
  await repo.cambiarEstado(parsed.data.id, parsed.data.activo);
  return NextResponse.json({ ok: true, demo: repo.clase === "memoria" });
}
