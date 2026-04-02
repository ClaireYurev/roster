import { cn } from '@/lib/utils'
import { LIFECYCLE_EVENT_LABELS, LIFECYCLE_EVENT_COLORS } from '@/lib/constants'

export function EventBadge({ eventType }: { eventType: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        LIFECYCLE_EVENT_COLORS[eventType] ?? 'bg-gray-100 text-gray-800'
      )}
    >
      {LIFECYCLE_EVENT_LABELS[eventType] ?? eventType}
    </span>
  )
}
