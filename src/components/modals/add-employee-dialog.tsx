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

  function onSubmit(data: CreateEmployeeInput) {
    startTransition(async () => {
      const result = await createEmployee(data)
      if ('error' in result) {
        toast({ title: 'Validation error', description: 'Check required fields.', variant: 'destructive' })
      } else {
        toast({ title: 'Employee added', description: `${data.currentName} has been onboarded.` })
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
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="currentName">Full Name *</Label>
              <Input id="currentName" {...register('currentName')} placeholder="Jane Smith" />
              {errors.currentName && <p className="text-xs text-destructive">{errors.currentName.message}</p>}
            </div>
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
                onValueChange={(v) => setValue('employmentType', v as 'FTE' | 'CONTRACTOR')}
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
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
          </div>

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
