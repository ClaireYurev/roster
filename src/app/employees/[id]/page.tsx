import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { EmployeeSnapshot } from '@/components/employee/employee-snapshot'
import { OnboardingChecklistCard } from '@/components/employee/onboarding-checklist'
import { LifecycleTimeline } from '@/components/employee/lifecycle-timeline'
import { LogEventDialog } from '@/components/modals/log-event-dialog'
import { getEmployee } from '@/actions/employees'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatCents } from '@/lib/utils'
import { Monitor, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EmployeePage({ params }: { params: { id: string } }) {
  const employee = await getEmployee(params.id)
  if (!employee) notFound()

  // Find the most recent ONBOARDED/REHIRED event and its checklist
  const latestOnboardEvent = employee.lifecycleEvents
    .filter((e) => e.eventType === 'ONBOARDED' || e.eventType === 'REHIRED')
    .at(0)

  const latestChecklist = latestOnboardEvent?.checklist ?? null
  const startEvent = employee.lifecycleEvents
    .filter((e) => e.eventType === 'ONBOARDED')
    .at(-1)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-semibold truncate">{employee.currentName}</h1>
          <div className="ml-auto">
            <LogEventDialog employee={employee} />
          </div>
        </div>

        {/* Section 1: Snapshot */}
        <EmployeeSnapshot
          employee={employee}
          startDate={startEvent ? startEvent.eventDate : null}
        />

        {/* Section 2: IT Checklist */}
        {latestOnboardEvent && (
          <OnboardingChecklistCard
            checklist={latestChecklist}
            lifecycleEventId={latestOnboardEvent.id}
          />
        )}

        {/* Section 3: Assigned Hardware */}
        {employee.hardwareAssets.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Monitor className="h-4 w-4" />
                Assigned Hardware
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {employee.hardwareAssets.map((hw) => (
                  <div key={hw.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium">{hw.systemName}</span>
                      <span className="text-muted-foreground">{hw.model}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {hw.cost && <span>{formatCents(hw.cost)}</span>}
                      {hw.assignedDate && <span>Since {formatDate(hw.assignedDate)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 4: Lifecycle Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Employment History</CardTitle>
          </CardHeader>
          <CardContent>
            <LifecycleTimeline events={employee.lifecycleEvents} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
