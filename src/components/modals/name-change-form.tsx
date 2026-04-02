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
import type { Employee } from '@/types'

export function NameChangeForm({
  employee,
  onSuccess,
}: {
  employee: Employee
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
    defaultValues: {
      employeeId: employee.id,
      eventDate: today,
      newLegalFirstName: employee.legalFirstName ?? '',
      newLegalLastName: employee.legalLastName ?? '',
    },
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
        <Label>Current Display Name</Label>
        <p className="text-sm text-muted-foreground">{employee.currentName}</p>
        {(employee.legalFirstName || employee.legalLastName) && (
          <p className="text-xs text-muted-foreground">
            Legal: {[employee.legalFirstName, employee.legalLastName].filter(Boolean).join(' ')}
          </p>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">New Legal Name</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="newLegalFirstName">Legal First Name *</Label>
            <Input id="newLegalFirstName" {...register('newLegalFirstName')} />
            {errors.newLegalFirstName && (
              <p className="text-xs text-destructive">{errors.newLegalFirstName.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="newLegalLastName">Legal Last Name *</Label>
            <Input id="newLegalLastName" {...register('newLegalLastName')} />
            {errors.newLegalLastName && (
              <p className="text-xs text-destructive">{errors.newLegalLastName.message}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Display name updates automatically. To change preferred name, use the profile import or edit.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="eventDate">Effective Date *</Label>
        <Input id="eventDate" type="date" {...register('eventDate')} />
        {errors.eventDate && <p className="text-xs text-destructive">{errors.eventDate.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} placeholder="e.g. Marriage, legal name correction" rows={2} />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Legal Name Change
      </Button>
    </form>
  )
}
