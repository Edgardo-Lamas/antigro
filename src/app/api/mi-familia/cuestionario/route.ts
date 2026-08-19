import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { repositorio } from "@/lib/datos";
import { tomarTurno } from "@/lib/limite";
import { INDICADORES, VALOR_MAXIMO, VENTANA_DIAS } from "@/lib/motor";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL CUESTIONARIO DE LOS ADULTOS — la segunda entrada, por fin con puerta
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Las preguntas existían desde el 14/8 y el motor las consumía, pero **no
 *  había ningún lugar donde contestarlas**: el panel decía «nadie contestó el
 *  cuestionario todavía» y eso era un callejón sin salida. Esto es la salida.
 *
 *  🔑 **Para qué está, y lo definió Edgardo el 18/8:** *"conocer los patrones
 *  de conducta del chico, que es de donde nos apoyamos principalmente"*. No es
 *  un test de riesgo sobre una persona, y por eso **acá no vuelve ningún
 *  puntaje**. Devolver un número sobre un chico es lo que la regla 1 prohíbe
 *  decir y lo que la Ley 25.326 art. 7 inc. 3 prohíbe registrar.
 *
 *  🔴 **La firma se guarda partida en dos, y las dos mitades no valen igual:**
 *  `hogar` sale de la SESIÓN y es un hecho comprobado; `adultoId` sale del
 *  formulario y es lo que esa persona declara. Con una credencial por casa el
 *  sistema no puede saber cuál de los dos padres está delante de la pantalla, y
 *  no lo inventa. Desde el 18/8 **la firma se muestra en el panel**, así que la
 *  distinción tiene que sobrevivir hasta la pantalla.
 *
 *  🚫 **El referente no contesta y no es una limitación técnica.** Decidido por
 *  Edgardo el 18/8: el referente no entra nunca al panel, porque si ve el
 *  informe de los padres puede devolvérselo al chico sin querer y ahí se pierde
 *  lo único que lo hace útil. Ver «EL REFERENTE NO ENTRA» en el `CLAUDE.md`.
 */

export const dynamic = "force-dynamic";

const DIA_MS = 24 * 60 * 60 * 1000;

/** Diez vueltas por hora y por casa. Contestar de nuevo es normal; cien veces no. */
const VENTANA_SEG = 60 * 60;
const TOPE = 10;

const IDS_VALIDOS = new Set(INDICADORES.map((i) => i.id));

/**
 * 🔑 **Las respuestas van de a una y ninguna es obligatoria.** El motor ya está
 * del lado correcto —`evaluarObservaciones` saltea lo que no vino y la ausencia
 * la trata como *no sabemos*, nunca como *está todo bien*—, así que la ruta no
 * tiene por qué exigir las nueve. Obligarlas empujaría al que no sabe a marcar
 * «no / nunca», y eso es una mentira entrando al motor.
 */
const Pedido = z.object({
  adultoId: z.string().min(1),
  respuestas: z.record(z.string(), z.number().int().min(0).max(VALOR_MAXIMO)),
});

type Sesion = { rol?: string; familiaId?: string | null; hogar?: string | null };

/** Quién puede firmar: los adultos que entran al panel, y sólo los activos. */
function quienesPuedenFirmar(adultos: { id: string; nombre: string; vinculo: string; rol: string; activo: boolean }[]) {
  return adultos
    .filter((a) => a.activo && a.rol === "progenitor")
    .map((a) => ({ id: a.id, nombre: a.nombre, vinculo: a.vinculo }));
}

/* ── Qué hay antes de contestar ─────────────────────────────────────────── */

