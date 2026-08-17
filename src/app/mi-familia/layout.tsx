import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { repositorio } from "@/lib/datos";

/**
 * 🔐 La segunda línea de defensa del panel de la familia.
 *
 * El middleware ya redirige, pero esta pantalla no depende de eso — el mismo
 * criterio que en `/panel`. **Y acá no es una precaución teórica:** el 16/8 se
 * descubrió que `middleware.ts` estaba en la raíz del proyecto y este proyecto
 * usa carpeta `src/`, así que Next nunca lo compiló. Durante todo ese tiempo la
 * única protección real del panel de administración fue esta comprobación
 * dentro de la página.
 *
 * 📌 Va en un `layout` y no en la página porque la página es un componente de
 * cliente: la comprobación tiene que pasar en el servidor, antes de mandar nada.
 */
export default async function LayoutDeMiFamilia({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await auth();
  const usuario = sesion?.user as { rol?: string; familiaId?: string } | undefined;

  if (!sesion?.user) redirect("/entrar");
  // Una cuenta de administración no pertenece a ninguna familia: acá no hay
  // nada coherente que mostrarle.
  if (usuario?.rol !== "adulto") redirect("/panel");

  /**
   * 🔴 **Una familia recién creada no tiene chico, y un panel vacío no le
   * explica nada a nadie.** La credencial se crea en `/entrar` y los datos se
   * cargan en el recorrido; entre las dos cosas hay un rato en que la familia
   * existe y está hueca. Ahí el lugar correcto no es el panel: es el recorrido,
   * que sabe qué preguntar y en qué orden.
   *
   * 🔑 Es la misma condición dura que ya declaraba `loQueImpideTrabajar`: sin
   * chico no hay nada que mirar. Acá se vuelve una puerta en vez de un cartel.
   */
  if (usuario.familiaId) {
    const datos = await repositorio().familiaPorId(usuario.familiaId);
    if (!datos?.chicos.some((c) => c.activo)) redirect("/alta");
  }

  return <>{children}</>;
}
