/**
 * Seed script — adds:
 *  1. 2 employees starting this coming Mon/Wed (for Weekly Onboarding view)
 *  2. Hardware assets: 4 assigned, 2 unassigned, 1 retired
 *
 * Run with:  npx tsx scripts/seed-weekly-hardware.ts
 */

import Database from 'better-sqlite3'
import path from 'path'
import { randomUUID } from 'crypto'

const DB_PATH = path.join(process.cwd(), 'data', 'roster.db')
const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

function ts(d: Date) { return d.getTime() }

// Compute next Monday and Wednesday from today
function getNextMondayAndWednesday(): { monday: Date; wednesday: Date } {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const dow = today.getDay() // 0=Sun,1=Mon,...,6=Sat
  const daysToMonday = dow === 0 ? 1 : dow === 1 ? 7 : 8 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + daysToMonday)
  monday.setHours(9, 0, 0, 0)
  const wednesday = new Date(monday)
  wednesday.setDate(monday.getDate() + 2)
  wednesday.setHours(9, 0, 0, 0)
  return { monday, wednesday }
}

const { monday, wednesday } = getNextMondayAndWednesday()
const now = new Date()

// ---------------------------------------------------------------------------
// Existing employee IDs (for hardware assignment)
// ---------------------------------------------------------------------------
const empIds = (sqlite.prepare('SELECT id, current_name FROM employees WHERE status = ?').all('ACTIVE') as { id: string; current_name: string }[])
const byName = (name: string) => empIds.find(e => e.current_name === name)?.id

const marcusId   = byName('Marcus Delgado')
const priId      = byName('Pri Nair')
const tylerRomId = byName('Tyler Romero')
const amaraId    = byName('Amara Osei')

