'use server'

import { db } from '@/db'
import { employees, lifecycleEvents, onboardingChecklists, loaRecords } from '@/db/schema'
import { eq, and, or, gte, lte, desc, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  nameChangeSchema,
  roleChangeSchema,
  convertToFteSchema,
  separationSchema,
  loaStartSchema,
  loaEndSchema,
} from '@/lib/validators'
import type { WeeklyOnboarding, LoaRecord } from '@/types'
import { getNextMondayAndWednesday, getMondayOfWeek, toISODate, computeDisplayName } from '@/lib/utils'
import type { z } from 'zod'

export async function logNameChange(input: z.infer<typeof nameChangeSchema>) {
  const parsed = nameChangeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { employeeId, newLegalFirstName, newLegalLastName, eventDate, notes } = parsed.data
  const now = new Date()

  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) })
  if (!emp) return { error: 'Employee not found' }

  // Display name uses new legal name but keeps any existing preferred name
  const newDisplayName = computeDisplayName(
    emp.preferredFirstName,
    emp.preferredLastName,
    newLegalFirstName,
    newLegalLastName
  )

  await db.transaction(async (tx) => {
    await tx.insert(lifecycleEvents).values({
      employeeId,
      eventType: 'NAME_CHANGE',
      eventDate: new Date(eventDate),
      payload: {
        oldName: emp.currentName,
        newName: newDisplayName,
        oldLegalFirst: emp.legalFirstName,
        oldLegalLast: emp.legalLastName,
        newLegalFirst: newLegalFirstName,
        newLegalLast: newLegalLastName,
      } as unknown as null,
      notes: notes ?? null,
      source: 'MANUAL',
      createdAt: now,
    })
    await tx.update(employees)
      .set({
        legalFirstName: newLegalFirstName,
        legalLastName: newLegalLastName,
        currentName: newDisplayName,
      })
      .where(eq(employees.id, employeeId))
  })

  revalidatePath('/dashboard')
  revalidatePath(`/employees/${employeeId}`)
  return { success: true }
}

export async function logRoleChange(input: z.infer<typeof roleChangeSchema>) {
  const parsed = roleChangeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { employeeId, newRole, newDepartment, eventDate, notes } = parsed.data
  const now = new Date()

  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) })
  if (!emp) return { error: 'Employee not found' }

  const updates: Partial<typeof emp> = { currentRole: newRole }
  if (newDepartment) updates.currentDepartment = newDepartment

  await db.transaction(async (tx) => {
    await tx.insert(lifecycleEvents).values({
      employeeId,
      eventType: 'ROLE_CHANGE',
      eventDate: new Date(eventDate),
      payload: {
        oldRole: emp.currentRole,
        newRole,
        oldDepartment: emp.currentDepartment,
        newDepartment: newDepartment ?? emp.currentDepartment,
      } as unknown as null,
      notes: notes ?? null,
      createdAt: now,
    })
    await tx.update(employees).set(updates).where(eq(employees.id, employeeId))
  })

  revalidatePath('/dashboard')
  revalidatePath(`/employees/${employeeId}`)
  return { success: true }
}

export async function logConvertToFte(input: z.infer<typeof convertToFteSchema>) {
  const parsed = convertToFteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { employeeId, eventDate, notes } = parsed.data
  const now = new Date()

  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) })
  if (!emp) return { error: 'Employee not found' }

  await db.transaction(async (tx) => {
    await tx.insert(lifecycleEvents).values({
      employeeId,
      eventType: 'CONVERTED_TO_FTE',
      eventDate: new Date(eventDate),
      payload: { previousType: emp.employmentType } as unknown as null,
      notes: notes ?? null,
      createdAt: now,
    })
    await tx
      .update(employees)
      .set({ employmentType: 'FTE' })
      .where(eq(employees.id, employeeId))
  })

  revalidatePath('/dashboard')
  revalidatePath(`/employees/${employeeId}`)
  return { success: true }
}

