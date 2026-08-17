/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA INSTALACIÓN — qué se instala, dónde, y por qué ahí (17/8/2026)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **AntiGro no se instala: se cambia el DNS.** No hay una app que espíe, no
 *  hay nada que se meta en el teléfono a mirar mensajes. En el teléfono del
 *  chico se cambia **una sola cosa**: a quién le pregunta dónde queda cada
 *  página que abre. Hoy se lo pregunta a la empresa de internet; con AntiGro se
 *  lo pregunta a **NextDNS**, que además de contestar deja anotado qué se
 *  consultó y a qué hora. Nada más.
 *
 *  ⚠ **Esto de acá arriba es la explicación TÉCNICA, para quien programa.** La
 *  que lee un padre vive en `COMO_FUNCIONA` (`config.ts`) y está en criollo:
 *  Edgardo frenó la versión vieja el 17/8 porque hablaba de «el aparato», «un
 *  servidor de nombres» y «ese servidor» sin decir nunca cuál. **Si hay que
 *  cambiar lo que se le cuenta a la familia, se cambia allá, no acá.**
 *
 *  Contarlo así, primero, es lo que hace que la regla 3 sea un paso concreto y
 *  no una promesa.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  🔑 **VA EN EL APARATO DEL CHICO, NO EN EL ROUTER.** Es la decisión.
 *  ─────────────────────────────────────────────────────────────────────────
 *
 *  Salió de una pregunta de Edgardo el 17/8 que parecía de otro tema: si los
 *  padres están separados y el chico pasa una quincena en cada casa, ¿qué pasa
 *  con el filtro instalado en una sola? Y ya estaba resuelto en Red Familiar —de
 *  su `CLAUDE.md`: *"NextDNS es la única opción que protege los celulares fuera
 *  del hogar; Pi-hole cubre únicamente la red del hogar"*.
 *
 *  🔴 **Y es más grave que las dos casas.** El router **no ve los datos
 *  móviles**. La actividad de madrugada es una de las dos únicas señales
 *  absolutas del motor, y un chico a las 3 de la mañana en su cuarto está tanto
 *  en el WiFi como en su plan de datos. Con el filtro sólo en el router, AntiGro
 *  queda ciego exactamente a la hora que más significa — **y ni se entera**: no
 *  recibe «nada», que es indistinguible de «todo tranquilo».
 *
 *  ⚠ En Red Familiar la protección fuera del hogar era el abono más caro. Acá
 *  **no puede ser un extra: es el piso.** Sin eso el motor no tiene con qué
 *  trabajar.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  📌 Lo que se hereda de Red Familiar es la FORMA, no el contenido.
 *  ─────────────────────────────────────────────────────────────────────────
 *
 *  Sus cuatro archivos (`rodos-3/public/tools/`) apuntan a **Cloudflare
 *  Family** (`1.1.1.3`), no a NextDNS: eran las herramientas gratuitas de la
 *  landing. Cloudflare Family filtra bien y **no reporta nada**, así que para
 *  AntiGro no sirve — el motor no lee lo que se bloqueó, lee lo que pasó.
 *  Lo aprovechable es la mecánica, que está bien: perfil de Apple con DNS sobre
 *  HTTPS, DNS privado de Android, script que fija el DNS en Windows.
 *
 *  Fuentes de los endpoints, verificadas el 17/8 (no de memoria):
 *  · DoH para Apple → `https://dns.nextdns.io/<id>` — https://apple.nextdns.io/
 *  · DNS privado de Android → `<id>.dns.nextdns.io` — help.nextdns.io
 *  · Comprobación → https://test.nextdns.io/ devuelve JSON con `status`.
 */

/** Los aparatos por los que se pregunta. */
export type Aparato = "iphone" | "android" | "windows" | "mac" | "router";

export const APARATOS: { id: Aparato; nombre: string }[] = [
  { id: "iphone", nombre: "iPhone o iPad" },
  { id: "android", nombre: "Android" },
  { id: "windows", nombre: "Windows" },
  { id: "mac", nombre: "Mac" },
  { id: "router", nombre: "El router de casa" },
];

/**
 * 🔑 La dirección donde se comprueba que quedó andando.
 *
 * 🔴 **No es un adorno: acá el fallo es SILENCIOSO.** Un DNS mal configurado no
 * da error, no muestra un cartel y no rompe nada — el aparato simplemente
 * pregunta a otro lado. La familia queda creyendo que está protegida y el motor
 * no recibe una sola señal, que se lee igual que «todo tranquilo». Por eso la
 * comprobación es un paso de la instalación y no una sugerencia al final.
 *
 * Devuelve `{"status":"unconfigured"}` si no quedó, y el id del perfil si sí.
 */
export const COMPROBACION = "https://test.nextdns.io/";

/* ── Los endpoints ───────────────────────────────────────────────────────── */

/**
 * Etiqueta del aparato, que NextDNS muestra en su panel.
 *
 * ⚠ **Nunca lleva el nombre del chico.** Es una etiqueta que viaja a un tercero,
 * y el nombre de una criatura no tiene por qué salir del sistema para que
 * funcione. Con «telefono» o «tablet» alcanza para lo único que sirve: saber
 * desde qué aparato salió la señal.
 */
