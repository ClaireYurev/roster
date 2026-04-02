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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 space-y-4 max-w-7xl mx-auto w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contractor End Dates
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {active} active contractor{active !== 1 ? 's' : ''}
              {expired > 0 && (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {' '}• {expired} expired
                </span>
              )}
              {critical > 0 && (
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  {' '}• {critical} expiring within 14 days
                </span>
              )}
            </p>
          </div>
        </div>

        <ContractorEndDatesTable data={contractors} />
      </main>
    </div>
  )
}
