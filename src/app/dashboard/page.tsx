import { Navbar } from '@/components/layout/navbar'
import { EmployeeTable } from '@/components/dashboard/employee-table'
import { ContractorExpiryBanner } from '@/components/dashboard/contractor-expiry-banner'
import { AddEmployeeDialog } from '@/components/modals/add-employee-dialog'
import { getEmployees } from '@/actions/employees'
import { getExpiringContractors } from '@/actions/contractors'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [employees, expiringContractors] = await Promise.all([
    getEmployees(),
    getExpiringContractors(14),
  ])

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
          <AddEmployeeDialog />
        </div>
        <EmployeeTable data={employees} />
      </main>
    </div>
  )
}
