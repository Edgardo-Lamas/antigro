import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { BadgeCheck, BellRing, BookOpen, School, Users } from "lucide-react";
import { auth } from "@/auth";
import { avisosDe, centroPorId, familiasDelCentro } from "@/lib/centros/datos";
import { codigoParaInsertar } from "@/lib/centros/distintivo";
import { ALUMNOS_MINIMOS_EN_EL_CENTRO, ALUMNOS_MINIMOS_POR_LUGAR } from "@/lib/centros/patrones";
import { PRODUCTO, SITIO } from "@/lib/config";
import { enlaceDeVinculacion } from "@/lib/mensajeria/vinculacion";
import { LOCALE_DEL_PAIS, type Pais } from "@/lib/paises";
import { obtenerFuente } from "@/lib/senales";
import { Copiar, Salir } from "./Botones";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL PANEL DEL CENTRO EDUCATIVO — 23/9
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Lo que ve el coordinador de bienestar y protección de una escuela que
 *  contrató AntiGro. Cuatro cosas, en el orden en que las usa:
 *    1. Los avisos: los patrones de su comunidad. Lo primero, porque es para lo
 *       que entra.
 *    2. Sus familias: cuántas activaron la licencia, y el enlace para invitar.
 *    3. Su canal: el Telegram por el que le llegan los avisos.
 *    4. El distintivo, para su web.
 *
 *  🔴 **En ningún lugar de esta pantalla aparece un alumno ni una familia.** Un
 *  número de familias que activaron, y avisos que son un sitio y un número. Si
 *  algún día alguien quiere agregar «qué familias activaron», está pidiendo lo
 *  que el centro promete no tener.
 */

export const dynamic = "force-dynamic";

const MATERIAL: Record<Pais, { nombre: string; de: string; url: string }[]> = {
  ES: [
    {
      nombre: "Decálogo de mediación parental y educación digital",
      de: "INCIBE",
      url: "https://www.incibe.es/menores/familias/decalogo-mediacion-parental-familias",
    },
    {
      nombre: "Cómo actuar si un menor está en situación de riesgo",
      de: "Fundación ANAR",
      url: "https://www.anar.org/soluciones-anar/consejos/decalogo-anar-sobre-como-actuar-si-un-menor-de-edad-esta-en-situacion-de-riesgo/",
    },
    {
      nombre: "Teléfono ANAR de la Familia y los Centros Escolares",
      de: "Fundación ANAR",
      url: "https://www.anar.org/telefono-anar-familia-y-centros-escolares/",
    },
  ],
  AR: [
    {
      nombre: "Guía para padres, familias y docentes sobre grooming",
      de: "Ministerio de Justicia — Con Vos en la Web",
      url: "https://www.argentina.gob.ar/justicia/convosenlaweb/situaciones/guia-para-padres-familias-y-docentes-grooming",
    },
  ],
};

function Titulo({ icono, children }: { icono: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-acento">
      {icono}
      {children}
    </h2>
  );
}

