/**
 * Freshservice Service Request import proxy
 *
 * GET  /api/import/freshservice?ticketId=10597
 *   → Fetches ticket from FS API, returns mapped employee fields as preview
 *
 * POST /api/import/freshservice
 *   Body: { ticketId: string }
 *   → Fetches ticket, upserts employee (create or update), logs source
 *
 * Env vars required:
 *   FRESHSERVICE_DOMAIN  — e.g. "liquidiv" (no .freshservice.com)
 *   FRESHSERVICE_API_KEY — your API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { findOrCreateEmployee, type ProfileFields } from '@/actions/employees'

// ---------------------------------------------------------------------------
// Freshservice custom field → ProfileFields mapping
// Field names in the FS API response use the snake_case label from the portal.
// The portal screenshot shows these exact field label slugs:
// ---------------------------------------------------------------------------
type FsCustomFields = Record<string, unknown>

function mapFsTicketToProfile(ticket: {
  subject?: string
  description?: string
  custom_fields?: FsCustomFields
  requester?: { name?: string; email?: string }
}): ProfileFields & { _fsSubject?: string } {
  const cf = ticket.custom_fields ?? {}

  // Employee name: prefer explicit first+last fields, fall back to subject parsing
  const firstName = str(cf.employee_first_name ?? cf.cf_employee_first_name)
  const lastName = str(cf.employee_last_name ?? cf.cf_employee_last_name)
  const fullName = firstName && lastName
    ? `${firstName} ${lastName}`
    : str(cf.employee_name ?? cf.cf_employee_name) ?? undefined

  // Employment type normalisation
  const rawType = str(cf.employee_type ?? cf.cf_employee_type) ?? ''
  const employmentType: 'FTE' | 'CONTRACTOR' =
    rawType.toLowerCase().includes('contract') ? 'CONTRACTOR' : 'FTE'

  // Work location type
  const rawLocation = str(cf.location ?? cf.cf_location) ?? ''
  let workLocationType: 'REMOTE' | 'HYBRID' | 'ONSITE' | undefined
  if (rawLocation.toLowerCase() === 'remote') workLocationType = 'REMOTE'
  else if (rawLocation.toLowerCase() === 'hybrid') workLocationType = 'HYBRID'
  else if (rawLocation.toLowerCase() === 'onsite' || rawLocation.toLowerCase() === 'on-site') workLocationType = 'ONSITE'

  // Hardware + special instructions land in notes on the checklist
  const hardware = str(cf.hardware_requested ?? cf.cf_hardware_requested)
  const specialNotes = str(cf.special_instructions_or_notes ?? cf.cf_special_instructions_or_notes)
  const noteParts = [
    hardware ? `Hardware: ${hardware}` : null,
    specialNotes ?? null,
  ].filter(Boolean)

  return {
    currentName: fullName,
    currentRole: str(cf.job_title ?? cf.cf_job_title) ?? undefined,
    currentDepartment: str(cf.department ?? cf.cf_department) ?? undefined,
    employmentType,
    workEmail: undefined, // FS onboarding tickets rarely carry work email
    personalEmail: str(cf.employees_personal_email_address ?? cf.cf_employees_personal_email_address) ?? undefined,
    mobilePhone: str(cf.employees_mobile_number ?? cf.cf_employees_mobile_number) ?? undefined,
    workLocation: rawLocation || undefined,
    workLocationType,
    managerName: extractManagerName(str(cf.reporting_manager_name ?? cf.cf_reporting_manager_name)),
    mailingAddress: str(cf.employees_mailing_address ?? cf.cf_employees_mailing_address) ?? undefined,
    startDate: normaliseDate(str(cf.start_date ?? cf.cf_start_date)),
    notes: noteParts.length > 0 ? noteParts.join(' | ') : undefined,
    _fsSubject: ticket.subject,
  }
}

function str(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  return String(v).trim()
}

// "Steven Wolf <steven.wolf@liquid-iv.com>" → "Steven Wolf"
function extractManagerName(raw: string | null): string | undefined {
  if (!raw) return undefined
  return raw.replace(/<[^>]+>/, '').trim() || undefined
}

// "04-06-2026" or "2026-04-06" → ISO string that Date constructor handles
function normaliseDate(raw: string | null): string | undefined {
  if (!raw) return undefined
  // MM-DD-YYYY → YYYY-MM-DD
  const mmddyyyy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (mmddyyyy) return `${mmddyyyy[3]}-${mmddyyyy[1]}-${mmddyyyy[2]}`
  return raw
}

// ---------------------------------------------------------------------------
// Fetch ticket from Freshservice REST API v2
// ---------------------------------------------------------------------------
async function fetchFsTicket(ticketId: string): Promise<{ ticket: ReturnType<typeof mapFsTicketToProfile> & { _fsSubject?: string } } | { error: string }> {
  const domain = process.env.FRESHSERVICE_DOMAIN
  const apiKey = process.env.FRESHSERVICE_API_KEY

  if (!domain || !apiKey) {
    return { error: 'FRESHSERVICE_DOMAIN and FRESHSERVICE_API_KEY must be set in .env.local' }
  }

  const url = `https://${domain}.freshservice.com/api/v2/tickets/${ticketId}`
  const auth = Buffer.from(`${apiKey}:X`).toString('base64')

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      // No caching — always fetch fresh
      cache: 'no-store',
    })
  } catch (e) {
    return { error: `Network error reaching Freshservice: ${e instanceof Error ? e.message : String(e)}` }
  }

  if (!res.ok) {
    if (res.status === 404) return { error: `Ticket #${ticketId} not found` }
    if (res.status === 401) return { error: 'Invalid Freshservice API key' }
    return { error: `Freshservice API returned ${res.status}` }
  }

  const json = (await res.json()) as { ticket?: Record<string, unknown> }
  if (!json.ticket) return { error: 'Unexpected response format from Freshservice API' }

  return { ticket: mapFsTicketToProfile(json.ticket as Parameters<typeof mapFsTicketToProfile>[0]) }
}

// ---------------------------------------------------------------------------
// GET — preview: returns mapped fields without committing
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const ticketId = req.nextUrl.searchParams.get('ticketId')?.replace(/^SR-/i, '')
  if (!ticketId) {
    return NextResponse.json({ error: 'ticketId query param is required' }, { status: 400 })
  }

  const result = await fetchFsTicket(ticketId)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }

  return NextResponse.json({ preview: result.ticket, ticketId })
}

// ---------------------------------------------------------------------------
// POST — import: upserts employee from ticket
// ---------------------------------------------------------------------------
const importSchema = z.object({ ticketId: z.string().min(1) })

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = importSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'ticketId is required' }, { status: 422 })
  }

  const ticketId = parsed.data.ticketId.replace(/^SR-/i, '')
  const fetchResult = await fetchFsTicket(ticketId)
  if ('error' in fetchResult) {
    return NextResponse.json({ error: fetchResult.error }, { status: 422 })
  }

  const { _fsSubject: _, ...profile } = fetchResult.ticket
  const importResult = await findOrCreateEmployee(profile, 'FRESHSERVICE_API')

  if ('error' in importResult) {
    return NextResponse.json({ error: importResult.error }, { status: 400 })
  }

  return NextResponse.json(importResult, {
    status: importResult.status === 'created' ? 201 : 200,
  })
}
