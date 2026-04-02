/**
 * Seed script — populates the DB with 2 records per employment category:
 *
 *  1. Active FTE              (2)
 *  2. Active Contractor       (2)
 *  3. On LOA                  (2)
 *  4. Voluntary Offboard      (2)
 *  5. Involuntary Offboard    (2)
 *
 * Run with:  npx tsx scripts/seed.ts
 */

import Database from 'better-sqlite3'
import path from 'path'
import { randomUUID } from 'crypto'

const DB_PATH = path.join(process.cwd(), 'data', 'roster.db')
const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ts(d: Date) {
  return d.getTime()
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

// ---------------------------------------------------------------------------
// Prepared statements
// ---------------------------------------------------------------------------
const insertEmployee = sqlite.prepare(`
  INSERT INTO employees (
    id, current_name, legal_first_name, legal_last_name,
    preferred_first_name, preferred_last_name,
    current_role, current_department, employment_type,
    is_active, status, contract_end_date,
    work_email, work_location, work_location_type,
    manager_name, cost_center, job_band,
    created_at
  ) VALUES (
    @id, @current_name, @legal_first_name, @legal_last_name,
    @preferred_first_name, @preferred_last_name,
    @current_role, @current_department, @employment_type,
    @is_active, @status, @contract_end_date,
    @work_email, @work_location, @work_location_type,
    @manager_name, @cost_center, @job_band,
    @created_at
  )
`)

const insertEvent = sqlite.prepare(`
  INSERT INTO lifecycle_events (
    employee_id, event_type, event_date, payload, notes, source, created_at
  ) VALUES (
    @employee_id, @event_type, @event_date, @payload, @notes, @source, @created_at
  )
`)

const insertChecklist = sqlite.prepare(`
  INSERT INTO onboarding_checklists (
    lifecycle_event_id,
    jumpcloud_provisioned, laptop_assigned, email_alias_created,
    computer_type, computer_size, peripherals_notes, additional_notes,
    created_at, updated_at
  ) VALUES (
    @lifecycle_event_id,
    @jumpcloud_provisioned, @laptop_assigned, @email_alias_created,
    @computer_type, @computer_size, @peripherals_notes, @additional_notes,
    @created_at, @updated_at
  )
`)

const insertLOARecord = sqlite.prepare(`
  INSERT INTO loa_records (
    lifecycle_event_id, expected_end_date,
    pc_end_date_confirmed, jumpcloud_suspended, jumpcloud_activated,
    actual_end_date, notes, created_at, updated_at
  ) VALUES (
    @lifecycle_event_id, @expected_end_date,
    @pc_end_date_confirmed, @jumpcloud_suspended, @jumpcloud_activated,
    @actual_end_date, @notes, @created_at, @updated_at
  )
`)

const getLastInsertRowid = sqlite.prepare('SELECT last_insert_rowid() as id')

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
type EmployeeSeed = {
  legalFirst: string
  legalLast: string
  preferredFirst?: string
  preferredLast?: string
  role: string
  dept: string
  type: 'FTE' | 'CONTRACTOR'
  status: 'ACTIVE' | 'LOA' | 'DISABLED_VOLUNTARY' | 'DISABLED_INVOLUNTARY'
  startDate: Date
  hireContext: string
  email: string
  location: string
  locationType: 'REMOTE' | 'HYBRID' | 'ONSITE'
  manager: string
  costCenter: string
  jobBand: string
  contractEndDate?: Date
  // For IT checklist
  checklistDone?: boolean
  // For separation
  separationType?: 'RESIGNED' | 'TERMINATED'
  separationDate?: Date
  // For LOA
  loaStartDate?: Date
  expectedReturn?: Date
  loaOverdue?: boolean
  pcConfirmed?: boolean
  jumpcloudSuspended?: boolean
  loaNotes?: string
}

const seeds: EmployeeSeed[] = [
  // ── 1. Active FTE ───────────────────────────────────────────────────────
  {
    legalFirst: 'Marcus', legalLast: 'Delgado',
    role: 'Senior Brand Manager', dept: 'Marketing',
    type: 'FTE', status: 'ACTIVE',
    startDate: daysAgo(120),
    hireContext: 'NEW_FTE',
    email: 'mdelgado@liquidiv.com',
    location: 'El Segundo, CA', locationType: 'HYBRID',
    manager: 'Sarah Chen', costCenter: 'MKT-001', jobBand: 'L5',
    checklistDone: true,
  },
  {
    legalFirst: 'Priya', legalLast: 'Nair',
    preferredFirst: 'Pri',
    role: 'Supply Chain Analyst', dept: 'Operations',
    type: 'FTE', status: 'ACTIVE',
    startDate: daysAgo(45),
    hireContext: 'UL_TRANSFER',
    email: 'pnair@liquidiv.com',
    location: 'Remote', locationType: 'REMOTE',
    manager: 'James Okafor', costCenter: 'OPS-003', jobBand: 'L4',
    checklistDone: false,
  },

  // ── 2. Active Contractor ─────────────────────────────────────────────────
  {
    legalFirst: 'Tyler', legalLast: 'Romero',
    role: 'UX Designer', dept: 'Product',
    type: 'CONTRACTOR', status: 'ACTIVE',
    startDate: daysAgo(60),
    hireContext: 'NEW_CONTRACTOR',
    email: 'tromero@contractor.liquidiv.com',
    location: 'Los Angeles, CA', locationType: 'HYBRID',
    manager: 'Nina Patel', costCenter: 'PROD-002', jobBand: 'IC3',
    contractEndDate: daysFromNow(45),
    checklistDone: true,
  },
  {
    legalFirst: 'Amara', legalLast: 'Osei',
    role: 'Data Engineer', dept: 'Technology',
    type: 'CONTRACTOR', status: 'ACTIVE',
    startDate: daysAgo(20),
    hireContext: 'NEW_CONTRACTOR',
    email: 'aosei@contractor.liquidiv.com',
    location: 'Remote', locationType: 'REMOTE',
    manager: 'Derek Walsh', costCenter: 'TECH-005', jobBand: 'IC4',
    contractEndDate: daysFromNow(12), // expiring soon — triggers warning
    checklistDone: false,
  },

  // ── 3. On LOA ────────────────────────────────────────────────────────────
  {
    legalFirst: 'Sofia', legalLast: 'Bergmann',
    role: 'Finance Manager', dept: 'Finance',
    type: 'FTE', status: 'LOA',
    startDate: daysAgo(365),
    hireContext: 'NEW_FTE',
    email: 'sbergmann@liquidiv.com',
    location: 'El Segundo, CA', locationType: 'ONSITE',
    manager: 'Rob Tanaka', costCenter: 'FIN-001', jobBand: 'L6',
    checklistDone: true,
    loaStartDate: daysAgo(30),
    expectedReturn: daysFromNow(14),
    pcConfirmed: true,
    jumpcloudSuspended: true,
    loaNotes: 'Parental leave — expected return confirmed with P&C on 2026-03-20.',
  },
  {
    legalFirst: 'Kwame', legalLast: 'Asante',
    role: 'Demand Planner', dept: 'Operations',
    type: 'FTE', status: 'LOA',
    startDate: daysAgo(500),
    hireContext: 'PAST_FTE_REHIRED',
    email: 'kasante@liquidiv.com',
    location: 'Remote', locationType: 'REMOTE',
    manager: 'James Okafor', costCenter: 'OPS-003', jobBand: 'L4',
    checklistDone: true,
    loaStartDate: daysAgo(10),
    expectedReturn: daysAgo(3), // overdue!
    pcConfirmed: false,
    jumpcloudSuspended: false,
    loaNotes: 'Medical leave. P&C has not yet confirmed return date.',
  },

  // ── 4. Voluntary Offboard (Resigned) ────────────────────────────────────
  {
    legalFirst: 'Hannah', legalLast: 'Liu',
    role: 'Content Strategist', dept: 'Marketing',
    type: 'FTE', status: 'DISABLED_VOLUNTARY',
    startDate: daysAgo(730),
    hireContext: 'NEW_FTE',
    email: 'hliu@liquidiv.com',
    location: 'El Segundo, CA', locationType: 'HYBRID',
    manager: 'Sarah Chen', costCenter: 'MKT-001', jobBand: 'L4',
    checklistDone: true,
    separationType: 'RESIGNED',
    separationDate: daysAgo(21),
  },
  {
    legalFirst: 'Devon', legalLast: 'Schultz',
    role: 'Logistics Coordinator', dept: 'Operations',
    type: 'CONTRACTOR', status: 'DISABLED_VOLUNTARY',
    startDate: daysAgo(200),
    hireContext: 'NEW_CONTRACTOR',
    email: 'dschultz@contractor.liquidiv.com',
    location: 'Remote', locationType: 'REMOTE',
    manager: 'James Okafor', costCenter: 'OPS-003', jobBand: 'IC2',
    checklistDone: true,
    separationType: 'RESIGNED',
    separationDate: daysAgo(14),
  },

  // ── 5. Involuntary Offboard (Terminated) ────────────────────────────────
  {
    legalFirst: 'Carlos', legalLast: 'Mendez',
    role: 'Sales Representative', dept: 'Sales',
    type: 'FTE', status: 'DISABLED_INVOLUNTARY',
    startDate: daysAgo(400),
    hireContext: 'NEW_FTE',
    email: 'cmendez@liquidiv.com',
    location: 'El Segundo, CA', locationType: 'ONSITE',
    manager: 'Lisa Yuen', costCenter: 'SALES-002', jobBand: 'L3',
    checklistDone: true,
    separationType: 'TERMINATED',
    separationDate: daysAgo(7),
  },
  {
    legalFirst: 'Jasmine', legalLast: 'Holloway',
    role: 'QA Engineer', dept: 'Technology',
    type: 'CONTRACTOR', status: 'DISABLED_INVOLUNTARY',
    startDate: daysAgo(90),
    hireContext: 'NEW_CONTRACTOR',
    email: 'jholloway@contractor.liquidiv.com',
    location: 'Remote', locationType: 'REMOTE',
    manager: 'Derek Walsh', costCenter: 'TECH-005', jobBand: 'IC3',
    checklistDone: true,
    separationType: 'TERMINATED',
    separationDate: daysAgo(5),
  },
]

// ---------------------------------------------------------------------------
// Execute seed in a single transaction
// ---------------------------------------------------------------------------
const run = sqlite.transaction(() => {
  for (const s of seeds) {
    const id = randomUUID()
    const now = new Date()
    const displayName = s.preferredFirst
      ? `${s.preferredFirst} ${s.legalLast}`
      : `${s.legalFirst} ${s.legalLast}`

    const isActive = s.status === 'ACTIVE' || s.status === 'LOA'

    insertEmployee.run({
      id,
      current_name: displayName,
      legal_first_name: s.legalFirst,
      legal_last_name: s.legalLast,
      preferred_first_name: s.preferredFirst ?? null,
      preferred_last_name: s.preferredLast ?? null,
      current_role: s.role,
      current_department: s.dept,
      employment_type: s.type,
      is_active: isActive ? 1 : 0,
      status: s.status,
      contract_end_date: s.contractEndDate ? ts(s.contractEndDate) : null,
      work_email: s.email,
      work_location: s.location,
      work_location_type: s.locationType,
      manager_name: s.manager,
      cost_center: s.costCenter,
      job_band: s.jobBand,
      created_at: ts(s.startDate),
    })

    // ONBOARDED event
    insertEvent.run({
      employee_id: id,
      event_type: 'ONBOARDED',
      event_date: ts(s.startDate),
      payload: JSON.stringify({ hireContext: s.hireContext, source: 'MANUAL' }),
      notes: null,
      source: 'MANUAL',
      created_at: ts(s.startDate),
    })
    const onboardedId = (getLastInsertRowid.get() as { id: number }).id

    // Onboarding checklist
    insertChecklist.run({
      lifecycle_event_id: onboardedId,
      jumpcloud_provisioned: s.checklistDone ? 1 : 0,
      laptop_assigned: s.checklistDone ? 1 : 0,
      email_alias_created: s.checklistDone ? 1 : 0,
      computer_type: s.type === 'FTE' ? 'MacBook Pro' : 'MacBook Air',
      computer_size: s.type === 'FTE' ? '14"' : '13"',
      peripherals_notes: null,
      additional_notes: null,
      created_at: ts(now),
      updated_at: ts(now),
    })

    // ── Separation event ─────────────────────────────────────────────────
    if (s.separationType && s.separationDate) {
      insertEvent.run({
        employee_id: id,
        event_type: s.separationType,
        event_date: ts(s.separationDate),
        payload: JSON.stringify({
          employmentTypeAtSeparation: s.type,
          status: s.status,
        }),
        notes: s.separationType === 'RESIGNED'
          ? 'Employee submitted resignation.'
          : 'Employment terminated.',
        source: 'MANUAL',
        created_at: ts(s.separationDate),
      })
    }

    // ── LOA events + record ──────────────────────────────────────────────
    if (s.status === 'LOA' && s.loaStartDate) {
      insertEvent.run({
        employee_id: id,
        event_type: 'LOA_START',
        event_date: ts(s.loaStartDate),
        payload: JSON.stringify({
          expectedEndDate: s.expectedReturn ? s.expectedReturn.toISOString() : null,
        }),
        notes: s.loaNotes ?? null,
        source: 'MANUAL',
        created_at: ts(s.loaStartDate),
      })
      const loaEventId = (getLastInsertRowid.get() as { id: number }).id

      insertLOARecord.run({
        lifecycle_event_id: loaEventId,
        expected_end_date: s.expectedReturn ? ts(s.expectedReturn) : null,
        pc_end_date_confirmed: s.pcConfirmed ? 1 : 0,
        jumpcloud_suspended: s.jumpcloudSuspended ? 1 : 0,
        jumpcloud_activated: 0,
        actual_end_date: null,
        notes: s.loaNotes ?? null,
        created_at: ts(s.loaStartDate),
        updated_at: ts(now),
      })
    }

    console.log(`  ✓  ${displayName.padEnd(28)} ${s.status.padEnd(24)} ${s.type}`)
  }
})

console.log('\nSeeding database...\n')
run()
console.log(`\nDone — inserted ${seeds.length} employees.\n`)
