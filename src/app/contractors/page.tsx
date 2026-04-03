import { Navbar } from '@/components/layout/navbar'
import { ContractorEndDatesTable } from '@/components/contractors/contractor-end-dates-table'
import { getAllContractors } from '@/actions/contractors'
import { TreemapView } from '@/components/shared/treemap-view'
import { ViewToggle } from '@/components/shared/view-toggle'
import { computeDisplayName } from '@/lib/utils'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

const EXPIRY_COLORS: Record<string, string> = {
  EXPIRED: '#dc2626',
  CRITICAL: '#ea580c',
  WARNING: '#d97706',
  OK: '#16a34a',
  NO_DATE: '#6b7280',
}

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const isMap = view === 'map'

  const contractors = await getAllContractors()

  const expired = contractors.filter((c) => c.expiryStatus === 'EXPIRED').length
  const critical = contractors.filter((c) => c.expiryStatus === 'CRITICAL').length
  const active = contractors.filter((c) => c.isActive).length
  const noDate = contractors.filter((c) => c.expiryStatus === 'NO_DATE').length

  if (isMap) {
    const items = contractors.map((c) => {
      // Urgency-based sizing: expired/critical = big tiles.
      // No-date contractors get a floor of 60 so they're always visible.
      const urgencyRaw = c.daysRemaining === null ? 0 : Math.max(0, 365 - c.daysRemaining)
      const urgency = Math.max(60, urgencyRaw)
      const name = computeDisplayName(c.preferredFirstName, c.preferredLastName, c.legalFirstName, c.legalLastName, c.currentName)
      const sub = c.daysRemaining === null
        ? 'No end date'
        : c.daysRemaining < 0
          ? `${Math.abs(c.daysRemaining)}d overdue`
          : `${c.daysRemaining}d left`
      return {
        id: c.id,
        label: name,
        sublabel: sub,
        value: urgency,
        color: EXPIRY_COLORS[c.expiryStatus] ?? '#6b7280',
        href: `/employees/${c.id}`,
      }
    })

    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold">Contractor End Dates</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {Object.entries(EXPIRY_COLORS).map(([status, color]) => (
                <span key={status} className="flex items-center gap-1">
                  <span style={{ background: color }} className="inline-block w-2.5 h-2.5 rounded-sm" />
                  {status === 'NO_DATE' ? 'No date' : status.charAt(0) + status.slice(1).toLowerCase()}
                </span>
              ))}
              <span className="text-muted-foreground/60">· tile size = urgency</span>
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
              <Users className="h-5 w-5" />
              Contractor End Dates
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Contract expiry tracking for all contractors
            </p>
          </div>
          <ViewToggle />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Total Contractors</p>
            <p className="text-2xl font-bold">{contractors.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{active}</p>
          </div>
          <div className={`rounded-lg border p-4 space-y-1 ${critical > 0 ? 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30' : 'bg-card'}`}>
            <p className="text-xs text-muted-foreground">Expiring ≤14 days</p>
            <p className={`text-2xl font-bold ${critical > 0 ? 'text-orange-600 dark:text-orange-400' : ''}`}>{critical}</p>
          </div>
          <div className={`rounded-lg border p-4 space-y-1 ${expired > 0 ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30' : 'bg-card'}`}>
            <p className="text-xs text-muted-foreground">Expired</p>
            <p className={`text-2xl font-bold ${expired > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{expired}</p>
          </div>
        </div>

        <ContractorEndDatesTable data={contractors} />
      </main>
    </div>
  )
}
