'use server'

import { db } from '@/db'
import { employees, lifecycleEvents, onboardingChecklists } from '@/db/schema'
import { eq, and, or, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  nameChangeSchema,
  roleChangeSchema,
  convertToFteSchema,
  separationSchema,
} from '@/lib/validators'
import type { WeeklyOnboarding } from '@/types'
import { getNextMondayAndWednesday } from '@/lib/utils'
import type { z } from 'zod'

export async function logNameChange(input: z.infer<typeof nameChangeSchema>) {
  const parsed = nameChangeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { employeeId, newName, eventDate, notes } = parsed.data
  const now = new Date()

  const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) })
  if (!emp) return { error: 'Employee not found' }

  await db.transaction(async (tx) => {
    await tx.insert(lifecycleEvents).values({
      employeeId,
      eventType: 'NAME_CHANGE',
      eventDate: new Date(eventDate),
      payload: { oldName: emp.currentName, newName } as unknown as null,
      notes: notes ?? null,
      createdAt: now,
    })
    await tx.update(employees).set({ currentName: newName }).where(eq(employees.id, employeeId))
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

  await db.transaction(async (tx) => {
    await tx.insert(lifecycleEvents).values({
      employeeId,
      eventType,
      eventDate: new Date(eventDate),
      payload: null,
      notes: notes ?? null,
      createdAt: now,
    })
    await tx
      .update(employees)
      .set({ isActive: false })
      .where(eq(employees.id, employeeId))
  })

  revalidatePath('/dashboard')
  revalidatePath(`/employees/${employeeId}`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// getWeeklyOnboardings — for the /onboarding/weekly view
// Returns ONBOARDED + REHIRED events whose eventDate falls on next Mon or Wed
// ---------------------------------------------------------------------------
export async function getWeeklyOnboardings(): Promise<{
  monday: Date
  wednesday: Date
  onboardings: WeeklyOnboarding[]
}> {
  const { monday, wednesday } = getNextMondayAndWednesday()

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
