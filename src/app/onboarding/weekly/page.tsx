import { Navbar } from '@/components/layout/navbar'
import { WeeklyOnboardingTable } from '@/components/onboarding/weekly-table'
import { getWeeklyOnboardings } from '@/actions/lifecycle'
import { CalendarDays, CalendarCheck } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

function formatDayHeader(date: Date): string {
  return format(date, 'EEEE, MMMM d') // "Monday, April 7"
}

export default async function WeeklyOnboardingPage() {
  const { monday, wednesday, onboardings } = await getWeeklyOnboardings()

  const mondayOnboardings = onboardings.filter((o) => {
    const d = new Date(o.event.eventDate as unknown as number)
    return d.toDateString() === monday.toDateString()
  })

  const wednesdayOnboardings = onboardings.filter((o) => {
    const d = new Date(o.event.eventDate as unknown as number)
    return d.toDateString() === wednesday.toDateString()
  })

  const hasAny = mondayOnboardings.length > 0 || wednesdayOnboardings.length > 0

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Weekly Onboarding Plan
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Employees starting {formatDayHeader(monday)} or {formatDayHeader(wednesday)}
            </p>
          </div>
        </div>

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
