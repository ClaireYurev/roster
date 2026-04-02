'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatCents, formatDate } from '@/lib/utils'
import { HARDWARE_STATUS_LABELS, HARDWARE_STATUS_COLORS } from '@/lib/constants'
import type { MonthlyHardwareAsset } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export function MonthlyHardwareView({
  year,
  month,
  purchased,
  assignedThisMonth,
  totalPurchasedCents,
  totalAssignedCents,
}: {
  year: number
  month: number
  purchased: MonthlyHardwareAsset[]
  assignedThisMonth: MonthlyHardwareAsset[]
  totalPurchasedCents: number
  totalAssignedCents: number
}) {
  const router = useRouter()
  const currentDate = new Date(year, month - 1, 1)

  function navigate(direction: -1 | 1) {
    const d = new Date(year, month - 1 + direction, 1)
    router.push(`/hardware/monthly?year=${d.getFullYear()}&month=${d.getMonth() + 1}`)
  }

  const unassignedCount = purchased.filter((a) => a.status === 'UNASSIGNED').length
  const unassignedCents = purchased.filter((a) => a.status === 'UNASSIGNED').reduce((s, a) => s + (a.cost ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold min-w-[160px] text-center">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Purchased" count={purchased.length} value={formatCents(totalPurchasedCents)} />
        <MetricCard label="Assigned" count={purchased.length + assignedThisMonth.length - unassignedCount} value={formatCents(totalAssignedCents)} />
        <MetricCard label="Unassigned" count={unassignedCount} value={formatCents(unassignedCents)} highlight />
        <MetricCard label="Carried Over" count={assignedThisMonth.length} value="(assigned, bought earlier)" small />
      </div>

      {/* Purchased this month */}
      {purchased.length > 0 ? (
        <AssetSection title={`Purchased in ${format(currentDate, 'MMMM')}`} assets={purchased} showPurchaseDate />
      ) : (
        <p className="text-sm text-muted-foreground">No assets purchased in {format(currentDate, 'MMMM yyyy')}.</p>
      )}

      {/* Assigned this month (bought earlier) */}
      {assignedThisMonth.length > 0 && (
        <AssetSection
          title={`Also assigned in ${format(currentDate, 'MMMM')} (purchased earlier)`}
          assets={assignedThisMonth}
          showAssignedDate
        />
      )}
    </div>
  )
}

function MetricCard({
  label,
  count,
  value,
  highlight,
  small,
}: {
  label: string
  count: number
  value: string
  highlight?: boolean
  small?: boolean
}) {
  return (
    <div className={`rounded-lg border p-4 ${highlight && count > 0 ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{count}</p>
      <p className={`mt-0.5 ${small ? 'text-xs text-muted-foreground' : 'text-sm font-medium'}`}>{value}</p>
    </div>
  )
}

function AssetSection({
  title,
  assets,
  showPurchaseDate,
  showAssignedDate,
}: {
  title: string
  assets: MonthlyHardwareAsset[]
  showPurchaseDate?: boolean
  showAssignedDate?: boolean
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">System Name</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Asset Tag</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Model</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Cost</th>
              {showPurchaseDate && <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Purchased</th>}
              {showAssignedDate && <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Assigned</th>}
              <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Assigned To</th>
              <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-t hover:bg-muted/40 transition-colors">
                <td className="py-2 px-4 font-mono font-medium">{asset.systemName}</td>
                <td className="py-2 px-4 text-muted-foreground">{asset.assetTag ?? '—'}</td>
                <td className="py-2 px-4">{asset.model}</td>
                <td className="py-2 px-4">{formatCents(asset.cost)}</td>
                {showPurchaseDate && <td className="py-2 px-4 text-muted-foreground">{formatDate(asset.purchaseDate)}</td>}
                {showAssignedDate && <td className="py-2 px-4 text-muted-foreground">{formatDate(asset.assignedDate)}</td>}
                <td className="py-2 px-4">{asset.employeeName ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="py-2 px-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${HARDWARE_STATUS_COLORS[asset.status]}`}>
                    {HARDWARE_STATUS_LABELS[asset.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-muted/30">
            <tr>
              <td colSpan={showPurchaseDate || showAssignedDate ? 4 : 3} className="py-2 px-4 text-xs font-semibold text-right">
                Total:
              </td>
              <td className="py-2 px-4 text-sm font-bold">
                {formatCents(assets.reduce((sum, a) => sum + (a.cost ?? 0), 0))}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