export default async function PanelDelCentro() {
  const sesion = await auth();
  const centroId = (sesion?.user as { centroId?: string } | undefined)?.centroId;
  if (!centroId) redirect("/entrar");

  const centro = await centroPorId(centroId);
  if (!centro) redirect("/entrar");

  const [familias, avisos, { simulada }] = await Promise.all([
    familiasDelCentro(centro.id),
    avisosDe(centro.id),
    obtenerFuente("normal"),
  ]);

  const invitacion = `${SITIO}/entrar?i=${centro.codigo}`;
  const enlaceTelegram = centro.codigoVinculacion
    ? enlaceDeVinculacion(centro.codigoVinculacion)
    : null;
  const qr =
    enlaceTelegram && !centro.canalDestino
      ? await QRCode.toString(enlaceTelegram, {
          type: "svg",
          margin: 2,
          errorCorrectionLevel: "H",
          /* 🔴 Oscuro sobre claro aunque la página sea oscura: hay teléfonos
             que no leen un QR en negativo. */
          color: { dark: "#0D1117", light: "#FFFFFF" },
        })
      : null;

  const verificacion = `${SITIO}/distintivo/${centro.distintivo}`;
  const sello = `${SITIO}/distintivo/${centro.distintivo}/sello.svg`;
  const fecha = (iso: string) =>
    new Date(iso).toLocaleDateString(LOCALE_DEL_PAIS[centro.pais], {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="flex items-start justify-between gap-4 border-b border-borde pb-6">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">
            <School size={13} /> {PRODUCTO} · centro educativo
          </p>
          <h1 className="mt-3 text-2xl font-bold text-tinta">{centro.nombre}</h1>
          {centro.coordinador && (
            <p className="mt-1 text-sm text-tenue">Coordinación: {centro.coordinador}</p>
          )}
        </div>
        <Salir />
      </header>

      {/* ── 1. Los avisos ─────────────────────────────────────────────────── */}
      <section className="mt-8">
        <Titulo icono={<BellRing size={14} />}>Avisos sobre su comunidad</Titulo>
        <p className="mt-2 text-sm leading-relaxed text-tenue">
          El centro recibe un aviso cuando un mismo sitio que merece atención aparece entre al
          menos {ALUMNOS_MINIMOS_POR_LUGAR} alumnos distintos. Siempre es un número: nunca se
          identifica a ningún alumno ni a ninguna familia, y el centro actúa hacia toda su
          comunidad.
        </p>

        {avisos.length === 0 ? (
          <div className="mt-4 rounded-lg border border-borde bg-superficie px-5 py-4 text-sm leading-relaxed text-tenue">
            {simulada ? (
              <>
                Todavía no hay avisos. El sistema está funcionando con{" "}
                <strong className="text-tinta">datos de demostración</strong>, y sobre datos
                inventados no se le avisa nada a un centro real.
              </>
            ) : (
              <>
                Sin avisos. Para que el sistema pueda comparar hacen falta al menos{" "}
                {ALUMNOS_MINIMOS_EN_EL_CENTRO} alumnos con {PRODUCTO} activo: con menos, un número
                podría señalar a alguien.
              </>
            )}
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {avisos.map((a) => (
              <li key={a.id} className="rounded-lg border border-borde bg-superficie px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-mono text-sm text-tinta">{a.dominio}</p>
                  <p className="shrink-0 text-xs text-apagado">{fecha(a.fecha)}</p>
                </div>
                <p className="mt-1 text-sm text-tinta">
                  {a.alumnos} alumnos distintos en los últimos días.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-tenue">Por qué: {a.porQue}.</p>
                <p className="mt-2 text-xs text-apagado">
                  {a.entregado
                    ? "Enviado por Telegram."
                    : "No salió por Telegram: el canal del centro todavía no está conectado."}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 rounded-lg border border-borde px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-medium text-tinta">
            <BookOpen size={14} className="text-acento" /> Material oficial para las familias
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {MATERIAL[centro.pais].map((m) => (
              <li key={m.url}>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-tenue underline decoration-borde underline-offset-4 transition hover:text-acento"
                >
                  {m.nombre}
                </a>{" "}
                <span className="text-apagado">· {m.de}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 2. Las familias ───────────────────────────────────────────────── */}
      <section className="mt-10">
        <Titulo icono={<Users size={14} />}>Sus familias</Titulo>
        <p className="mt-3 text-3xl font-bold text-tinta">
          {familias} <span className="text-base font-normal text-tenue">de {centro.licencias} licencias activadas</span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-tenue">
          Cada familia activa y gestiona su propio panel. El centro sabe cuántas activaron,
          nunca cuáles.
        </p>
        <p className="mt-4 text-sm text-tinta">Enlace para invitar a las familias:</p>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-borde bg-superficie px-3 py-2">
          <code className="min-w-0 flex-1 truncate text-xs text-tenue">{invitacion}</code>
          <Copiar texto={invitacion} />
        </div>
      </section>

      {/* ── 3. El canal ───────────────────────────────────────────────────── */}
      <section className="mt-10">
        <Titulo icono={<BellRing size={14} />}>Dónde le llegan los avisos</Titulo>
        {centro.canalDestino ? (
          <p className="mt-3 text-sm leading-relaxed text-tenue">
            Telegram conectado
            {centro.vinculado ? ` desde el ${fecha(centro.vinculado)}` : ""}. Los avisos llegan
            ahí y quedan también en esta pantalla.
          </p>
        ) : enlaceTelegram ? (
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
            {qr && (
              <div
                className="h-36 w-36 shrink-0 overflow-hidden rounded-lg"
                /* 🔐 El SVG lo dibuja el propio servidor a partir de un enlace
                   nuestro: no hay texto de nadie adentro. */
                dangerouslySetInnerHTML={{ __html: qr }}
              />
            )}
            <div className="text-sm leading-relaxed text-tenue">
              <p>
                Escanee el código desde el teléfono de coordinación, o abra{" "}
                <a
                  href={enlaceTelegram}
                  className="text-acento underline underline-offset-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  este enlace
                </a>
                , y apriete «Iniciar» en Telegram. Es un solo toque.
              </p>
              <p className="mt-2 text-xs text-apagado">
                Mientras no esté conectado, los avisos quedan en esta pantalla igual.
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-tenue">
            El canal de Telegram del sistema no está configurado todavía. Los avisos quedan en esta
            pantalla.
          </p>
        )}
      </section>

      {/* ── 4. El distintivo ──────────────────────────────────────────────── */}
      <section className="mt-10 pb-6">
        <Titulo icono={<BadgeCheck size={14} />}>El distintivo del centro</Titulo>
        <p className="mt-2 text-sm leading-relaxed text-tenue">
          Para su web. El sello lleva a una página de {PRODUCTO} que confirma, en el momento en que
          alguien la abre, que el centro participa.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/distintivo/${centro.distintivo}/sello.svg`}
          alt={`${centro.nombre} participa en ${PRODUCTO}`}
          width={360}
          height={104}
          className="mt-4 max-w-full"
        />
        <p className="mt-4 text-sm text-tinta">Código para insertar en la web del centro:</p>
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-borde bg-superficie px-3 py-2">
          <code className="min-w-0 flex-1 break-all text-xs text-tenue">
            {codigoParaInsertar({ centro: centro.nombre, paginaDeVerificacion: verificacion, imagen: sello })}
          </code>
          <Copiar
            texto={codigoParaInsertar({
              centro: centro.nombre,
              paginaDeVerificacion: verificacion,
              imagen: sello,
            })}
          />
        </div>
        <a
          href={`/distintivo/${centro.distintivo}`}
          target="_blank"
          className="mt-3 inline-block text-xs text-tenue underline decoration-borde underline-offset-4 hover:text-acento"
        >
          Ver la página de verificación
        </a>
      </section>
    </main>
  );
}
