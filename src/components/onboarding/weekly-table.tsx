'use client'

import { useState, useTransition } from 'react'
import { upsertChecklist } from '@/actions/checklist'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import type { WeeklyOnboarding } from '@/types'
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants'
import { Cloud, Laptop, Mail } from 'lucide-react'
import Link from 'next/link'

function ChecklistCell({
  checked,
  onChange,
  label,
  icon: Icon,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  icon: React.ElementType
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none" title={label}>
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="h-3.5 w-3.5"
      />
      <Icon className={`h-3 w-3 ${checked ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
    </label>
  )
}

function OnboardingRow({ item, onboardDate }: { item: WeeklyOnboarding; onboardDate: string }) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const { employee, event, checklist } = item

  const [state, setState] = useState({
    jumpCloudProvisioned: checklist?.jumpCloudProvisioned ?? false,
    laptopAssigned: checklist?.laptopAssigned ?? false,
    emailAliasCreated: checklist?.emailAliasCreated ?? false,
  })

  const allDone = state.jumpCloudProvisioned && state.laptopAssigned && state.emailAliasCreated
  const anyDone = state.jumpCloudProvisioned || state.laptopAssigned || state.emailAliasCreated

  function handleChange(key: keyof typeof state, value: boolean) {
    const next = { ...state, [key]: value }
    setState(next)
    if (!checklist) return
    startTransition(async () => {
      const result = await upsertChecklist({ lifecycleEventId: event.id, ...next })
      if ('error' in result) {
        toast({ title: 'Error saving', variant: 'destructive' })
        setState(state)
      }
    })
  }

  return (
    <tr className="border-b last:border-0 hover:bg-muted/40 transition-colors">
      <td className="py-3 px-4">
        <Link href={`/employees/${employee.id}`} className="font-medium hover:underline text-sm">
          {employee.currentName}
        </Link>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground">{employee.currentDepartment}</td>
      <td className="py-3 px-4">
        <Badge variant={employee.employmentType === 'FTE' ? 'default' : 'secondary'} className="text-xs">
          {EMPLOYMENT_TYPE_LABELS[employee.employmentType]}
        </Badge>
      </td>
      <td className="py-3 px-4 text-sm">
        {checklist?.computerType ? (
          <span>{checklist.computerType}{checklist.computerSize ? ` ${checklist.computerSize}` : ''}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
        {checklist?.peripheralsNotes && (
          <p className="text-xs text-muted-foreground mt-0.5">{checklist.peripheralsNotes}</p>
        )}
      </td>
      <td className="py-3 px-4 text-sm max-w-[180px]">
        {employee.mailingAddress ? (
          <span className="whitespace-pre-line text-xs leading-tight">{employee.mailingAddress}</span>
        ) : (
          <span className="text-muted-foreground text-xs">No address on file</span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <ChecklistCell
            checked={state.jumpCloudProvisioned}
            onChange={(v) => handleChange('jumpCloudProvisioned', v)}
            label="JumpCloud"
            icon={Cloud}
          />
          <ChecklistCell
            checked={state.laptopAssigned}
            onChange={(v) => handleChange('laptopAssigned', v)}
            label="Laptop"
            icon={Laptop}
          />
          <ChecklistCell
            checked={state.emailAliasCreated}
            onChange={(v) => handleChange('emailAliasCreated', v)}
            label="Email Alias"
            icon={Mail}
          />
        </div>
      </td>
      <td className="py-3 px-4">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            allDone
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : anyDone
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {allDone ? 'Ready' : anyDone ? 'In Progress' : 'Not Started'}
        </span>
      </td>
    </tr>
  )
}

export function WeeklyOnboardingTable({
  onboardings,
  dateLabel,
}: {
  onboardings: WeeklyOnboarding[]
  dateLabel: string
}) {
  if (onboardings.length === 0) return null

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {dateLabel} — {onboardings.length} starting
      </h2>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Name</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Department</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Type</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Computer</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Mailing Address</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">
                <span title="JumpCloud / Laptop / Email">JC / Laptop / Email</span>
              </th>
              <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {onboardings.map((item) => (
              <OnboardingRow key={item.event.id} item={item} onboardDate={dateLabel} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
