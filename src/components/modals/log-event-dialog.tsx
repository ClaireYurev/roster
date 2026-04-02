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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { NameChangeForm } from './name-change-form'
import { RoleChangeForm } from './role-change-form'
import { ConvertToFteForm } from './convert-to-fte-form'
import { SeparationForm } from './separation-form'
import { LOAStartForm } from './loa-start-form'
import { LOAReturnForm } from './loa-return-form'
import { RehireForm } from './rehire-form'
import type { Employee, LoaRecord } from '@/types'

type EventModal =
  | 'name-change'
  | 'role-change'
  | 'convert-fte'
  | 'loa-start'
  | 'loa-return'
  | 'resign'
  | 'terminate'
  | 'rehire'
  | null

const EVENT_LABELS: Record<NonNullable<EventModal>, string> = {
  'name-change': 'Log Name Change',
  'role-change': 'Log Role Change',
  'convert-fte': 'Convert to FTE',
  'loa-start': 'Start Leave of Absence (LOA)',
  'loa-return': 'Return from LOA',
  'resign': 'Voluntary Offboard',
  'terminate': 'Involuntary Offboard',
  'rehire': 'Rehire Employee',
}

export function LogEventDialog({
  employee,
  loaRecord,
}: {
  employee: Employee
  loaRecord?: LoaRecord | null
}) {
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

  const isActive = employee.status === 'ACTIVE'
  const isOnLOA = employee.status === 'LOA'
  const isDisabled = employee.status === 'DISABLED_VOLUNTARY' || employee.status === 'DISABLED_INVOLUNTARY'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Log Event <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[220px]">

          {/* Active employee options */}
          {isActive && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">Profile Changes</DropdownMenuLabel>
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
              <DropdownMenuLabel className="text-xs text-muted-foreground">Leave</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openModal('loa-start')}>
                Start LOA (Leave of Absence)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Offboarding</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openModal('resign')} className="text-amber-600 dark:text-amber-400">
                Voluntary Offboard (Resigned)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openModal('terminate')} className="text-destructive">
                Involuntary Offboard (Terminated)
              </DropdownMenuItem>
            </>
          )}

          {/* LOA employee options */}
          {isOnLOA && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">On Leave of Absence</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openModal('loa-return')}>
                Record Return from LOA
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openModal('resign')} className="text-amber-600 dark:text-amber-400">
                Voluntary Offboard (Resigned)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openModal('terminate')} className="text-destructive">
                Involuntary Offboard (Terminated)
              </DropdownMenuItem>
            </>
          )}

          {/* Disabled employee options */}
          {isDisabled && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">Inactive Employee</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openModal('rehire')}>
                Rehire
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeModal ? EVENT_LABELS[activeModal] : ''}
            </DialogTitle>
          </DialogHeader>

          {activeModal === 'name-change' && (
            <NameChangeForm employee={employee} onSuccess={onSuccess} />
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
          {activeModal === 'loa-start' && (
            <LOAStartForm employeeId={employee.id} onSuccess={onSuccess} />
          )}
          {activeModal === 'loa-return' && loaRecord && (
            <LOAReturnForm employeeId={employee.id} loaRecord={loaRecord} onSuccess={onSuccess} />
          )}
          {(activeModal === 'resign' || activeModal === 'terminate') && (
            <SeparationForm
              employeeId={employee.id}
              employeeName={employee.currentName}
              employmentType={employee.employmentType}
              eventType={activeModal === 'resign' ? 'RESIGNED' : 'TERMINATED'}
              onSuccess={onSuccess}
            />
          )}
          {activeModal === 'rehire' && (
            <RehireForm employee={employee} onSuccess={onSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
