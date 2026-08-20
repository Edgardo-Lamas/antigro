/**
 * Repositorio sobre Supabase.
 *
 * Se usa cuando hay credenciales. Las columnas van en snake_case, que es lo que
 * espera Postgres; el dominio queda en camelCase. La traducción vive acá y en
 * ningún otro lado.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { generarToken } from "@/lib/supabase";
import { exigeVinculacion, generarCodigo } from "./tipos";
import type {
  AdultoResponsable,
  Canal,
  Chico,
  Familia,
  FamiliaCompleta,
  ObservacionDelAdulto,
  Respuesta,
  SenalRegistrada,
  TurnoDeCharla,
} from "./tipos";
import type {
  AccesoRegistrado,
  AltaDeFamilia,
  AltaDeHogar,
  DatosDeLaFamilia,
  PuertaDeLaCasa,
  Repositorio,
  ResultadoDeAlta,
  ResultadoDeCambioDeClave,
  ResultadoDeCierre,
} from "./repositorio";

/* ── Traducción fila ⇄ dominio ───────────────────────────────────────────── */

type FilaFamilia = {
  id: string;
  nombre: string;
  token: string;
  activo: boolean;
  notas: string | null;
  created_at: string;
};

type FilaChico = {
  id: string;
  familia_id: string;
  nombre: string;
  edad: number;
  genero: Chico["genero"];
  canal_tipo: Canal["tipo"];
  canal_destino: string | null;
  codigo_vinculacion: string | null;
  vinculado_en: string | null;
  // 🔑 El perfil es del chico desde el 17/8: el filtro va en su dispositivo,
  // no en el router de la casa. Ver `Chico` en tipos.ts.
  nextdns_profile_id: string | null;
  // 🔑 Corre la hora de la madrugada, como la edad. Ver `TurnoEscolar`.
  turno_escolar: Chico["turnoEscolar"] | null;
  activo: boolean;
  created_at: string;
};

type FilaAdulto = {
  id: string;
  familia_id: string;
  nombre: string;
  vinculo: AdultoResponsable["vinculo"];
  rol: AdultoResponsable["rol"] | null;
  elegido_por_el_chico: boolean;
  canal_tipo: Canal["tipo"];
  canal_destino: string | null;
  codigo_vinculacion: string | null;
  vinculado_en: string | null;
  created_at: string;
  activo: boolean | null;
  baja_en: string | null;
  baja_motivo: AdultoResponsable["bajaMotivo"] | null;
};

type FilaCharla = {
  id: string;
  familia_id: string;
  adulto_id: string | null;
  fecha: string;
  quien: TurnoDeCharla["quien"];
  texto: string;
  origen: TurnoDeCharla["origen"] | null;
  causa: TurnoDeCharla["causa"] | null;
};

/** Fila ⇄ Canal. El destino puede venir vacío: en Telegram llega al vincular. */
const aCanal = (f: {
  canal_tipo: Canal["tipo"];
  canal_destino: string | null;
  codigo_vinculacion: string | null;
  vinculado_en: string | null;
}): Canal => ({
  tipo: f.canal_tipo,
  destino: f.canal_destino ?? "",
  codigo: f.codigo_vinculacion ?? undefined,
  vinculado: f.vinculado_en ?? undefined,
});

const aFamilia = (f: FilaFamilia): Familia => ({
  id: f.id,
  nombre: f.nombre,
  token: f.token,
  activo: f.activo,
  notas: f.notas ?? undefined,
  creado: f.created_at,
});

const aChico = (c: FilaChico): Chico => ({
  id: c.id,
  familiaId: c.familia_id,
  nombre: c.nombre,
  edad: c.edad,
  genero: c.genero,
  canal: aCanal(c),
  turnoEscolar: c.turno_escolar ?? undefined,
  nextdnsProfileId: c.nextdns_profile_id ?? undefined,
  activo: c.activo,
  creado: c.created_at,
});

