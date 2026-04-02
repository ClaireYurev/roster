'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { upsertChecklist } from '@/actions/checklist'
import type { OnboardingChecklist } from '@/types'
import { CheckSquare, Laptop, Mail, Cloud, Loader2 } from 'lucide-react'

const CHECKLIST_ITEMS = [
  { key: 'jumpCloudProvisioned', label: 'JumpCloud Account Provisioned', icon: Cloud },
  { key: 'laptopAssigned', label: 'Laptop Assigned', icon: Laptop },
  { key: 'emailAliasCreated', label: 'Email Alias Created', icon: Mail },
] as const

export function OnboardingChecklistCard({
  checklist,
  lifecycleEventId,
}: {
  checklist: OnboardingChecklist | null
  lifecycleEventId: number
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState({
    jumpCloudProvisioned: checklist?.jumpCloudProvisioned ?? false,
    laptopAssigned: checklist?.laptopAssigned ?? false,
    emailAliasCreated: checklist?.emailAliasCreated ?? false,
  })

  const completedCount = Object.values(state).filter(Boolean).length
  const totalCount = CHECKLIST_ITEMS.length

  function handleSave() {
    startTransition(async () => {
      const result = await upsertChecklist({
        lifecycleEventId,
        ...state,
      })
      if ('error' in result) {
        toast({ title: 'Error saving checklist', variant: 'destructive' })
      } else {
        toast({ title: 'Checklist saved' })
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckSquare className="h-4 w-4" />
            IT Provisioning Checklist
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} complete
          </span>
        </div>
        {checklist?.computerType && (
          <p className="text-sm text-muted-foreground mt-1">
            Computer: {checklist.computerType}
            {checklist.computerSize ? ` ${checklist.computerSize}` : ''}
            {checklist.peripheralsNotes ? ` — ${checklist.peripheralsNotes}` : ''}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {CHECKLIST_ITEMS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center gap-3">
            <Checkbox
              id={key}
              checked={state[key]}
              onCheckedChange={(checked) =>
                setState((prev) => ({ ...prev, [key]: checked === true }))
              }
            />
            <Label htmlFor={key} className="flex items-center gap-2 cursor-pointer font-normal">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {label}
            </Label>
          </div>
        ))}

        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending}
          className="mt-2"
        >
          {isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          Save
        </Button>

        {checklist?.additionalNotes && (
          <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
            {checklist.additionalNotes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
