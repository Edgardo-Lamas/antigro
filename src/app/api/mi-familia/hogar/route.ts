import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, unstable_update } from "@/auth";
import { repositorio } from "@/lib/datos";
import { tomarTurno } from "@/lib/limite";
import {
  LARGO_MAXIMO_DE_CASA,
  revisarClaveNueva,
  revisarNombreDeCasa,
  sePuedeAbrirOtraPuerta,
  sePuedeCerrar,
  type Puerta,
} from "@/lib/hogares";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA SEGUNDA PUERTA — padres separados, un solo panel, dos entradas
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  El recorrido de alta lo viene prometiendo desde el 17/8 —*"la segunda
 *  entrada se crea desde el panel, cuando termines acá"*— y hasta hoy ese panel
 *  no la tenía. Esto es esa entrada.
 *
 *  🔴 **El diseño lo cerró Edgardo el 18/8, con la ley al lado:** el responsable
 *  decide si se abre la segunda puerta, y **abierta, no la puede cerrar**.
 *  CCyC art. 641 inc. b (separados, el ejercicio es de ambos) y art. 654 (*"cada
 *  progenitor debe informar al otro sobre cuestiones… relativas a la persona del
 *  hijo"*). Cómo está el hijo es exactamente eso. Así el acceso al informe de un
 *  chico no se usa como moneda de cambio entre dos adultos peleados.
 *  ⚠ Si hay medida judicial, esa manda. AntiGro no pide sentencias ni las puede
 *  verificar: lo dice y se corre.
 *
 *  🔑 **Lo único reversible es un error de tipeo** — ver `DELETE` abajo.
 *
 *  ⚠ **LA SEGUNDA PUERTA NO ACEPTA TÉRMINOS, y es a propósito.** Quien la abre
 *  no puede aceptarlos por otro: marcar esa cuenta como que aceptó sería
 *  inventar un consentimiento, que es lo mismo que la migración 14 se negó a
 *  hacer con las cuentas viejas. Queda en null, que significa exactamente lo
 *  que pasó: nadie aceptó nada desde esa puerta todavía.
 */

export const dynamic = "force-dynamic";

/**
 * 🔑 Cinco por hora por familia. Abrir la segunda puerta se hace una vez en la
 * vida; el margen es para equivocarse con el correo y volver a intentar.
 */
const VENTANA_SEG = 60 * 60;
const TOPE = 5;

type Sesion = {
  rol?: string;
  familiaId?: string | null;
  hogar?: string | null;
  usuarioId?: string | null;
};

const Cuerpo = z.object({
  /**
   * 🔑 Cómo se llama ESTA casa. Sólo hace falta cuando todavía no tiene nombre:
   * con una sola casa nadie tuvo que escribir «mi casa» —y está bien—, pero con
   * dos, el nombre es lo único que en el informe distingue quién aportó qué.
   */
  estaCasa: z.string().max(LARGO_MAXIMO_DE_CASA).optional(),
  otraCasa: z.string().max(LARGO_MAXIMO_DE_CASA),
  email: z.string().email("Ese correo no parece válido.").max(254),
  clave: z.string().max(200),
  claveRepetida: z.string().max(200),
});

/** Lo que la sesión sabe de quién está pidiendo, o el 401 correspondiente. */
async function quienPide() {
  const sesion = await auth();
  const usuario = sesion?.user as Sesion | undefined;

  if (!sesion || usuario?.rol !== "adulto" || !usuario.familiaId || !usuario.usuarioId) {
    return null;
  }
  return {
    familiaId: usuario.familiaId,
    usuarioId: usuario.usuarioId,
    hogar: usuario.hogar ?? null,
  };
}

/** Las puertas de la familia, ya con «cuál es la mía» resuelto. */
async function puertasConLaMia(familiaId: string, usuarioId: string): Promise<Puerta[]> {
  const puertas = await repositorio().puertasDe(familiaId);
  return puertas.map((p) => ({
    id: p.id,
    hogar: p.hogar,
    esLaMia: p.id === usuarioId,
    ultimoAcceso: p.ultimoAcceso,
    creado: p.creado,
  }));
}

export async function POST(req: Request) {
  const yo = await quienPide();
  if (!yo) return NextResponse.json({ error: "sin_sesion" }, { status: 401 });

  const turno = await tomarTurno(`segunda-puerta:${yo.familiaId}`, VENTANA_SEG, TOPE);
  if (!turno.permitido) {
    return NextResponse.json(
      { error: "Probá de nuevo más tarde.", esperaSeg: turno.esperaSeg },
      { status: 429 },
    );
  }

  const parsed = Cuerpo.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const { estaCasa, otraCasa, email, clave, claveRepetida } = parsed.data;

  const repo = repositorio();
  const puertas = await puertasConLaMia(yo.familiaId, yo.usuarioId);

  /* 🔴 El tope de dos se comprueba ACÁ y no en la pantalla: la pantalla es una
     comodidad, el que decide es el servidor. */
  if (!sePuedeAbrirOtraPuerta(puertas)) {
    return NextResponse.json(
      { error: "Esta familia ya tiene sus dos entradas." },
      { status: 409 },
    );
  }

  const laMia = puertas.find((p) => p.esLaMia);
  const lasOtras = puertas.filter((p) => !p.esLaMia);

  /* ── El nombre de esta casa, si todavía no tiene ──────────────────────── */
  const hayQueNombrarEstaCasa = !laMia?.hogar?.trim();
  if (hayQueNombrarEstaCasa) {
    const problema = revisarNombreDeCasa(estaCasa ?? "", lasOtras);
    if (problema) return NextResponse.json({ error: problema, campo: "estaCasa" }, { status: 400 });
  }

  /* ── El nombre de la otra, que no puede repetir el de ésta ────────────── */
  const yaTomadas: Puerta[] = hayQueNombrarEstaCasa
    ? [...lasOtras, { ...(laMia as Puerta), hogar: estaCasa ?? null }]
    : puertas;

  const problemaOtra = revisarNombreDeCasa(otraCasa, yaTomadas);
  if (problemaOtra) {
    return NextResponse.json({ error: problemaOtra, campo: "otraCasa" }, { status: 400 });
  }

  const problemaClave = revisarClaveNueva(clave, claveRepetida);
  if (problemaClave) {
    return NextResponse.json({ error: problemaClave, campo: "clave" }, { status: 400 });
  }

  /* ── Primero el nombre de esta casa ───────────────────────────────────────
     🔑 **En este orden a propósito.** Si fallara después de crear la otra
     puerta, quedarían dos casas y una sin nombre — y sin nombre las respuestas
     del cuestionario no se pueden atribuir. Al revés no pasa nada: una casa con
     nombre y una sola puerta es exactamente el estado de antes, más prolijo. */
  if (hayQueNombrarEstaCasa) {
    const ok = await repo.renombrarPuerta(yo.familiaId, yo.usuarioId, estaCasa as string);
    if (!ok) {
      return NextResponse.json(
        { error: "No pudimos guardar el nombre de tu casa. Probá de nuevo." },
        { status: 500 },
      );
    }
  }

  /* ── Y ahora sí, la otra puerta ───────────────────────────────────────── */
  const alta = await repo.crearHogar({
    email,
    clave,
    hogar: otraCasa.trim(),
    familiaId: yo.familiaId,
    /* ⚠ null: nadie aceptó los términos desde esa puerta todavía, y quien la
       abre no puede aceptarlos por otro. Ver el encabezado. */
    terminosVersion: null,
  });

  if (!alta.ok) {
    if (alta.motivo === "email_tomado") {
      return NextResponse.json(
        {
          error:
            "Ese correo ya tiene una cuenta en AntiGro. Usá otro, o pedile a esa " +
            "persona que entre con la que ya tiene.",
          campo: "email",
        },
        { status: 409 },
      );
    }
    if (alta.motivo === "hogar_ocupado") {
      return NextResponse.json(
        { error: "Esa casa ya tiene su entrada.", campo: "otraCasa" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        error:
          "El sistema está corriendo sin base de datos, así que una entrada no " +
          "sobreviviría al próximo reinicio.",
        sinBase: true,
      },
      { status: 503 },
    );
  }

  await repo.registrarAcceso({
    familiaId: yo.familiaId,
    usuarioId: yo.usuarioId,
    /* 📌 El nombre que tiene la casa AHORA, que puede ser el que se acaba de
       poner dos líneas más arriba. Se copia al momento: si mañana se renombra,
       esto siguió pasando desde la casa que ese día se llamaba así. */
    hogar: hayQueNombrarEstaCasa ? (estaCasa as string).trim() : yo.hogar,
    que: "abrio_la_segunda_puerta",
    detalle: `${otraCasa.trim()} · ${email.trim().toLowerCase()}`,
  });

  /* ── Que la sesión se entere del nombre nuevo ─────────────────────────────
     Sin esto, el próximo cuestionario que se conteste desde acá quedaría
     firmado «desde la casa» en vez de «desde Casa de mamá», hasta el próximo
     ingreso. ⚠ Si no se aplica, no se rompe nada: la base ya tiene el nombre
     bueno. Por eso va envuelto y no puede voltear un alta que ya salió bien. */
  if (hayQueNombrarEstaCasa) {
    try {
      await unstable_update({ hogar: (estaCasa as string).trim() } as never);
    } catch (e) {
      console.error("[segunda-puerta] la sesión quedó con el nombre viejo:", e);
    }
  }

  return NextResponse.json({ ok: true });
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CERRAR UNA PUERTA QUE NADIE USÓ — el único caso reversible
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 **No es «dar de baja a la otra casa»: eso no existe y no va a existir.** Es
 * corregir un correo mal tipeado antes de que le sirva a nadie. En cuanto
 * alguien entró una vez por esa puerta, la puerta es de esa casa.
 *
 * 🔑 La condición la impone el almacenamiento, no esta ruta: `ultimo_acceso is
 * null` va adentro del propio `delete`. Entre mirar y borrar hay un hueco, y en
 * ese hueco la otra casa puede haber entrado por primera vez.
 */
export async function DELETE(req: Request) {
  const yo = await quienPide();
  if (!yo) return NextResponse.json({ error: "sin_sesion" }, { status: 401 });

  const turno = await tomarTurno(`cerrar-puerta:${yo.familiaId}`, VENTANA_SEG, TOPE);
  if (!turno.permitido) {
    return NextResponse.json(
      { error: "Probá de nuevo más tarde.", esperaSeg: turno.esperaSeg },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta cuál puerta." }, { status: 400 });

  const repo = repositorio();
  const puertas = await puertasConLaMia(yo.familiaId, yo.usuarioId);
  const puerta = puertas.find((p) => p.id === id);

  if (!puerta) return NextResponse.json({ error: "Esa entrada no existe." }, { status: 404 });

  /* Se comprueba acá para poder decir POR QUÉ no, y lo vuelve a comprobar el
     repositorio para que no dependa de que esta ruta se acordó. */
  if (!sePuedeCerrar(puerta, puertas)) {
    return NextResponse.json(
      { error: "Ya entraron por esa entrada, así que es de esa casa. No se cierra desde acá." },
      { status: 409 },
    );
  }

  const cierre = await repo.cerrarPuerta(yo.familiaId, id);
  if (!cierre.ok) {
    if (cierre.motivo === "ya_se_uso") {
      return NextResponse.json(
        {
          error:
            "Entraron por esa entrada mientras estabas en esta pantalla, así que " +
            "ya es de esa casa.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Esa entrada no existe." }, { status: 404 });
  }

  await repo.registrarAcceso({
    familiaId: yo.familiaId,
    usuarioId: yo.usuarioId,
    hogar: yo.hogar,
    que: "cerro_una_puerta",
    detalle: puerta.hogar ?? null,
  });

  return NextResponse.json({ ok: true });
}
