'use server'

import { db } from '@/db'
import { employees, lifecycleEvents, loaRecords } from '@/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import type { Employee, LoaRecord } from '@/types'

export type LOAEmployeeWithRecord = Employee & {
  loaRecord: LoaRecord
  loaStartDate: Date
  daysOnLOA: number
  isOverdue: boolean
}

export async function getLOAEmployees(): Promise<LOAEmployeeWithRecord[]> {
  const loaEmployees = await db.query.employees.findMany({
    where: eq(employees.status, 'LOA'),
    orderBy: [desc(employees.createdAt)],
  })

  const results: LOAEmployeeWithRecord[] = []
  const now = new Date()

  for (const emp of loaEmployees) {
    const loaStartEvent = await db.query.lifecycleEvents.findFirst({
      where: and(
        eq(lifecycleEvents.employeeId, emp.id),
        eq(lifecycleEvents.eventType, 'LOA_START'),
      ),
      orderBy: [desc(lifecycleEvents.eventDate)],
    })
    if (!loaStartEvent) continue

    const record = await db.query.loaRecords.findFirst({
      where: and(
        eq(loaRecords.lifecycleEventId, loaStartEvent.id),
        isNull(loaRecords.actualEndDate),
      ),
    })
    if (!record) continue

    const loaStartDate =
      loaStartEvent.eventDate instanceof Date
        ? loaStartEvent.eventDate
        : new Date(loaStartEvent.eventDate)

    const daysOnLOA = Math.floor(
      (now.getTime() - loaStartDate.getTime()) / (1000 * 60 * 60 * 24),
    )

    const expectedEnd = record.expectedEndDate
      ? record.expectedEndDate instanceof Date
        ? record.expectedEndDate
        : new Date(record.expectedEndDate)
      : null

    const isOverdue = expectedEnd != null && expectedEnd < now

    results.push({ ...emp, loaRecord: record, loaStartDate, daysOnLOA, isOverdue })
  }

  // Sort: overdue first, then by loaStartDate ascending (longest LOA at top)
  results.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1
    if (!a.isOverdue && b.isOverdue) return 1
    return a.loaStartDate.getTime() - b.loaStartDate.getTime()
  })

  return results
}

// ── Inline field update ─────────────────────────────────────────────────────

export async function updateLoaRecordDetails(
  loaRecordId: number,
  updates: {
    expectedEndDate?: string | null
    notes?: string | null
    pcEndDateConfirmed?: boolean
    jumpcloudSuspended?: boolean
    jumpcloudActivated?: boolean
  }
): Promise<{ success: true } | { error: string }> {
  const set: Record<string, unknown> = { updatedAt: new Date() }

  if ('expectedEndDate' in updates) {
    set.expectedEndDate = updates.expectedEndDate ? new Date(updates.expectedEndDate) : null
  }
  if ('notes' in updates) set.notes = updates.notes ?? null
  if ('pcEndDateConfirmed' in updates) set.pcEndDateConfirmed = updates.pcEndDateConfirmed
  if ('jumpcloudSuspended' in updates) set.jumpcloudSuspended = updates.jumpcloudSuspended
  if ('jumpcloudActivated' in updates) set.jumpcloudActivated = updates.jumpcloudActivated

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.update(loaRecords).set(set as any).where(eq(loaRecords.id, loaRecordId))
  return { success: true }
}