export async function logSeparation(input: z.infer<typeof separationSchema>) {
  const parsed = separationSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { employeeId, eventType, eventDate, notes } = parsed.data
  const now = new Date()
  // RESIGNED → voluntary; TERMINATED → involuntary
  const newStatus = eventType === 'RESIGNED' ? 'DISABLED_VOLUNTARY' : 'DISABLED_INVOLUNTARY'

  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) })
  if (!emp) return { error: 'Employee not found' }

  await db.transaction(async (tx) => {
    await tx.insert(lifecycleEvents).values({
      employeeId,
      eventType,
      eventDate: new Date(eventDate),
      payload: { employmentTypeAtSeparation: emp.employmentType } as unknown as null,
      notes: notes ?? null,
      source: 'MANUAL',
      createdAt: now,
    })
    await tx
      .update(employees)
      .set({ isActive: false, status: newStatus, contractEndDate: null })
      .where(eq(employees.id, employeeId))
  })

  revalidatePath('/dashboard')
  revalidatePath('/contractors')
  revalidatePath(`/employees/${employeeId}`)
  return { success: true, requiresServiceNowTicket: emp.employmentType === 'CONTRACTOR' }
}

// ---------------------------------------------------------------------------
// logLOAStart — sets status=LOA, creates loa_record with IT checklist
// ---------------------------------------------------------------------------
export async function logLOAStart(input: z.infer<typeof loaStartSchema>) {
  const parsed = loaStartSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { employeeId, eventDate, expectedEndDate, pcEndDateConfirmed, jumpcloudSuspended, notes } = parsed.data
  const now = new Date()

  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) })
  if (!emp) return { error: 'Employee not found' }
  if (emp.status !== 'ACTIVE') return { error: 'Employee must be Active to start LOA' }

  let loaRecordId: number | undefined

  await db.transaction(async (tx) => {
    const [event] = await tx.insert(lifecycleEvents).values({
      employeeId,
      eventType: 'LOA_START',
      eventDate: new Date(eventDate),
      payload: { expectedEndDate } as unknown as null,
      notes: notes ?? null,
      source: 'MANUAL',
      createdAt: now,
    }).returning({ id: lifecycleEvents.id })

    const [record] = await tx.insert(loaRecords).values({
      lifecycleEventId: event.id,
      expectedEndDate: new Date(expectedEndDate),
      pcEndDateConfirmed,
      jumpcloudSuspended,
      jumpcloudActivated: false,
      actualEndDate: null,
      notes: notes ?? null,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: loaRecords.id })

    loaRecordId = record.id

    // Azure stays active — isActive stays true; status = LOA
    await tx.update(employees).set({ status: 'LOA' }).where(eq(employees.id, employeeId))
  })

  revalidatePath('/dashboard')
  revalidatePath(`/employees/${employeeId}`)
  return { success: true, loaRecordId }
}

// ---------------------------------------------------------------------------
// updateLOAChecklist — allows IT to tick off JumpCloud suspended/activated
// ---------------------------------------------------------------------------
export async function updateLOAChecklist(
  loaRecordId: number,
  updates: { pcEndDateConfirmed?: boolean; jumpcloudSuspended?: boolean; jumpcloudActivated?: boolean }
) {
  const now = new Date()
  await db.update(loaRecords).set({ ...updates, updatedAt: now }).where(eq(loaRecords.id, loaRecordId))
  return { success: true }
}

