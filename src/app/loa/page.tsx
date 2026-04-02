import { getLOAEmployees } from '@/actions/loa'
import { LOATable } from '@/components/loa/loa-table'
import { PauseCircle, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LOAPage() {
  const employees = await getLOAEmployees()

  const overdueCount = employees.filter((e) => e.isOverdue).length
  const jumpcloudPending = employees.filter((e) => !e.loaRecord.jumpcloudSuspended).length
  const pcPending = employees.filter((e) => !e.loaRecord.pcEndDateConfirmed).length

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <PauseCircle className="h-6 w-6 text-violet-600" />
            Leave of Absence
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Employees currently on LOA — Azure accounts remain active; JumpCloud must be suspended.
          </p>
        </div>
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
    </div>
  )
}
