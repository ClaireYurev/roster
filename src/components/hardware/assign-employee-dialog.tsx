'use client'

import { useState, useTransition } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { assignAsset, unassignAsset, retireAsset } from '@/actions/hardware'
import type { Employee } from '@/types'
import { UserPlus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AssignAssetDialog({
  assetId,
  currentEmployeeId,
  employees,
}: {
  assetId: string
  currentEmployeeId: string | null
  employees: Employee[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0])
  const { toast } = useToast()
  const router = useRouter()

  const activeEmployees = employees.filter((e) => e.isActive)

  function handleAssign() {
    if (!selectedEmployeeId) return
    startTransition(async () => {
      const result = await assignAsset({ assetId, employeeId: selectedEmployeeId, assignedDate })
      if ('error' in result) {
        toast({ title: 'Error assigning asset', variant: 'destructive' })
      } else {
        toast({ title: 'Asset assigned' })
        setOpen(false)
        router.refresh()
      }
    })
  }

  function handleUnassign() {
    startTransition(async () => {
      const result = await unassignAsset(assetId)
      if ('error' in result) {
        toast({ title: 'Error unassigning asset', variant: 'destructive' })
      } else {
        toast({ title: 'Asset unassigned' })
        setOpen(false)
        router.refresh()
      }
    })
  }

  function handleRetire() {
    startTransition(async () => {
      const result = await retireAsset(assetId)
      if ('error' in result) {
        toast({ title: 'Error retiring asset', variant: 'destructive' })
      } else {
        toast({ title: 'Asset retired' })
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          {currentEmployeeId ? 'Reassign' : 'Assign'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Hardware Asset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Employee</Label>
            <Select onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee..." />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.currentName} — {emp.currentRole}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="assignedDate">Assigned Date</Label>
            <Input
              id="assignedDate"
              type="date"
              value={assignedDate}
              onChange={(e) => setAssignedDate(e.target.value)}
            />
          </div>
          <Button onClick={handleAssign} disabled={!selectedEmployeeId || isPending} className="w-full">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assign
          </Button>

          {currentEmployeeId && (
            <>
              <div className="relative flex items-center gap-2">
                <div className="flex-1 border-t" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 border-t" />
              </div>
              <Button variant="outline" onClick={handleUnassign} disabled={isPending} className="w-full">
                Unassign from current employee
              </Button>
            </>
          )}

          <Button variant="ghost" size="sm" onClick={handleRetire} disabled={isPending} className="w-full text-muted-foreground">
            Mark as Retired
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
