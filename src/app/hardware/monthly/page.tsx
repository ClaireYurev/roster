import { Navbar } from '@/components/layout/navbar'
import { MonthlyHardwareView } from '@/components/hardware/monthly-view'
import { getMonthlyAssets } from '@/actions/hardware'
import { formatCents } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Monitor } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MonthlyHardwarePage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string }
}) {
  const now = new Date()
  const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear()
  const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1

  const { purchased, assignedThisMonth, totalPurchasedCents, totalAssignedCents } =
    await getMonthlyAssets(year, month)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Hardware Procurement</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Monthly procurement and assignment tracking</p>
          </div>
          <Link href="/hardware">
            <Button variant="outline" size="sm">
              <Monitor className="h-4 w-4 mr-1" /> All Assets
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Purchased This Month</p>
            <p className="text-2xl font-bold">{purchased.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Assigned This Month</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{assignedThisMonth.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Purchased Value</p>
            <p className="text-2xl font-bold">{formatCents(totalPurchasedCents)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Assigned Value</p>
            <p className="text-2xl font-bold">{formatCents(totalAssignedCents)}</p>
          </div>
        </div>

        <MonthlyHardwareView
          year={year}
          month={month}
          purchased={purchased}
          assignedThisMonth={assignedThisMonth}
          totalPurchasedCents={totalPurchasedCents}
          totalAssignedCents={totalAssignedCents}
        />
      </main>
    </div>
  )
}
