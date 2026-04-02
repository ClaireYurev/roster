import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

const devBypass = process.env.AUTH_DEV_BYPASS === 'true'

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
    // Dev-only credentials provider — only active when AUTH_DEV_BYPASS=true.
    // NEVER enable in production.
    ...(devBypass
      ? [
          Credentials({
            credentials: {
              username: { label: 'Username', type: 'text' },
              password: { label: 'Password', type: 'password' },
            },
            authorize(credentials) {
              const validUsername = process.env.AUTH_DEV_USERNAME ?? 'admin'
              const validPassword = process.env.AUTH_DEV_PASSWORD ?? 'admin'

              if (
                credentials?.username === validUsername &&
                credentials?.password === validPassword
              ) {
                return {
                  id: 'dev-user',
                  name: 'Dev Admin',
                  email: 'dev@roster.local',
                }
              }
              return null
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
    jwt({ token, user, profile, trigger }) {
      // OAuth profile (JumpCloud)
      if (profile) {
        token.name = profile.name ?? token.name
        token.email = profile.email ?? token.email
      }
      // Credentials sign-in — user object comes from authorize()
      if (trigger === 'signIn' && user && !profile) {
        token.name = user.name ?? token.name
        token.email = user.email ?? token.email
        token.devMode = true
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