export async function GET() {
  const sesion = await auth();
  const usuario = sesion?.user as Sesion | undefined;

  if (!sesion || usuario?.rol !== "adulto" || !usuario.familiaId) {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const repo = repositorio();
  const datos = await repo.familiaPorId(usuario.familiaId);
  if (!datos) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });
  if (!datos.familia.activo) return NextResponse.json({ error: "inactivo" }, { status: 403 });

  const chico = datos.chicos.find((c) => c.activo) ?? datos.chicos[0];
  if (!chico) return NextResponse.json({ error: "sin_chico" }, { status: 409 });

  /* Lo último que contestó cada uno, para poder traerlo puesto. Volver a
     contestar es lo normal: nadie arranca de cero cada vez. */
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - VENTANA_DIAS * DIA_MS);
  const observaciones = await repo.observacionesDe(
    chico.id,
    desde.toISOString(),
    hasta.toISOString(),
  );

  const ultimaDeCadaUno = new Map<string, { fecha: string; respuestas: Record<string, number> }>();
  for (const o of observaciones) {
    const previa = ultimaDeCadaUno.get(o.adultoId);
    if (!previa || o.fecha > previa.fecha) {
      ultimaDeCadaUno.set(o.adultoId, { fecha: o.fecha, respuestas: o.respuestas });
    }
  }

  return NextResponse.json({
    chico: { nombre: chico.nombre, edad: chico.edad },
    hogar: usuario.hogar ?? null,
    firmantes: quienesPuedenFirmar(datos.adultos),
    ultimas: Object.fromEntries(ultimaDeCadaUno),
  });
}

/* ── Contestar ──────────────────────────────────────────────────────────── */

export async function POST(req: Request) {
  const sesion = await auth();
  const usuario = sesion?.user as Sesion | undefined;

  if (!sesion || usuario?.rol !== "adulto" || !usuario.familiaId) {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const parsed = Pedido.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "parametros_invalidos" }, { status: 400 });
  }
  const { adultoId, respuestas } = parsed.data;

  /* ⚠ Se quedan sólo los indicadores que existen. Un id inventado no rompe
     nada —`evaluarObservaciones` recorre la lista, no el objeto— pero quedaría
     guardado para siempre en una fila que dice ser la observación de alguien. */
  const limpias: Record<string, number> = {};
  for (const [id, valor] of Object.entries(respuestas)) {
    if (IDS_VALIDOS.has(id)) limpias[id] = valor;
  }
  if (Object.keys(limpias).length === 0) {
    return NextResponse.json({ error: "sin_respuestas" }, { status: 400 });
  }

  const turno = await tomarTurno(`cuestionario:${usuario.familiaId}`, VENTANA_SEG, TOPE);
  if (!turno.permitido) {
    return NextResponse.json(
      { error: "demasiados_pedidos", esperaSeg: turno.esperaSeg },
      { status: 429 },
    );
  }

  const repo = repositorio();
  const datos = await repo.familiaPorId(usuario.familiaId);
  if (!datos) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });
  if (!datos.familia.activo) return NextResponse.json({ error: "inactivo" }, { status: 403 });

  const chico = datos.chicos.find((c) => c.activo) ?? datos.chicos[0];
  if (!chico) return NextResponse.json({ error: "sin_chico" }, { status: 409 });

  /* 🔴 La firma se comprueba contra ESTA familia. Es una declaración, sí, pero
     una declaración acotada: sólo se puede firmar como alguien de la casa. Sin
     esto, el cuerpo del pedido podría colgarle una observación a un adulto de
     otra familia, que es el mismo agujero que la sesión cierra con la familia. */
  const firmante = quienesPuedenFirmar(datos.adultos).find((a) => a.id === adultoId);
  if (!firmante) return NextResponse.json({ error: "firmante_invalido" }, { status: 403 });

  const observacion = await repo.registrarObservacion({
    chicoId: chico.id,
    adultoId: firmante.id,
    // CONSTA: de la sesión, no del formulario.
    hogar: usuario.hogar ?? null,
    fecha: new Date().toISOString(),
    respuestas: limpias,
  });

  /* 📌 Vuelve lo que se guardó y NADA más. Ningún puntaje, ninguna lectura,
     ningún «tu hijo está en riesgo». Lo que cambió el informe se ve en el
     panel, que es donde el sistema explica lo que ve con sus dos ojos. */
  return NextResponse.json({
    ok: true,
    firma: { adultoId: firmante.id, nombre: firmante.nombre, hogar: usuario.hogar ?? null },
    fecha: observacion.fecha,
    respondidas: Object.keys(limpias).length,
    deUnTotalDe: INDICADORES.length,
    almacenamiento: repo.clase,
  });
}
