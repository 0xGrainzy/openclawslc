import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { rateLimit } from "./rate-limit";

const ALLOWED_EMAIL = "0xgrainzy@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "SLCAdmin2026!";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      id: "password",
      name: "Password",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Rate limit by IP
        const ip =
          (req as { headers?: Record<string, string | string[] | undefined> })
            ?.headers?.["x-forwarded-for"]
            ?.toString()
            .split(",")[0]
            .trim() ?? "unknown";
        const rl = rateLimit(`login:${ip}`, 5, 60_000);
        if (!rl.allowed) {
          throw new Error("Too many login attempts. Please wait a minute.");
        }

        const password = credentials?.password ?? "";
        if (!password) return null;

        if (password !== ADMIN_PASSWORD) return null;

        return {
          id: "grant",
          name: "Grant",
          email: ALLOWED_EMAIL,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        return user.email === ALLOWED_EMAIL;
      }
      // Password provider already validated above
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub ?? "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
