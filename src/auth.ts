import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { verifyAdminCredentials } from "@/features/auth/verify-credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const result = await verifyAdminCredentials(
          credentials.email as string,
          credentials.password as string
        );
        if (result.success && result.user) {
          return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
          };
        }
        return null;
      },
    }),
  ],
});
