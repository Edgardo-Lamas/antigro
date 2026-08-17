import { NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { FuenteSimulador, type Escenario } from "@/lib/senales";
import { evaluar, VENTANA_DIAS } from "@/lib/motor";
import { redactarLecturaParaAdultos, redactarMensajeAlChico } from "@/lib/ia";
import { TransporteTelegram } from "@/lib/mensajeria";
import { deQuienViene, tomarTurno } from "@/lib/limite";
import { enlaceDeVinculacion, nombreDelBot } from "@/lib/mensajeria/vinculacion";
import {
  CODIGO_DEMO,
  conectados,
  CUPO,
  esAdulto,
  nombreDelRol,
  renovar,
  ROLES,
  type CupoTomado,
} from "@/lib/mensajeria/cupo-demo";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL QR DE LA DEMO, Y LA ENTREGA DE VERDAD
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  GET  — el QR, el enlace y quién está conectado ahora.
 *  POST — manda el aviso a los Telegram conectados. **Sale de verdad.**
 *
 *  🔑 El QR se dibuja en el servidor y viaja como SVG en la respuesta. No se
 *  usa ningún generador de terceros: mandarle a un servicio ajeno el enlace de
 *  vinculación de un sistema que cuida chicos sería una contradicción, aunque
 *  el enlace no tenga nada secreto.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Estado del cupo, para que la página lo muestre sin adornar.
 *
 * 📌 Recibe los tomados en vez de buscarlos: desde que el cupo vive en la base,
 * cada llamada sería una consulta, y una misma respuesta lo arma hasta dos
 * veces. Se lee una vez por pedido y se pasa.
 */
function estadoDelCupo(tomados: CupoTomado[]) {
  return {
    tope: CUPO,
    usados: tomados.length,
    lugares: ROLES.map((r) => {
      const quien = tomados.find((c) => c.rol === r.rol);
      return {
        rol: r.rol,
        nombre: r.nombre,
        explica: r.explica,
        ocupado: Boolean(quien),
        /** Sólo el nombre de pila que muestra Telegram. Nunca el chat_id. */
        porQuien: quien?.nombre ?? null,
      };
    }),
  };
}

export async function GET() {
  const bot = nombreDelBot();
  const enlace = enlaceDeVinculacion(CODIGO_DEMO);
  const cupo = estadoDelCupo(await conectados());

  if (!bot || !enlace) {
    return NextResponse.json({
      disponible: false,
      motivo: "Falta TELEGRAM_BOT_USERNAME",
      cupo,
    });
  }

  const qr = await QRCode.toString(enlace, {
    type: "svg",
    // Zona de silencio: sin margen, un lector pega el código contra el borde
    // de la tarjeta y falla.
    margin: 2,
    // Alto: el QR se lee de una pantalla, muchas veces filmada o proyectada.
    errorCorrectionLevel: "H",
    /**
     * 🔴 Oscuro sobre CLARO, aunque el resto de la página sea oscura.
     * Un QR en negativo queda lindo y **hay teléfonos que no lo leen**: el
     * estándar asume módulos oscuros sobre fondo claro, y varios lectores no
     * prueban la inversión. En una demostración donde escanear es el punto
     * entero, eso es cambiar que funcione por que combine.
     */
    color: { dark: "#0D1117", light: "#FFFFFF" },
  });

  return NextResponse.json({ disponible: true, bot, enlace, qr, cupo });
}

const Envio = z.object({
  escenario: z.enum(["normal", "cambio_leve", "persistente", "evasion"]).default("persistente"),
  dia: z.coerce.number().int().min(0).max(VENTANA_DIAS - 1).default(VENTANA_DIAS - 1),
  edad: z.coerce.number().int().min(7).max(17).default(12),
  genero: z.enum(["nena", "varon", "otro"]).default("nena"),
  nombre: z.string().max(40).default("Ana"),
});

/**
 * 🔐 Cuántos avisos puede pedir un mismo visitante, y por qué esos números.
 *
 * Este endpoint es público a propósito: el botón está en la home y apretarlo es
 * la demostración. Pero cada vez que sale un aviso son **dos llamadas a Opus 5
 * y tres mensajes de Telegram**, así que sin límite alcanza un `for` para que
 * la demo cueste plata y le llene el teléfono a los tres que están mirando.
 *
 * Seis por minuto: el que prueba en serio aprieta, lee lo que le llegó y vuelve
 * a apretar con otro escenario. Seis le sobra y no lo va a rozar nunca.
 */
const TOPE_DEMO = 6;
const VENTANA_DEMO_SEG = 60;

export async function POST(req: Request) {
  const parsed = Envio.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }
  const { escenario, dia, edad, genero, nombre } = parsed.data;

  const destinatarios = await conectados();
  const cupo = estadoDelCupo(destinatarios);

  /* 🔑 El límite se cobra ANTES de escribir nada, pero DESPUÉS de mirar el
     cupo: si no hay nadie conectado no se llama al modelo, así que ese pedido
     no cuesta y no tiene por qué gastar turno. */
  if (destinatarios.length > 0) {
    const turno = await tomarTurno(`demo:${deQuienViene(req)}`, VENTANA_DEMO_SEG, TOPE_DEMO);
    if (!turno.permitido) {
      return NextResponse.json(
        {
          enviado: false,
          motivo: "demasiado_seguido",
          /* ⚠ Se dice el número, no un "esperá un rato". Quien está probando
             esto adelante de gente necesita saber cuánto. */
          esperaSeg: turno.esperaSeg,
          cupo,
        },
        { status: 429 },
      );
    }
  }

  if (destinatarios.length === 0) {
    return NextResponse.json({
      enviado: false,
      motivo: "sin_conectados",
      cupo,
    });
  }

  const fin = new Date();
  fin.setHours(23, 59, 59, 999);
  const inicio = new Date(fin.getTime() - (VENTANA_DIAS - 1) * DIA_MS);
  inicio.setHours(0, 0, 0, 0);
  const hasta = new Date(inicio.getTime() + dia * DIA_MS);
  hasta.setHours(23, 59, 59, 999);

  const senales = await new FuenteSimulador(escenario as Escenario).leer({
    chicoId: "demo",
    desde: inicio.toISOString(),
    hasta: hasta.toISOString(),
  });

  const lectura = evaluar({ chico: { edad, genero }, senales, hasta, diasObservados: dia + 1 });

  /* 🔴 La misma regla que en `avisar()`: sólo se escribe con patrón sostenido.
     Acá importa el doble — si el botón mandara algo siempre, la demo estaría
     mostrando un sistema distinto del que se describe dos párrafos más arriba
     en la misma página. Que no salga nada ES el comportamiento correcto. */
  if (lectura.estado !== "patron_sostenido") {
    return NextResponse.json({
      enviado: false,
      motivo: "sin_patron_sostenido",
      estado: lectura.estado,
      cupo,
    });
  }

  const [paraLosAdultos, paraElChico] = await Promise.all([
    redactarLecturaParaAdultos({ nombreDelChico: nombre, edad, lectura }),
    redactarMensajeAlChico({ nombre, edad, genero, estado: lectura.estado }),
  ]);

  /* Los dos redactores devuelven `null` en calma, y en calma no llegamos acá.
     Aun así no se fuerza el tipo: si algún día devuelven null por otro motivo,
     el sistema tiene que no mandar nada antes que mandar un mensaje vacío a
     tres teléfonos. */
  if (!paraLosAdultos || !paraElChico) {
    return NextResponse.json({
      enviado: false,
      motivo: "sin_texto",
      estado: lectura.estado,
      cupo,
    });
  }

  const bot = new TransporteTelegram();

  const entregas = await Promise.all(
    destinatarios.map(async (c) => {
      const cuerpo = esAdulto(c.rol) ? paraLosAdultos.texto : paraElChico.texto;
      /* ⚠ El encabezado no es decoración: quien recibe esto en su teléfono
         tiene que saber en el mismo mensaje que es una demostración y que la
         chica no existe. Un texto así llegando sin marco es alarmante. */
      const texto =
        `— AntiGro · demostración —\n` +
        `Esto es lo que le llegaría a ${nombreDelRol(c.rol)}. Ana es un caso inventado.\n\n` +
        cuerpo;

      const resultado = await bot.enviar({
        canal: "telegram",
        destino: c.chatId,
        texto,
      });
      await renovar(c.chatId);
      return {
        rol: c.rol,
        paraQuien: nombreDelRol(c.rol),
        nombre: c.nombre,
        entregado: resultado.entregado,
        detalle: resultado.detalle ?? null,
      };
    }),
  );

  return NextResponse.json({
    enviado: entregas.some((e) => e.entregado),
    estado: lectura.estado,
    entregas,
    origen: { adultos: paraLosAdultos.origen, chico: paraElChico.origen },
    cupo,
  });
}
