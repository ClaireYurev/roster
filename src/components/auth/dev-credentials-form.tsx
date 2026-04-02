'use client'

import { useActionState } from 'react'
import { devSignIn, type DevSignInState } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Terminal } from 'lucide-react'

export function DevCredentialsForm({ defaultUsername }: { defaultUsername: string }) {
  const [state, action, pending] = useActionState<DevSignInState, FormData>(devSignIn, null)

  return (
    <div className="w-full space-y-3">
      {/* Dev mode warning banner */}
      <div className="flex items-start gap-2 rounded-md border border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700 p-3">
        <Terminal className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Dev Mode Active</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
            JumpCloud OIDC is bypassed. This login is for local testing only.
          </p>
        </div>
      </div>

      <form action={action} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="dev-username" className="text-xs">
            Username
          </Label>
          <Input
            id="dev-username"
            name="username"
            type="text"
            defaultValue={defaultUsername}
            autoComplete="username"
            required
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dev-password" className="text-xs">
            Password
          </Label>
          <Input
            id="dev-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-8 text-sm"
          />
        </div>

        {state?.error && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {state.error}
          </div>
        )}

        <Button type="submit" disabled={pending} size="sm" className="w-full">
          {pending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          Sign in (Dev)
        </Button>
      </form>
    </div>
  )
}