const aTurno = (t: FilaCharla): TurnoDeCharla => ({
  id: t.id,
  familiaId: t.familia_id,
  adultoId: t.adulto_id ?? undefined,
  fecha: t.fecha,
  quien: t.quien,
  texto: t.texto,
  origen: t.origen ?? undefined,
  causa: t.causa ?? undefined,
});

const aAdulto = (a: FilaAdulto): AdultoResponsable => ({
  id: a.id,
  familiaId: a.familia_id,
  nombre: a.nombre,
  vinculo: a.vinculo,
  // `?? "progenitor"` para filas anteriores a la columna. La migración las
  // corrige por `vinculo`; esto es sólo la red por si algo quedó sin pasar.
  rol: a.rol ?? "progenitor",
  elegidoPorElChico: a.elegido_por_el_chico,
  canal: aCanal(a),
  creado: a.created_at,
  // `?? true` para las filas anteriores a que existiera la columna: un adulto
  // sin dato no es un adulto dado de baja.
  activo: a.activo ?? true,
  bajaEn: a.baja_en ?? undefined,
  bajaMotivo: a.baja_motivo ?? undefined,
});

/* ── Repositorio ─────────────────────────────────────────────────────────── */

export class RepositorioSupabase implements Repositorio {
  readonly clase = "supabase" as const;

  constructor(private db: SupabaseClient) {}

  async crearFamilia(alta: AltaDeFamilia): Promise<FamiliaCompleta> {
    const { data: fila, error } = await this.db
      .from("familias")
      .insert({
        nombre: alta.nombre,
        token: generarToken(),
        notas: alta.notas ?? null,
      })
      .select()
      .single<FilaFamilia>();

    if (error || !fila) throw new Error(error?.message ?? "No se pudo crear la familia");
    const familia = aFamilia(fila);

    /* 🔑 Los dos caminos de alta —éste, por API, y el recorrido— escriben por
       la misma puerta. Cuando estaban duplicados, agregar el turno escolar
       significaba acordarse de tocar los dos. */
    const { chicos, adultos } = await this.insertarChicosYAdultos(
      familia.id,
      alta.chicos,
      alta.adultos,
    );

    return { familia, chicos, adultos };
  }

