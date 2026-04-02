import { EventBadge } from './event-badge'
import { formatDate } from '@/lib/utils'
import type { LifecycleEvent, OnboardingChecklist } from '@/types'

type EventWithChecklist = LifecycleEvent & { checklist: OnboardingChecklist | null }

function formatPayload(eventType: string, payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, string>

  switch (eventType) {
    case 'NAME_CHANGE':
      return `${p.oldName} → ${p.newName}`
    case 'ROLE_CHANGE':
      return p.oldDepartment !== p.newDepartment
        ? `${p.oldRole} (${p.oldDepartment}) → ${p.newRole} (${p.newDepartment})`
        : `${p.oldRole} → ${p.newRole}`
    case 'CONVERTED_TO_FTE':
      return `From ${p.previousType}`
    case 'HARDWARE_ASSIGNED':
      return `${p.systemName} — ${p.model}`
    case 'HARDWARE_UNASSIGNED':
      return `${p.systemName} — ${p.model}`
    default:
      return null
  }
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
          const payloadSummary = formatPayload(event.eventType, event.payload)
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
                </div>
                {payloadSummary && (
                  <p className="text-sm text-foreground mt-1">{payloadSummary}</p>
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
