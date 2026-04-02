import { Navbar } from '@/components/layout/navbar'
import { EmployeeTable } from '@/components/dashboard/employee-table'
import { AddEmployeeDialog } from '@/components/modals/add-employee-dialog'
import { getEmployees } from '@/actions/employees'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const employees = await getEmployees()

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Employees</h1>
            <p className="text-sm text-muted-foreground">
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
