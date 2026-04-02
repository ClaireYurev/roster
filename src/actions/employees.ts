'use server'

import { db } from '@/db'
import { employees, lifecycleEvents, onboardingChecklists, hardwareAssets } from '@/db/schema'
import type { ImportSource } from '@/db/schema'
import { eq, desc, and, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createEmployeeSchema, rehireSchema, importRowSchema } from '@/lib/validators'
import type { EmployeeWithLatestChecklist, EmployeeWithFullHistory, ImportRowValidated } from '@/types'
import type { z } from 'zod'

// ---------------------------------------------------------------------------
// ProfileFields — shape used by all 3 import/update pathways
// ---------------------------------------------------------------------------
export type ProfileFields = {
  currentName?: string
  currentRole?: string
  currentDepartment?: string
  employmentType?: 'FTE' | 'CONTRACTOR'
  freshserviceId?: string
  workEmail?: string
  personalEmail?: string
  workPhone?: string
  mobilePhone?: string
  workLocation?: string
  workLocationType?: 'REMOTE' | 'HYBRID' | 'ONSITE'
  managerName?: string
  costCenter?: string
  jobBand?: string
  mailingAddress?: string
  photoUrl?: string
  startDate?: string   // ISO date — only used when creating a new record
  notes?: string       // carried as event notes (e.g. hardware requested, special instructions)
}

// Field display names for diff payload (human-readable in timeline)
const FIELD_LABELS: Record<string, string> = {
  currentName: 'Name',
  currentRole: 'Job Title',
  currentDepartment: 'Department',
  employmentType: 'Employment Type',
  freshserviceId: 'Freshservice ID',
  workEmail: 'Work Email',
  personalEmail: 'Personal Email',
  workPhone: 'Work Phone',
  mobilePhone: 'Mobile',
  workLocation: 'Work Location',
  workLocationType: 'Work Type',
  managerName: 'Manager',
  costCenter: 'Cost Center',
  jobBand: 'Job Band',
  mailingAddress: 'Mailing Address',
}

// ---------------------------------------------------------------------------
// updateEmployeeProfile
// Shared by: manual UI edits, browser extension, Freshservice import
// - Only overwrites fields where incoming value is non-null and non-empty
// - Logs a PROFILE_UPDATED lifecycle event with a diff of what changed
// - Returns { status: 'updated'|'no_changes', employeeId }
// ---------------------------------------------------------------------------
export async function updateEmployeeProfile(
  employeeId: string,
  incoming: ProfileFields,
  source: ImportSource
): Promise<{ status: 'updated' | 'no_changes'; employeeId: string } | { error: string }> {
  const existing = await db.query.employees.findFirst({
    where: eq(employees.id, employeeId),
  })
  if (!existing) return { error: 'Employee not found' }

  // Build diff: only include fields where incoming value is non-empty and different
  type DiffEntry = { from: string | null; to: string }
  const diff: Record<string, DiffEntry> = {}
  const updates: Partial<typeof existing> = {}

  const profileKeys = [
    'currentName', 'currentRole', 'currentDepartment', 'employmentType',
    'freshserviceId', 'workEmail', 'personalEmail', 'workPhone', 'mobilePhone',
    'workLocation', 'workLocationType', 'managerName', 'costCenter', 'jobBand',
    'mailingAddress', 'photoUrl',
  ] as const

  for (const key of profileKeys) {
    const newVal = incoming[key as keyof ProfileFields] as string | undefined
    if (newVal === undefined || newVal === null || newVal.trim() === '') continue

    const oldVal = (existing as Record<string, unknown>)[key] as string | null
    if (newVal.trim() === (oldVal ?? '').trim()) continue // no change

    // Only include in diff payload if it's a visible field (not photoUrl)
    if (key !== 'photoUrl' && FIELD_LABELS[key]) {
      diff[FIELD_LABELS[key]] = { from: oldVal ?? null, to: newVal.trim() }
    }
    ;(updates as Record<string, unknown>)[key] = newVal.trim()
  }

  if (Object.keys(updates).length === 0) {
    return { status: 'no_changes', employeeId }
  }

  const now = new Date()

  await db.transaction(async (tx) => {
    await tx.update(employees).set(updates).where(eq(employees.id, employeeId))

    await tx.insert(lifecycleEvents).values({
      employeeId,
      eventType: 'PROFILE_UPDATED',
      eventDate: now,
      payload: { changes: diff } as unknown as null,
      notes: incoming.notes ?? null,
      source,
      createdAt: now,
    })
  })

  revalidatePath(`/employees/${employeeId}`)
  revalidatePath('/dashboard')
  return { status: 'updated', employeeId }
}

