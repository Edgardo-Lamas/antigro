/**
 * Repositorio sobre Supabase.
 *
 * Se usa cuando hay credenciales. Las columnas van en snake_case, que es lo que
 * espera Postgres; el dominio queda en camelCase. La traducción vive acá y en
 * ningún otro lado.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
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
} from "./tipos";
import type { AltaDeFamilia, Repositorio } from "./repositorio";

/* ── Traducción fila ⇄ dominio ───────────────────────────────────────────── */

type FilaFamilia = {
  id: string;
  nombre: string;
  token: string;
  activo: boolean;
  nextdns_profile_id: string | null;
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
  activo: boolean;
  created_at: string;
};

type FilaAdulto = {
  id: string;
  familia_id: string;
  nombre: string;
  vinculo: AdultoResponsable["vinculo"];
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
  nextdnsProfileId: f.nextdns_profile_id ?? undefined,
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
  activo: c.activo,
  creado: c.created_at,
});

const aAdulto = (a: FilaAdulto): AdultoResponsable => ({
  id: a.id,
  familiaId: a.familia_id,
  nombre: a.nombre,
  vinculo: a.vinculo,
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
        nextdns_profile_id: alta.nextdnsProfileId ?? null,
      })
      .select()
      .single<FilaFamilia>();

    if (error || !fila) throw new Error(error?.message ?? "No se pudo crear la familia");
    const familia = aFamilia(fila);

    const { data: chicos } = await this.db
      .from("chicos")
      .insert(
        alta.chicos.map((c) => ({
          familia_id: familia.id,
          nombre: c.nombre,
          edad: c.edad,
          genero: c.genero,
          canal_tipo: c.canal.tipo,
          canal_destino: exigeVinculacion(c.canal.tipo) ? null : c.canal.destino,
          codigo_vinculacion: exigeVinculacion(c.canal.tipo) ? generarCodigo() : null,
        })),
      )
      .select()
      .returns<FilaChico[]>();

    const { data: adultos } = await this.db
      .from("adultos")
      .insert(
        alta.adultos.map((a) => ({
          familia_id: familia.id,
          nombre: a.nombre,
          vinculo: a.vinculo,
          elegido_por_el_chico: a.elegidoPorElChico,
          canal_tipo: a.canal.tipo,
          canal_destino: exigeVinculacion(a.canal.tipo) ? null : a.canal.destino,
          codigo_vinculacion: exigeVinculacion(a.canal.tipo) ? generarCodigo() : null,
        })),
      )
      .select()
      .returns<FilaAdulto[]>();

    return {
      familia,
      chicos: (chicos ?? []).map(aChico),
      adultos: (adultos ?? []).map(aAdulto),
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
    }));
  }

  async registrarObservacion(o: Omit<ObservacionDelAdulto, "id">): Promise<ObservacionDelAdulto> {
    const { data, error } = await this.db
      .from("observaciones")
      .insert({
        chico_id: o.chicoId,
        adulto_id: o.adultoId,
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
          fecha: string;
          respuestas: Record<string, number>;
        }[]
      >();

    return (data ?? []).map((o) => ({
      id: o.id,
      chicoId: o.chico_id,
      adultoId: o.adulto_id,
      fecha: o.fecha,
      respuestas: o.respuestas ?? {},
    }));
  }
}
