import { getOffboardedEmployees } from '@/actions/offboarding'
import { OffboardingTable } from '@/components/offboarding/offboarding-table'
import { Navbar } from '@/components/layout/navbar'
import { TreemapView } from '@/components/shared/treemap-view'
import { ViewToggle } from '@/components/shared/view-toggle'
import { computeDisplayName } from '@/lib/utils'
import { UserX, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OffboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const isMap = view === 'map'

  const employees = await getOffboardedEmployees()

  const voluntary = employees.filter((e) => e.status === 'DISABLED_VOLUNTARY').length
  const involuntary = employees.filter((e) => e.status === 'DISABLED_INVOLUNTARY').length
  const contractors = employees.filter((e) => e.requiresServiceNow).length

  if (isMap) {
    const now = Date.now()
    const items = employees.map((emp) => {
      const name = computeDisplayName(emp.preferredFirstName, emp.preferredLastName, emp.legalFirstName, emp.legalLastName, emp.currentName)
      const daysSince = emp.separationDate
        ? Math.max(1, Math.floor((now - emp.separationDate.getTime()) / 86_400_000))
        : 1
      const sub = emp.separationType === 'RESIGNED' ? 'Resigned' : emp.separationType === 'TERMINATED' ? 'Terminated' : 'Separated'
      return {
        id: emp.id,
        label: name,
        sublabel: sub,
        value: daysSince,
        color: emp.status === 'DISABLED_INVOLUNTARY' ? '#dc2626' : '#d97706',
        href: `/employees/${emp.id}`,
      }
    })

    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold">Offboarding</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span style={{ background: '#d97706' }} className="inline-block w-2.5 h-2.5 rounded-sm" />
                Voluntary
              </span>
              <span className="flex items-center gap-1">
                <span style={{ background: '#dc2626' }} className="inline-block w-2.5 h-2.5 rounded-sm" />
                Involuntary
              </span>
              <span className="text-muted-foreground/60">· tile size = days since separation</span>
            </div>
          </div>
          <ViewToggle />
        </div>
        <div className="flex-1 p-2 min-h-0">
          <TreemapView items={items} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <UserX className="h-5 w-5 text-red-600" />
            Offboarding
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All separated employees. Contractor offboards require a ServiceNow ticket to Unilever.
          </p>
        </div>
        <ViewToggle />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Total Offboarded</p>
          <p className="text-2xl font-bold">{employees.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Voluntary</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{voluntary}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Involuntary</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{involuntary}</p>
        </div>
        <div className={`rounded-lg border p-4 space-y-1 ${contractors > 0 ? 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30' : 'bg-card'}`}>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {contractors > 0 && <AlertCircle className="h-3 w-3 text-orange-500" />}
            ServiceNow Required
          </p>
          <p className={`text-2xl font-bold ${contractors > 0 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
            {contractors}
          </p>
        </div>
      </div>

      <OffboardingTable data={employees} />
      </main>
    </div>
  )
}
