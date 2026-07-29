import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Emails in the DB are inconsistently cased (some were bulk-imported
        // with capitals), and browsers happily submit whatever the user typed.
        // Match exactly first, then fall back to a case-insensitive lookup so
        // "Sohelskhmail@gmail.com" and "sohelskhmail@gmail.com" both work.
        const email = (credentials.email as string).trim();

        const user =
          (await prisma.user.findUnique({ where: { email } })) ??
          (await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
          }));

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avenueId: user.avenueId,
          clubId: user.clubId,
          dcmRecordId: user.dcmRecordId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.avenueId = (user as { avenueId?: string }).avenueId;
        token.clubId = (user as { clubId?: string }).clubId;
        token.dcmRecordId = (user as { dcmRecordId?: string }).dcmRecordId;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avenueId = token.avenueId as string | undefined;
        session.user.clubId = token.clubId as string | undefined;
        session.user.dcmRecordId = token.dcmRecordId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