  /**
   * ───────────────────────────────────────────────────────────────────────────
   *  LA PUERTA DE LA CASA — primer paso del recorrido de alta (17/8)
   * ───────────────────────────────────────────────────────────────────────────
   *
   * 🔴 **Cierra el agujero de la auditoría:** hasta hoy el alta creaba familia,
   * chicos y adultos y ninguna cuenta, así que la familia quedaba afuera de su
   * propio panel. Las de Mariana y Carla se habían sembrado a mano.
   *
   * 🔑 **La clave se cifra acá y en ningún otro lado.** Entra en claro por el
   * pedido, sale hasheada a la base y no se devuelve nunca.
   */
  async crearHogar(alta: AltaDeHogar): Promise<ResultadoDeAlta> {
    const email = alta.email.trim().toLowerCase();

    /* 🔑 Se pregunta antes en vez de dejar reventar el índice único, porque a
       la persona hay que decirle CUÁL de las dos cosas pasó. Igual, si dos
       altas entran a la vez, la que pierde cae en el `insert` de abajo: el
       índice es el que manda, no esta consulta. */
    const { data: yaEsta } = await this.db
      .from("usuarios")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (yaEsta) return { ok: false, motivo: "email_tomado" };

    /* ── La familia: se crea, o se reusa la que ya está ──
       🔑 Reusarla es exactamente el caso de padres separados. La segunda casa
       NO crea una familia nueva: se cuelga de la misma, con otro `hogar`. */
    let familia: Familia;
    if (alta.familiaId) {
      const { data } = await this.db
        .from("familias")
        .select("*")
        .eq("id", alta.familiaId)
        .maybeSingle<FilaFamilia>();
      if (!data) throw new Error("La familia no existe");
      familia = aFamilia(data);

      const { data: ocupado } = await this.db
        .from("usuarios")
        .select("id")
        .eq("familia_id", familia.id)
        .eq("hogar", alta.hogar ?? "")
        .maybeSingle();
      if (ocupado) return { ok: false, motivo: "hogar_ocupado" };
    } else {
      const { data, error } = await this.db
        .from("familias")
        .insert({
          nombre: alta.nombreDeLaFamilia?.trim() || "Mi familia",
          token: generarToken(),
        })
        .select()
        .single<FilaFamilia>();
      if (error || !data) throw new Error(error?.message ?? "No se pudo crear la familia");
      familia = aFamilia(data);
    }

    const hash = await bcrypt.hash(alta.clave, 12);
    const { data: usuario, error } = await this.db
      .from("usuarios")
      .insert({
        email,
        password_hash: hash,
        /* 📌 El nombre de la cuenta es el de la casa, no el de una persona: la
           credencial es del hogar y la usan los dos progenitores. */
        nombre: familia.nombre,
        rol: "adulto",
        familia_id: familia.id,
        hogar: alta.hogar ?? null,
        /* 🔴 Qué versión de los términos aceptó y cuándo. Va en el MISMO insert
           que la cuenta, no en un update después: si el segundo paso fallara,
           quedaría una credencial viva sin ninguna aceptación detrás — que es
           justo el estado que estos campos existen para que no pase. */
        terminos_version: alta.terminosVersion,
        /* 🔑 La fecha acompaña a la versión o no va: una fecha de aceptación
           sin saber QUÉ se aceptó no prueba nada, y con `terminos_version` en
           null diría que alguien aceptó algo cuando no aceptó nada. */
        terminos_en: alta.terminosVersion ? new Date().toISOString() : null,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !usuario) {
      /* 23505 es la violación de índice único de Postgres: o el correo o la
         casa. Es la carrera que la consulta de arriba no puede evitar. */
      if (error?.code === "23505") {
        return {
          ok: false,
          motivo: error.message.includes("hogar") ? "hogar_ocupado" : "email_tomado",
        };
      }
      throw new Error(error?.message ?? "No se pudo crear la cuenta");
    }

    return { ok: true, familia, usuarioId: usuario.id };
  }

  /* ═══════════════════════════════════════════════════════════════════════
     LAS PUERTAS DE LA CASA — 20/8
     ═══════════════════════════════════════════════════════════════════════ */

  async puertasDe(familiaId: string): Promise<PuertaDeLaCasa[]> {
    const { data } = await this.db
      .from("usuarios")
      .select("id, email, hogar, ultimo_acceso, created_at")
      /* 🔐 Sólo cuentas de familia. Una de administración no pertenece a
         ninguna —lo dice el check `usuarios_familia_coherente`— así que esto
         no debería traer ninguna; el filtro está igual, porque una puerta de
         más en esta lista sería una puerta de más en la pantalla. */
      .eq("familia_id", familiaId)
      .eq("rol", "adulto")
      .order("created_at", { ascending: true })
      .returns<
        { id: string; email: string; hogar: string | null; ultimo_acceso: string | null; created_at: string }[]
      >();

    return (data ?? []).map((f) => ({
      id: f.id,
      email: f.email,
      hogar: f.hogar,
      ultimoAcceso: f.ultimo_acceso,
      creado: f.created_at,
    }));
  }

  async renombrarPuerta(familiaId: string, usuarioId: string, hogar: string): Promise<boolean> {
    const { data } = await this.db
      .from("usuarios")
      .update({ hogar: hogar.trim() })
      .eq("id", usuarioId)
      // 🔐 En el UPDATE, no en una comprobación aparte: una puerta de otra
      // familia simplemente no entra en la consulta.
      .eq("familia_id", familiaId)
      .select("id")
      .maybeSingle<{ id: string }>();

    return Boolean(data);
  }

  async cambiarClave(
    familiaId: string,
    usuarioId: string,
    actual: string,
    nueva: string,
  ): Promise<ResultadoDeCambioDeClave> {
    const { data: usuario } = await this.db
      .from("usuarios")
      .select("id, password_hash")
      .eq("id", usuarioId)
      .eq("familia_id", familiaId)
      .maybeSingle<{ id: string; password_hash: string }>();

    /* 📌 Se contesta lo mismo que si la clave estuviera mal. Una puerta que no
       existe y una clave equivocada son el mismo callejón para quien está del
       otro lado, y distinguirlos deja averiguar qué cuentas hay. */
    if (!usuario) return { ok: false, motivo: "clave_actual_no_coincide" };

    const ok = await bcrypt.compare(actual, usuario.password_hash);
    if (!ok) return { ok: false, motivo: "clave_actual_no_coincide" };

    // 12 vueltas, el mismo costo que en el alta. Ver `crearHogar`.
    const hash = await bcrypt.hash(nueva, 12);
    const { error } = await this.db
      .from("usuarios")
      .update({ password_hash: hash })
      .eq("id", usuarioId)
      .eq("familia_id", familiaId);

    if (error) throw new Error(error.message);
    return { ok: true };
  }

  async cerrarPuerta(familiaId: string, usuarioId: string): Promise<ResultadoDeCierre> {
    /* 🔴 `is("ultimo_acceso", null)` es lo que hace que esto NO pueda sacar a
       nadie del informe de su hijo. Va adentro del delete y no en una consulta
       previa: entre mirar y borrar hay un hueco, y en ese hueco la otra casa
       puede haber entrado por primera vez. Es el mismo criterio que la
       vinculación por código, que sólo sirve una vez. */
    const { data } = await this.db
      .from("usuarios")
      .delete()
      .eq("id", usuarioId)
      .eq("familia_id", familiaId)
      .is("ultimo_acceso", null)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (data) return { ok: true };

    /* No se borró: o no existe, o alguien ya entró. Son cosas distintas y se
       cuentan distinto — la segunda no es un error, es la regla. */
    const { data: existe } = await this.db
      .from("usuarios")
      .select("id")
      .eq("id", usuarioId)
      .eq("familia_id", familiaId)
      .maybeSingle<{ id: string }>();

    return { ok: false, motivo: existe ? "ya_se_uso" : "no_existe" };
  }

  async marcarAcceso(usuarioId: string): Promise<void> {
    await this.db
      .from("usuarios")
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq("id", usuarioId);
  }

  async registrarAcceso(a: Omit<AccesoRegistrado, "id" | "fecha">): Promise<void> {
    const { error } = await this.db.from("accesos").insert({
      familia_id: a.familiaId,
      usuario_id: a.usuarioId,
      hogar: a.hogar,
      que: a.que,
      detalle: a.detalle,
    });

    /* ⚠ Se avisa y se sigue. Este registro acompaña a un hecho que YA pasó —la
       clave ya cambió, la puerta ya se abrió—: hacer fallar el pedido porque no
       se pudo anotar dejaría a la persona creyendo que no pasó nada cuando sí
       pasó, que es peor que un registro con un agujero. */
    if (error) console.error("[accesos] no se pudo registrar:", error.message);
  }

  async accesosDe(familiaId: string, limite: number): Promise<AccesoRegistrado[]> {
    const { data } = await this.db
      .from("accesos")
      .select("id, familia_id, usuario_id, hogar, que, detalle, fecha")
      .eq("familia_id", familiaId)
      .order("fecha", { ascending: false })
      .limit(limite)
      .returns<
        {
          id: string;
          familia_id: string;
          usuario_id: string | null;
          hogar: string | null;
          que: string;
          detalle: string | null;
          fecha: string;
        }[]
      >();

    return (data ?? []).map((f) => ({
      id: f.id,
      familiaId: f.familia_id,
      usuarioId: f.usuario_id,
      hogar: f.hogar,
      que: f.que,
      detalle: f.detalle,
      fecha: f.fecha,
    }));
  }

  async universoObservado(): Promise<{ chicos: number; chicosConAlerta: number }> {
    /* 🔑 `head: true` con `count: exact`: cuenta en el servidor y no trae una
       sola fila. Acá no hace falta ningún dato de ningún chico — hace falta
       cuántos son. */
    const { count: chicos } = await this.db
      .from("chicos")
      .select("id", { count: "exact", head: true })
      .eq("activo", true);

    /* Cuántos chicos DISTINTOS tuvieron alguna alerta. Se traen los ids de las
       alertas y se cuentan únicos: son pocos por definición —una alerta es un
       hecho raro— y `count distinct` no existe en esta interfaz. */
    const { data: alertas } = await this.db
      .from("respuestas")
      .select("chico_id")
      .in("clase", ["alerta_adultos", "escalada_adultos"])
      .returns<{ chico_id: string }[]>();

    return {
      chicos: chicos ?? 0,
      chicosConAlerta: new Set((alertas ?? []).map((a) => a.chico_id)).size,
    };
  }

  /**
   * Los datos de la familia, ya adentro del recorrido.
   *
   * 🔴 **Reemplaza, no acumula.** El recorrido se puede rehacer, y si esto
   * sumara, volver atrás a corregir una edad dejaría dos chicos cargados.
   */
  async cargarDatosDeLaFamilia(
    familiaId: string,
    datos: DatosDeLaFamilia,
  ): Promise<FamiliaCompleta> {
    if (datos.nombre?.trim()) {
      const nombre = datos.nombre.trim();
      await this.db.from("familias").update({ nombre }).eq("id", familiaId);

      /* 🔴 **Y la cuenta también, o el panel saluda con otro nombre.** La
         credencial se crea antes que los datos, así que nace con un nombre
         provisorio; si esto no se actualizara, el encabezado diría «Familia
         Gómez» y abajo «entraste como Mi familia». Apareció probando el
         recorrido entero en el navegador, no en el typecheck.
         🔑 La cuenta es del HOGAR: su nombre es el de la casa, no el de una
         persona. Por eso se copia el de la familia y no se pregunta aparte. */
      await this.db.from("usuarios").update({ nombre }).eq("familia_id", familiaId);
    }

    /* 🔑 Los chicos se reemplazan de verdad: un chico cargado en una pasada
       anterior del recorrido no es historia que haya que conservar, es un error
       de tipeo. ⚠ Y `on delete cascade` se lleva sus señales, que es lo
       correcto: eran las de un chico que nunca existió. */
    await this.db.from("chicos").delete().eq("familia_id", familiaId);

    /* 🔴 Los adultos NO se borran: baja blanda. Sus observaciones son entrada
       del motor y borrarlas cambiaría lecturas que ya se hicieron. */
    await this.db
      .from("adultos")
      .update({ activo: false, baja_en: new Date().toISOString(), baja_motivo: "otro" })
      .eq("familia_id", familiaId)
      .eq("activo", true);

    await this.insertarChicosYAdultos(familiaId, datos.chicos, datos.adultos);

    const completa = await this.familiaPorId(familiaId);
    if (!completa) throw new Error("La familia no existe");
    return completa;
  }

  /** Lo que comparten `crearFamilia` y `cargarDatosDeLaFamilia`. */
  private async insertarChicosYAdultos(
    familiaId: string,
    chicos: AltaDeFamilia["chicos"],
    adultos: AltaDeFamilia["adultos"],
  ): Promise<{ chicos: Chico[]; adultos: AdultoResponsable[] }> {
    const { data: filasChicos } = await this.db
      .from("chicos")
      .insert(
        chicos.map((c) => ({
          familia_id: familiaId,
          nombre: c.nombre,
          edad: c.edad,
          genero: c.genero,
          // 🔑 Corre la hora de la madrugada, igual que la edad. Ver `pesos.ts`.
          turno_escolar: c.turnoEscolar ?? null,
          canal_tipo: c.canal.tipo,
          canal_destino: exigeVinculacion(c.canal.tipo) ? null : c.canal.destino,
          codigo_vinculacion: exigeVinculacion(c.canal.tipo) ? generarCodigo() : null,
          nextdns_profile_id: c.nextdnsProfileId ?? null,
        })),
      )
      .select()
      .returns<FilaChico[]>();

    const { data: filasAdultos } = await this.db
      .from("adultos")
      .insert(
        adultos.map((a) => ({
          familia_id: familiaId,
          nombre: a.nombre,
          vinculo: a.vinculo,
          rol: a.rol,
          elegido_por_el_chico: a.elegidoPorElChico,
          canal_tipo: a.canal.tipo,
          canal_destino: exigeVinculacion(a.canal.tipo) ? null : a.canal.destino,
          codigo_vinculacion: exigeVinculacion(a.canal.tipo) ? generarCodigo() : null,
        })),
      )
      .select()
      .returns<FilaAdulto[]>();

    return {
      chicos: (filasChicos ?? []).map(aChico),
      adultos: (filasAdultos ?? []).map(aAdulto),
    };
  }

  async familiaPorToken(token: string): Promise<FamiliaCompleta | null> {
    const { data } = await this.db
      .from("familias")
      .select("*")
      .eq("token", token)
      .maybeSingle<FilaFamilia>();
    return this.completar(data);
  }

  async familiaPorId(id: string): Promise<FamiliaCompleta | null> {
    const { data } = await this.db
      .from("familias")
      .select("*")
      .eq("id", id)
      .maybeSingle<FilaFamilia>();
    return this.completar(data);
  }

  /** Le cuelga los chicos y los adultos. Lo único que cambia es cómo se buscó. */
  private async completar(fila: FilaFamilia | null): Promise<FamiliaCompleta | null> {
    if (!fila) return null;
    const familia = aFamilia(fila);

    const [{ data: chicos }, { data: adultos }] = await Promise.all([
      this.db.from("chicos").select("*").eq("familia_id", familia.id).returns<FilaChico[]>(),
      this.db.from("adultos").select("*").eq("familia_id", familia.id).returns<FilaAdulto[]>(),
    ]);

    return {
      familia,
      chicos: (chicos ?? []).map(aChico),
      adultos: (adultos ?? []).map(aAdulto),
    };
  }

  async listarFamilias(): Promise<Familia[]> {
    const { data } = await this.db
      .from("familias")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<FilaFamilia[]>();
    return (data ?? []).map(aFamilia);
  }

  async cambiarEstado(id: string, activo: boolean): Promise<void> {
    await this.db.from("familias").update({ activo }).eq("id", id);
  }

  async darDeBajaAdulto(
    familiaId: string,
    adultoId: string,
    motivo: AdultoResponsable["bajaMotivo"] & string,
  ): Promise<AdultoResponsable | null> {
    const { data } = await this.db
      .from("adultos")
      .update({ activo: false, baja_en: new Date().toISOString(), baja_motivo: motivo })
      .eq("id", adultoId)
      // 🔐 El filtro por familia va en el UPDATE, no en una comprobación
      // aparte: si el adulto es de otra casa, la consulta no toca ninguna fila.
      .eq("familia_id", familiaId)
      .select("*")
      .maybeSingle<FilaAdulto>();

    return data ? aAdulto(data) : null;
  }

  async vincularPorCodigo(codigo: string, destino: string) {
    const buscado = codigo.trim().toUpperCase();
    const vinculado = new Date().toISOString();

    // 🔴 `is("vinculado_en", null)` es lo que hace que el código sirva UNA vez.
    // Sin eso, cualquiera que lo consiga se mete en el canal de una familia.
    for (const [tabla, quien] of [
      ["chicos", "chico"],
      ["adultos", "adulto"],
    ] as const) {
      const { data } = await this.db
        .from(tabla)
        .update({ canal_destino: destino, vinculado_en: vinculado })
        .eq("codigo_vinculacion", buscado)
        .is("vinculado_en", null)
        .select("nombre, familia_id")
        .maybeSingle<{ nombre: string; familia_id: string }>();

      if (data) return { quien, nombre: data.nombre, familiaId: data.familia_id };
    }
    return null;
  }

  async registrarSenales(senales: SenalRegistrada[]): Promise<void> {
    if (senales.length === 0) return;
    await this.db.from("senales").upsert(
      senales.map((s) => ({
        id: s.id,
        chico_id: s.chicoId,
        fecha: s.fecha,
        tipo: s.tipo,
        intensidad: s.intensidad,
        contexto: s.contexto ?? {},
        fuente: s.fuente,
      })),
      { onConflict: "id" },
    );
  }

  async senalesDe(chicoId: string, desde: string, hasta: string): Promise<SenalRegistrada[]> {
    const { data } = await this.db
      .from("senales")
      .select("*")
      .eq("chico_id", chicoId)
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .order("fecha")
      .returns<
        {
          id: string;
          chico_id: string;
          fecha: string;
          tipo: SenalRegistrada["tipo"];
          intensidad: number;
          contexto: SenalRegistrada["contexto"];
          fuente: SenalRegistrada["fuente"];
        }[]
      >();

    return (data ?? []).map((s) => ({
      id: s.id,
      chicoId: s.chico_id,
      fecha: s.fecha,
      tipo: s.tipo,
      intensidad: s.intensidad,
      contexto: s.contexto,
      fuente: s.fuente,
    }));
  }

  async registrarRespuesta(r: Omit<Respuesta, "id">): Promise<Respuesta> {
    const { data, error } = await this.db
      .from("respuestas")
      .insert({
        chico_id: r.chicoId,
        fecha: r.fecha,
        clase: r.clase,
        canal: r.canal,
        destino: r.destino,
        texto: r.texto,
        senales_que_la_sostienen: r.senalesQueLaSostienen,
        entregado: r.entregado,
        acuse_token: r.acuseToken ?? null,
        acusado_en: r.acusadoEn ?? null,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !data) throw new Error(error?.message ?? "No se pudo registrar la respuesta");
    return { ...r, id: data.id };
  }

  async respuestasDe(chicoId: string, desde: string, hasta: string): Promise<Respuesta[]> {
    const { data } = await this.db
      .from("respuestas")
      .select("*")
      .eq("chico_id", chicoId)
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .order("fecha")
      .returns<
        {
          id: string;
          chico_id: string;
          fecha: string;
          clase: Respuesta["clase"];
          canal: Respuesta["canal"];
          destino: string;
          texto: string;
          senales_que_la_sostienen: string[];
          entregado: boolean;
          acuse_token: string | null;
          acusado_en: string | null;
        }[]
      >();

    return (data ?? []).map((r) => ({
      id: r.id,
      chicoId: r.chico_id,
      fecha: r.fecha,
      clase: r.clase,
      canal: r.canal,
      destino: r.destino,
      texto: r.texto,
      senalesQueLaSostienen: r.senales_que_la_sostienen ?? [],
      entregado: r.entregado,
      acuseToken: r.acuse_token,
      acusadoEn: r.acusado_en,
    }));
  }

  /**
   * Marca que alguien apretó «Lo vi».
   *
   * 🔴 **De un solo uso, y lo garantiza la BASE, no el código.** El
   * `.is("acusado_en", null)` es lo que hace que el segundo toque no escriba
   * nada — mismo criterio que la vinculación por código. Comprobar antes y
   * escribir después sería una carrera: dos toques en el mismo segundo
   * pasarían los dos.
   */
  async marcarAcuse(token: string, cuando: string): Promise<Respuesta | null> {
    const { data } = await this.db
      .from("respuestas")
      .update({ acusado_en: cuando })
      .eq("acuse_token", token)
      .is("acusado_en", null)
      .select("*")
      .maybeSingle<{
        id: string;
        chico_id: string;
        fecha: string;
        clase: Respuesta["clase"];
        canal: Respuesta["canal"];
        destino: string;
        texto: string;
        senales_que_la_sostienen: string[];
        entregado: boolean;
        acuse_token: string | null;
        acusado_en: string | null;
      }>();

    if (!data) return null;
    return {
      id: data.id,
      chicoId: data.chico_id,
      fecha: data.fecha,
      clase: data.clase,
      canal: data.canal,
      destino: data.destino,
      texto: data.texto,
      senalesQueLaSostienen: data.senales_que_la_sostienen ?? [],
      entregado: data.entregado,
      acuseToken: data.acuse_token,
      acusadoEn: data.acusado_en,
    };
  }

  async registrarObservacion(o: Omit<ObservacionDelAdulto, "id">): Promise<ObservacionDelAdulto> {
    const { data, error } = await this.db
      .from("observaciones")
      .insert({
        chico_id: o.chicoId,
        adulto_id: o.adultoId,
        // Desde qué casa. Es un hecho: sale de la sesión, nunca del formulario.
        hogar: o.hogar ?? null,
        fecha: o.fecha,
        respuestas: o.respuestas,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !data) throw new Error(error?.message ?? "No se pudo registrar la observación");
    return { ...o, id: data.id };
  }

  async observacionesDe(
    chicoId: string,
    desde: string,
    hasta: string,
  ): Promise<ObservacionDelAdulto[]> {
    const { data } = await this.db
      .from("observaciones")
      .select("*")
      .eq("chico_id", chicoId)
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .order("fecha")
      .returns<
        {
          id: string;
          chico_id: string;
          adulto_id: string;
          hogar: string | null;
          fecha: string;
          respuestas: Record<string, number>;
        }[]
      >();

    return (data ?? []).map((o) => ({
      id: o.id,
      chicoId: o.chico_id,
      adultoId: o.adulto_id,
      hogar: o.hogar ?? null,
      fecha: o.fecha,
      respuestas: o.respuestas ?? {},
    }));
  }

  async guardarCharla(turnos: Omit<TurnoDeCharla, "id">[]): Promise<void> {
    if (turnos.length === 0) return;
    await this.db.from("charlas").insert(
      turnos.map((t) => ({
        familia_id: t.familiaId,
        adulto_id: t.adultoId ?? null,
        fecha: t.fecha,
        quien: t.quien,
        texto: t.texto,
        origen: t.origen ?? null,
        causa: t.causa ?? null,
      })),
    );
  }

  async charlaDe(familiaId: string, limite: number): Promise<TurnoDeCharla[]> {
    /* Se piden los ÚLTIMOS, así que la consulta va al revés y la lista se da
       vuelta acá. Pedir los primeros y cortar dejaría al adulto mirando el
       arranque de una charla vieja en vez de lo que acaba de preguntar. */
    const { data } = await this.db
      .from("charlas")
      .select("*")
      .eq("familia_id", familiaId)
      .order("fecha", { ascending: false })
      .limit(limite)
      .returns<FilaCharla[]>();

    return (data ?? []).map(aTurno).reverse();
  }

  async borrarCharla(familiaId: string): Promise<void> {
    // 🔐 El filtro por familia no es opcional: sin él, un `delete` sobre
    // `charlas` se lleva puestas las de todas las casas.
    await this.db.from("charlas").delete().eq("familia_id", familiaId);
  }
}
