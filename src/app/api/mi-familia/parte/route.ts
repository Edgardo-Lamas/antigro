import { NextResponse } from "next/server";
import { hogarDeLaSesion } from "@/lib/sesion";
import { repositorio } from "@/lib/datos";
import { obtenerFuente } from "@/lib/senales";
import {
  armarParte,
  DIAS_ENTRE_PARTES,
  evaluar,
  juntarObservaciones,
  textoDelParte,
} from "@/lib/motor";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL PARTE, PEDIDO A MANO — lo pidió Edgardo el 2026-09-19
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  **El parte existía desde el 19/8 pero sólo lo mandaba el reloj, cada 30 días,
 *  y por Telegram.** O sea: el padre que entraba al panel el día 12 preguntándose
 *  si esto funciona **no tenía forma de averiguarlo**, que es exactamente el
 *  agujero que el parte vino a tapar. Él lo vio: *"creo que debería haber un
 *  botón para que el padre pueda pedirlo al momento"*.
 *
 *  🔑 **Y sale gratis, que es lo que lo hace posible.** El parte es
 *  determinista: son cuentas sobre las señales, no lo escribe el modelo. Un
 *  botón que llamara a Opus 5 cada vez que un padre ansioso lo aprieta sería la
 *  clase de gasto que encontró la auditoría del 17/8. Éste no cuesta nada, así
 *  que se puede apretar todas las veces que haga falta.
 *
 *  🔴 **Pedirlo NO se registra en el libro de la casa.** Mirar no deja rastro:
 *  el registro anota lo que una casa APORTA o CAMBIA, nunca lo que MIRA. Con
 *  padres separados, anotar quién miró el informe convierte un registro en
 *  vigilancia — la decisión es del 20/8 y vale igual acá.
 *
 *  📌 **No dispara el envío por Telegram.** El parte que se pide se muestra en
 *  la pantalla de quien lo pidió. Mandárselo también a la otra casa haría que
 *  abrir el panel le vibre el teléfono al otro progenitor, que es justo lo que
 *  el punto de arriba evita.
 */

export const dynamic = "force-dynamic";

const DIA_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  /* 🔐 Comprobada contra la base: ver `src/lib/sesion.ts`. */
  const usuario = await hogarDeLaSesion();
  if (!usuario) {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const repo = repositorio();
  const datos = await repo.familiaPorId(usuario.familiaId);

  if (!datos) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });
  if (!datos.familia.activo) return NextResponse.json({ error: "inactivo" }, { status: 403 });

  const chico = datos.chicos.find((c) => c.activo) ?? datos.chicos[0];
  if (!chico) return NextResponse.json({ error: "sin_chico" }, { status: 404 });

  /* 🔑 **El período del parte es el del parte —30 días—, no la ventana del
     motor, que son 21.** Son dos cosas distintas y confundirlas haría que el
     texto dijera «miramos 21 días» en un resumen que se llama mensual. */
  const ahora = new Date();
  const diasDesdeElAlta = Math.max(
    1,
    Math.floor((ahora.getTime() - new Date(chico.creado).getTime()) / DIA_MS),
  );
  const diasMirados = Math.min(diasDesdeElAlta, DIAS_ENTRE_PARTES);
  const desde = new Date(ahora.getTime() - diasMirados * DIA_MS).toISOString();
  const hasta = ahora.toISOString();

  const { fuente } = await obtenerFuente("normal");
  const senales = await fuente.leer({ chicoId: chico.id, desde, hasta });

  const observaciones = await repo.observacionesDe(chico.id, desde, hasta);
  const respuestas = await repo.respuestasDe(chico.id, desde, hasta);

  const lectura = evaluar({
    chico: { edad: chico.edad, genero: chico.genero },
    senales,
    hasta: ahora,
    observaciones: juntarObservaciones(observaciones),
    diasObservados: diasDesdeElAlta,
  });

  /* 🔴 Los mismos cuatro datos que le pasa el reloj, y a propósito: si el parte
     que el padre pide fuera distinto del que le llega por mensaje, tendríamos
     dos verdades sobre el mismo mes. */
  const parte = armarParte({
    senales,
    diasMirados,
    rachaMasLarga: lectura.diasSostenidos,
    huboAviso: respuestas.some((r) => r.clase === "alerta_adultos"),
  });

  return NextResponse.json({
    chico: chico.nombre,
    parte,
    texto: textoDelParte(chico.nombre, parte),
    periodo: { desde, hasta, dias: diasMirados },
    pedidoEl: hasta,
  });
}
