'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { NameChangeForm } from './name-change-form'
import { RoleChangeForm } from './role-change-form'
import { ConvertToFteForm } from './convert-to-fte-form'
import { SeparationForm } from './separation-form'
import type { Employee } from '@/types'

type EventModal =
  | 'name-change'
  | 'role-change'
  | 'convert-fte'
  | 'resign'
  | 'terminate'
  | null

const EVENT_LABELS: Record<NonNullable<EventModal>, string> = {
  'name-change': 'Log Name Change',
  'role-change': 'Log Role Change',
  'convert-fte': 'Convert to FTE',
  'resign': 'Log Resignation',
  'terminate': 'Log Termination',
}

export function LogEventDialog({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<EventModal>(null)

  function openModal(type: EventModal) {
    setActiveModal(type)
    setOpen(true)
  }

  function onSuccess() {
    setOpen(false)
    setActiveModal(null)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Log Event <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openModal('name-change')}>
            Log Name Change
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openModal('role-change')}>
            Log Role Change
          </DropdownMenuItem>
          {employee.employmentType === 'CONTRACTOR' && (
            <DropdownMenuItem onClick={() => openModal('convert-fte')}>
              Convert to FTE
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openModal('resign')} className="text-amber-600">
            Log Resignation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openModal('terminate')} className="text-destructive">
            Log Termination
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activeModal ? EVENT_LABELS[activeModal] : ''}
            </DialogTitle>
          </DialogHeader>

          {activeModal === 'name-change' && (
            <NameChangeForm employeeId={employee.id} currentName={employee.currentName} onSuccess={onSuccess} />
          )}
          {activeModal === 'role-change' && (
            <RoleChangeForm
              employeeId={employee.id}
              currentRole={employee.currentRole}
              currentDepartment={employee.currentDepartment}
              onSuccess={onSuccess}
            />
          )}
          {activeModal === 'convert-fte' && (
            <ConvertToFteForm employeeId={employee.id} onSuccess={onSuccess} />
          )}
          {(activeModal === 'resign' || activeModal === 'terminate') && (
            <SeparationForm
              employeeId={employee.id}
              eventType={activeModal === 'resign' ? 'RESIGNED' : 'TERMINATED'}
              onSuccess={onSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
