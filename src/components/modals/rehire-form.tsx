'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { rehireEmployee } from '@/actions/employees'
import { rehireSchema, type RehireInput } from '@/lib/validators'
import { COMPUTER_TYPES, COMPUTER_SIZES } from '@/lib/constants'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Employee } from '@/types'

const FTE_HIRE_CONTEXTS = [
  { value: 'PAST_FTE_REHIRED', label: 'Past LIV FTE rehired as FTE' },
  { value: 'PAST_CONTRACTOR_AS_FTE', label: 'Past LIV Contractor rehired as FTE' },
  { value: 'UL_TRANSFER', label: 'Unilever transfer → LIV FTE' },
  { value: 'NEW_FTE', label: 'New FTE (no prior LIV history)' },
]

const CONTRACTOR_HIRE_CONTEXTS = [
  { value: 'NEW_CONTRACTOR', label: 'New Contractor' },
  { value: 'PAST_FTE_REHIRED', label: 'Past LIV employee rehired as Contractor' },
]

export function RehireForm({
  employee,
  onSuccess,
}: {
  employee: Employee
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RehireInput>({
    resolver: zodResolver(rehireSchema),
    defaultValues: {
      employeeId: employee.id,
      eventDate: today,
      newRole: employee.currentRole,
      newDepartment: employee.currentDepartment,
      employmentType: 'FTE',
      hireContext: 'PAST_FTE_REHIRED',
    },
  })

  const employmentType = watch('employmentType')
  const isContractor = employmentType === 'CONTRACTOR'

  function handleTypeChange(value: string) {
    setValue('employmentType', value as 'FTE' | 'CONTRACTOR')
    setValue('hireContext', value === 'CONTRACTOR' ? 'NEW_CONTRACTOR' : 'PAST_FTE_REHIRED')
  }

  function onSubmit(data: RehireInput) {
    startTransition(async () => {
      const result = await rehireEmployee(data)
      if ('error' in result) {
        toast({ title: 'Error', variant: 'destructive' })
        return
      }
      toast({ title: 'Employee rehired', description: `${employee.currentName} has been rehired.` })
      onSuccess()
      router.refresh()
    })
  }

  const hireContextOptions = isContractor ? CONTRACTOR_HIRE_CONTEXTS : FTE_HIRE_CONTEXTS

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('employeeId')} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="newRole">Job Title *</Label>
          <Input id="newRole" {...register('newRole')} />
          {errors.newRole && <p className="text-xs text-destructive">{errors.newRole.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="newDepartment">Department *</Label>
          <Input id="newDepartment" {...register('newDepartment')} />
          {errors.newDepartment && <p className="text-xs text-destructive">{errors.newDepartment.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Employment Type *</Label>
          <Select defaultValue="FTE" onValueChange={handleTypeChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="FTE">Full-Time Employee</SelectItem>
              <SelectItem value="CONTRACTOR">Contractor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="eventDate">Rehire Date *</Label>
          <Input id="eventDate" type="date" {...register('eventDate')} />
          {errors.eventDate && <p className="text-xs text-destructive">{errors.eventDate.message}</p>}
        </div>
      </div>

      {/* Hire context */}
      <div className="space-y-1">
        <Label>Hire Context *</Label>
        <Select
          defaultValue={isContractor ? 'NEW_CONTRACTOR' : 'PAST_FTE_REHIRED'}
          onValueChange={(v) => setValue('hireContext', v as RehireInput['hireContext'])}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {hireContextOptions.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isContractor && (
        <div className="space-y-1">
          <Label htmlFor="contractEndDate">Contract End Date</Label>
          <Input id="contractEndDate" type="date" {...register('contractEndDate')} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Computer Type</Label>
          <Select onValueChange={(v) => setValue('computerType', v)}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {COMPUTER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Computer Size</Label>
          <Select onValueChange={(v) => setValue('computerSize', v)}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {COMPUTER_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} rows={2} />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Rehire Employee
      </Button>
    </form>
  )
}
