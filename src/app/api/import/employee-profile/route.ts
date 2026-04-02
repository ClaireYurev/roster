/**
 * POST /api/import/employee-profile
 *
 * Browser extension endpoint for importing one employee profile at a time
 * from Freshservice (or any HR system). Matches by freshserviceId first,
 * then falls back to exact name match. Creates the employee if not found.
 *
 * Expected JSON body (all fields optional except at minimum one identifier):
 * {
 *   freshserviceId?: string       — HR system employee ID
 *   currentName: string           — full name (required)
 *   currentRole?: string          — job title
 *   currentDepartment?: string    — department
 *   employmentType?: 'FTE' | 'CONTRACTOR'
 *   workEmail?: string
 *   personalEmail?: string
 *   workPhone?: string
 *   mobilePhone?: string
 *   workLocation?: string         — office/city name
 *   workLocationType?: 'REMOTE' | 'HYBRID' | 'ONSITE'
 *   managerName?: string
 *   costCenter?: string
 *   jobBand?: string              — e.g. 'L4', 'Senior IC'
 *   mailingAddress?: string
 *   photoUrl?: string             — base64 data URI ("data:image/...") or https URL
 *   startDate?: string            — ISO date string, used only when creating new employee
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { employees, lifecycleEvents, onboardingChecklists } from '@/db/schema'
import { eq, or } from 'drizzle-orm'
import { z } from 'zod'

const profileSchema = z.object({
  currentName: z.string().min(1),
  currentRole: z.string().optional(),
  currentDepartment: z.string().optional(),
  employmentType: z.enum(['FTE', 'CONTRACTOR']).optional(),
  freshserviceId: z.string().optional(),
  workEmail: z.string().optional(),
  personalEmail: z.string().optional(),
  workPhone: z.string().optional(),
  mobilePhone: z.string().optional(),
  workLocation: z.string().optional(),
  workLocationType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  managerName: z.string().optional(),
  costCenter: z.string().optional(),
  jobBand: z.string().optional(),
  mailingAddress: z.string().optional(),
  photoUrl: z.string().optional(),
  startDate: z.string().optional(), // ISO date — used only for new employee creation
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const data = parsed.data
  const now = new Date()

  // --- Find existing employee ---
  let existing = data.freshserviceId
    ? await db.query.employees.findFirst({
        where: eq(employees.freshserviceId, data.freshserviceId),
      })
    : undefined

  // Fallback: match by exact name if no freshserviceId match
  if (!existing) {
    existing = await db.query.employees.findFirst({
      where: eq(employees.currentName, data.currentName),
    })
  }

  if (existing) {
    // --- UPDATE existing employee profile fields ---
    await db
      .update(employees)
      .set({
        // Update HR profile fields — never overwrite name/role/dept without explicit event
        ...(data.freshserviceId !== undefined && { freshserviceId: data.freshserviceId }),
        ...(data.workEmail !== undefined && { workEmail: data.workEmail }),
        ...(data.personalEmail !== undefined && { personalEmail: data.personalEmail }),
        ...(data.workPhone !== undefined && { workPhone: data.workPhone }),
        ...(data.mobilePhone !== undefined && { mobilePhone: data.mobilePhone }),
        ...(data.workLocation !== undefined && { workLocation: data.workLocation }),
        ...(data.workLocationType !== undefined && { workLocationType: data.workLocationType }),
        ...(data.managerName !== undefined && { managerName: data.managerName }),
        ...(data.costCenter !== undefined && { costCenter: data.costCenter }),
        ...(data.jobBand !== undefined && { jobBand: data.jobBand }),
        ...(data.mailingAddress !== undefined && { mailingAddress: data.mailingAddress }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
        // Also update role/dept/type if provided (same info as HR system)
        ...(data.currentRole !== undefined && { currentRole: data.currentRole }),
        ...(data.currentDepartment !== undefined && { currentDepartment: data.currentDepartment }),
        ...(data.employmentType !== undefined && { employmentType: data.employmentType }),
      })
      .where(eq(employees.id, existing.id))

    return NextResponse.json({ status: 'updated', employeeId: existing.id })
  }

  // --- CREATE new employee ---
  const id = crypto.randomUUID()
  const startDate = data.startDate ? new Date(data.startDate) : now

  await db.transaction(async (tx) => {
    await tx.insert(employees).values({
      id,
      currentName: data.currentName,
      currentRole: data.currentRole ?? 'Unknown',
      currentDepartment: data.currentDepartment ?? 'Unknown',
      employmentType: data.employmentType ?? 'FTE',
      isActive: true,
      mailingAddress: data.mailingAddress ?? null,
      createdAt: now,
      freshserviceId: data.freshserviceId ?? null,
      workEmail: data.workEmail ?? null,
      personalEmail: data.personalEmail ?? null,
      workPhone: data.workPhone ?? null,
      mobilePhone: data.mobilePhone ?? null,
      workLocation: data.workLocation ?? null,
      workLocationType: data.workLocationType ?? null,
      managerName: data.managerName ?? null,
      costCenter: data.costCenter ?? null,
      jobBand: data.jobBand ?? null,
      photoUrl: data.photoUrl ?? null,
    })

    const [event] = await tx
      .insert(lifecycleEvents)
      .values({
        employeeId: id,
        eventType: 'ONBOARDED',
        eventDate: startDate,
        payload: null,
        notes: 'Created via browser extension import',
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

  return NextResponse.json({ status: 'created', employeeId: id }, { status: 201 })
}
