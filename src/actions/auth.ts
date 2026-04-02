'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'

export type DevSignInState = { error: string } | null

export async function devSignIn(
  _prevState: DevSignInState,
  formData: FormData
): Promise<DevSignInState> {
  try {
    await signIn('credentials', {
      username: formData.get('username'),
      password: formData.get('password'),
      redirectTo: '/dashboard',
    })
  } catch (error) {
    // Next.js redirect() throws a special error that must be re-thrown
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    if (error instanceof AuthError) {
      return { error: 'Invalid username or password.' }
    }
    return { error: 'Something went wrong. Please try again.' }
  }

  // Should not be reached (signIn redirects on success), but satisfies TypeScript
  redirect('/dashboard')
}
