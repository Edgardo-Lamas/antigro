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
          .select("id, email, nombre, rol, password_hash, activo, adulto_id")
          .eq("email", email.toLowerCase())
          .single();

        if (error || !usuario || !usuario.activo) return null;
        const ok = await bcrypt.compare(password, usuario.password_hash);
        if (!ok) return null;

        /* 🔴 A qué familia pertenece se resuelve ACÁ y viaja en la sesión.
           El panel no puede preguntarle al navegador de quién son los datos
           que va a mostrar: eso sería dejar que cualquiera lea el informe de
           cualquier chico cambiando un identificador en la dirección. */
        let familiaId: string | null = null;
        if (usuario.rol === "adulto") {
          if (!usuario.adulto_id) return null;

          const { data: adulto } = await db
            .from("adultos")
            .select("familia_id, activo")
            .eq("id", usuario.adulto_id)
            .single();

          /* 🔑 Si al adulto lo dieron de baja, la cuenta deja de abrir. Es la
             consecuencia real de la baja: sin esto, quien se fue de la familia
             seguiría entrando a ver a la criatura. */
          if (!adulto || adulto.activo === false) return null;
          familiaId = adulto.familia_id as string;
        }

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nombre,
          rol: usuario.rol,
          adultoId: usuario.adulto_id ?? null,
          familiaId,
        };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as { rol?: string; adultoId?: string | null; familiaId?: string | null };
        token.rol = u.rol;
        token.adultoId = u.adultoId ?? null;
        token.familiaId = u.familiaId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      const u = session.user as {
        rol?: unknown;
        adultoId?: unknown;
        familiaId?: unknown;
      };
      u.rol = token.rol;
      u.adultoId = token.adultoId;
      u.familiaId = token.familiaId;
      return session;
    },
  },

  pages: { signIn: "/panel/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
});
