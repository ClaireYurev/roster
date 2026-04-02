'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { logNameChange } from '@/actions/lifecycle'
import { nameChangeSchema, type NameChangeInput } from '@/lib/validators'
import { Loader2 } from 'lucide-react'

export function NameChangeForm({
  employeeId,
  currentName,
  onSuccess,
}: {
  employeeId: string
  currentName: string
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NameChangeInput>({
    resolver: zodResolver(nameChangeSchema),
    defaultValues: { employeeId, eventDate: today },
  })

  function onSubmit(data: NameChangeInput) {
    startTransition(async () => {
      const result = await logNameChange(data)
      if ('error' in result) {
        toast({ title: 'Error', description: 'Could not save name change.', variant: 'destructive' })
      } else {
        toast({ title: 'Name change recorded' })
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('employeeId')} />
      <div className="space-y-1">
        <Label>Current Name</Label>
        <p className="text-sm text-muted-foreground">{currentName}</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="newName">New Name *</Label>
        <Input id="newName" {...register('newName')} placeholder="Enter new legal name" />
        {errors.newName && <p className="text-xs text-destructive">{errors.newName.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="eventDate">Effective Date *</Label>
        <Input id="eventDate" type="date" {...register('eventDate')} />
        {errors.eventDate && <p className="text-xs text-destructive">{errors.eventDate.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} placeholder="Optional notes" rows={2} />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Name Change
      </Button>
    </form>
  )
}
