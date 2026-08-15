/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LAS DOS SALIDAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. Alerta con contexto a los adultos responsables — a los dos, no a uno.
 * 2. Orientación al propio chico, en su canal, con el texto de su edad.
 *
 * 🔴 Y una regla que no está en ningún prompt: **no se repite el aviso.**
 * Un sistema que manda la misma alerta todos los días se apaga solo, y el día
 * que tenga algo nuevo para decir nadie lo va a leer.
 */

import { diaLocal, type Lectura } from "@/lib/motor";
import { canalListo, repositorio, type AdultoResponsable, type Chico, type Familia } from "@/lib/datos";
import type { ClaseDeRespuesta, Respuesta } from "@/lib/datos/tipos";
import { transporteDe } from "./index";
import type { ResultadoDeEnvio } from "./tipos";

export interface AvisoEmitido {
  clase: ClaseDeRespuesta;
  /** A quién. Nombre, no destino: el destino no se muestra entero. */
  paraQuien: string;
  canal: string;
  texto: string;
  resultado: ResultadoDeEnvio;
  /** true cuando ya se había avisado hoy y no se volvió a mandar. */
  omitidoPorRepetido: boolean;
  /** true cuando esa persona todavía no apretó "Iniciar" en el bot. */
  sinVincular?: boolean;
}

export interface Aviso {
  familia: Familia;
  chico: Chico;
  adultos: AdultoResponsable[];
  lectura: Lectura;
  /** Ya redactados: el motor decidió, la IA escribió, el control revisó. */
  textos: { paraLosAdultos: string; paraElChico: string | null };
  /** Momento del aviso. El reloj del simulador lo mueve. */
  ahora: Date;
}

/**
 * ¿Ya se le mandó hoy un aviso de esta clase a este destinatario?
 *
 * Se deduce del registro fechado en vez de guardar una marca aparte: si el
 * registro es la fuente de verdad para decidir, tiene que serlo también para
 * no repetir.
 */
function yaSeAviso(
  previas: Respuesta[],
  clase: ClaseDeRespuesta,
  destino: string,
  ahora: Date,
): boolean {
  const hoy = diaLocal(ahora);
  return previas.some(
    (r) => r.clase === clase && r.destino === destino && diaLocal(r.fecha) === hoy,
  );
}

export async function avisar(aviso: Aviso): Promise<AvisoEmitido[]> {
  const { chico, adultos, lectura, textos, ahora } = aviso;

  // 🔴 En calma no sale nada. El silencio es la respuesta correcta y es la
  // más difícil de programar.
  if (lectura.estado === "en_calma") return [];

  const repo = repositorio();
  const desde = new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const previas = await repo.respuestasDe(chico.id, desde, ahora.toISOString());

  const emitidos: AvisoEmitido[] = [];

  const mandar = async (
    clase: ClaseDeRespuesta,
    paraQuien: string,
    canal: (typeof adultos)[number]["canal"],
    texto: string,
    asunto?: string,
  ) => {
    /* 🔴 Sin vincular no se le puede escribir, y eso NO se disimula. Un adulto
       que cree que va a recibir avisos y no los recibe está peor que uno que
       sabe que le falta un clic. */
    if (!canalListo(canal)) {
      emitidos.push({
        clase,
        paraQuien,
        canal: canal.tipo,
        texto,
        resultado: {
          transporte: "—",
          entregado: false,
          ensayo: false,
          detalle: canal.codigo
            ? `Falta que ${paraQuien} apriete "Iniciar" (código ${canal.codigo}).`
            : "No tiene canal cargado.",
        },
        omitidoPorRepetido: false,
        sinVincular: true,
      });
      return;
    }

    if (yaSeAviso(previas, clase, canal.destino, ahora)) {
      emitidos.push({
        clase,
        paraQuien,
        canal: canal.tipo,
        texto,
        resultado: {
          transporte: "—",
          entregado: false,
          ensayo: false,
          detalle: "Ya se avisó hoy.",
        },
        omitidoPorRepetido: true,
        sinVincular: false,
      });
      return;
    }

    const transporte = await transporteDe(canal.tipo);
    const resultado = await transporte.enviar({
      canal: canal.tipo,
      destino: canal.destino,
      asunto,
      texto,
    });

    await repo.registrarRespuesta({
      chicoId: chico.id,
      fecha: ahora.toISOString(),
      clase,
      canal: canal.tipo,
      destino: canal.destino,
      texto,
      senalesQueLaSostienen: lectura.senalesQueLaSostienen,
      entregado: resultado.entregado,
    });

    emitidos.push({
      clase,
      paraQuien,
      canal: canal.tipo,
      texto,
      resultado,
      omitidoPorRepetido: false,
      sinVincular: false,
    });
  };

  /* ── 1. Los adultos responsables. Todos, no el primero que aparezca. ── */
  for (const adulto of adultos) {
    await mandar(
      "alerta_adultos",
      adulto.nombre,
      adulto.canal,
      textos.paraLosAdultos,
      `AntiGro · ${chico.nombre}`,
    );
  }

  /* ── 2. El chico, en su propio canal. ──
     Es lo que convierte al sistema en algo que trabaja PARA él y no sólo
     SOBRE él. Si no hay texto para su edad, no se le inventa uno. */
  if (textos.paraElChico) {
    await mandar("orientacion_chico", chico.nombre, chico.canal, textos.paraElChico);
  }

  return emitidos;
}
