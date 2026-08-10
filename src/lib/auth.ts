import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 8, // 8 horas
  },
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });

        if (!user || !user.password) return null;
        if (!user.active) return null; // bloqueia usuário inativo

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          String(credentials.password),
          user.password
        );

        if (!isValidPassword) {
          // Incrementa tentativas falhas de login
          const attempts = user.failedLoginAttempts + 1;
          const shouldLock = attempts >= 5; // Bloqueia após 5 tentativas falhas

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil: shouldLock 
              ? new Date(Date.now() + 15 * 60 * 1000) // Bloqueia por 15 minutos
              : null, 
            },
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.department = (user as { department?: string | null }).department;
      }
      return token;
    },
    async session({ session, user }) {
      if(!(user as any).active) {
        return null as any;
      }
      if (session.user) {
        session.user.id = String(user.id);
        session.user.role = (user as any).role;
        session.user.department = (user as any).department;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});