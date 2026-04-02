'use server'

import { db } from '@/db'
import { employees } from '@/db/schema'
import { eq, and, lte, isNotNull } from 'drizzle-orm'
import type { Employee } from '@/types'

export type ContractorWithStatus = Employee & {
  daysRemaining: number | null  // null = no end date set
  expiryStatus: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'OK' | 'NO_DATE'
}

function classifyExpiry(endDate: Date | number | null | undefined): {
  daysRemaining: number | null
  expiryStatus: ContractorWithStatus['expiryStatus']
} {
  if (!endDate) return { daysRemaining: null, expiryStatus: 'NO_DATE' }
  const end = typeof endDate === 'number' ? new Date(endDate) : endDate
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const diff = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0) return { daysRemaining: diff, expiryStatus: 'EXPIRED' }
  if (diff <= 14) return { daysRemaining: diff, expiryStatus: 'CRITICAL' }
  if (diff <= 30) return { daysRemaining: diff, expiryStatus: 'WARNING' }
  return { daysRemaining: diff, expiryStatus: 'OK' }
}

// ---------------------------------------------------------------------------
// getAllContractors — all contractor employees, sorted soonest end date first
// ---------------------------------------------------------------------------
export async function getAllContractors(): Promise<ContractorWithStatus[]> {
  const all = await db.query.employees.findMany({
    where: eq(employees.employmentType, 'CONTRACTOR'),
  })

  return all
    .map((emp) => ({ ...emp, ...classifyExpiry(emp.contractEndDate) }))
    .sort((a, b) => {
      // Expired first, then soonest, then no date
      if (a.expiryStatus === 'NO_DATE' && b.expiryStatus !== 'NO_DATE') return 1
      if (b.expiryStatus === 'NO_DATE' && a.expiryStatus !== 'NO_DATE') return -1
      if (a.daysRemaining === null) return 1
      if (b.daysRemaining === null) return -1
      return a.daysRemaining - b.daysRemaining
    })
}

// ---------------------------------------------------------------------------
// getExpiringContractors — active contractors expiring within `days` days
// (includes already-expired ones — they're the most urgent)
// ---------------------------------------------------------------------------
export async function getExpiringContractors(days = 14): Promise<ContractorWithStatus[]> {
  const threshold = new Date()
  threshold.setDate(threshold.getDate() + days)
  threshold.setHours(23, 59, 59, 999)

  const expiring = await db.query.employees.findMany({
    where: and(
      eq(employees.employmentType, 'CONTRACTOR'),
      eq(employees.isActive, true),
      isNotNull(employees.contractEndDate),
      lte(employees.contractEndDate, threshold)
    ),
  })

  return expiring
    .map((emp) => ({ ...emp, ...classifyExpiry(emp.contractEndDate) }))
    .sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0))
}
