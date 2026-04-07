import { Navbar } from '@/components/layout/navbar'
import { WeeklyOnboardingTable } from '@/components/onboarding/weekly-table'
import { WeekNavigator } from '@/components/onboarding/week-navigator'
import { OnboardingCalendar } from '@/components/onboarding/onboarding-calendar'
import { getWeeklyOnboardings, getOnboardingsCalendarData } from '@/actions/lifecycle'
import { TreemapView } from '@/components/shared/treemap-view'
import { ViewToggle } from '@/components/shared/view-toggle'
import { computeDisplayName, getMondayOfWeek, toISODate } from '@/lib/utils'
import { CalendarDays, CalendarCheck } from 'lucide-react'
import { format, addDays, subMonths, addMonths } from 'date-fns'

export const dynamic = 'force-dynamic'

function formatDayHeader(date: Date): string {
  return format(date, 'EEEE, MMMM d')
}

/** Parse YYYY-MM-DD string → midnight Date, or null */
function parseWeekParam(s: string | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(s + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  // Snap to Monday in case someone passes a non-Monday
  return getMondayOfWeek(d)
}

export default async function WeeklyOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; week?: string }>
}) {
  const { view, week } = await searchParams
  const isMap      = view === 'map'
  const isCalendar = view === 'calendar'

  // Determine the "default" week (upcoming Mon with no ?week param)
  const { monday: defaultMonday } = await getWeeklyOnboardings()
  const defaultMondayISO = toISODate(defaultMonday)

  // ── Calendar view ────────────────────────────────────────────────
  if (isCalendar) {
    // Fetch onboarding counts for a wide range: 3 months back to 6 months ahead
    const rangeStart = subMonths(new Date(), 3)
    const rangeEnd   = addMonths(new Date(), 6)
    const calendarData = await getOnboardingsCalendarData(rangeStart, rangeEnd)

    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Onboarding Calendar
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Click any week to see the onboarding detail
              </p>
            </div>
            <ViewToggle showCalendar />
          </div>
          <OnboardingCalendar
            data={calendarData}
            defaultWeek={defaultMondayISO}
          />
        </main>
      </div>
    )
  }

  // ── Table / Map views ────────────────────────────────────────────
  const selectedMonday = parseWeekParam(week)
  const { monday, wednesday, onboardings } = await getWeeklyOnboardings(selectedMonday ?? undefined)

  const mondayOnboardings = onboardings.filter((o) => {
    const d = new Date(o.event.eventDate as unknown as number)
    return d.toDateString() === monday.toDateString()
  })

  const wednesdayOnboardings = onboardings.filter((o) => {
    const d = new Date(o.event.eventDate as unknown as number)
    return d.toDateString() === wednesday.toDateString()
  })

  const hasAny = mondayOnboardings.length > 0 || wednesdayOnboardings.length > 0

  // ── Map view ──────────────────────────────────────────────────────
  if (isMap) {
    const items = onboardings.map((o) => {
      const emp = o.employee
      const name = computeDisplayName(emp.preferredFirstName, emp.preferredLastName, emp.legalFirstName, emp.legalLastName, emp.currentName)
      const d = new Date(o.event.eventDate as unknown as number)
      const dayLabel = d.toDateString() === monday.toDateString()
        ? `Mon ${format(monday, 'MMM d')}`
        : `Wed ${format(wednesday, 'MMM d')}`
      const color = emp.employmentType === 'FTE' ? '#2563eb' : '#7c3aed'
      return {
        id: emp.id,
        label: name,
        sublabel: dayLabel,
        value: 1,
        color,
        href: `/employees/${emp.id}`,
      }
    })

    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold">Weekly Onboarding</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span style={{ background: '#2563eb' }} className="inline-block w-2.5 h-2.5 rounded-sm" />
                FTE
              </span>
              <span className="flex items-center gap-1">
                <span style={{ background: '#7c3aed' }} className="inline-block w-2.5 h-2.5 rounded-sm" />
                Contractor
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WeekNavigator
              monday={monday}
              wednesday={wednesday}
              defaultMonday={defaultMondayISO}
            />
            <ViewToggle showCalendar />
          </div>
        </div>
        <div className="flex-1 p-2 min-h-0">
          <TreemapView items={items} />
        </div>
      </div>
    )
  }

  // ── Table view (default) ──────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Weekly Onboarding Plan
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Employees starting {formatDayHeader(monday)} or {formatDayHeader(wednesday)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <WeekNavigator
              monday={monday}
              wednesday={wednesday}
              defaultMonday={defaultMondayISO}
            />
            <ViewToggle showCalendar />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Starting This Week</p>
            <p className="text-2xl font-bold">{onboardings.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Monday {format(monday, 'MMM d')}</p>
            <p className="text-2xl font-bold">{mondayOnboardings.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Wednesday {format(wednesday, 'MMM d')}</p>
            <p className="text-2xl font-bold">{wednesdayOnboardings.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Fully Provisioned</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {onboardings.filter((o) => o.checklist?.jumpCloudProvisioned && o.checklist?.laptopAssigned && o.checklist?.emailAliasCreated).length}
            </p>
          </div>
        </div>

        {!hasAny ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <CalendarCheck className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium">No onboardings this week</p>
            <p className="text-sm text-muted-foreground">
              No employees are scheduled to start on {formatDayHeader(monday)} or {formatDayHeader(wednesday)}.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <WeeklyOnboardingTable
              onboardings={mondayOnboardings}
              dateLabel={`Monday, ${format(monday, 'MMMM d')}`}
            />
            <WeeklyOnboardingTable
              onboardings={wednesdayOnboardings}
              dateLabel={`Wednesday, ${format(wednesday, 'MMMM d')}`}
            />
          </div>
        )}
      </main>
    </div>
  )
}
