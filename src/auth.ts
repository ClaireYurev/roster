import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  // JWT sessions avoid needing Auth.js user/session/account tables in our DB
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    {
      id: 'jumpcloud',
      name: 'JumpCloud',
      type: 'oidc',
      issuer: process.env.AUTH_JUMPCLOUD_ISSUER,
      clientId: process.env.AUTH_JUMPCLOUD_CLIENT_ID,
      clientSecret: process.env.AUTH_JUMPCLOUD_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    },
  ],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
    jwt({ token, profile }) {
      if (profile) {
        token.name = profile.name ?? token.name
        token.email = profile.email ?? token.email
      }
      return token
    },
    session({ session, token }) {
      if (token.email) session.user.email = token.email as string
      if (token.name) session.user.name = token.name as string
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
