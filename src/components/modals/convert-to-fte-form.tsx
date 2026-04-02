'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { logConvertToFte } from '@/actions/lifecycle'
import { convertToFteSchema, type ConvertToFteInput } from '@/lib/validators'
import { Loader2 } from 'lucide-react'

export function ConvertToFteForm({ employeeId, onSuccess }: { employeeId: string; onSuccess: () => void }) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, formState: { errors } } = useForm<ConvertToFteInput>({
    resolver: zodResolver(convertToFteSchema),
    defaultValues: { employeeId, eventDate: today },
  })

  function onSubmit(data: ConvertToFteInput) {
    startTransition(async () => {
      const result = await logConvertToFte(data)
      if ('error' in result) {
        toast({ title: 'Error', variant: 'destructive' })
      } else {
        toast({ title: 'Converted to FTE' })
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('employeeId')} />
      <p className="text-sm text-muted-foreground">
        This will convert the employee from Contractor to Full-Time Employee status and log the event to their history.
      </p>
      <div className="space-y-1">
        <Label htmlFor="eventDate">Effective Date *</Label>
        <Input id="eventDate" type="date" {...register('eventDate')} />
        {errors.eventDate && <p className="text-xs text-destructive">{errors.eventDate.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} rows={2} />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Convert to FTE
      </Button>
    </form>
  )
}