export function etiquetaDeAparato(aparato: Aparato): string {
  return { iphone: "telefono", android: "telefono", windows: "compu", mac: "compu", router: "casa" }[
    aparato
  ];
}

/** DNS sobre HTTPS — el que va en el perfil de Apple y en Windows moderno. */
export function endpointDoH(perfil: string, etiqueta?: string): string {
  const base = `https://dns.nextdns.io/${perfil}`;
  return etiqueta ? `${base}/${etiqueta}` : base;
}

/** El nombre que se escribe en «DNS privado» de Android. */
export function hostDnsPrivado(perfil: string): string {
  return `${perfil}.dns.nextdns.io`;
}

/* ── El perfil de Apple ──────────────────────────────────────────────────── */

/**
 * UUID estable a partir de un texto.
 *
 * 🔑 **Estable a propósito.** Si cada descarga trajera UUIDs nuevos, el iPhone
 * las trataría como perfiles distintos y se irían apilando uno arriba del otro.
 * Volver a bajarlo tiene que reemplazar el que hay, no sumar otro.
 *
 * 📌 No es criptográfico y no tiene por qué serlo: acá un UUID sólo tiene que
 * ser distinto del de al lado y el mismo la próxima vez.
 */
function uuidEstable(texto: string): string {
  const h = new Uint32Array(4);
  for (let i = 0; i < 4; i++) {
    let x = 0x811c9dc5 + i * 0x01000193;
    for (let j = 0; j < texto.length; j++) {
      x ^= texto.charCodeAt(j) + i;
      x = Math.imul(x, 0x01000193) >>> 0;
    }
    h[i] = x >>> 0;
  }
  const hex = Array.from(h, (n) => n.toString(16).padStart(8, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ]
    .join("-")
    .toUpperCase();
}

/** Escapa lo que va adentro de una etiqueta XML del plist. */
function xml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * El `.mobileconfig` para iPhone, iPad y Mac.
 *
 * ⚠ `PayloadRemovalDisallowed` va en **false**, y es deliberado. Trabarlo desde
 * el perfil no sirve de nada —se saca igual reseteando— y contradice la regla 3:
 * el chico sabe que esto existe. Si la familia quiere que no se pueda quitar,
 * el camino es Screen Time con clave, que es una decisión de ellos y se explica
 * como lo que es. Un perfil que finge ser inarrancable es peor que uno honesto.
 */
export function perfilApple(entrada: { perfil: string; aparato: Aparato }): string {
  const etiqueta = etiquetaDeAparato(entrada.aparato);
  const url = endpointDoH(entrada.perfil, etiqueta);
  const id = `ar.antigro.dns.${entrada.perfil}.${etiqueta}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>DNSSettings</key>
      <dict>
        <key>DNSProtocol</key>
        <string>HTTPS</string>
        <key>ServerURL</key>
        <string>${xml(url)}</string>
      </dict>
      <key>PayloadDescription</key>
      <string>AntiGro mira horarios y cuánto se usa internet. No lee mensajes, ni los guarda, ni puede verlos.</string>
      <key>PayloadDisplayName</key>
      <string>AntiGro — DNS</string>
      <key>PayloadIdentifier</key>
      <string>${xml(id)}.payload</string>
      <key>PayloadType</key>
      <string>com.apple.dnsSettings.managed</string>
      <key>PayloadUUID</key>
      <string>${uuidEstable(id + ".payload")}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Hace que este aparato consulte los nombres de sitios a través de AntiGro. No instala ninguna aplicación y no da acceso a ningún contenido.</string>
  <key>PayloadDisplayName</key>
  <string>AntiGro</string>
  <key>PayloadIdentifier</key>
  <string>${xml(id)}</string>
  <key>PayloadOrganization</key>
  <string>AntiGro</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${uuidEstable(id)}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
`;
}

/* ── Las guías, por aparato ──────────────────────────────────────────────── */

export interface Guia {
  aparato: Aparato;
  nombre: string;
  pasos: string[];
  /** Lo que este camino NO resuelve. Va siempre que haya algo que decir. */
  advertencia?: string;
  /** Se baja un archivo, o se copia un dato a mano. */
  archivo?: "apple" | "windows";
  /** El dato que se copia, cuando el camino es copiar y pegar. */
  aCopiar?: string;
}

export function guiaPara(aparato: Aparato, perfil: string): Guia {
  const etiqueta = etiquetaDeAparato(aparato);

  switch (aparato) {
    case "iphone":
      return {
        aparato,
        nombre: "iPhone o iPad",
        archivo: "apple",
        pasos: [
          "Bajá el perfil desde este mismo teléfono, con Safari.",
          "Se descarga y no pasa nada más: hay que ir a Ajustes, donde va a aparecer «Perfil descargado».",
          "Tocá «Instalar», arriba a la derecha, y confirmá con el código del teléfono.",
          `Comprobalo: abrí ${COMPROBACION} en este mismo aparato. Tiene que decir "status": "ok".`,
        ],
        advertencia:
          "Con Safari, no con Chrome: en iPhone los perfiles sólo se instalan desde Safari.",
      };

    case "mac":
      return {
        aparato,
        nombre: "Mac",
        archivo: "apple",
        pasos: [
          "Bajá el perfil y abrilo con doble clic.",
          "Ajustes del Sistema → Privacidad y seguridad → Perfiles → Instalar.",
          `Comprobalo: abrí ${COMPROBACION} en esta computadora. Tiene que decir "status": "ok".`,
        ],
      };

    case "android":
      return {
        aparato,
        nombre: "Android",
        aCopiar: hostDnsPrivado(perfil),
        pasos: [
          "Ajustes → Red e Internet → Configuración avanzada → DNS privado.",
          "Elegí «Nombre de host del proveedor de DNS privado».",
          "Pegá el nombre que está acá arriba y guardá.",
          `Comprobalo: abrí ${COMPROBACION} en este mismo teléfono. Tiene que decir "status": "ok".`,
        ],
        advertencia:
          "Hace falta Android 9 o más nuevo. En algunos teléfonos el menú se llama «DNS privado» " +
          "y está en Conexiones en vez de Red e Internet.",
      };

    case "windows":
      return {
        aparato,
        nombre: "Windows",
        archivo: "windows",
        pasos: [
          "Bajá el archivo y abrilo con clic derecho → «Ejecutar como administrador».",
          "Fija el DNS en todas las conexiones de esta computadora.",
          `Comprobalo: abrí ${COMPROBACION} en esta computadora. Tiene que decir "status": "ok".`,
        ],
        advertencia:
          "Si el chico usa esta computadora con una cuenta de administrador, puede deshacerlo. " +
          "Conviene que use una cuenta estándar.",
      };

    case "router":
      return {
        aparato,
        nombre: "El router de casa",
        aCopiar: endpointDoH(perfil, etiqueta),
        pasos: [
          "Entrá a la configuración del router (suele ser 192.168.0.1 o 192.168.1.1).",
          "Buscá DNS, y reemplazá los que estén por los de AntiGro.",
          "Reiniciá el router.",
        ],
        /* 🔴 Esta advertencia es la más importante de todo el archivo. */
        advertencia:
          "Esto NO alcanza, y conviene saber por qué. El router sólo ve lo que pasa por el WiFi " +
          "de esta casa: no ve los datos móviles del teléfono, no ve el WiFi del colegio ni el " +
          "de un amigo, y no ve nada si el chico se va a otra casa. La actividad de madrugada — " +
          "que es una de las dos señales más fuertes que mira el sistema— pasa muchas veces por " +
          "datos móviles. Instalado sólo acá, AntiGro no recibe esa señal y no tiene forma de " +
          "avisarte que le falta: no recibir nada se ve igual que estar todo tranquilo. " +
          "Ponelo en el aparato del chico, y usá el router además, no en lugar de.",
      };
  }
}

/**
 * El script de Windows. Fija el DNS de todas las conexiones activas.
 *
 * 📌 Se usan las direcciones IPv4 de NextDNS, no DoH: en Windows el DNS cifrado
 * depende de la versión y de la configuración de cada máquina, y una instalación
 * que a veces queda y a veces no es peor que una que no promete cifrado.
 * ⚠ Sin la IP vinculada en la cuenta de NextDNS, esas direcciones responden sin
 * identificar el perfil. Por eso Windows va acompañado, nunca solo.
 */
export function scriptWindows(perfil: string): string {
  return `@echo off
chcp 65001 >nul
title AntiGro — configurar DNS
echo.
echo   AntiGro no instala ninguna aplicacion.
echo.
echo   Cada vez que esta computadora abre una pagina, primero tiene que
echo   averiguar donde queda, como buscar un numero en una guia telefonica.
echo   Hoy esa consulta se la hace a la empresa que te da internet.
echo   Este archivo cambia UNA cosa: a partir de ahora se la hace a NextDNS,
echo   que ademas de contestarla deja anotado que se consulto y a que hora.
echo.
echo   Eso es todo lo que ve AntiGro: nombres de sitios y horarios.
echo   No lee mensajes. No puede leerlos: por ahi no pasan.
echo.
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo   [!] Hace falta abrirlo como administrador.
  echo       Cerra esta ventana, clic derecho sobre el archivo,
  echo       y elegi "Ejecutar como administrador".
  echo.
  pause
  exit /b 1
)

echo   Configurando...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | ForEach-Object { try { Set-DnsClientServerAddress -InterfaceIndex $_.ifIndex -ServerAddresses ('45.90.28.0','45.90.30.0') -ErrorAction Stop; Write-Host '  [OK]' $_.Name } catch { Write-Host '  [--]' $_.Name } }"
ipconfig /flushdns >nul 2>&1
echo   [OK] Cache de DNS renovado
echo.
echo   ────────────────────────────────────────────────
echo   FALTA UN PASO, y sin el no queda andando:
echo   abri ${COMPROBACION} en esta computadora.
echo   Tiene que decir  "status": "ok"
echo   Perfil: ${perfil}
echo   ────────────────────────────────────────────────
echo.
pause
`;
}
