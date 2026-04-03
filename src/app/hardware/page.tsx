import { Navbar } from '@/components/layout/navbar'
import { AssetsTable } from '@/components/hardware/assets-table'
import { AddAssetDialog } from '@/components/hardware/asset-form'
import { getAssets } from '@/actions/hardware'
import { getEmployees } from '@/actions/employees'
import { formatCents } from '@/lib/utils'
import { TreemapView } from '@/components/shared/treemap-view'
import { ViewToggle } from '@/components/shared/view-toggle'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BarChart3, Monitor } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ASSET_STATUS_COLORS: Record<string, string> = {
  ASSIGNED: '#16a34a',
  UNASSIGNED: '#d97706',
  RETIRED: '#6b7280',
}

export default async function HardwarePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const isMap = view === 'map'

  const [rawAssets, employeeList] = await Promise.all([getAssets(), getEmployees()])

  const unassigned = rawAssets.filter((a) => a.status === 'UNASSIGNED').length
  const assigned = rawAssets.filter((a) => a.status === 'ASSIGNED').length
  const retired = rawAssets.filter((a) => a.status === 'RETIRED').length
  const totalValue = rawAssets.reduce((sum, a) => sum + (a.cost ?? 0), 0)

  if (isMap) {
    const items = rawAssets.map((asset) => {
      const emp = (asset as unknown as { employee?: { currentName: string } }).employee
      const label = asset.systemName
      const sub = emp ? emp.currentName : asset.model ?? 'Unassigned'
      const valueCents = Math.max(1, asset.cost ?? 50000) // default $500 if no cost
      return {
        id: asset.id,
        label,
        sublabel: sub,
        value: valueCents,
        color: ASSET_STATUS_COLORS[asset.status] ?? '#6b7280',
        href: '/hardware',
      }
    })

    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold">Hardware Assets</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {Object.entries(ASSET_STATUS_COLORS).map(([status, color]) => (
                <span key={status} className="flex items-center gap-1">
                  <span style={{ background: color }} className="inline-block w-2.5 h-2.5 rounded-sm" />
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </span>
              ))}
              <span className="text-muted-foreground/60">· tile size = asset value</span>
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
              <Monitor className="h-5 w-5" />
              Hardware Assets
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Inventory and assignment tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle />
            <Link href="/hardware/monthly">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-1" />
                Monthly View
              </Button>
            </Link>
            <AddAssetDialog />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Total Assets</p>
            <p className="text-2xl font-bold">{rawAssets.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Assigned</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{assigned}</p>
          </div>
          <div className={`rounded-lg border p-4 space-y-1 ${unassigned > 0 ? 'border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30' : 'bg-card'}`}>
            <p className="text-xs text-muted-foreground">Unassigned</p>
            <p className={`text-2xl font-bold ${unassigned > 0 ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>{unassigned}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">{formatCents(totalValue)}</p>
          </div>
        </div>

        <AssetsTable assets={rawAssets as Parameters<typeof AssetsTable>[0]['assets']} employees={employeeList} />
      </main>
    </div>
  )
}
