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

        /* ── Modo demo: sin Supabase, el panel igual se puede abrir ── */
        if (!hayBase()) {
          const emailDemo = process.env.ADMIN_EMAIL ?? "demo@antigro.app";
          const claveDemo = process.env.ADMIN_PASSWORD ?? "antigro2026";
          if (
            email.toLowerCase() === emailDemo.toLowerCase() &&
            password === claveDemo
          ) {
            return { id: "demo", email: emailDemo, name: "Cuenta demo", rol: "admin" };
          }
          return null;
        }

        /* ── Producción ── */
        const db = baseDeDatos()!;
        const { data: usuario, error } = await db
          .from("usuarios")
          .select("id, email, nombre, rol, password_hash, activo")
          .eq("email", email.toLowerCase())
          .single();

        if (error || !usuario || !usuario.activo) return null;
        const ok = await bcrypt.compare(password, usuario.password_hash);
        if (!ok) return null;

        return { id: usuario.id, email: usuario.email, name: usuario.nombre, rol: usuario.rol };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) token.rol = (user as { rol?: string }).rol;
      return token;
    },
    session({ session, token }) {
      (session.user as { rol?: unknown }).rol = token.rol;
      return session;
    },
  },

  pages: { signIn: "/panel/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
});