// ---------------------------------------------------------------------------
// Prepared statements
// ---------------------------------------------------------------------------
const insertEmployee = sqlite.prepare(`
  INSERT INTO employees (
    id, current_name, legal_first_name, legal_last_name,
    current_role, current_department, employment_type,
    is_active, status, work_email, work_location, work_location_type,
    manager_name, cost_center, job_band, created_at
  ) VALUES (
    @id, @current_name, @legal_first_name, @legal_last_name,
    @current_role, @current_department, @employment_type,
    @is_active, @status, @work_email, @work_location, @work_location_type,
    @manager_name, @cost_center, @job_band, @created_at
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

const insertHardware = sqlite.prepare(`
  INSERT INTO hardware_assets (
    id, system_name, asset_tag, model, description, cost,
    purchase_date, status, employee_id, assigned_date,
    created_at, updated_at
  ) VALUES (
    @id, @system_name, @asset_tag, @model, @description, @cost,
    @purchase_date, @status, @employee_id, @assigned_date,
    @created_at, @updated_at
  )
`)

const getLastId = sqlite.prepare('SELECT last_insert_rowid() as id')

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
const run = sqlite.transaction(() => {

  // ── 1. Weekly Onboarding employees ────────────────────────────────────────
  const weeklyEmployees = [
    {
      legalFirst: 'Jordan', legalLast: 'Park',
      role: 'Growth Marketing Manager', dept: 'Marketing',
      type: 'FTE', email: 'jpark@liquidiv.com',
      location: 'El Segundo, CA', locationType: 'HYBRID',
      manager: 'Sarah Chen', costCenter: 'MKT-001', jobBand: 'L5',
      startDate: monday,
      hireContext: 'NEW_FTE',
      // Monday starter — checklist not done yet
      checklistDone: false,
    },
    {
      legalFirst: 'Nadia', legalLast: 'Volkov',
      role: 'IT Systems Analyst', dept: 'Technology',
      type: 'CONTRACTOR', email: 'nvolkov@contractor.liquidiv.com',
      location: 'Remote', locationType: 'REMOTE',
      manager: 'Derek Walsh', costCenter: 'TECH-005', jobBand: 'IC3',
      startDate: wednesday,
      hireContext: 'NEW_CONTRACTOR',
      checklistDone: false,
    },
  ]

  for (const s of weeklyEmployees) {
    const id = randomUUID()
    const displayName = `${s.legalFirst} ${s.legalLast}`

    insertEmployee.run({
      id,
      current_name: displayName,
      legal_first_name: s.legalFirst,
      legal_last_name: s.legalLast,
      current_role: s.role,
      current_department: s.dept,
      employment_type: s.type,
      is_active: 1,
      status: 'ACTIVE',
      work_email: s.email,
      work_location: s.location,
      work_location_type: s.locationType,
      manager_name: s.manager,
      cost_center: s.costCenter,
      job_band: s.jobBand,
      created_at: ts(s.startDate),
    })

    insertEvent.run({
      employee_id: id,
      event_type: 'ONBOARDED',
      event_date: ts(s.startDate),
      payload: JSON.stringify({ hireContext: s.hireContext }),
      notes: null,
      source: 'MANUAL',
      created_at: ts(now),
    })
    const eventId = (getLastId.get() as { id: number }).id

    insertChecklist.run({
      lifecycle_event_id: eventId,
      jumpcloud_provisioned: 0,
      laptop_assigned: 0,
      email_alias_created: 0,
      computer_type: s.type === 'FTE' ? 'MacBook Pro' : 'MacBook Air',
      computer_size: s.type === 'FTE' ? '14"' : '13"',
      peripherals_notes: null,
      additional_notes: null,
      created_at: ts(now),
      updated_at: ts(now),
    })

    const day = s.startDate === monday ? 'Monday' : 'Wednesday'
    console.log(`  ✓  ${displayName.padEnd(28)} starts ${day} ${s.startDate.toLocaleDateString()}`)
  }

  // ── 2. Hardware Assets ────────────────────────────────────────────────────
  const purchasedMonthsAgo = (n: number) => {
    const d = new Date()
    d.setMonth(d.getMonth() - n)
    return d
  }

  const assets = [
    // Assigned to active employees
    {
      system_name: 'LIV-501', asset_tag: 'LIV-501',
      model: 'MacBook Pro 14" M3', description: 'Space Gray, 16GB RAM, 512GB SSD',
      cost: 159900, purchase_date: purchasedMonthsAgo(4), // $1,599
      status: 'ASSIGNED', employee_id: marcusId,
      assigned_date: purchasedMonthsAgo(4),
    },
    {
      system_name: 'LIV-502', asset_tag: 'LIV-502',
      model: 'MacBook Air 13" M2', description: 'Midnight, 8GB RAM, 256GB SSD',
      cost: 99900, purchase_date: purchasedMonthsAgo(2), // $999
      status: 'ASSIGNED', employee_id: priId,
      assigned_date: purchasedMonthsAgo(2),
    },
    {
      system_name: 'LIV-503', asset_tag: 'LIV-503',
      model: 'MacBook Air 13" M2', description: 'Silver, 8GB RAM, 256GB SSD',
      cost: 99900, purchase_date: purchasedMonthsAgo(2), // $999
      status: 'ASSIGNED', employee_id: tylerRomId,
      assigned_date: purchasedMonthsAgo(2),
    },
    {
      system_name: 'LIV-504', asset_tag: 'LIV-504',
      model: 'MacBook Air 13" M3', description: 'Starlight, 16GB RAM, 512GB SSD',
      cost: 109900, purchase_date: purchasedMonthsAgo(1), // $1,099
      status: 'ASSIGNED', employee_id: amaraId,
      assigned_date: purchasedMonthsAgo(1),
    },
    // Unassigned (available stock — ready for new starters)
    {
      system_name: 'LIV-505', asset_tag: 'LIV-505',
      model: 'MacBook Pro 14" M3', description: 'Space Black, 18GB RAM, 512GB SSD — awaiting Jordan Park',
      cost: 159900, purchase_date: purchasedMonthsAgo(0), // $1,599
      status: 'UNASSIGNED', employee_id: null,
      assigned_date: null,
    },
    {
      system_name: 'LIV-506', asset_tag: 'LIV-506',
      model: 'MacBook Air 13" M2', description: 'Silver, 8GB RAM, 256GB SSD — awaiting Nadia Volkov',
      cost: 99900, purchase_date: purchasedMonthsAgo(0), // $999
      status: 'UNASSIGNED', employee_id: null,
      assigned_date: null,
    },
    // Retired
    {
      system_name: 'LIV-488', asset_tag: 'LIV-488',
      model: 'MacBook Pro 13" Intel', description: 'Previously assigned — retired due to age',
      cost: 109900, purchase_date: purchasedMonthsAgo(36), // $1,099
      status: 'RETIRED', employee_id: null,
      assigned_date: null,
    },
  ]

  for (const a of assets) {
    insertHardware.run({
      id: randomUUID(),
      ...a,
      purchase_date: ts(a.purchase_date),
      assigned_date: a.assigned_date ? ts(a.assigned_date) : null,
      created_at: ts(now),
      updated_at: ts(now),
    })
    const label = a.employee_id
      ? empIds.find(e => e.id === a.employee_id)?.current_name ?? 'assigned'
      : a.status.toLowerCase()
    console.log(`  ✓  ${a.system_name.padEnd(12)} ${a.model.padEnd(28)} → ${label}`)
  }
})

console.log('\nSeeding weekly onboarding + hardware...\n')
run()
console.log('\nDone.\n')
