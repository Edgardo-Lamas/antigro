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

import {
  diaLocal,
  textoDeLaCeguera,
  textoDelParte,
  type Ceguera,
  type Lectura,
  type Parte,
} from "@/lib/motor";
import { canalListo, repositorio, type AdultoResponsable, type Chico, type Familia } from "@/lib/datos";
import type { ClaseDeRespuesta, Respuesta } from "@/lib/datos/tipos";
import { transporteDe } from "./index";
import { nuevoTokenDeAcuse, type QuienLoVio } from "./acuse";
import {
  decidirEscalada,
  textoDeLaEscalada,
  type DecisionDeEscalada,
} from "./escalada";
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

  /* 🔴 Sólo se avisa con el patrón sostenido. Un cambio que todavía no se
     sostiene NO sale a nadie — ni a los adultos ni al chico.
     Cualquier chico se queda una noche hasta tarde hablando con un compañero
     por algo puntual. Alarmar por eso gasta dos cosas que después hacen falta:
     la atención de los adultos y, sobre todo, la confianza del chico, que es
     el activo del que depende todo el producto. */
  if (lectura.estado !== "patron_sostenido") return [];

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
    /* 🔴 **El botón «Lo vi» va SÓLO en las alertas a los adultos, y la condición
       está acá y no en el transporte a propósito.** El chico no recibe una
       alerta para actuar: recibe orientación. Si su toque contara como acuse,
       el sistema dejaría de insistir **porque lo vio la chica**, y eso da vuelta
       el producto entero. Escrito así, la única forma de romperlo es cambiar
       esta línea, que dice para qué está. */
    const acuseToken = clase === "alerta_adultos" ? nuevoTokenDeAcuse() : undefined;
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
      acuseToken,
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
      /* 🔑 El token va en la MISMA fila que el mensaje, así el acuse dice
         también quién lo apretó sin que nadie lo declare. Es lo contrario del
         cuestionario, donde la persona es una declaración: acá consta. */
      acuseToken,
      acusadoEn: null,
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

/* ═══════════════════════════════════════════════════════════════════════════
   LA ESCALADA — insistir cuando el aviso no lo abrió nadie
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Manda la escalada, si corresponde mandarla.
 *
 * 🔴 **Quién decide NO es esta función**: decide `decidirEscalada()`, que es
 * pura y está probada caso por caso. Acá sólo se ejecuta. Es la misma división
 * que en el resto del sistema — el motor decide, esta capa entrega — y es lo
 * que hace que la política se pueda revisar sin tocar ningún transporte.
 *
 * 🚫 **Va SÓLO a los responsables activos, y el referente queda afuera.**
 * Él ya recibió el aviso original: lo único que la escalada le agregaría es
 * *«los padres no lo vieron»*, y eso es información sobre los padres. Es la
 * asimetría que Edgardo cerró el 18/8. Ver `escalada.ts`.
 */
export async function escalar(aviso: {
  chico: Chico;
  adultos: AdultoResponsable[];
  lectura: Lectura;
  quienLoVio: QuienLoVio;
  yaSeEscalo: boolean;
  ahora: Date;
}): Promise<{ decision: DecisionDeEscalada; emitidos: AvisoEmitido[] }> {
  const { chico, adultos, lectura, quienLoVio, yaSeEscalo, ahora } = aviso;

  const decision = decidirEscalada({ lectura, quienLoVio, yaSeEscalo, ahora });
  if (!decision.escala) return { decision, emitidos: [] };

  const repo = repositorio();
  const texto = textoDeLaEscalada(
    chico.nombre,
    decision.horasDesdeElAviso ?? 0,
    lectura.evasionesRecientes > 0,
  );

  const emitidos: AvisoEmitido[] = [];

  /* 🔑 Los responsables, no todos los adultos. Y sólo los que tienen canal: a
     quien no lo tiene no se le puede escribir, y eso ya lo dice el panel. */
  const responsables = adultos.filter(
    (a) => a.rol === "progenitor" && a.activo !== false && canalListo(a.canal),
  );

  for (const adulto of responsables) {
    const acuseToken = nuevoTokenDeAcuse();
    const transporte = await transporteDe(adulto.canal.tipo);
    const resultado = await transporte.enviar({
      canal: adulto.canal.tipo,
      destino: adulto.canal.destino,
      asunto: `AntiGro · ${chico.nombre} · sigue sin abrirse`,
      texto,
      acuseToken,
    });

    /* 📌 La escalada también lleva botón: si alguien la abre, eso consta. */
    await repo.registrarRespuesta({
      chicoId: chico.id,
      fecha: ahora.toISOString(),
      clase: "escalada_adultos",
      canal: adulto.canal.tipo,
      destino: adulto.canal.destino,
      texto,
      senalesQueLaSostienen: lectura.senalesQueLaSostienen,
      entregado: resultado.entregado,
      acuseToken,
      acusadoEn: null,
    });

    emitidos.push({
      clase: "escalada_adultos",
      paraQuien: adulto.nombre,
      canal: adulto.canal.tipo,
      texto,
      resultado,
      omitidoPorRepetido: false,
      sinVincular: false,
    });
  }

  return { decision, emitidos };
}

