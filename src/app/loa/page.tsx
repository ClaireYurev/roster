import { getLOAEmployees } from '@/actions/loa'
import { LOATable } from '@/components/loa/loa-table'
import { Navbar } from '@/components/layout/navbar'
import { TreemapView } from '@/components/shared/treemap-view'
import { ViewToggle } from '@/components/shared/view-toggle'
import { computeDisplayName } from '@/lib/utils'
import { PauseCircle, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LOAPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const isMap = view === 'map'

  const employees = await getLOAEmployees()

  const overdueCount = employees.filter((e) => e.isOverdue).length
  const jumpcloudPending = employees.filter((e) => !e.loaRecord.jumpcloudSuspended).length
  const pcPending = employees.filter((e) => !e.loaRecord.pcEndDateConfirmed).length

  if (isMap) {
    const items = employees.map((emp) => {
      const name = computeDisplayName(emp.preferredFirstName, emp.preferredLastName, emp.legalFirstName, emp.legalLastName, emp.currentName)
      return {
        id: emp.id,
        label: name,
        sublabel: `${emp.daysOnLOA}d out`,
        value: Math.max(1, emp.daysOnLOA),
        color: emp.isOverdue ? '#dc2626' : '#7c3aed',
        href: `/employees/${emp.id}`,
      }
    })

    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold">Leave of Absence</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span style={{ background: '#7c3aed' }} className="inline-block w-2.5 h-2.5 rounded-sm" />
                On LOA
              </span>
              <span className="flex items-center gap-1">
                <span style={{ background: '#dc2626' }} className="inline-block w-2.5 h-2.5 rounded-sm" />
                Overdue
              </span>
              <span className="text-muted-foreground/60">· tile size = days on leave</span>
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
            <PauseCircle className="h-5 w-5 text-violet-600" />
            Leave of Absence
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Employees currently on LOA — Azure accounts remain active; JumpCloud must be suspended.
          </p>
        </div>
        <ViewToggle />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">On LOA</p>
          <p className="text-2xl font-bold">{employees.length}</p>
        </div>
        <div className={`rounded-lg border p-4 space-y-1 ${overdueCount > 0 ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30' : 'bg-card'}`}>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {overdueCount > 0 && <AlertTriangle className="h-3 w-3 text-red-500" />}
            Overdue Returns
          </p>
          <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
            {overdueCount}
          </p>
        </div>
        <div className={`rounded-lg border p-4 space-y-1 ${jumpcloudPending > 0 ? 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30' : 'bg-card'}`}>
          <p className="text-xs text-muted-foreground">JumpCloud Pending</p>
          <p className={`text-2xl font-bold ${jumpcloudPending > 0 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
            {jumpcloudPending}
          </p>
        </div>
        <div className={`rounded-lg border p-4 space-y-1 ${pcPending > 0 ? 'border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30' : 'bg-card'}`}>
          <p className="text-xs text-muted-foreground">P&C Date Pending</p>
          <p className={`text-2xl font-bold ${pcPending > 0 ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
            {pcPending}
          </p>
        </div>
      </div>

      <LOATable data={employees} />
      </main>
    </div>
  )
}
