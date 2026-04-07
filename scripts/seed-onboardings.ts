/**
 * Seed script — adds dummy onboarding records for 3 upcoming weeks:
 *   Week 1: Mon Apr 13 + Wed Apr 15, 2026
 *   Week 2: Mon Apr 20 + Wed Apr 22, 2026
 *   Week 3: Mon Apr 27 + Wed Apr 29, 2026
 *
 * Run with:  npx tsx scripts/seed-onboardings.ts
 */

import Database from 'better-sqlite3'
import path from 'path'
import { randomUUID } from 'crypto'

const DB_PATH = path.join(process.cwd(), 'data', 'roster.db')
const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

function ts(d: Date) { return d.getTime() }

function date(y: number, m: number, day: number) {
  return new Date(y, m - 1, day, 9, 0, 0, 0)
}

const insertEmployee = sqlite.prepare(`
  INSERT INTO employees (
    id, current_name, legal_first_name, legal_last_name,
    preferred_first_name, preferred_last_name,
    current_role, current_department, employment_type,
    is_active, status, contract_end_date,
    work_email, work_location, work_location_type,
    manager_name, cost_center, job_band,
    mailing_address, created_at
  ) VALUES (
    @id, @current_name, @legal_first_name, @legal_last_name,
    @preferred_first_name, @preferred_last_name,
    @current_role, @current_department, @employment_type,
    @is_active, @status, @contract_end_date,
    @work_email, @work_location, @work_location_type,
    @manager_name, @cost_center, @job_band,
    @mailing_address, @created_at
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

const getLastId = () =>
  (sqlite.prepare('SELECT last_insert_rowid() as id').get() as { id: number }).id

const now = Date.now()

type Onboardee = {
  legalFirst: string
  legalLast: string
  preferredFirst?: string
  role: string
  dept: string
  type: 'FTE' | 'CONTRACTOR'
  location: string
  locationType: 'REMOTE' | 'HYBRID' | 'ONSITE'
  manager: string
  costCenter: string
  jobBand: string
  address?: string
  contractEndDate?: Date
  computer: { type: string; size: string; notes?: string }
  checklist: { jc: boolean; laptop: boolean; email: boolean }
  notes?: string
}

const ONBOARDEES: Array<{ startDate: Date; people: Onboardee[] }> = [
  // ── Week 1: Apr 13 (Mon) ──────────────────────────────────────────
  {
    startDate: date(2026, 4, 13),
    people: [
      {
        legalFirst: 'Marcus', legalLast: 'Osei',
        role: 'Software Engineer II', dept: 'Engineering',
        type: 'FTE', location: 'Austin, TX', locationType: 'HYBRID',
        manager: 'Priya Kamdar', costCenter: 'ENG-001', jobBand: 'L4',
        address: '2104 Barton Springs Rd\nAustin, TX 78704',
        computer: { type: 'MacBook Pro 14"', size: 'M3 Pro' },
        checklist: { jc: true, laptop: true, email: false },
        notes: 'Joining from Google. Hardware shipped to home office.',
      },
      {
        legalFirst: 'Amara', legalLast: 'Diallo',
        role: 'Product Designer', dept: 'Design',
        type: 'FTE', location: 'New York, NY', locationType: 'HYBRID',
        manager: 'Sarah Lin', costCenter: 'DES-001', jobBand: 'L3',
        address: '315 W 23rd St, Apt 4B\nNew York, NY 10011',
        computer: { type: 'MacBook Pro 16"', size: 'M3 Max', notes: 'Also needs XDR display' },
        checklist: { jc: true, laptop: true, email: true },
      },
      {
        legalFirst: 'Tobias', legalLast: 'Reinholt',
        role: 'Data Analyst', dept: 'Analytics',
        type: 'FTE', location: 'Remote', locationType: 'REMOTE',
        manager: 'Leon Park', costCenter: 'ANA-001', jobBand: 'L3',
        address: '88 Maple Street\nPortland, OR 97201',
        computer: { type: 'MacBook Pro 14"', size: 'M3' },
        checklist: { jc: false, laptop: false, email: false },
      },
      {
        legalFirst: 'Lucia', legalLast: 'Ferretti',
        role: 'Brand Marketing Manager', dept: 'Marketing',
        type: 'CONTRACTOR',
        contractEndDate: date(2026, 10, 13),
        location: 'Los Angeles, CA', locationType: 'REMOTE',
        manager: 'Denise Watanabe', costCenter: 'MKT-002', jobBand: 'IC3',
        address: '1420 Venice Blvd\nLos Angeles, CA 90066',
        computer: { type: 'MacBook Air 13"', size: 'M3' },
        checklist: { jc: true, laptop: false, email: false },
        notes: '6-month contract, option to extend.',
      },
    ],
  },

  // ── Week 1: Apr 15 (Wed) ─────────────────────────────────────────
  {
    startDate: date(2026, 4, 15),
    people: [
      {
        legalFirst: 'Yuki', legalLast: 'Hashimoto',
        preferredFirst: 'Yu',
        role: 'Infrastructure Engineer', dept: 'Engineering',
        type: 'FTE', location: 'San Francisco, CA', locationType: 'ONSITE',
        manager: 'Priya Kamdar', costCenter: 'ENG-002', jobBand: 'L4',
        address: '540 Howard St, Apt 12\nSan Francisco, CA 94105',
        computer: { type: 'MacBook Pro 14"', size: 'M3 Max' },
        checklist: { jc: true, laptop: true, email: true },
      },
      {
        legalFirst: 'Kofi', legalLast: 'Mensah',
        role: 'Account Executive', dept: 'Sales',
        type: 'FTE', location: 'Chicago, IL', locationType: 'HYBRID',
        manager: 'Rachel Goldstein', costCenter: 'SAL-001', jobBand: 'L3',
        address: '1200 N Lake Shore Dr, Apt 5C\nChicago, IL 60610',
        computer: { type: 'MacBook Air 15"', size: 'M3' },
        checklist: { jc: false, laptop: false, email: false },
        notes: 'Needs Salesforce access on day 1.',
      },
    ],
  },

  // ── Week 2: Apr 20 (Mon) ─────────────────────────────────────────
  {
    startDate: date(2026, 4, 20),
    people: [
      {
        legalFirst: 'Simone', legalLast: 'Okafor',
        role: 'Senior Software Engineer', dept: 'Engineering',
        type: 'FTE', location: 'Austin, TX', locationType: 'HYBRID',
        manager: 'Priya Kamdar', costCenter: 'ENG-001', jobBand: 'L5',
        address: '901 E 6th St\nAustin, TX 78702',
        computer: { type: 'MacBook Pro 16"', size: 'M3 Max' },
        checklist: { jc: false, laptop: false, email: false },
      },
      {
        legalFirst: 'Dmitri', legalLast: 'Voronov',
        role: 'Security Engineer', dept: 'IT & Security',
        type: 'FTE', location: 'Remote', locationType: 'REMOTE',
        manager: 'Claire Chen', costCenter: 'ITS-001', jobBand: 'L4',
        address: '2200 Pennsylvania Ave NW, Apt 300\nWashington, DC 20037',
        computer: { type: 'MacBook Pro 14"', size: 'M3 Pro', notes: 'Requires YubiKey' },
        checklist: { jc: false, laptop: false, email: false },
        notes: 'Hardware shipped. Awaiting background check completion.',
      },
      {
        legalFirst: 'Naledi', legalLast: 'Dlamini',
        role: 'People Operations Specialist', dept: 'People & Culture',
        type: 'FTE', location: 'New York, NY', locationType: 'HYBRID',
        manager: 'Hana Bergström', costCenter: 'HR-001', jobBand: 'L3',
        address: '45 E 25th St, Apt 8A\nNew York, NY 10010',
        computer: { type: 'MacBook Air 13"', size: 'M3' },
        checklist: { jc: true, laptop: false, email: false },
      },
      {
        legalFirst: 'Felix', legalLast: 'Brandt',
        role: 'UX Researcher', dept: 'Design',
        type: 'CONTRACTOR',
        contractEndDate: date(2026, 7, 20),
        location: 'Berlin (Remote)', locationType: 'REMOTE',
        manager: 'Sarah Lin', costCenter: 'DES-002', jobBand: 'IC2',
        address: 'Oranienburger Str. 67\nBerlin, Germany 10117',
        computer: { type: 'MacBook Air 13"', size: 'M3' },
        checklist: { jc: false, laptop: false, email: false },
        notes: '3-month research contract. EU timezone, async-friendly.',
      },
    ],
  },

  // ── Week 2: Apr 22 (Wed) ─────────────────────────────────────────
  {
    startDate: date(2026, 4, 22),
    people: [
      {
        legalFirst: 'Priscilla', legalLast: 'Nakagawa',
        preferredFirst: 'Priya',
        role: 'Finance Business Partner', dept: 'Finance',
        type: 'FTE', location: 'San Francisco, CA', locationType: 'HYBRID',
        manager: 'Omar Shaikh', costCenter: 'FIN-001', jobBand: 'L4',
        address: '1 Market St, Ste 100\nSan Francisco, CA 94105',
        computer: { type: 'MacBook Pro 14"', size: 'M3' },
        checklist: { jc: false, laptop: false, email: false },
      },
      {
        legalFirst: 'Elijah', legalLast: 'Baptiste',
        role: 'Customer Success Manager', dept: 'Customer Success',
        type: 'FTE', location: 'Remote', locationType: 'REMOTE',
        manager: 'Rachel Goldstein', costCenter: 'CS-001', jobBand: 'L3',
        address: '820 Bourbon St\nNew Orleans, LA 70116',
        computer: { type: 'MacBook Air 15"', size: 'M3', notes: 'Prefers dark mode setup' },
        checklist: { jc: false, laptop: false, email: false },
      },
    ],
  },

  // ── Week 3: Apr 27 (Mon) ─────────────────────────────────────────
  {
    startDate: date(2026, 4, 27),
    people: [
      {
        legalFirst: 'Ingrid', legalLast: 'Svensson',
        role: 'Staff Engineer', dept: 'Engineering',
        type: 'FTE', location: 'Remote', locationType: 'REMOTE',
        manager: 'Priya Kamdar', costCenter: 'ENG-003', jobBand: 'L6',
        address: '42 Sveavägen\nStockholm, Sweden 11134',
        computer: { type: 'MacBook Pro 16"', size: 'M3 Max', notes: 'International shipping — confirmed delivered' },
        checklist: { jc: true, laptop: true, email: false },
        notes: 'Stockholm-based. All-remote. Will need Zoom Rooms access.',
      },
      {
        legalFirst: 'Jerome', legalLast: 'Washington',
        role: 'Growth Marketing Manager', dept: 'Marketing',
        type: 'FTE', location: 'Atlanta, GA', locationType: 'HYBRID',
        manager: 'Denise Watanabe', costCenter: 'MKT-001', jobBand: 'L4',
        address: '750 Peachtree St NE, Apt 22\nAtlanta, GA 30308',
        computer: { type: 'MacBook Air 15"', size: 'M3' },
        checklist: { jc: false, laptop: false, email: false },
      },
      {
        legalFirst: 'Anika', legalLast: 'Patel',
        role: 'Backend Engineer', dept: 'Engineering',
        type: 'FTE', location: 'Austin, TX', locationType: 'ONSITE',
        manager: 'Priya Kamdar', costCenter: 'ENG-001', jobBand: 'L4',
        address: '1800 Lavaca St, Apt 9\nAustin, TX 78701',
        computer: { type: 'MacBook Pro 14"', size: 'M3 Pro' },
        checklist: { jc: false, laptop: false, email: false },
        notes: 'Transferring from LIV India subsidiary.',
      },
      {
        legalFirst: 'Santiago', legalLast: 'Herrera',
        role: 'DevRel Engineer', dept: 'Engineering',
        type: 'CONTRACTOR',
        contractEndDate: date(2026, 12, 31),
        location: 'Miami, FL', locationType: 'REMOTE',
        manager: 'Priya Kamdar', costCenter: 'ENG-004', jobBand: 'IC4',
        address: '100 Biscayne Blvd, Unit 3200\nMiami, FL 33132',
        computer: { type: 'MacBook Pro 14"', size: 'M3' },
        checklist: { jc: false, laptop: false, email: false },
      },
    ],
  },

  // ── Week 3: Apr 29 (Wed) ─────────────────────────────────────────
  {
    startDate: date(2026, 4, 29),
    people: [
      {
        legalFirst: 'Dara', legalLast: 'Abramowitz',
        preferredFirst: 'Dee',
        role: 'Legal Counsel', dept: 'Legal',
        type: 'FTE', location: 'New York, NY', locationType: 'HYBRID',
        manager: 'Omar Shaikh', costCenter: 'LEG-001', jobBand: 'L5',
        address: '200 W 72nd St, Apt 18D\nNew York, NY 10023',
        computer: { type: 'MacBook Pro 14"', size: 'M3 Pro' },
        checklist: { jc: false, laptop: false, email: false },
      },
      {
        legalFirst: 'Kwame', legalLast: 'Asare',
        role: 'Solutions Architect', dept: 'Engineering',
        type: 'FTE', location: 'Remote', locationType: 'REMOTE',
        manager: 'Priya Kamdar', costCenter: 'ENG-005', jobBand: 'L5',
        address: '5678 Pecan Grove Rd\nHouston, TX 77056',
        computer: { type: 'MacBook Pro 16"', size: 'M3 Max', notes: 'Needs external display adapter' },
        checklist: { jc: false, laptop: false, email: false },
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Insert everything in a transaction
// ---------------------------------------------------------------------------
const seed = sqlite.transaction(() => {
  let empCount = 0
  let eventCount = 0
  let checklistCount = 0

  for (const batch of ONBOARDEES) {
    for (const p of batch.people) {
      const id = randomUUID()
      const displayName = `${p.preferredFirst ?? p.legalFirst} ${p.legalLast}`

      insertEmployee.run({
        id,
        current_name: displayName,
        legal_first_name: p.legalFirst,
        legal_last_name: p.legalLast,
        preferred_first_name: p.preferredFirst ?? null,
        preferred_last_name: null,
        current_role: p.role,
        current_department: p.dept,
        employment_type: p.type,
        is_active: 1,
        status: 'ACTIVE',
        contract_end_date: p.contractEndDate ? ts(p.contractEndDate) : null,
        work_email: `${p.legalFirst.toLowerCase()}.${p.legalLast.toLowerCase()}@company.com`,
        work_location: p.location,
        work_location_type: p.locationType,
        manager_name: p.manager,
        cost_center: p.costCenter,
        job_band: p.jobBand,
        mailing_address: p.address ?? null,
        created_at: now,
      })
      empCount++

      insertEvent.run({
        employee_id: id,
        event_type: 'ONBOARDED',
        event_date: ts(batch.startDate),
        payload: JSON.stringify({ hireContext: p.type === 'CONTRACTOR' ? 'NEW_CONTRACTOR' : 'NEW_FTE' }),
        notes: p.notes ?? null,
        source: 'MANUAL',
        created_at: now,
      })
      eventCount++

      const eventId = getLastId()

      insertChecklist.run({
        lifecycle_event_id: eventId,
        jumpcloud_provisioned: p.checklist.jc ? 1 : 0,
        laptop_assigned: p.checklist.laptop ? 1 : 0,
        email_alias_created: p.checklist.email ? 1 : 0,
        computer_type: p.computer.type,
        computer_size: p.computer.size,
        peripherals_notes: p.computer.notes ?? null,
        additional_notes: p.notes ?? null,
        created_at: now,
        updated_at: now,
      })
      checklistCount++

      const status = p.checklist.jc && p.checklist.laptop && p.checklist.email
        ? '✓ Ready'
        : p.checklist.jc || p.checklist.laptop || p.checklist.email
        ? '~ In Progress'
        : '○ Not Started'

      const dateStr = batch.startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      console.log(`  [${dateStr}] ${status}  ${displayName} — ${p.role} (${p.dept}, ${p.type})`)
    }
  }

  return { empCount, eventCount, checklistCount }
})

console.log('\n🌱 Seeding onboarding records...\n')
const result = seed()
console.log(`\n✅ Done — inserted ${result.empCount} employees, ${result.eventCount} events, ${result.checklistCount} checklists.\n`)
sqlite.close()
