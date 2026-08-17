import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { baseDeDatos, hayBase } from "@/lib/supabase";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },

      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        /* ── Modo demo: sin Supabase, el panel igual se puede abrir ──
           🔴 **Sin credenciales en el entorno no entra nadie, y eso es a
           propósito.** Acá había un usuario y una clave escritos como valor por
           defecto. Parecían inofensivos —son de modo demo— y no lo eran: la
           cuenta de administración de producción se sembró con ESOS valores, y
           este archivo vive en un repositorio público. El 17/8 se comprobó que
           la clave publicada abría `/panel`.

           La lección no es "esa clave era mala": es que un valor por defecto
           que abre una puerta se filtra al lugar donde no tenía que estar. Si
           falta la variable, el panel se cierra. Fallar cerrado es la única
           forma de que esto no vuelva a pasar. */
        if (!hayBase()) {
          const emailDemo = process.env.ADMIN_EMAIL;
          const claveDemo = process.env.ADMIN_PASSWORD;
          if (!emailDemo || !claveDemo) return null;

          if (email.toLowerCase() === emailDemo.toLowerCase() && password === claveDemo) {
            return { id: "demo", email: emailDemo, name: "Cuenta demo", rol: "admin" };
          }
          return null;
        }

        /* ── Producción ── */
        const db = baseDeDatos()!;
        const { data: usuario, error } = await db
          .from("usuarios")
          .select("id, email, nombre, rol, password_hash, activo, familia_id, hogar")
          .eq("email", email.toLowerCase())
          .single();

        if (error || !usuario || !usuario.activo) return null;
        const ok = await bcrypt.compare(password, usuario.password_hash);
        if (!ok) return null;

        /* ─────────────────────────────────────────────────────────────────
           🔴 LA CREDENCIAL ES DEL HOGAR, NO DE UNA PERSONA (17/8)
           ─────────────────────────────────────────────────────────────────

           Hasta el 16/8 cada adulto tenía su cuenta, colgada de `adulto_id`.
           Edgardo lo volteó con un argumento de la vida real: *"en la práctica
           los padres no van a aceptar tener cada uno una clave diferente, es
           decirles que cada uno se maneja por separado… se supone que son un
           matrimonio y eso va a generar fricción"*.

           🔑 Y hay una consecuencia técnica que va en la misma dirección: una
           clave que los dos conocen no separa nada. Sostener cuentas distintas
           habría dado la apariencia de una privacidad que no existía.

           📌 Padres separados son DOS filas de la misma familia, con distinto
           `hogar`: un solo panel, dos puertas. Ninguno puede dejar al otro
           afuera cambiando la clave.

           🔴 A qué familia pertenece se resuelve ACÁ y viaja en la sesión.
           El panel no puede preguntarle al navegador de quién son los datos
           que va a mostrar: eso sería dejar que cualquiera lea el informe de
           cualquier chico cambiando un identificador en la dirección. */
        let familiaId: string | null = null;
        if (usuario.rol === "adulto") {
          if (!usuario.familia_id) return null;

          /* 🔑 Si la familia se pausa, la cuenta deja de abrir. Antes esto
             colgaba de la baja del adulto; ahora la puerta es de la casa, así
             que lo que la cierra es que la casa deje de estar activa. */
          const { data: familia } = await db
            .from("familias")
            .select("activo")
            .eq("id", usuario.familia_id)
            .single();

          if (!familia || familia.activo === false) return null;
          familiaId = usuario.familia_id as string;
        }

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nombre,
          rol: usuario.rol,
          familiaId,
          /** Cuál de las dos casas. `null` cuando hay una sola, que es lo normal. */
          hogar: (usuario.hogar as string | null) ?? null,
        };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as { rol?: string; familiaId?: string | null; hogar?: string | null };
        token.rol = u.rol;
        token.familiaId = u.familiaId ?? null;
        token.hogar = u.hogar ?? null;
      }
      return token;
    },
    session({ session, token }) {
      const u = session.user as {
        rol?: unknown;
        familiaId?: unknown;
        hogar?: unknown;
      };
      u.rol = token.rol;
      u.familiaId = token.familiaId;
      u.hogar = token.hogar;
      return session;
    },
  },

  pages: { signIn: "/panel/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
});
