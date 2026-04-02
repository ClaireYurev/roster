'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { logRoleChange } from '@/actions/lifecycle'
import { roleChangeSchema, type RoleChangeInput } from '@/lib/validators'
import { Loader2 } from 'lucide-react'

export function RoleChangeForm({
  employeeId,
  currentRole,
  currentDepartment,
  onSuccess,
}: {
  employeeId: string
  currentRole: string
  currentDepartment: string
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, formState: { errors } } = useForm<RoleChangeInput>({
    resolver: zodResolver(roleChangeSchema),
    defaultValues: { employeeId, eventDate: today, newRole: currentRole, newDepartment: currentDepartment },
  })

  function onSubmit(data: RoleChangeInput) {
    startTransition(async () => {
      const result = await logRoleChange(data)
      if ('error' in result) {
        toast({ title: 'Error', description: 'Could not save role change.', variant: 'destructive' })
      } else {
        toast({ title: 'Role change recorded' })
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('employeeId')} />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs mb-1">Current Role</p>
          <p>{currentRole}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-1">Current Dept</p>
          <p>{currentDepartment}</p>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="newRole">New Role *</Label>
        <Input id="newRole" {...register('newRole')} />
        {errors.newRole && <p className="text-xs text-destructive">{errors.newRole.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="newDepartment">New Department</Label>
        <Input id="newDepartment" {...register('newDepartment')} placeholder="Leave blank to keep current" />
      </div>
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
        Save Role Change
      </Button>
    </form>
  )
}
