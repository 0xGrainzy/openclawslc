import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyAdminKey } from "./admin-key";
import { rateLimit } from "./rate-limit";

const ALLOWED_EMAIL = "0xgrainzy@gmail.com";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      id: "access-key",
      name: "Access Key",
      credentials: {
        accessKey: { label: "Access Key", type: "password" },
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

        const key = credentials?.accessKey ?? "";
        if (!key) return null;

        const valid = await verifyAdminKey(key);
        if (!valid) return null;

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
