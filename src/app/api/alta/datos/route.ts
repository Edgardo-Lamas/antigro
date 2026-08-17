import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { repositorio, EDAD_MAXIMA, EDAD_MINIMA } from "@/lib/datos";
import { sugerenciasParaLaFamilia } from "@/lib/datos/tipos";
import { EDAD_PARA_ELEGIR_REFERENTE } from "@/lib/config";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA CARGA DE DATOS — segundo paso del recorrido de alta (17/8)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Ya hay puerta y ya hay sesión: acá se carga quién vive en la casa.
 *
 * 🔴 **La familia sale de la SESIÓN, nunca del cuerpo del pedido.** Es la misma
 * regla que sostiene `/api/mi-familia`: si el identificador viniera del
 * navegador, cambiar un número alcanzaría para escribirle los datos a la familia
 * de otro chico.
 *
 * 🔴 **Nada se exige más allá de lo que impide trabajar.** Es la corrección del
 * 17/8 y vale igual acá: *"tampoco podemos exigir padres y referentes, siempre
 * sugerimos"*. Lo único duro es que haya un chico —sin eso no hay nada que
 * mirar—; el resto sale como sugerencia, con su porqué, y la familia decide.
 */

export const dynamic = "force-dynamic";

const CanalSchema = z.object({
  tipo: z.enum(["telegram", "correo", "whatsapp"]),
  /**
   * 📌 Puede venir vacío y está bien: en Telegram el destino no se carga a mano,
   * aparece cuando la persona aprieta «Iniciar». Ver `Canal` en `tipos.ts`.
   */
  destino: z.string().max(254).default(""),
});

const ChicoSchema = z.object({
  nombre: z.string().min(1, "Falta el nombre del chico.").max(80),
  edad: z
    .number()
    .int()
    .min(EDAD_MINIMA, `La edad va de ${EDAD_MINIMA} a ${EDAD_MAXIMA} años.`)
    .max(EDAD_MAXIMA, `La edad va de ${EDAD_MINIMA} a ${EDAD_MAXIMA} años.`),
  genero: z.enum(["nena", "varon", "otro"]),
  /** 🔑 Corre la hora de la madrugada, igual que la edad. Ver `pesos.ts`. */
  turnoEscolar: z.enum(["manana", "tarde", "doble", "noche", "no_va"]).optional(),
  canal: CanalSchema,
  nextdnsProfileId: z.string().max(50).optional(),
});

const AdultoSchema = z.object({
  nombre: z.string().min(1, "Falta el nombre de un adulto.").max(80),
  vinculo: z.enum(["madre", "padre", "tia_tio", "hermano_a", "abuelo_a", "otro"]),
  /** 🔴 Qué puede ver. No se deduce del vínculo: ver `RolDeAdulto`. */
  rol: z.enum(["progenitor", "referente"]),
  elegidoPorElChico: z.boolean().default(false),
  canal: CanalSchema,
});

const Cuerpo = z.object({
  nombre: z.string().max(100).optional(),
  chicos: z.array(ChicoSchema).min(1, "Hay que cargar al menos un chico."),
  /**
   * 📌 Puede venir vacío. Un hogar sin ningún adulto cargado es raro, pero la
   * regla del 17/8 es que nada se exige: el sistema lo sugiere con el porqué y
   * la familia decide. Lo único que impide trabajar es no tener chico.
   */
  adultos: z.array(AdultoSchema).default([]),
});

export async function POST(req: Request) {
  const sesion = await auth();
  const usuario = sesion?.user as { rol?: string; familiaId?: string } | undefined;
  if (!usuario?.familiaId || usuario.rol !== "adulto") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = Cuerpo.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const repo = repositorio();
  const familia = await repo.cargarDatosDeLaFamilia(usuario.familiaId, parsed.data);

  /**
   * 🔑 **Las sugerencias vuelven con el alta, no después.** El momento en que
   * alguien puede sumar un adulto de confianza es mientras está cargando la
   * familia — no tres pantallas más adelante, cuando ya cerró el trámite.
   */
  return NextResponse.json({
    ok: true,
    chicos: familia.chicos.length,
    adultos: familia.adultos.filter((a) => a.activo).length,
    sugerencias: sugerenciasParaLaFamilia(familia, EDAD_PARA_ELEGIR_REFERENTE),
    /**
     * 📌 Qué hay que instalar, por chico. La instalación ya estaba construida y
     * vivía sólo en el panel; el recorrido es donde de verdad hace falta.
     */
    chicosParaInstalar: familia.chicos.map((c) => ({
      nombre: c.nombre,
      tienePerfil: Boolean(c.nextdnsProfileId),
    })),
  });
}
