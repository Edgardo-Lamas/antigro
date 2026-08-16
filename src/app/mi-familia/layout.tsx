import { redirect } from "next/navigation";
import { auth } from "@/auth";

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
  const rol = (sesion?.user as { rol?: string } | undefined)?.rol;

  if (!sesion?.user) redirect("/entrar");
  // Una cuenta de administración no pertenece a ninguna familia: acá no hay
  // nada coherente que mostrarle.
  if (rol !== "adulto") redirect("/panel");

  return <>{children}</>;
}
