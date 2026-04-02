import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to access this application.',
    Verification: 'The verification link has expired or has already been used.',
    Default: 'An unexpected authentication error occurred.',
  }

  const message = errorMessages[searchParams.error ?? 'Default'] ?? errorMessages.Default

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-10 shadow-md w-full max-w-sm text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h1 className="text-xl font-semibold">Authentication Error</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </main>
  )
}
