import { Navbar } from '@/components/layout/navbar'
import { AssetsTable } from '@/components/hardware/assets-table'
import { AddAssetDialog } from '@/components/hardware/asset-form'
import { getAssets } from '@/actions/hardware'
import { getEmployees } from '@/actions/employees'
import { formatCents } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HardwarePage() {
  const [rawAssets, employeeList] = await Promise.all([getAssets(), getEmployees()])

  const unassigned = rawAssets.filter((a) => a.status === 'UNASSIGNED').length
  const assigned = rawAssets.filter((a) => a.status === 'ASSIGNED').length
  const totalValue = rawAssets.reduce((sum, a) => sum + (a.cost ?? 0), 0)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Hardware Assets</h1>
            <p className="text-sm text-muted-foreground">
              {rawAssets.length} total · {assigned} assigned · {unassigned} unassigned · {formatCents(totalValue)} total value
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/hardware/monthly">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-1" />
                Monthly View
              </Button>
            </Link>
            <AddAssetDialog />
          </div>
        </div>

        <AssetsTable assets={rawAssets as Parameters<typeof AssetsTable>[0]['assets']} employees={employeeList} />
      </main>
    </div>
  )
}
