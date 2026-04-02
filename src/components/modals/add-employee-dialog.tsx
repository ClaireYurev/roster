'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { createEmployee } from '@/actions/employees'
import { createEmployeeSchema, type CreateEmployeeInput } from '@/lib/validators'
import { COMPUTER_TYPES, COMPUTER_SIZES } from '@/lib/constants'
import { Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: { employmentType: 'FTE', startDate: today },
  })

  const employmentType = watch('employmentType')
  const startDate = watch('startDate')
  const isContractor = employmentType === 'CONTRACTOR'

  // When switching to CONTRACTOR, auto-populate contract end date to +1 year from start date
  function handleEmploymentTypeChange(value: string) {
    setValue('employmentType', value as 'FTE' | 'CONTRACTOR')
    if (value === 'CONTRACTOR' && startDate) {
      const end = new Date(startDate)
      end.setFullYear(end.getFullYear() + 1)
      setValue('contractEndDate', end.toISOString().split('T')[0])
    } else {
      setValue('contractEndDate', undefined)
    }
  }

  // When start date changes while contractor is selected, update end date too
  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (isContractor && val) {
      const end = new Date(val)
      end.setFullYear(end.getFullYear() + 1)
      setValue('contractEndDate', end.toISOString().split('T')[0])
    }
  }

  function onSubmit(data: CreateEmployeeInput) {
    startTransition(async () => {
      const result = await createEmployee(data)
      if ('error' in result) {
        toast({ title: 'Validation error', description: 'Check required fields.', variant: 'destructive' })
      } else {
        const displayName = data.preferredFirstName
          ? `${data.preferredFirstName} ${data.preferredLastName ?? data.legalLastName}`.trim()
          : `${data.legalFirstName} ${data.legalLastName}`.trim()
        toast({ title: 'Employee added', description: `${displayName} has been onboarded.` })
        reset()
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Hire context — shown for FTE only */}
          {!isContractor && (
            <div className="space-y-1">
              <Label>Hire Context *</Label>
              <Select
                defaultValue="NEW_FTE"
                onValueChange={(v) => setValue('hireContext', v as CreateEmployeeInput['hireContext'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW_FTE">New FTE — first time at Liquid IV</SelectItem>
                  <SelectItem value="UL_TRANSFER">UL → LIV FTE (Unilever transfer)</SelectItem>
                  <SelectItem value="PAST_FTE_REHIRED">Past LIV FTE rehired as FTE</SelectItem>
                  <SelectItem value="PAST_CONTRACTOR_AS_FTE">Past LIV Contractor rehired as FTE</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Recorded in the employee history for audit purposes.
              </p>
            </div>
          )}

          {/* Legal name */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Legal Name (HR / Payroll)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="legalFirstName">Legal First Name *</Label>
                <Input id="legalFirstName" {...register('legalFirstName')} placeholder="Jane" />
                {errors.legalFirstName && <p className="text-xs text-destructive">{errors.legalFirstName.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="legalLastName">Legal Last Name *</Label>
                <Input id="legalLastName" {...register('legalLastName')} placeholder="Smith" />
                {errors.legalLastName && <p className="text-xs text-destructive">{errors.legalLastName.message}</p>}
              </div>
            </div>
          </div>
          {/* Preferred name */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Preferred Name <span className="normal-case">(shown in all views — leave blank to use legal name)</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="preferredFirstName">Preferred First</Label>
                <Input id="preferredFirstName" {...register('preferredFirstName')} placeholder="e.g. Alex" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="preferredLastName">Preferred Last</Label>
                <Input id="preferredLastName" {...register('preferredLastName')} placeholder="e.g. Smith-Jones" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="currentRole">Job Title *</Label>
              <Input id="currentRole" {...register('currentRole')} placeholder="Software Engineer" />
              {errors.currentRole && <p className="text-xs text-destructive">{errors.currentRole.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="currentDepartment">Department *</Label>
              <Input id="currentDepartment" {...register('currentDepartment')} placeholder="Engineering" />
              {errors.currentDepartment && <p className="text-xs text-destructive">{errors.currentDepartment.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Employment Type *</Label>
              <Select
                defaultValue="FTE"
                onValueChange={handleEmploymentTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FTE">Full-Time Employee</SelectItem>
                  <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                onChange={(e) => {
                  register('startDate').onChange(e)
                  handleStartDateChange(e)
                }}
              />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
          </div>

          {/* Contract end date — shown only for contractors */}
          {isContractor && (
            <div className="rounded-md border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-3 space-y-1">
              <Label htmlFor="contractEndDate" className="text-orange-900 dark:text-orange-200">
                Contract End Date *
              </Label>
              <Input
                id="contractEndDate"
                type="date"
                {...register('contractEndDate')}
                className="bg-white dark:bg-background"
              />
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Defaults to 1 year after start date. IT will be notified 2 weeks before this date.
              </p>
              {errors.contractEndDate && (
                <p className="text-xs text-destructive">{errors.contractEndDate.message}</p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="mailingAddress">Mailing Address</Label>
            <Textarea
              id="mailingAddress"
              {...register('mailingAddress')}
              placeholder="123 Main St&#10;San Francisco, CA 94102"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Computer Type</Label>
              <Select onValueChange={(v) => setValue('computerType', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {COMPUTER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Computer Size</Label>
              <Select onValueChange={(v) => setValue('computerSize', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {COMPUTER_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="peripheralsNotes">Peripherals / Notes</Label>
            <Input id="peripheralsNotes" {...register('peripheralsNotes')} placeholder="Docking station, external monitor..." />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Onboarding Notes</Label>
            <Textarea id="notes" {...register('notes')} rows={2} />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Employee
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