// ---------------------------------------------------------------------------
// logLOAReturn — ends LOA, sets status=ACTIVE, marks JumpCloud activated
// ---------------------------------------------------------------------------
export async function logLOAReturn(input: z.infer<typeof loaEndSchema>) {
  const parsed = loaEndSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { employeeId, loaRecordId, eventDate, jumpcloudActivated, notes } = parsed.data
  const now = new Date()

  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) })
  if (!emp) return { error: 'Employee not found' }
  if (emp.status !== 'LOA') return { error: 'Employee is not currently on LOA' }

  await db.transaction(async (tx) => {
    await tx.insert(lifecycleEvents).values({
      employeeId,
      eventType: 'LOA_END',
      eventDate: new Date(eventDate),
      payload: null,
      notes: notes ?? null,
      source: 'MANUAL',
      createdAt: now,
    })

    await tx.update(loaRecords).set({
      jumpcloudActivated,
      actualEndDate: new Date(eventDate),
      updatedAt: now,
    }).where(eq(loaRecords.id, loaRecordId))

    await tx.update(employees).set({ status: 'ACTIVE', isActive: true }).where(eq(employees.id, employeeId))
  })

  revalidatePath('/dashboard')
  revalidatePath(`/employees/${employeeId}`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// getActiveLOARecord — returns the open loa_record for an employee on LOA
// ---------------------------------------------------------------------------
export async function getActiveLOARecord(employeeId: string): Promise<LoaRecord | null> {
  // Find most recent LOA_START event for this employee
  const loaStartEvent = await db.query.lifecycleEvents.findFirst({
    where: and(
      eq(lifecycleEvents.employeeId, employeeId),
      eq(lifecycleEvents.eventType, 'LOA_START')
    ),
    orderBy: [desc(lifecycleEvents.eventDate)],
  })
  if (!loaStartEvent) return null

  const record = await db.query.loaRecords.findFirst({
    where: and(
      eq(loaRecords.lifecycleEventId, loaStartEvent.id),
      isNull(loaRecords.actualEndDate)
    ),
  }) ?? null

  return record
}

// ---------------------------------------------------------------------------
// getWeeklyOnboardings — for the /onboarding/weekly view
// Returns ONBOARDED + REHIRED events whose eventDate falls on Mon or Wed of
// the given week (monday). Defaults to the next upcoming Mon/Wed pair.
// ---------------------------------------------------------------------------
export async function getWeeklyOnboardings(weekStart?: Date): Promise<{
  monday: Date
  wednesday: Date
  onboardings: WeeklyOnboarding[]
}> {
  let monday: Date
  let wednesday: Date

  if (weekStart) {
    monday = new Date(weekStart)
    monday.setHours(0, 0, 0, 0)
    wednesday = new Date(monday)
    wednesday.setDate(monday.getDate() + 2)
    wednesday.setHours(0, 0, 0, 0)
  } else {
    ;({ monday, wednesday } = getNextMondayAndWednesday())
  }

  // Query window: from monday 00:00:00 to wednesday 23:59:59
  const windowStart = new Date(monday)
  windowStart.setHours(0, 0, 0, 0)
  const windowEnd = new Date(wednesday)
  windowEnd.setHours(23, 59, 59, 999)

  const events = await db.query.lifecycleEvents.findMany({
    where: and(
      or(
        eq(lifecycleEvents.eventType, 'ONBOARDED'),
        eq(lifecycleEvents.eventType, 'REHIRED')
      ),
      gte(lifecycleEvents.eventDate, windowStart),
      lte(lifecycleEvents.eventDate, windowEnd)
    ),
  })

  const onboardings: WeeklyOnboarding[] = []

  for (const event of events) {
    const emp = await db.query.employees.findFirst({
      where: eq(employees.id, event.employeeId),
    })
    if (!emp) continue

    const checklist = await db.query.onboardingChecklists.findFirst({
      where: eq(onboardingChecklists.lifecycleEventId, event.id),
    }) ?? null

    onboardings.push({ employee: emp, event, checklist })
  }

  // Sort by eventDate
  onboardings.sort((a, b) =>
    Number(a.event.eventDate) - Number(b.event.eventDate)
  )

  return { monday, wednesday, onboardings }
}

// ---------------------------------------------------------------------------
// getOnboardingsCalendarData — returns per-date onboarding counts for a range
// Used by the calendar overview to show onboarding density across weeks
// ---------------------------------------------------------------------------
export async function getOnboardingsCalendarData(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<{ date: string; count: number }[]> {
  const start = new Date(rangeStart); start.setHours(0, 0, 0, 0)
  const end   = new Date(rangeEnd);   end.setHours(23, 59, 59, 999)

  const events = await db.query.lifecycleEvents.findMany({
    where: and(
      or(
        eq(lifecycleEvents.eventType, 'ONBOARDED'),
        eq(lifecycleEvents.eventType, 'REHIRED')
      ),
      gte(lifecycleEvents.eventDate, start),
      lte(lifecycleEvents.eventDate, end)
    ),
  })

  const counts: Record<string, number> = {}
  for (const ev of events) {
    const d = new Date(ev.eventDate as unknown as number)
    const key = toISODate(d)
    counts[key] = (counts[key] ?? 0) + 1
  }

  return Object.entries(counts).map(([date, count]) => ({ date, count }))
}
