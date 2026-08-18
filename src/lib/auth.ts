import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // M-2: rate-limit login attempts per IP (10 per minute)
        // Note: headers() is available in Server Actions / Route Handlers context.
        // In the authorize callback we use a try/catch as a safeguard.
        try {
          const headersList = await headers();
          const ip =
            headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "login-ip";
          const rateCheck = checkRateLimit(`login:${ip}`, 10, 60 * 1000);
          if (!rateCheck.success) {
            throw new Error("Too many login attempts. Please try again later.");
          }
        } catch (rateErr: unknown) {
          // Re-throw rate limit errors; swallow header-access errors gracefully
          if (
            rateErr instanceof Error &&
            rateErr.message.startsWith("Too many login")
          ) {
            throw rateErr;
          }
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email address before logging in.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});

