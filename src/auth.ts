import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { baseDeDatos, hayBase } from "@/lib/supabase";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
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

        /* ─────────────────────────────────────────────────────────────────
           🔴 QUEDA CONSTANCIA DE QUE SE ENTRÓ — 20/8, migración 19
           ─────────────────────────────────────────────────────────────────

           **Se PISA, no acumula.** Es un dato y no un historial, y la
           diferencia es todo: contesta «¿la otra casa está participando?» sin
           dejar reconstruir a qué hora se levanta nadie. Con padres separados
           un historial de entradas deja de ser un registro y pasa a ser
           vigilancia de uno sobre el otro — y AntiGro no puede hacerles a los
           padres lo que promete no hacerle al chico.

           🔑 Y habilita algo concreto: una segunda puerta con el correo mal
           tipeado se puede cerrar **mientras nadie haya entrado por ella**.
           Este `update` es lo que hace que deje de poder cerrarse.

           ⚠ Nunca frena el ingreso. Si esto falla, la persona entra igual: la
           credencial ya se comprobó, y dejar afuera al dueño de la casa porque
           no se pudo anotar la fecha sería el peor cambio posible. */
        try {
          await db
            .from("usuarios")
            .update({ ultimo_acceso: new Date().toISOString() })
            .eq("id", usuario.id);
        } catch (e) {
          console.error("[auth] no se pudo anotar el acceso:", e);
        }

        return {
          /* 🔑 El id de la PUERTA. Viaja porque hay cosas que sólo se pueden
             hacer sobre la propia: cambiar su clave, ponerle nombre a la casa.
             Sin esto, una ruta tendría que adivinar cuál de las dos filas de la
             familia es la que está mirando. */
          usuarioId: usuario.id,
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
    jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as {
          id?: string;
          usuarioId?: string;
          rol?: string;
          familiaId?: string | null;
          hogar?: string | null;
        };
        token.rol = u.rol;
        token.familiaId = u.familiaId ?? null;
        token.hogar = u.hogar ?? null;
        token.usuarioId = u.usuarioId ?? u.id ?? null;
      }

      /* ── El nombre de la casa puede cambiar con la sesión abierta ────────
         🔑 Pasa una sola vez y en un momento concreto: cuando se abre la
         segunda puerta hay que ponerle nombre a ésta, porque con dos casas el
         nombre es lo que en el informe distingue quién aportó qué.

         ⚠ **Si esto no llegara a aplicarse, no se rompe nada**: la base ya
         tiene el nombre bueno y lo que queda viejo es la etiqueta que viaja en
         la sesión, hasta el próximo ingreso. Degrada a lo que había antes —«la
         casa», sin nombre—, que es impreciso pero no falso. */
      if (trigger === "update") {
        const nuevo = (session as { hogar?: unknown } | undefined)?.hogar;
        if (typeof nuevo === "string") token.hogar = nuevo;
      }

      return token;
    },
    session({ session, token }) {
      const u = session.user as {
        rol?: unknown;
        familiaId?: unknown;
        hogar?: unknown;
        usuarioId?: unknown;
      };
      u.rol = token.rol;
      u.familiaId = token.familiaId;
      u.hogar = token.hogar;
      /* 📌 `token.sub` de respaldo: las sesiones abiertas ANTES del 20/8 no
         llevan `usuarioId`, y sin esto quedarían sin poder cambiar su clave
         hasta que vencieran (treinta días). */
      u.usuarioId = token.usuarioId ?? token.sub ?? null;
      return session;
    },
  },

  pages: { signIn: "/panel/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
});
