import { NextResponse } from "next/server";
import { z } from "zod";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { repositorio } from "@/lib/datos";
import { diasDeObservacion, evaluar, VENTANA_DIAS } from "@/lib/motor";
import { FuenteSimulador, type Escenario } from "@/lib/senales";
import { redactarLecturaParaAdultos, redactarMensajeAlChico } from "@/lib/ia";
import { avisar, estadoDeLosCanales } from "@/lib/mensajeria";

/**
 * El sistema entero, de punta a punta:
 * señales → motor → IA → control → los dos adultos y el chico.
 *
 * Es POST porque manda mensajes de verdad cuando hay un canal configurado.
 * Sin canal configurado sale todo en modo ensayo y no le llega nada a nadie.
 *
 * 🔐 **Sólo con sesión de administración, desde el 17/8.** Estuvo abierto hasta
 * esa fecha y era la peor combinación del sistema: cualquiera con la dirección
 * disparaba dos llamadas al modelo y, con el token de una familia, mensajes de
 * verdad a los teléfonos de esa casa.
 *
 * ⚠ Y algo que no se arregla con esto: **el token de una familia es una
 * credencial.** Si aparece en una captura, en un video o en una URL compartida,
 * quien lo tenga puede pedir avisos para esa familia. No se filma.
 *
 * 🔑 No se borró, a diferencia de `/api/mensajes`: acá vive la única llamada a
 * `avisar()`, que es la salida real del sistema y de la que va a colgar la
 * escalada. Cerrarlo conserva el camino entero andando y verificable.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 90;

const DIA_MS = 24 * 60 * 60 * 1000;

function esAdmin(sesion: Session | null) {
  return (sesion?.user as { rol?: string })?.rol === "admin";
}

const Cuerpo = z.object({
  token: z.string().default("demo"),
  escenario: z.enum(["normal", "cambio_leve", "persistente", "evasion"]).default("persistente"),
  dia: z.coerce.number().int().min(0).max(VENTANA_DIAS - 1).default(VENTANA_DIAS - 1),
});

export async function POST(req: Request) {
  if (!esAdmin(await auth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = Cuerpo.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalle: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }

  const { token, escenario, dia } = parsed.data;

  const repo = repositorio();
  const datos = await repo.familiaPorToken(token);
  if (!datos) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });
  if (!datos.familia.activo) return NextResponse.json({ error: "inactivo" }, { status: 403 });

  const chico = datos.chicos.find((c) => c.activo) ?? datos.chicos[0];
  if (!chico) return NextResponse.json({ error: "sin_chico_cargado" }, { status: 409 });

  /* ── El reloj: el comienzo queda fijo, sólo se corre el final ── */
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);
  const inicio = new Date(fin.getTime() - (VENTANA_DIAS - 1) * DIA_MS);
  inicio.setHours(0, 0, 0, 0);
  const ahora = new Date(inicio.getTime() + dia * DIA_MS);
  ahora.setHours(23, 59, 59, 999);

  const senales = await new FuenteSimulador(escenario as Escenario).leer({
    chicoId: chico.id,
    desde: inicio.toISOString(),
    hasta: ahora.toISOString(),
  });
  await repo.registrarSenales(senales);

  // 🔑 Hace cuántos días miramos a este chico sale del ALTA, no de las señales.
  const lectura = evaluar({
    chico,
    senales,
    hasta: ahora,
    diasObservados: diasDeObservacion(chico.creado, ahora),
  });

  /* ── La IA escribe sólo si el motor decidió que hay algo que decir ── */
  const [paraLosAdultos, paraElChico] = await Promise.all([
    redactarLecturaParaAdultos({ nombreDelChico: chico.nombre, edad: chico.edad, lectura }),
    redactarMensajeAlChico({
      nombre: chico.nombre,
      edad: chico.edad,
      genero: chico.genero,
      estado: lectura.estado,
    }),
  ]);

  const emitidos = await avisar({
    familia: datos.familia,
    chico,
    adultos: datos.adultos,
    lectura,
    textos: {
      paraLosAdultos: paraLosAdultos?.texto ?? "",
      paraElChico: paraElChico?.texto ?? null,
    },
    ahora,
  });

  return NextResponse.json({
    escenario,
    dia: dia + 1,
    de: VENTANA_DIAS,
    chico: { nombre: chico.nombre, edad: chico.edad },
    estado: lectura.estado,
    silencio: lectura.estado === "en_calma",
    redaccion: {
      paraLosAdultos: paraLosAdultos && {
        origen: paraLosAdultos.origen,
        motivos: paraLosAdultos.motivos,
      },
      paraElChico: paraElChico && {
        origen: paraElChico.origen,
        motivos: paraElChico.motivos,
      },
    },
    canales: await estadoDeLosCanales(),
    avisos: emitidos,
  });
}
