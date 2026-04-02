import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isApiAuthRoute = pathname.startsWith('/api/auth')
  const isAuthPage = pathname.startsWith('/auth')

  // Always allow API auth routes (OIDC callbacks, CSRF, etc.)
  if (isApiAuthRoute) return NextResponse.next()

  // On auth pages: redirect to dashboard if already signed in
  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // All other routes: require authentication
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Exclude static assets from middleware processing
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
}
