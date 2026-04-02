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
import { logLOAReturn } from '@/actions/lifecycle'
import { loaEndSchema, type LOAEndInput } from '@/lib/validators'
import { Loader2, Info } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { LoaRecord } from '@/types'

export function LOAReturnForm({
  employeeId,
  loaRecord,
  onSuccess,
}: {
  employeeId: string
  loaRecord: LoaRecord
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LOAEndInput>({
    resolver: zodResolver(loaEndSchema),
    defaultValues: {
      employeeId,
      loaRecordId: loaRecord.id,
      eventDate: today,
      jumpcloudActivated: false,
    },
  })

  const jumpcloudDone = watch('jumpcloudActivated')

  function onSubmit(data: LOAEndInput) {
    startTransition(async () => {
      const result = await logLOAReturn(data)
      if ('error' in result) {
        toast({ title: 'Error', description: String(result.error), variant: 'destructive' })
        return
      }
      toast({ title: 'Return from LOA recorded', description: 'Employee status restored to Active.' })
      onSuccess()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('employeeId')} />
      <input type="hidden" {...register('loaRecordId')} />

      {/* LOA summary */}
      <div className="rounded-md border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 p-3 text-sm space-y-1">
        <p className="font-semibold text-violet-900 dark:text-violet-200">Returning from LOA</p>
        {loaRecord.expectedEndDate && (
          <p className="text-xs text-violet-800 dark:text-violet-300">
            Expected return: {formatDate(loaRecord.expectedEndDate)}
          </p>
        )}
        {loaRecord.notes && (
          <p className="text-xs text-violet-700 dark:text-violet-400 italic">{loaRecord.notes}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="eventDate">Actual Return Date *</Label>
        <Input id="eventDate" type="date" {...register('eventDate')} />
        {errors.eventDate && <p className="text-xs text-destructive">{errors.eventDate.message}</p>}
      </div>

      {/* IT action checklist */}
      <div className="rounded-md border p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">IT Actions</p>
        <div className="flex items-start space-x-2">
          <Checkbox
            id="jumpcloudActivated"
            checked={jumpcloudDone}
            onCheckedChange={(v) => setValue('jumpcloudActivated', !!v)}
          />
          <label htmlFor="jumpcloudActivated" className="text-sm leading-relaxed cursor-pointer">
            JumpCloud account <strong>re-activated</strong>
          </label>
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          Azure was never disabled — no action needed there.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} rows={2} />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Record Return from LOA
      </Button>
    </form>
  )
}
