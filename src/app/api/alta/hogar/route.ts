import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { repositorio } from "@/lib/datos";
import { deQuienViene, tomarTurno } from "@/lib/limite";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA PUERTA DE LA CASA — primer paso del recorrido de alta (17/8)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Edgardo describió la secuencia entera: *"abre el enlace, llega al panel de
 * logueo, crea credenciales, y accede al mismo recorrido pero sin pagar. Ve el
 * simulador y luego la carga de datos"*. Esto es el «crea credenciales».
 *
 * 🔴 **Es la primera ruta pública del sistema que ESCRIBE, y eso cambia lo que
 * hay que cuidar.** La auditoría del 17/8 encontró tres rutas abiertas llamando
 * a Opus 5 sin sesión y ningún límite de frecuencia en todo el sistema. Ésta no
 * llama al modelo, pero abre algo peor: una cuenta con la que después SÍ se
 * llega al asistente. Por eso:
 *
 * 1. **Límite por IP**, en Postgres como el resto (ver `limite.ts`).
 * 2. **La clave se cifra en el repositorio**, no viaja de vuelta ni se registra.
 * 3. **Un solo mensaje para «ese correo ya tiene cuenta»**, igual que en
 *    `/entrar`: decir cuáles existen deja averiguar quién está adentro de un
 *    sistema que cuida chicos.
 *
 * 📌 En producción esto va después del pago. Hoy no se cobra —está decidido— y
 * el recorrido lo dice en pantalla en vez de simular un cobro que no existe.
 */

export const dynamic = "force-dynamic";

/**
 * 🔑 Tres por minuto por IP. Un alta de verdad se hace una vez; tres deja
 * lugar a equivocarse dos veces sin trabar a nadie.
 */
const VENTANA_SEG = 60;
const TOPE = 3;

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  🔴 EL ENLACE QUE SE LE PASA AL JURADO ES UNA PUERTA, Y HAY QUE TRATARLA ASÍ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Lo levantó Edgardo el 17/8, apenas quedó hecho el recorrido: *"si les damos el
 * enlace para que ingresen directo, y de repente alguien lo consigue, puede
 * hacer explotar el sistema"*. **Tiene razón, y el agujero lo abrió el recorrido
 * mismo:** hasta hoy ninguna ruta pública escribía.
 *
 * 🔑 **Y el problema no es la basura en la base: es la plata.** Cada cuenta creada
 * llega al asistente, que son llamadas a Opus 5. El asistente ya tiene su tope
 * —30 por hora **por familia**—, así que sin freno en el alta alcanza con crear
 * familias para multiplicarlo. **El cuello de botella tiene que estar acá.**
 *
 * Tres capas, y el ORDEN importa:
 *
 * 1. **Por IP** (arriba): frena el martilleo.
 * 2. **Código de invitación**: el que viaja en el enlace del jurado.
 * 3. **Tope global diario**: porque un enlace que circula se copia, y el código
 *    va escrito adentro. Es el techo del gasto, pase lo que pase.
 *
 * 🔴 **El código se comprueba ANTES del tope global, y no es un detalle.** Al
 * revés, cualquiera sin código podría quemar el cupo del día pegándole a la
 * ruta, y el jurado se encontraría la puerta cerrada sin que nadie entrara.
 */

/**
 * 🔴 **Sin la variable en el entorno, las altas quedan CERRADAS.** Es la lección
 * de la auditoría del 17/8 aplicada de entrada: acá había una clave de ejemplo
 * que terminó abriendo la cuenta de administración de producción. **Un valor por
 * defecto que abre una puerta se filtra al lugar donde no tenía que estar.**
 * Fallar cerrado es lo único que evita que vuelva a pasar.
 */
function codigoEsperado(): string | null {
  const codigo = process.env.CODIGO_DE_INVITACION?.trim();
  return codigo && codigo.length > 0 ? codigo : null;
}

/**
 * Cuántas altas entran por día en todo el sistema.
 *
 * 📌 El número sale de para qué existe esto: un jurado, más él probando. Cuarenta
 * es holgado para eso y sigue siendo un techo. ⚠ Si algún día AntiGro tiene
 * clientes de verdad, esto se saca — es un freno de demostración, no de producto.
 */
const TOPE_DIARIO = 40;
const DIA_SEG = 60 * 60 * 24;

/**
 * 🔴 **Ocho, y con un porqué que se puede defender.** Es la puerta al informe de
 * un chico. Cuatro caracteres es una clave que se adivina; pedir mayúsculas,
 * números y símbolos empuja a la gente al papelito pegado en la heladera. La
 * regla que sostiene la puerta es el largo.
 */
const CLAVE_MINIMA = 8;

