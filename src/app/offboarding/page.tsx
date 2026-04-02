import { getOffboardedEmployees } from '@/actions/offboarding'
import { OffboardingTable } from '@/components/offboarding/offboarding-table'
import { UserX, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OffboardingPage() {
  const employees = await getOffboardedEmployees()

  const voluntary = employees.filter((e) => e.status === 'DISABLED_VOLUNTARY').length
  const involuntary = employees.filter((e) => e.status === 'DISABLED_INVOLUNTARY').length
  const contractors = employees.filter((e) => e.requiresServiceNow).length

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <UserX className="h-6 w-6 text-red-600" />
            Offboarding
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All separated employees. Contractor offboards require a ServiceNow ticket to Unilever.
          </p>
        </div>
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
    </div>
  )
}
