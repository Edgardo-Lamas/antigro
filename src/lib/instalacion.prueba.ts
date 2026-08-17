/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA INSTALACIÓN, CON SUS CASOS — `npm run probar-instalacion`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Acá el error no se ve.** Un DNS mal escrito no rompe nada: el aparato
 *  pregunta a otro lado, la familia queda creyendo que está protegida y el motor
 *  no recibe una sola señal — que se lee igual que «todo tranquilo». No hay
 *  pantalla roja, no hay excepción, no hay nada. Por eso los endpoints se
 *  comprueban letra por letra contra lo que dice la fuente.
 *
 *  Fuentes verificadas el 17/8:
 *  · `https://dns.nextdns.io/<id>` — https://apple.nextdns.io/
 *  · `<id>.dns.nextdns.io` — help.nextdns.io (DNS privado de Android)
 */

import {
  APARATOS,
  COMPROBACION,
  endpointDoH,
  etiquetaDeAparato,
  guiaPara,
  hostDnsPrivado,
  perfilApple,
  scriptWindows,
  type Aparato,
} from "./instalacion.ts";

const PERFIL = "a1b2c3";

let fallaron = 0;
function comprobar(nombre: string, condicion: boolean, detalle?: string) {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) {
    fallaron++;
    if (detalle) console.log(`    ${detalle}`);
  }
}

/* ── Los endpoints, que es donde un error no se ve ──────────────────────── */

comprobar(
  "🔴 DoH: el id va en la RUTA, no de subdominio",
  endpointDoH(PERFIL) === "https://dns.nextdns.io/a1b2c3",
  `salió: ${endpointDoH(PERFIL)}`,
);

comprobar(
  "DoH con etiqueta de aparato",
  endpointDoH(PERFIL, "telefono") === "https://dns.nextdns.io/a1b2c3/telefono",
  `salió: ${endpointDoH(PERFIL, "telefono")}`,
);

comprobar(
  "🔴 DNS privado de Android: el id va de SUBDOMINIO, al revés que el otro",
  hostDnsPrivado(PERFIL) === "a1b2c3.dns.nextdns.io",
  `salió: ${hostDnsPrivado(PERFIL)}`,
);

comprobar(
  "el host de Android NO lleva https:// — Android pide un nombre, no una dirección",
  !hostDnsPrivado(PERFIL).includes("://"),
);

/* ── La etiqueta no puede llevar el nombre del chico ────────────────────── */

comprobar(
  "🔴 ninguna etiqueta de aparato lleva un nombre de persona",
  APARATOS.every((a) => /^[a-z]+$/.test(etiquetaDeAparato(a.id))),
  APARATOS.map((a) => etiquetaDeAparato(a.id)).join(", "),
);

/* ── El perfil de Apple ─────────────────────────────────────────────────── */

const apple = perfilApple({ perfil: PERFIL, aparato: "iphone" });

comprobar("el perfil de Apple es un plist con la cabecera correcta", apple.startsWith("<?xml"));
comprobar(
  "lleva el endpoint completo adentro",
  apple.includes("https://dns.nextdns.io/a1b2c3/telefono"),
);
comprobar("declara el protocolo HTTPS", apple.includes("<string>HTTPS</string>"));
comprobar(
  "🔴 NO se declara imposible de quitar — la regla 3 dice que el chico lo sabe",
  apple.includes("<key>PayloadRemovalDisallowed</key>\n  <false/>"),
);

const otraVez = perfilApple({ perfil: PERFIL, aparato: "iphone" });
comprobar(
  "🔴 dos descargas dan el MISMO perfil — si no, se apilan en el teléfono",
  apple === otraVez,
);

const otroAparato = perfilApple({ perfil: PERFIL, aparato: "mac" });
comprobar("aparatos distintos dan perfiles distintos", apple !== otroAparato);

const otroPerfil = perfilApple({ perfil: "z9y8x7", aparato: "iphone" });
comprobar(
  "🔴 familias distintas dan UUID distintos",
  !otroPerfil.includes(apple.match(/<key>PayloadUUID<\/key>\s*<string>([^<]+)/)?.[1] ?? "nunca"),
);

comprobar(
  "el texto que ve el padre dice que no se leen mensajes",
  apple.includes("No lee mensajes"),
);

/* ── Las guías ──────────────────────────────────────────────────────────── */

for (const a of APARATOS) {
  const g = guiaPara(a.id, PERFIL);
  comprobar(`${a.nombre}: tiene pasos`, g.pasos.length > 0);
}

const router = guiaPara("router", PERFIL);
comprobar(
  "🔴 la del router avisa que NO alcanza — es la advertencia más importante",
  Boolean(router.advertencia?.includes("NO alcanza")),
);
comprobar(
  "🔴 y explica que se pierde la madrugada por los datos móviles",
  Boolean(
    router.advertencia?.includes("datos móviles") && router.advertencia?.includes("madrugada"),
  ),
);

/* 🔴 Sin comprobación, una instalación fallida se ve igual que una que anduvo.
   Va en TODOS los caminos donde el aparato queda configurado. */
for (const id of ["iphone", "android", "windows", "mac"] as Aparato[]) {
  const g = guiaPara(id, PERFIL);
  comprobar(
    `${g.nombre}: termina mandando a comprobar`,
    g.pasos.some((p) => p.includes(COMPROBACION)),
  );
}

/* ── El script de Windows ───────────────────────────────────────────────── */

const bat = scriptWindows(PERFIL);
comprobar("el .bat exige administrador antes de tocar nada", bat.includes("net session"));
comprobar("el .bat manda a comprobar al final", bat.includes(COMPROBACION));
comprobar("el .bat dice que no lee mensajes", bat.includes("No lee mensajes"));

console.log(`\n${fallaron === 0 ? "todo bien" : `${fallaron} fallaron`}`);
if (fallaron > 0) process.exit(1);