/* ═══════════════════════════════════════════════════════════════════════════
   EL PARTE Y LA CEGUERA — la señal de vida
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Manda un mensaje del sistema a los responsables, sin botón y sin ceremonia.
 *
 * 🔑 **Va sólo a los responsables**, ni al referente ni al chico. El parte y la
 * avería son de quien administra el sistema; el referente está para el chico, y
 * el chico no tiene por qué recibir el mantenimiento de la casa.
 *
 * 🔴 **Y NO lleva botón «Lo vi».** El acuse existe para saber si alguien vio una
 * ALERTA, y de ahí cuelga la escalada. Ponérselo a un parte mensual haría que un
 * parte sin abrir se pareciera a una alerta sin abrir, que es exactamente la
 * confusión que este mensaje viene a evitar.
 */
async function mandarALosResponsables(
  chico: Chico,
  adultos: AdultoResponsable[],
  clase: ClaseDeRespuesta,
  texto: string,
  asunto: string,
  ahora: Date,
): Promise<AvisoEmitido[]> {
  const repo = repositorio();
  const emitidos: AvisoEmitido[] = [];

  const responsables = adultos.filter(
    (a) => a.rol === "progenitor" && a.activo !== false && canalListo(a.canal),
  );

  for (const adulto of responsables) {
    const transporte = await transporteDe(adulto.canal.tipo);
    const resultado = await transporte.enviar({
      canal: adulto.canal.tipo,
      destino: adulto.canal.destino,
      asunto,
      texto,
    });

    await repo.registrarRespuesta({
      chicoId: chico.id,
      fecha: ahora.toISOString(),
      clase,
      canal: adulto.canal.tipo,
      destino: adulto.canal.destino,
      texto,
      // Un parte no se apoya en señales puntuales: resume el período entero.
      senalesQueLaSostienen: [],
      entregado: resultado.entregado,
      acuseToken: null,
      acusadoEn: null,
    });

    emitidos.push({
      clase,
      paraQuien: adulto.nombre,
      canal: adulto.canal.tipo,
      texto,
      resultado,
      omitidoPorRepetido: false,
      sinVincular: false,
    });
  }

  return emitidos;
}

/** El parte periódico: la señal de vida. */
export async function enviarParte(entrada: {
  chico: Chico;
  adultos: AdultoResponsable[];
  parte: Parte;
  ahora: Date;
}): Promise<AvisoEmitido[]> {
  return mandarALosResponsables(
    entrada.chico,
    entrada.adultos,
    "parte_periodico",
    textoDelParte(entrada.chico.nombre, entrada.parte),
    `AntiGro · el parte de ${entrada.chico.nombre}`,
    entrada.ahora,
  );
}

/**
 * El aviso de que el sistema dejó de ver.
 *
 * 🔴 **Es el único mensaje del sistema que pide una acción concreta.** No es una
 * novedad sobre el chico: es una avería. Y una avería que nadie arregla deja a
 * la familia creyendo que está protegida cuando no lo está.
 */
export async function avisarDeLaCeguera(entrada: {
  chico: Chico;
  adultos: AdultoResponsable[];
  ceguera: Ceguera;
  ahora: Date;
}): Promise<AvisoEmitido[]> {
  return mandarALosResponsables(
    entrada.chico,
    entrada.adultos,
    "aviso_de_ceguera",
    textoDeLaCeguera(entrada.chico.nombre, entrada.ceguera),
    `AntiGro · dejó de recibir datos de ${entrada.chico.nombre}`,
    entrada.ahora,
  );
}