// ---------------------------------------------------------------------------
// findOrCreateEmployee
// Used by browser extension + Freshservice import when creating from scratch
// ---------------------------------------------------------------------------
export async function findOrCreateEmployee(
  incoming: ProfileFields,
  source: ImportSource
): Promise<{ status: 'created' | 'updated' | 'no_changes'; employeeId: string } | { error: string }> {
  // Match by freshserviceId first, then exact name
  let existing = incoming.freshserviceId
    ? await db.query.employees.findFirst({ where: eq(employees.freshserviceId, incoming.freshserviceId) })
    : undefined

  if (!existing && incoming.currentName) {
    existing = await db.query.employees.findFirst({
      where: eq(employees.currentName, incoming.currentName.trim()),
    })
  }

  if (existing) {
    const result = await updateEmployeeProfile(existing.id, incoming, source)
    if ('error' in result) return result
    return { ...result, employeeId: existing.id }
  }

  // Create new
  if (!incoming.currentName) return { error: 'currentName is required to create a new employee' }

  const id = crypto.randomUUID()
  const now = new Date()
  const startDate = incoming.startDate ? new Date(incoming.startDate) : now

  await db.transaction(async (tx) => {
    await tx.insert(employees).values({
      id,
      currentName: incoming.currentName!.trim(),
      currentRole: incoming.currentRole?.trim() ?? 'Unknown',
      currentDepartment: incoming.currentDepartment?.trim() ?? 'Unknown',
      employmentType: incoming.employmentType ?? 'FTE',
      isActive: true,
      mailingAddress: incoming.mailingAddress?.trim() ?? null,
      createdAt: now,
      freshserviceId: incoming.freshserviceId?.trim() ?? null,
      workEmail: incoming.workEmail?.trim() ?? null,
      personalEmail: incoming.personalEmail?.trim() ?? null,
      workPhone: incoming.workPhone?.trim() ?? null,
      mobilePhone: incoming.mobilePhone?.trim() ?? null,
      workLocation: incoming.workLocation?.trim() ?? null,
      workLocationType: incoming.workLocationType ?? null,
      managerName: incoming.managerName?.trim() ?? null,
      costCenter: incoming.costCenter?.trim() ?? null,
      jobBand: incoming.jobBand?.trim() ?? null,
      photoUrl: incoming.photoUrl?.trim() ?? null,
    })

    const [event] = await tx
      .insert(lifecycleEvents)
      .values({
        employeeId: id,
        eventType: 'ONBOARDED',
        eventDate: startDate,
        payload: null,
        notes: incoming.notes ?? `Created via ${source.toLowerCase().replace(/_/g, ' ')}`,
        source,
        createdAt: now,
      })
      .returning({ id: lifecycleEvents.id })

    await tx.insert(onboardingChecklists).values({
      lifecycleEventId: event.id,
      jumpCloudProvisioned: false,
      laptopAssigned: false,
      emailAliasCreated: false,
      computerType: null,
      computerSize: null,
      peripheralsNotes: null,
      additionalNotes: null,
      createdAt: now,
      updatedAt: now,
    })
  })

  revalidatePath('/dashboard')
  return { status: 'created', employeeId: id }
}

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
