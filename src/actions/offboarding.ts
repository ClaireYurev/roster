'use server'

import { db } from '@/db'
import { employees, lifecycleEvents } from '@/db/schema'
import { eq, or, and, desc } from 'drizzle-orm'
import type { Employee } from '@/types'

export type OffboardedEmployee = Employee & {
  separationDate: Date | null
  separationType: 'RESIGNED' | 'TERMINATED' | null
  /** True if the employee was a contractor at time of separation — needs ServiceNow */
  requiresServiceNow: boolean
}

export async function getOffboardedEmployees(): Promise<OffboardedEmployee[]> {
  const offboarded = await db.query.employees.findMany({
    where: or(
      eq(employees.status, 'DISABLED_VOLUNTARY'),
      eq(employees.status, 'DISABLED_INVOLUNTARY'),
    ),
  })

  const results: OffboardedEmployee[] = []

  for (const emp of offboarded) {
    const sepEvent = await db.query.lifecycleEvents.findFirst({
      where: and(
        eq(lifecycleEvents.employeeId, emp.id),
        or(
          eq(lifecycleEvents.eventType, 'RESIGNED'),
          eq(lifecycleEvents.eventType, 'TERMINATED'),
        ),
      ),
      orderBy: [desc(lifecycleEvents.eventDate)],
    })

    const separationDate = sepEvent?.eventDate
      ? sepEvent.eventDate instanceof Date
        ? sepEvent.eventDate
        : new Date(sepEvent.eventDate)
      : null

    const separationType =
      (sepEvent?.eventType as 'RESIGNED' | 'TERMINATED' | null) ?? null

    // ServiceNow needed if they were a contractor at time of separation
    const payload = sepEvent?.payload as Record<string, unknown> | null
    const typeAtSep = payload?.employmentTypeAtSeparation as string | undefined
    const requiresServiceNow = (typeAtSep ?? emp.employmentType) === 'CONTRACTOR'

    results.push({ ...emp, separationDate, separationType, requiresServiceNow })
  }

  // Most recently separated first
  results.sort((a, b) => {
    if (!a.separationDate && !b.separationDate) return 0
    if (!a.separationDate) return 1
    if (!b.separationDate) return -1
    return b.separationDate.getTime() - a.separationDate.getTime()
  })

  return results
}
