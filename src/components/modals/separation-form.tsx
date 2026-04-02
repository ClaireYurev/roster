'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { logSeparation } from '@/actions/lifecycle'
import { separationSchema, type SeparationInput } from '@/lib/validators'
import { Loader2 } from 'lucide-react'

export function SeparationForm({
  employeeId,
  eventType,
  onSuccess,
}: {
  employeeId: string
  eventType: 'RESIGNED' | 'TERMINATED'
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, formState: { errors } } = useForm<SeparationInput>({
    resolver: zodResolver(separationSchema),
    defaultValues: { employeeId, eventType, eventDate: today },
  })

  function onSubmit(data: SeparationInput) {
    startTransition(async () => {
      const result = await logSeparation(data)
      if ('error' in result) {
        toast({ title: 'Error', variant: 'destructive' })
      } else {
        toast({ title: eventType === 'RESIGNED' ? 'Resignation recorded' : 'Termination recorded' })
        onSuccess()
      }
    })
  }

  const isTermination = eventType === 'TERMINATED'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('employeeId')} />
      <input type="hidden" {...register('eventType')} />
      <p className="text-sm text-muted-foreground">
        {isTermination
          ? 'This will mark the employee as inactive and log a Termination event.'
          : 'This will mark the employee as inactive and log a Resignation event.'}
      </p>
      <div className="space-y-1">
        <Label htmlFor="eventDate">{isTermination ? 'Termination' : 'Last'} Date *</Label>
        <Input id="eventDate" type="date" {...register('eventDate')} />
        {errors.eventDate && <p className="text-xs text-destructive">{errors.eventDate.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} rows={2} />
      </div>
      <Button
        type="submit"
        disabled={isPending}
        variant={isTermination ? 'destructive' : 'default'}
        className="w-full"
      >
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isTermination ? 'Record Termination' : 'Record Resignation'}
      </Button>
    </form>
  )
}
