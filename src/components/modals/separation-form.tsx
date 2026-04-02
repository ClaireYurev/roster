'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { logSeparation } from '@/actions/lifecycle'
import { separationSchema, type SeparationInput } from '@/lib/validators'
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react'

export function SeparationForm({
  employeeId,
  employeeName,
  employmentType,
  eventType,
  onSuccess,
}: {
  employeeId: string
  employeeName: string
  employmentType: 'FTE' | 'CONTRACTOR'
  eventType: 'RESIGNED' | 'TERMINATED'
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [serviceNowAcknowledged, setServiceNowAcknowledged] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const isContractor = employmentType === 'CONTRACTOR'
  const isTermination = eventType === 'TERMINATED'

  const { register, handleSubmit, formState: { errors } } = useForm<SeparationInput>({
    resolver: zodResolver(separationSchema),
    defaultValues: { employeeId, eventType, eventDate: today },
  })

  function onSubmit(data: SeparationInput) {
    startTransition(async () => {
      const result = await logSeparation(data)
      if ('error' in result) {
        toast({ title: 'Error', variant: 'destructive' })
        return
      }
      const label = isTermination ? 'Involuntary offboard' : 'Voluntary offboard'
      toast({
        title: `${label} recorded`,
        description: isContractor
          ? 'Remember to submit the ServiceNow ticket to Unilever.'
          : "P&C will handle the Unilever submission.",
      })
      onSuccess()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('employeeId')} />
      <input type="hidden" {...register('eventType')} />

      {/* Status explanation */}
      <div className={`rounded-md p-3 text-sm space-y-1 ${
        isTermination
          ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800'
          : 'bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800'
      }`}>
        <p className="font-medium">
          {isTermination ? '🔴 Involuntary Offboard' : '🟡 Voluntary Offboard'}
        </p>
        <p className="text-muted-foreground text-xs">
          Status will be set to{' '}
          <span className="font-mono font-semibold">
            {isTermination ? 'Disabled — Involuntary' : 'Disabled — Voluntary'}
          </span>.
          {' '}P&amp;C handles the Unilever system update — we do not open a ServiceNow ticket for FTE offboards.
        </p>
      </div>

      {/* ServiceNow alert — contractors only */}
      {isContractor && (
        <div className="rounded-md border-2 border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/40 p-3 space-y-3">
          <p className="text-sm font-semibold text-orange-900 dark:text-orange-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            ServiceNow Ticket Required
          </p>
          <p className="text-xs text-orange-800 dark:text-orange-300">
            <strong>{employeeName}</strong> is a Liquid IV <strong>Contractor</strong>. You{' '}
            <strong>must</strong> submit a ServiceNow offboarding ticket to Unilever for this
            contractor. P&amp;C does not handle this — IT must submit it directly.
          </p>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="servicenow-ack"
              checked={serviceNowAcknowledged}
              onCheckedChange={(v) => setServiceNowAcknowledged(!!v)}
            />
            <label htmlFor="servicenow-ack" className="text-xs text-orange-900 dark:text-orange-200 leading-relaxed cursor-pointer">
              I acknowledge this requires a ServiceNow ticket and will submit it (or have already submitted it) to Unilever.
            </label>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="eventDate">
          {isTermination ? 'Termination Date' : 'Last Day'} *
        </Label>
        <Input id="eventDate" type="date" {...register('eventDate')} />
        {errors.eventDate && <p className="text-xs text-destructive">{errors.eventDate.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} rows={2} placeholder="Optional context…" />
      </div>

      <Button
        type="submit"
        disabled={isPending || (isContractor && !serviceNowAcknowledged)}
        variant={isTermination ? 'destructive' : 'default'}
        className="w-full"
      >
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isTermination ? 'Record Involuntary Offboard' : 'Record Voluntary Offboard'}
      </Button>

      {isContractor && !serviceNowAcknowledged && (
        <p className="text-xs text-center text-orange-600 dark:text-orange-400">
          Acknowledge the ServiceNow requirement above to continue.
        </p>
      )}
    </form>
  )
}
