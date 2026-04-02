import Link from 'next/link'
import { AlertTriangle, Clock, XCircle, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { ContractorWithStatus } from '@/actions/contractors'

function ExpiryIcon({ status }: { status: ContractorWithStatus['expiryStatus'] }) {
  if (status === 'EXPIRED') return <XCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
  if (status === 'CRITICAL') return <AlertTriangle className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
  return <Clock className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
}

function daysLabel(days: number | null): string {
  if (days === null) return ''
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

export function ContractorExpiryBanner({ contractors }: { contractors: ContractorWithStatus[] }) {
  if (contractors.length === 0) return null

  const expired = contractors.filter((c) => c.expiryStatus === 'EXPIRED')
  const critical = contractors.filter((c) => c.expiryStatus === 'CRITICAL')

  const borderColor = expired.length > 0
    ? 'border-red-500 dark:border-red-700'
    : 'border-orange-400 dark:border-orange-600'

  const bgColor = expired.length > 0
    ? 'bg-red-50 dark:bg-red-950/40'
    : 'bg-orange-50 dark:bg-orange-950/40'

  return (
    <div className={`rounded-lg border-l-4 ${borderColor} ${bgColor} p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {expired.length > 0
              ? `${expired.length} contractor contract${expired.length !== 1 ? 's' : ''} expired`
              : `${critical.length} contractor contract${critical.length !== 1 ? 's' : ''} expiring soon`}
            {expired.length > 0 && critical.length > 0 && (
              <span className="font-normal text-muted-foreground ml-1">
                + {critical.length} expiring within 14 days
              </span>
            )}
          </p>

          <ul className="mt-2 space-y-1.5">
            {contractors.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <ExpiryIcon status={c.expiryStatus} />
                <Link
                  href={`/employees/${c.id}`}
                  className="font-medium hover:underline truncate"
                >
                  {c.currentName}
                </Link>
                <span className="text-muted-foreground shrink-0">
                  {c.currentRole}
                </span>
                <span className="ml-auto shrink-0 text-xs font-medium">
                  {c.contractEndDate
                    ? <>
                        {formatDate(c.contractEndDate)}
                        {' '}
                        <span className={
                          c.expiryStatus === 'EXPIRED'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-orange-600 dark:text-orange-400'
                        }>
                          ({daysLabel(c.daysRemaining)})
                        </span>
                      </>
                    : <span className="text-muted-foreground">No end date</span>
                  }
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/contractors"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
