import { Navbar } from '@/components/layout/navbar'
import { MonthlyHardwareView } from '@/components/hardware/monthly-view'
import { getMonthlyAssets } from '@/actions/hardware'
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
      <main className="flex-1 p-4 md:p-6 space-y-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Hardware Procurement</h1>
            <p className="text-sm text-muted-foreground">Monthly procurement and assignment tracking</p>
          </div>
          <Link href="/hardware">
            <Button variant="outline" size="sm">
              <Monitor className="h-4 w-4 mr-1" /> All Assets
            </Button>
          </Link>
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
