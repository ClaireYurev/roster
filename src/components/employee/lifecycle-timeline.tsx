import { EventBadge } from './event-badge'
import { formatDate } from '@/lib/utils'
import { IMPORT_SOURCE_LABELS, HIRE_CONTEXT_LABELS } from '@/lib/constants'
import type { LifecycleEvent, OnboardingChecklist } from '@/types'

type EventWithChecklist = LifecycleEvent & { checklist: OnboardingChecklist | null }

function formatPayload(eventType: string, payload: unknown): React.ReactNode | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>

  switch (eventType) {
    case 'NAME_CHANGE':
      return <span>{String(p.oldName)} → {String(p.newName)}</span>

    case 'ROLE_CHANGE': {
      const rp = p as { oldRole?: string; newRole?: string; oldDepartment?: string; newDepartment?: string }
      return rp.oldDepartment !== rp.newDepartment
        ? <span>{rp.oldRole} ({rp.oldDepartment}) → {rp.newRole} ({rp.newDepartment})</span>
        : <span>{rp.oldRole} → {rp.newRole}</span>
    }

    case 'ONBOARDED':
    case 'REHIRED': {
      const ctx = p.hireContext as string | undefined
      return ctx ? <span>{HIRE_CONTEXT_LABELS[ctx] ?? ctx}</span> : null
    }

    case 'CONVERTED_TO_FTE':
      return <span>From {String(p.previousType)}</span>

    case 'LOA_START': {
      const expectedEnd = p.expectedEndDate
      return expectedEnd ? <span>Expected return: {new Date(expectedEnd as string).toLocaleDateString()}</span> : null
    }

    case 'LOA_END':
      return null

    case 'HARDWARE_ASSIGNED':
    case 'HARDWARE_UNASSIGNED':
      return <span>{String(p.systemName)} — {String(p.model)}</span>

    case 'PROFILE_UPDATED': {
      const changes = p.changes as Record<string, { from: string | null; to: string }> | undefined
      if (!changes || Object.keys(changes).length === 0) return null
      return (
        <ul className="mt-1 space-y-0.5 text-xs">
          {Object.entries(changes).map(([field, { from, to }]) => (
            <li key={field}>
              <span className="text-muted-foreground">{field}:</span>{' '}
              {from && <span className="line-through text-muted-foreground">{truncate(from)}</span>}
              {from && ' → '}
              <span className="text-foreground font-medium">{truncate(to)}</span>
            </li>
          ))}
        </ul>
      )
    }

    default:
      return null
  }
}

function truncate(s: string, max = 60): string {
  return s.length > max ? s.slice(0, max) + '…' : s
}

export function LifecycleTimeline({ events }: { events: EventWithChecklist[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No events recorded.</p>
  }

  return (
    <div className="relative">
      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
      <ul className="space-y-6">
        {events.map((event) => {
          const payloadNode = formatPayload(event.eventType, event.payload)
          return (
            <li key={event.id} className="relative flex gap-4 pl-10">
              <div className="absolute left-0 flex h-7 w-7 items-center justify-center rounded-full border bg-background">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <EventBadge eventType={event.eventType} />
                  <span className="text-sm text-muted-foreground">
                    {formatDate(event.eventDate)}
                  </span>
                  {event.source && (
                    <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                      {IMPORT_SOURCE_LABELS[event.source] ?? event.source}
                    </span>
                  )}
                </div>
                {payloadNode && (
                  <div className="text-sm text-foreground mt-1">{payloadNode}</div>
                )}
                {event.notes && (
                  <p className="text-sm text-muted-foreground mt-0.5">{event.notes}</p>
                )}
                {event.checklist && (
                  <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                    <span className={event.checklist.jumpCloudProvisioned ? 'text-green-600 dark:text-green-400' : ''}>
                      {event.checklist.jumpCloudProvisioned ? '✓' : '○'} JumpCloud
                    </span>
                    <span className={event.checklist.laptopAssigned ? 'text-green-600 dark:text-green-400' : ''}>
                      {event.checklist.laptopAssigned ? '✓' : '○'} Laptop
                    </span>
                    <span className={event.checklist.emailAliasCreated ? 'text-green-600 dark:text-green-400' : ''}>
                      {event.checklist.emailAliasCreated ? '✓' : '○'} Email Alias
                    </span>
                    {event.checklist.computerType && (
                      <span>
                        {event.checklist.computerType}
                        {event.checklist.computerSize ? ` ${event.checklist.computerSize}` : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
