'use server'

import { db } from '@/db'
import { employees, lifecycleEvents, onboardingChecklists, hardwareAssets } from '@/db/schema'
import { eq, desc, and, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createEmployeeSchema, rehireSchema, importRowSchema } from '@/lib/validators'
import type { EmployeeWithLatestChecklist, EmployeeWithFullHistory, ImportRowValidated } from '@/types'
import type { z } from 'zod'

// ---------------------------------------------------------------------------
// createEmployee — creates employee + ONBOARDED event + checklist in one tx
// ---------------------------------------------------------------------------
export async function createEmployee(input: z.infer<typeof createEmployeeSchema>) {
  const parsed = createEmployeeSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  const id = crypto.randomUUID()
  const now = new Date()
  const startDate = new Date(data.startDate)

  await db.transaction(async (tx) => {
    await tx.insert(employees).values({
      id,
      currentName: data.currentName,
      currentRole: data.currentRole,
      currentDepartment: data.currentDepartment,
      employmentType: data.employmentType,
      mailingAddress: data.mailingAddress ?? null,
      isActive: true,
      createdAt: now,
    })

    const [event] = await tx
      .insert(lifecycleEvents)
      .values({
        employeeId: id,
        eventType: 'ONBOARDED',
        eventDate: startDate,
        payload: null,
        notes: data.notes ?? null,
        createdAt: now,
      })
      .returning({ id: lifecycleEvents.id })

    await tx.insert(onboardingChecklists).values({
      lifecycleEventId: event.id,
      jumpCloudProvisioned: false,
      laptopAssigned: false,
      emailAliasCreated: false,
      computerType: data.computerType ?? null,
      computerSize: data.computerSize ?? null,
      peripheralsNotes: data.peripheralsNotes ?? null,
      additionalNotes: null,
      createdAt: now,
      updatedAt: now,
    })
  })

  revalidatePath('/dashboard')
  return { success: true, employeeId: id }
}

// ---------------------------------------------------------------------------
// getEmployees — dashboard list with latest checklist status + hardware
// ---------------------------------------------------------------------------
export async function getEmployees(): Promise<EmployeeWithLatestChecklist[]> {
  const allEmployees = await db.query.employees.findMany({
    orderBy: [desc(employees.createdAt)],
  })

  const results: EmployeeWithLatestChecklist[] = []

  for (const emp of allEmployees) {
    // Find latest ONBOARDED or REHIRED event for checklist
    const latestOnboardingEvent = await db.query.lifecycleEvents.findFirst({
      where: and(
        eq(lifecycleEvents.employeeId, emp.id),
        or(
          eq(lifecycleEvents.eventType, 'ONBOARDED'),
          eq(lifecycleEvents.eventType, 'REHIRED')
        )
      ),
      orderBy: [desc(lifecycleEvents.eventDate)],
    })

    const latestChecklist = latestOnboardingEvent
      ? await db.query.onboardingChecklists.findFirst({
          where: eq(onboardingChecklists.lifecycleEventId, latestOnboardingEvent.id),
        }) ?? null
      : null

    const assignedHardware = await db.query.hardwareAssets.findFirst({
      where: and(
        eq(hardwareAssets.employeeId, emp.id),
        eq(hardwareAssets.status, 'ASSIGNED')
      ),
    }) ?? null

    results.push({ ...emp, latestChecklist, assignedHardware })
  }

  return results
}

// ---------------------------------------------------------------------------
// getEmployee — full profile with all lifecycle events + hardware
// ---------------------------------------------------------------------------
export async function getEmployee(id: string): Promise<EmployeeWithFullHistory | null> {
  const emp = await db.query.employees.findFirst({
    where: eq(employees.id, id),
  })
  if (!emp) return null

  const events = await db.query.lifecycleEvents.findMany({
    where: eq(lifecycleEvents.employeeId, id),
    orderBy: [desc(lifecycleEvents.eventDate)],
  })

  const eventsWithChecklists = await Promise.all(
    events.map(async (event) => {
      const checklist =
        event.eventType === 'ONBOARDED' || event.eventType === 'REHIRED'
          ? await db.query.onboardingChecklists.findFirst({
              where: eq(onboardingChecklists.lifecycleEventId, event.id),
            }) ?? null
          : null
      return { ...event, checklist }
    })
  )

  const hw = await db.query.hardwareAssets.findMany({
    where: eq(hardwareAssets.employeeId, id),
    orderBy: [desc(hardwareAssets.assignedDate)],
  })

  return { ...emp, lifecycleEvents: eventsWithChecklists, hardwareAssets: hw }
}

// ---------------------------------------------------------------------------
// rehireEmployee — rehire with new role + checklist
// ---------------------------------------------------------------------------
export async function rehireEmployee(input: z.infer<typeof rehireSchema>) {
  const parsed = rehireSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const data = parsed.data
  const now = new Date()

  await db.transaction(async (tx) => {
    await tx
      .update(employees)
      .set({
        isActive: true,
        currentRole: data.newRole,
        currentDepartment: data.newDepartment,
        employmentType: data.employmentType,
      })
      .where(eq(employees.id, data.employeeId))

    const [event] = await tx
      .insert(lifecycleEvents)
      .values({
        employeeId: data.employeeId,
        eventType: 'REHIRED',
        eventDate: new Date(data.eventDate),
        payload: { newRole: data.newRole, newDepartment: data.newDepartment } as unknown as null,
        notes: data.notes ?? null,
        createdAt: now,
      })
      .returning({ id: lifecycleEvents.id })

    await tx.insert(onboardingChecklists).values({
      lifecycleEventId: event.id,
      jumpCloudProvisioned: false,
      laptopAssigned: false,
      emailAliasCreated: false,
      computerType: data.computerType ?? null,
      computerSize: data.computerSize ?? null,
      peripheralsNotes: null,
      additionalNotes: null,
      createdAt: now,
      updatedAt: now,
    })
  })

  revalidatePath('/dashboard')
  revalidatePath(`/employees/${data.employeeId}`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// bulkImportEmployees — transaction-wrapped batch insert
// ---------------------------------------------------------------------------
export async function bulkImportEmployees(rows: ImportRowValidated[]) {
  const validRows = rows.filter((r) => r._valid)
  if (validRows.length === 0) return { error: 'No valid rows to import' }

  let imported = 0

  await db.transaction(async (tx) => {
    for (const row of validRows) {
      const parsed = importRowSchema.safeParse(row)
      if (!parsed.success) continue

      const data = parsed.data
      const id = crypto.randomUUID()
      const now = new Date()
      const startDate = new Date(data.startDate)

      await tx.insert(employees).values({
        id,
        currentName: data.currentName,
        currentRole: data.currentRole,
        currentDepartment: data.currentDepartment,
        employmentType: data.employmentType,
        mailingAddress: data.mailingAddress ?? null,
        isActive: true,
        createdAt: now,
      })

      const [event] = await tx
        .insert(lifecycleEvents)
        .values({
          employeeId: id,
          eventType: 'ONBOARDED',
          eventDate: startDate,
          payload: null,
          notes: 'Bulk import',
          createdAt: now,
        })
        .returning({ id: lifecycleEvents.id })

      await tx.insert(onboardingChecklists).values({
        lifecycleEventId: event.id,
        jumpCloudProvisioned: false,
        laptopAssigned: false,
        emailAliasCreated: false,
        computerType: data.computerType ?? null,
        computerSize: data.computerSize ?? null,
        peripheralsNotes: null,
        additionalNotes: null,
        createdAt: now,
        updatedAt: now,
      })

      imported++
    }
  })

  revalidatePath('/dashboard')
  return { success: true, imported }
}
