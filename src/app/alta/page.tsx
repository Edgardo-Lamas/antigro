import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { repositorio } from "@/lib/datos";
import Recorrido from "./Recorrido";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL RECORRIDO DE ALTA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Edgardo describió la secuencia de producción: *"accede al enlace, elige la
 *  suscripción, paga la suscripción y luego el sistema lo lleva en un recorrido
 *  de pantallas para cargar los datos"*. Y la del CoderCup, que es la misma sin
 *  el pago: *"abre el enlace, llega al panel de logueo, crea credenciales, y
 *  accede al mismo recorrido pero sin pagar. Ve el simulador y luego la carga de
 *  datos"*.
 *
 *  🔑 **Por eso el simulador va ANTES de pedir un solo dato.** Nadie carga la
 *  edad de su hijo en un sistema que todavía no vio funcionar, y el jurado
 *  tampoco. Primero se muestra qué hace; después se pregunta.
 *
 *  🔴 **La familia sale de la sesión.** Acá ya hay credencial —se creó en
 *  `/entrar`— y lo que falta es quién vive en la casa.
 */

export const dynamic = "force-dynamic";

export default async function Alta() {
  const sesion = await auth();
  const usuario = sesion?.user as { rol?: string; familiaId?: string } | undefined;

  // El middleware ya redirige; el recorrido no depende de eso para cerrarse.
  if (!sesion?.user) redirect("/entrar");
  if (usuario?.rol !== "adulto" || !usuario.familiaId) redirect("/panel");

  const datos = await repositorio().familiaPorId(usuario.familiaId);

  /**
   * 📌 Se pasa lo que YA hay cargado para poder rehacer el recorrido sin
   * escribir todo de nuevo. Alguien se equivoca en la edad, vuelve, y encuentra
   * sus datos donde los dejó.
   */
  const chico = datos?.chicos.find((c) => c.activo) ?? datos?.chicos[0];

  return (
    <Recorrido
      nombreDeLaFamilia={datos?.familia.nombre ?? ""}
      familiaId={usuario.familiaId}
      yaCargado={
        chico
          ? {
              nombre: chico.nombre,
              edad: chico.edad,
              genero: chico.genero,
              turnoEscolar: chico.turnoEscolar,
              perfil: chico.nextdnsProfileId ?? "",
              adultos: (datos?.adultos ?? [])
                .filter((a) => a.activo)
                .map((a) => ({
                  nombre: a.nombre,
                  vinculo: a.vinculo,
                  rol: a.rol,
                  elegidoPorElChico: a.elegidoPorElChico,
                  canal: a.canal.tipo,
                  destino: a.canal.destino,
                })),
            }
          : null
      }
    />
  );
}