const Cuerpo = z.object({
  email: z.string().email("Ese correo no parece válido.").max(254),
  clave: z.string().min(CLAVE_MINIMA, `La clave necesita al menos ${CLAVE_MINIMA} caracteres.`),
  nombreDeLaFamilia: z.string().max(100).optional(),
  /**
   * 🔑 Cómo se llama esta casa. Sólo cuando el chico vive en dos: con una sola
   * va vacío y nadie tiene que escribir «mi casa».
   */
  hogar: z.string().max(60).optional(),
  /**
   * 🔴 **La segunda puerta de la MISMA familia — padres separados.** Sólo se
   * acepta si quien lo pide ya está adentro de esa familia: si viniera suelto
   * del navegador, cualquiera se colgaría de la familia de otro escribiendo un
   * identificador. Ver el chequeo de sesión abajo.
   */
  familiaId: z.string().optional(),
  /** El que viaja en el enlace que se le pasa al jurado. Ver arriba. */
  invitacion: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  const turno = await tomarTurno(`alta:${deQuienViene(req)}`, VENTANA_SEG, TOPE);
  if (!turno.permitido) {
    return NextResponse.json(
      {
        error: "Probá de nuevo en un momento.",
        esperaSeg: turno.esperaSeg,
      },
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

  const { email, clave, nombreDeLaFamilia, hogar, familiaId, invitacion } = parsed.data;

  /* ── 2. El código de invitación ──────────────────────────────────────────
     ⚠ Va ANTES del tope global a propósito: si no, cualquiera sin código
     quemaría el cupo del día y el jurado encontraría la puerta cerrada. */
  const esperado = codigoEsperado();
  if (!esperado) {
    return NextResponse.json(
      {
        error:
          "Las altas están cerradas en este momento. Podés ver el sistema entero " +
          "funcionando sin registrarte.",
        cerrado: true,
      },
      { status: 503 },
    );
  }
  if (invitacion?.trim() !== esperado) {
    /* 📌 No dice «código incorrecto» ni «falta el código»: los dos casos suenan
       igual desde afuera. El que tiene el enlace bueno nunca ve esto. */
    return NextResponse.json(
      { error: "Este enlace no habilita crear una cuenta.", sinInvitacion: true },
      { status: 403 },
    );
  }

  /* ── 3. El techo del gasto, pase lo que pase ─────────────────────────────
     🔑 Existe porque el código viaja escrito adentro del enlace, y un enlace
     que circula se copia. Esto es lo único que no depende de que el código
     siga siendo secreto. */
  const delDia = await tomarTurno("altas:global", DIA_SEG, TOPE_DIARIO);
  if (!delDia.permitido) {
    return NextResponse.json(
      {
        error:
          "Se llegó al máximo de cuentas nuevas por hoy. Podés ver el sistema " +
          "entero funcionando sin registrarte.",
        topeDiario: true,
      },
      { status: 429 },
    );
  }

  /* 🔴 La segunda casa la abre alguien que YA está en la familia. Sin esto, el
     `familiaId` del cuerpo sería una llave para colgarse de cualquier familia. */
  if (familiaId) {
    const sesion = await auth();
    const suya = (sesion?.user as { familiaId?: string } | undefined)?.familiaId;
    if (suya !== familiaId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const repo = repositorio();
  const alta = await repo.crearHogar({ email, clave, hogar, familiaId, nombreDeLaFamilia });

  if (!alta.ok) {
    /* Cada motivo se cuenta distinto porque son problemas distintos, y confundirlos
       es lo que deja a alguien trabado sin saber qué hacer. */
    if (alta.motivo === "email_tomado") {
      return NextResponse.json(
        { error: "Ese correo ya tiene una cuenta. Si es tuya, entrá con ella." },
        { status: 409 },
      );
    }
    if (alta.motivo === "hogar_ocupado") {
      return NextResponse.json(
        { error: "Esa casa ya tiene su clave. Una puerta por casa." },
        { status: 409 },
      );
    }
    /* 🔴 Modo demo: se dice, no se disimula. Ver `crearHogar` en `memoria.ts`. */
    return NextResponse.json(
      {
        error:
          "El sistema está corriendo sin base de datos, así que una cuenta no " +
          "sobreviviría al próximo reinicio. Podés ver el sistema entero funcionando " +
          "sin registrarte.",
        sinBase: true,
      },
      { status: 503 },
    );
  }

  /**
   * 📌 Se devuelve el id de la familia, no el token. El token es una credencial
   * —con él se piden avisos por `/api/alertas`— y no tiene por qué salir de acá.
   * El id sólo sirve para lo que sigue: abrir la segunda casa.
   */
  return NextResponse.json({ ok: true, familiaId: alta.familia.id });
}
