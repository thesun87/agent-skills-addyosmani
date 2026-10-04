import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/admin/dang-nhap",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isLoginPage = nextUrl.pathname === "/admin/dang-nhap";

      if (isOnAdmin) {
        if (isLoginPage) {
          if (isLoggedIn) {
            return Response.redirect(new URL("/admin/don-hang", nextUrl));
          }
          return true;
        }
        return isLoggedIn;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [],
  trustHost: true,
} satisfies NextAuthConfig;
