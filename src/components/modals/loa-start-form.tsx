'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { logLOAStart } from '@/actions/lifecycle'
import { loaStartSchema, type LOAStartInput } from '@/lib/validators'
import { Loader2, Info } from 'lucide-react'

export function LOAStartForm({
  employeeId,
  onSuccess,
}: {
  employeeId: string
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LOAStartInput>({
    resolver: zodResolver(loaStartSchema),
    defaultValues: {
      employeeId,
      eventDate: today,
      pcEndDateConfirmed: false,
      jumpcloudSuspended: false,
    },
  })

  const pcConfirmed = watch('pcEndDateConfirmed')
  const jumpcloudDone = watch('jumpcloudSuspended')

  function onSubmit(data: LOAStartInput) {
    startTransition(async () => {
      const result = await logLOAStart(data)
      if ('error' in result) {
        const err = result.error
        const msg = typeof err === 'object' && err !== null ? String(Object.values(err as Record<string, string[]>)[0]?.[0] ?? 'Unknown error') : 'Unknown error'
        toast({ title: 'Error', description: msg, variant: 'destructive' })
        return
      }
      toast({ title: 'LOA recorded', description: 'Employee status set to On LOA. Azure account remains active.' })
      onSuccess()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('employeeId')} />

      {/* Info box */}
      <div className="rounded-md border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 p-3 text-xs text-violet-900 dark:text-violet-200 space-y-1">
        <p className="font-semibold flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> LOA Rules</p>
        <ul className="space-y-0.5 list-disc list-inside text-violet-800 dark:text-violet-300">
          <li>Azure account stays <strong>active</strong> — do not touch it.</li>
          <li>JumpCloud account must be <strong>suspended</strong> immediately.</li>
          <li>End date must be <strong>confirmed with P&amp;C</strong> via email or Teams.</li>
          <li>No ServiceNow ticket needed.</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="eventDate">LOA Start Date *</Label>
          <Input id="eventDate" type="date" {...register('eventDate')} />
          {errors.eventDate && <p className="text-xs text-destructive">{errors.eventDate.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="expectedEndDate">Expected Return Date *</Label>
          <Input id="expectedEndDate" type="date" {...register('expectedEndDate')} />
          {errors.expectedEndDate && <p className="text-xs text-destructive">{errors.expectedEndDate.message}</p>}
        </div>
      </div>

      {/* IT action checklist */}
      <div className="rounded-md border p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">IT Actions</p>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="pcConfirmed"
            checked={pcConfirmed}
            onCheckedChange={(v) => setValue('pcEndDateConfirmed', !!v)}
          />
          <label htmlFor="pcConfirmed" className="text-sm leading-relaxed cursor-pointer">
            End date confirmed with P&amp;C via <strong>email or Teams</strong>
          </label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="jumpcloudSuspended"
            checked={jumpcloudDone}
            onCheckedChange={(v) => setValue('jumpcloudSuspended', !!v)}
          />
          <label htmlFor="jumpcloudSuspended" className="text-sm leading-relaxed cursor-pointer">
            JumpCloud account <strong>suspended</strong>
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} rows={2} placeholder="Reason, contact info, etc." />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Record LOA Start
      </Button>
    </form>
  )
}
