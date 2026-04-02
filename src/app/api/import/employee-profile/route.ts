/**
 * POST /api/import/employee-profile
 *
 * Browser extension endpoint — scrapes one Azure/HR profile at a time.
 * Matches by freshserviceId first, then exact name. Creates or updates.
 * All changes are versioned via PROFILE_UPDATED lifecycle events.
 *
 * Body: see ProfileFields type in src/actions/employees.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { findOrCreateEmployee } from '@/actions/employees'

const schema = z.object({
  // Accept both structured name fields and legacy currentName
  legalFirstName: z.string().optional(),
  legalLastName: z.string().optional(),
  preferredFirstName: z.string().optional(),
  preferredLastName: z.string().optional(),
  // Legacy: bare full name string; parsed into legal first+last internally
  currentName: z.string().optional(),
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
  startDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  // Must have at least some name to identify/create the employee
  const d = parsed.data
  if (!d.legalFirstName && !d.legalLastName && !d.currentName) {
    return NextResponse.json(
      { error: 'At least one of legalFirstName, legalLastName, or currentName is required' },
      { status: 422 }
    )
  }

  const result = await findOrCreateEmployee(parsed.data, 'BROWSER_EXTENSION')

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result, {
    status: result.status === 'created' ? 201 : 200,
  })
}
