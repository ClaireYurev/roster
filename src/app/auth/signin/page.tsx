import { signIn } from '@/auth'
import { ShieldCheck } from 'lucide-react'
import { DevCredentialsForm } from '@/components/auth/dev-credentials-form'
import { Separator } from '@/components/ui/separator'

const devBypass = process.env.AUTH_DEV_BYPASS === 'true'
const devUsername = process.env.AUTH_DEV_USERNAME ?? 'admin'

export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string }
}) {
  const callbackUrl = searchParams.callbackUrl ?? '/dashboard'

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5 rounded-xl border bg-card p-10 shadow-md w-full max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <ShieldCheck className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Roster</h1>
          <p className="text-sm text-muted-foreground text-center">
            Employee Database &amp; Onboarding Dashboard
          </p>
        </div>

        {searchParams.error && !devBypass && (
          <div className="w-full rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center">
            Authentication error. Please try again.
          </div>
        )}

        {/* Dev credentials form — shown when AUTH_DEV_BYPASS=true */}
        {devBypass && <DevCredentialsForm defaultUsername={devUsername} />}

        {/* Separator between dev form and JumpCloud button */}
        {devBypass && (
          <div className="w-full flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
        )}

        {/* JumpCloud OIDC button — always shown */}
        <form
          className="w-full"
          action={async () => {
            'use server'
            await signIn('jumpcloud', { redirectTo: callbackUrl })
          }}
        >
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border bg-background px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-accent transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
            {devBypass ? 'Sign in with JumpCloud (Production)' : 'Sign in with JumpCloud'}
          </button>
        </form>
      </div>
    </main>
  )
}
