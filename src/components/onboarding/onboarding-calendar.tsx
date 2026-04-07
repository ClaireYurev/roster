'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  isSameDay,
  getDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CalendarDot = { date: string; count: number }

interface Props {
  /** Counts per date in ISO YYYY-MM-DD format */
  data: CalendarDot[]
  /** Currently selected week's Monday in ISO format, if any */
  selectedWeek?: string
  /** The "default" week Monday (upcoming) in ISO format */
  defaultWeek: string
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function OnboardingCalendar({ data, selectedWeek, defaultWeek }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Map for O(1) lookup
  const countMap = Object.fromEntries(data.map((d) => [d.date, d.count]))

  // Month currently shown in the calendar
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    // Start from the selected or default week's month
    const ref = selectedWeek ?? defaultWeek
    return startOfMonth(new Date(ref + 'T00:00:00'))
  })

  // --- Navigation ---
  function prevMonth() { setViewMonth((m) => subMonths(m, 1)) }
  function nextMonth() { setViewMonth((m) => addMonths(m, 1)) }

  function goToWeek(monday: Date) {
    const params = new URLSearchParams(searchParams.toString())
    const iso = format(monday, 'yyyy-MM-dd')
    if (iso === defaultWeek) {
      params.delete('week')
    } else {
      params.set('week', iso)
    }
    params.delete('view') // switch back to table view
    const qs = params.toString()
    router.push(pathname + (qs ? `?${qs}` : ''))
  }

  // --- Build calendar grid ---
  // Calendar weeks: from the Monday of the week containing monthStart
  // to the Sunday of the week containing monthEnd
  const monthStart = startOfMonth(viewMonth)
  const monthEnd   = endOfMonth(viewMonth)

  // Always start grid on Monday
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd   = endOfWeek(monthEnd, { weekStartsOn: 1 })

  // Build array of weeks (each week = [Mon, Tue, Wed, Thu, Fri, Sat, Sun])
  const weeks: Date[][] = []
  let cursor = gridStart
  while (cursor <= gridEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(cursor)
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
  }

  // --- Upcoming weeks strip ---
  // Show next 6 weeks as a horizontal "pipeline"
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function getMondayOfWeek(d: Date): Date {
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const result = new Date(d)
    result.setDate(d.getDate() + diff)
    result.setHours(0, 0, 0, 0)
    return result
  }

  const upcomingWeeks: { monday: Date; wednesday: Date; mondayCount: number; wednesdayCount: number }[] = []
  let weekCursor = getMondayOfWeek(today)
  for (let i = 0; i < 8; i++) {
    const wed = addDays(weekCursor, 2)
    const mKey = format(weekCursor, 'yyyy-MM-dd')
    const wKey = format(wed, 'yyyy-MM-dd')
    upcomingWeeks.push({
      monday: new Date(weekCursor),
      wednesday: new Date(wed),
      mondayCount: countMap[mKey] ?? 0,
      wednesdayCount: countMap[wKey] ?? 0,
    })
    weekCursor = addDays(weekCursor, 7)
  }

  const totalInMonth = weeks.flat().reduce((sum, d) => {
    if (!isSameMonth(d, viewMonth)) return sum
    return sum + (countMap[format(d, 'yyyy-MM-dd')] ?? 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* ── Upcoming pipeline strip ── */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Upcoming 8 Weeks
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {upcomingWeeks.map(({ monday, wednesday, mondayCount, wednesdayCount }, i) => {
            const isSelected = selectedWeek === format(monday, 'yyyy-MM-dd')
              || (!selectedWeek && format(monday, 'yyyy-MM-dd') === defaultWeek)
            const total = mondayCount + wednesdayCount
            return (
              <button
                key={i}
                onClick={() => goToWeek(monday)}
                className={`rounded-lg border p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring ${
                  isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'
                }`}
              >
                <div className="text-[10px] text-muted-foreground font-medium mb-1.5 truncate">
                  {format(monday, 'MMM d')} – {format(wednesday, 'MMM d')}
                </div>
                <div className="flex items-end justify-between gap-1">
                  <div className="text-xl font-bold leading-none">{total}</div>
                  {total > 0 && <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0 mb-0.5" />}
                </div>
                <div className="flex gap-1 mt-1.5">
                  {mondayCount > 0 && (
                    <span className="inline-flex items-center rounded px-1 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[9px] font-medium">
                      Mon {mondayCount}
                    </span>
                  )}
                  {wednesdayCount > 0 && (
                    <span className="inline-flex items-center rounded px-1 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 text-[9px] font-medium">
                      Wed {wednesdayCount}
                    </span>
                  )}
                  {total === 0 && (
                    <span className="text-[9px] text-muted-foreground/50">—</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Month calendar ── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="font-semibold">{format(viewMonth, 'MMMM yyyy')}</p>
            {totalInMonth > 0 && (
              <p className="text-xs text-muted-foreground">{totalInMonth} onboarding{totalInMonth !== 1 ? 's' : ''} this month</p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className={`py-2 text-center text-xs font-medium ${
                d === 'Mon' ? 'text-blue-600 dark:text-blue-400' :
                d === 'Wed' ? 'text-violet-600 dark:text-violet-400' :
                'text-muted-foreground'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => {
          const weekMonday = week[0]
          const weekMondayISO = format(weekMonday, 'yyyy-MM-dd')
          const weekWednesdayISO = format(week[2], 'yyyy-MM-dd')
          const weekTotal = week.reduce((sum, d) => sum + (countMap[format(d, 'yyyy-MM-dd')] ?? 0), 0)
          const isSelectedWeek = selectedWeek
            ? selectedWeek === weekMondayISO
            : defaultWeek === weekMondayISO

          return (
            <div
              key={wi}
              className={`grid grid-cols-7 border-b last:border-0 group cursor-pointer transition-colors ${
                isSelectedWeek ? 'bg-primary/5' : 'hover:bg-muted/30'
              }`}
              onClick={() => goToWeek(weekMonday)}
              title={`View week of ${format(weekMonday, 'MMMM d')}`}
            >
              {week.map((day, di) => {
                const dayISO = format(day, 'yyyy-MM-dd')
                const count = countMap[dayISO] ?? 0
                const inMonth = isSameMonth(day, viewMonth)
                const isMonday = di === 0
                const isWednesday = di === 2
                const hasOnboarding = count > 0
                const dayIsToday = isToday(day)

                return (
                  <div
                    key={di}
                    className={`relative min-h-[80px] p-2 border-r last:border-r-0 ${
                      !inMonth ? 'bg-muted/20' : ''
                    } ${isMonday && isSelectedWeek ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}
                    ${isWednesday && isSelectedWeek ? 'bg-violet-50/50 dark:bg-violet-950/20' : ''}`}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          dayIsToday
                            ? 'bg-primary text-primary-foreground font-bold'
                            : !inMonth
                            ? 'text-muted-foreground/40'
                            : isMonday
                            ? 'text-blue-700 dark:text-blue-300 font-semibold'
                            : isWednesday
                            ? 'text-violet-700 dark:text-violet-300 font-semibold'
                            : 'text-foreground'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Onboarding count badge */}
                    {hasOnboarding && inMonth && (
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                            isMonday
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                              : isWednesday
                              ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Users className="h-2.5 w-2.5" />
                          {count}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {count === 1 ? 'starting' : 'starting'}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Click any week row to see the full onboarding detail. Monday and Wednesday are the scheduled start days.
      </p>
    </div>
  )
}
