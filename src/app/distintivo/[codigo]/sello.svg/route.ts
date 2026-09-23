import { centroPorDistintivo } from "@/lib/centros/datos";
import { selloSvg } from "@/lib/centros/distintivo";
import { SITIO } from "@/lib/config";

/**
 * El sello que el centro pone en su web.
 *
 * 🔴 **Se genera en cada pedido y no se cachea largo:** si el centro deja de
 * participar, el sello tiene que decirlo la próxima vez que alguien abra su
 * web, no dentro de un mes.
 */
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { codigo: string } }) {
  const centro = await centroPorDistintivo(params.codigo);
  if (!centro) return new Response("No existe ese distintivo.", { status: 404 });

  const direccion = `${SITIO.replace(/^https?:\/\//, "")}/distintivo/${centro.distintivo}`;
  return new Response(selloSvg({ centro: centro.nombre, vigente: centro.activo, direccion }), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
