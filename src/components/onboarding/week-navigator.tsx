'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, addDays } from 'date-fns'

export function WeekNavigator({
  monday,
  wednesday,
  defaultMonday,
}: {
  monday: Date
  wednesday: Date
  /** ISO date string of the "default" week (i.e. the upcoming week with no ?week param) */
  defaultMonday: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const mondayISO = format(monday, 'yyyy-MM-dd')
  const isDefault = mondayISO === defaultMonday

  function goToWeek(targetMonday: Date) {
    const params = new URLSearchParams(searchParams.toString())
    const iso = format(targetMonday, 'yyyy-MM-dd')
    if (iso === defaultMonday) {
      params.delete('week')
    } else {
      params.set('week', iso)
    }
    const qs = params.toString()
    router.push(pathname + (qs ? `?${qs}` : ''))
  }

  const prevMonday = addDays(monday, -7)
  const nextMonday = addDays(monday, 7)

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => goToWeek(prevMonday)}
        title="Previous week"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex flex-col items-center px-1 min-w-[160px] text-center">
        <span className="text-sm font-semibold tabular-nums">
          {format(monday, 'MMM d')}
          {' – '}
          {format(wednesday, 'MMM d, yyyy')}
        </span>
        <span className="text-[10px] text-muted-foreground leading-tight">
          Week of {format(monday, 'MMMM d')}
        </span>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => goToWeek(nextMonday)}
        title="Next week"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isDefault && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 ml-1 text-xs text-muted-foreground"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('week')
            const qs = params.toString()
            router.push(pathname + (qs ? `?${qs}` : ''))
          }}
          title="Go to upcoming week"
        >
          <CalendarClock className="h-3.5 w-3.5 mr-1" />
          Today
        </Button>
      )}
    </div>
  )
}
