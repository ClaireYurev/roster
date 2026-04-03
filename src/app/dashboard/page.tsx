import { Navbar } from '@/components/layout/navbar'
import { EmployeeTable } from '@/components/dashboard/employee-table'
import { ContractorExpiryBanner } from '@/components/dashboard/contractor-expiry-banner'
import { AddEmployeeDialog } from '@/components/modals/add-employee-dialog'
import { getEmployees } from '@/actions/employees'
import { getExpiringContractors } from '@/actions/contractors'
import { TreemapView } from '@/components/shared/treemap-view'
import { ViewToggle } from '@/components/shared/view-toggle'
import { computeDisplayName } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#16a34a',
  LOA: '#7c3aed',
  DISABLED_VOLUNTARY: '#d97706',
  DISABLED_INVOLUNTARY: '#dc2626',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const isMap = view === 'map'

  const [employees, expiringContractors] = await Promise.all([
    getEmployees(),
    getExpiringContractors(14),
  ])

  if (isMap) {
    const now = Date.now()
    const items = employees.map((emp) => {
      const created = emp.createdAt instanceof Date ? emp.createdAt.getTime() : (emp.createdAt as number)
      const daysEmployed = Math.max(30, Math.floor((now - created) / 86_400_000))
      const name = computeDisplayName(emp.preferredFirstName, emp.preferredLastName, emp.legalFirstName, emp.legalLastName, emp.currentName)
      return {
        id: emp.id,
        label: name,
        sublabel: emp.currentRole,
        value: daysEmployed,
        color: STATUS_COLORS[emp.status] ?? '#6b7280',
        href: `/employees/${emp.id}`,
      }
    })

    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold">Employees</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <span key={status} className="flex items-center gap-1">
                  <span style={{ background: color }} className="inline-block w-2.5 h-2.5 rounded-sm" />
                  {status === 'ACTIVE' ? 'Active' : status === 'LOA' ? 'LOA' : status === 'DISABLED_VOLUNTARY' ? 'Resigned' : 'Terminated'}
                </span>
              ))}
              <span className="text-muted-foreground/60">· tile size = tenure</span>
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
        <ContractorExpiryBanner contractors={expiringContractors} />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Employees</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {employees.filter((e) => e.isActive).length} active •{' '}
              {employees.length} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle />
            <AddEmployeeDialog />
          </div>
        </div>
        <EmployeeTable data={employees} />
      </main>
    </div>
  )
}
