import { Navbar } from '@/components/layout/navbar'
import { ContractorEndDatesTable } from '@/components/contractors/contractor-end-dates-table'
import { getAllContractors } from '@/actions/contractors'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ContractorsPage() {
  const contractors = await getAllContractors()

  const expired = contractors.filter((c) => c.expiryStatus === 'EXPIRED').length
  const critical = contractors.filter((c) => c.expiryStatus === 'CRITICAL').length
  const active = contractors.filter((c) => c.isActive).length
  const noDate = contractors.filter((c) => c.expiryStatus === 'NO_DATE').length

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
