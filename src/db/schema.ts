import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Enums (SQLite has no native enum — stored as text with constraint)
// ---------------------------------------------------------------------------

export const EmploymentType = {
  CONTRACTOR: 'CONTRACTOR',
  FTE: 'FTE',
} as const
export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType]

export const EmployeeStatus = {
  ACTIVE: 'ACTIVE',
  LOA: 'LOA',                           // Leave of Absence (still employed, Azure stays active)
  DISABLED_VOLUNTARY: 'DISABLED_VOLUNTARY',
  DISABLED_INVOLUNTARY: 'DISABLED_INVOLUNTARY',
} as const
export type EmployeeStatus = (typeof EmployeeStatus)[keyof typeof EmployeeStatus]

export const HireContext = {
  NEW_FTE: 'NEW_FTE',                           // Brand new, no prior LIV or UL history
  UL_TRANSFER: 'UL_TRANSFER',                   // Coming from Unilever (contractor or FTE)
  CONTRACTOR_TO_FTE: 'CONTRACTOR_TO_FTE',       // Active LIV contractor → immediate FTE (CONVERTED_TO_FTE event)
  PAST_CONTRACTOR_AS_FTE: 'PAST_CONTRACTOR_AS_FTE', // Was LIV contractor in past, now rehired as FTE
  PAST_FTE_REHIRED: 'PAST_FTE_REHIRED',         // Was LIV FTE in past, now rehired as FTE
  NEW_CONTRACTOR: 'NEW_CONTRACTOR',             // Standard new contractor hire
} as const
export type HireContext = (typeof HireContext)[keyof typeof HireContext]

export const LifecycleEventType = {
  ONBOARDED: 'ONBOARDED',
  NAME_CHANGE: 'NAME_CHANGE',
  ROLE_CHANGE: 'ROLE_CHANGE',
  CONVERTED_TO_FTE: 'CONVERTED_TO_FTE',
  RESIGNED: 'RESIGNED',
  TERMINATED: 'TERMINATED',
  REHIRED: 'REHIRED',
  HARDWARE_ASSIGNED: 'HARDWARE_ASSIGNED',
  HARDWARE_UNASSIGNED: 'HARDWARE_UNASSIGNED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  LOA_START: 'LOA_START',
  LOA_END: 'LOA_END',
} as const
export type LifecycleEventType = (typeof LifecycleEventType)[keyof typeof LifecycleEventType]

export const ImportSource = {
  MANUAL: 'MANUAL',
  BROWSER_EXTENSION: 'BROWSER_EXTENSION',
  FRESHSERVICE_API: 'FRESHSERVICE_API',
  BULK_IMPORT: 'BULK_IMPORT',
} as const
export type ImportSource = (typeof ImportSource)[keyof typeof ImportSource]

export const HardwareStatus = {
  UNASSIGNED: 'UNASSIGNED',
  ASSIGNED: 'ASSIGNED',
  RETIRED: 'RETIRED',
} as const
export type HardwareStatus = (typeof HardwareStatus)[keyof typeof HardwareStatus]

// ---------------------------------------------------------------------------
// employees — stable entity record; current* fields are denormalized state
// ---------------------------------------------------------------------------

export const WorkLocationType = {
  REMOTE: 'REMOTE',
  HYBRID: 'HYBRID',
  ONSITE: 'ONSITE',
} as const
export type WorkLocationType = (typeof WorkLocationType)[keyof typeof WorkLocationType]

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(), // UUID, generated in application layer
  currentName: text('current_name').notNull(),
  currentRole: text('current_role').notNull(),
  currentDepartment: text('current_department').notNull(),
  employmentType: text('employment_type', {
    enum: ['CONTRACTOR', 'FTE'],
  })
    .notNull()
    .default('FTE'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  // Richer status — kept in sync with isActive (isActive = status IN ('ACTIVE','LOA'))
  status: text('status', {
    enum: ['ACTIVE', 'LOA', 'DISABLED_VOLUNTARY', 'DISABLED_INVOLUNTARY'],
  }).notNull().default('ACTIVE'),
  mailingAddress: text('mailing_address'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),

  // --- Contractor end date (required for CONTRACTOR type; null for FTE) ---
  contractEndDate: integer('contract_end_date', { mode: 'timestamp_ms' }),

  // --- Legal name (required) + preferred name (optional, shown everywhere by default) ---
  legalFirstName: text('legal_first_name'),
  legalLastName: text('legal_last_name'),
  preferredFirstName: text('preferred_first_name'),  // overrides legal first for display
  preferredLastName: text('preferred_last_name'),    // overrides legal last for display

  // --- Profile fields (populated via browser extension / Freshservice import) ---
  freshserviceId: text('freshservice_id'),      // HR system employee ID
  workEmail: text('work_email'),
  personalEmail: text('personal_email'),
  workPhone: text('work_phone'),
  mobilePhone: text('mobile_phone'),
  workLocation: text('work_location'),          // office name / city
  workLocationType: text('work_location_type', {
    enum: ['REMOTE', 'HYBRID', 'ONSITE'],
  }),
  managerName: text('manager_name'),
  costCenter: text('cost_center'),
  jobBand: text('job_band'),                    // e.g. 'L4', 'Senior', 'IC3'
  photoUrl: text('photo_url'),                  // base64 data URI or https URL
})

// ---------------------------------------------------------------------------
// lifecycle_events — append-only event ledger; never UPDATE or DELETE
// ---------------------------------------------------------------------------

export const lifecycleEvents = sqliteTable('lifecycle_events', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  employeeId: text('employee_id')
    .notNull()
    .references(() => employees.id),
  eventType: text('event_type', {
    enum: [
      'ONBOARDED',
      'NAME_CHANGE',
      'ROLE_CHANGE',
      'CONVERTED_TO_FTE',
      'RESIGNED',
      'TERMINATED',
      'REHIRED',
      'HARDWARE_ASSIGNED',
      'HARDWARE_UNASSIGNED',
      'PROFILE_UPDATED',
      'LOA_START',
      'LOA_END',
    ],
  }).notNull(),
  eventDate: integer('event_date', { mode: 'timestamp_ms' }).notNull(),
  payload: text('payload', { mode: 'json' }),
  notes: text('notes'),
  // Source of the event: helps audit trail show where each change came from
  source: text('source', {
    enum: ['MANUAL', 'BROWSER_EXTENSION', 'FRESHSERVICE_API', 'BULK_IMPORT'],
  }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

// ---------------------------------------------------------------------------
// onboarding_checklists — one per ONBOARDED or REHIRED lifecycle event
// computerType/Size stored here (event-specific, not employee-specific)
// ---------------------------------------------------------------------------

export const onboardingChecklists = sqliteTable('onboarding_checklists', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  lifecycleEventId: integer('lifecycle_event_id')
    .notNull()
    .references(() => lifecycleEvents.id),
  jumpCloudProvisioned: integer('jumpcloud_provisioned', { mode: 'boolean' }).notNull().default(false),
  laptopAssigned: integer('laptop_assigned', { mode: 'boolean' }).notNull().default(false),
  emailAliasCreated: integer('email_alias_created', { mode: 'boolean' }).notNull().default(false),
  computerType: text('computer_type'),
  computerSize: text('computer_size'),
  peripheralsNotes: text('peripherals_notes'),
  additionalNotes: text('additional_notes'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

// ---------------------------------------------------------------------------
// loa_records — one per LOA_START lifecycle event; tracks IT checklist + end date
// ---------------------------------------------------------------------------

export const loaRecords = sqliteTable('loa_records', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  lifecycleEventId: integer('lifecycle_event_id')
    .notNull()
    .references(() => lifecycleEvents.id),
  // Confirmed with P&C
  expectedEndDate: integer('expected_end_date', { mode: 'timestamp_ms' }),
  pcEndDateConfirmed: integer('pc_end_date_confirmed', { mode: 'boolean' }).notNull().default(false),
  // IT action: JumpCloud must be suspended on LOA start
  jumpcloudSuspended: integer('jumpcloud_suspended', { mode: 'boolean' }).notNull().default(false),
  // IT action: JumpCloud must be re-activated on LOA return
  jumpcloudActivated: integer('jumpcloud_activated', { mode: 'boolean' }).notNull().default(false),
  actualEndDate: integer('actual_end_date', { mode: 'timestamp_ms' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

// ---------------------------------------------------------------------------
// hardware_assets — laptop/device inventory; cost stored in cents
// ---------------------------------------------------------------------------

export const hardwareAssets = sqliteTable('hardware_assets', {
  id: text('id').primaryKey(), // UUID
  systemName: text('system_name').notNull().unique(), // e.g. 'LIV-499'
  assetTag: text('asset_tag'),
  model: text('model').notNull(), // e.g. 'MacBook Pro 14" M3 Max'
  description: text('description'),
  cost: integer('cost'), // stored in cents: 189999 = $1,899.99
  purchaseDate: integer('purchase_date', { mode: 'timestamp_ms' }).notNull(),
  status: text('status', {
    enum: ['UNASSIGNED', 'ASSIGNED', 'RETIRED'],
  })
    .notNull()
    .default('UNASSIGNED'),
  employeeId: text('employee_id').references(() => employees.id),
  assignedDate: integer('assigned_date', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const employeesRelations = relations(employees, ({ many }) => ({
  lifecycleEvents: many(lifecycleEvents),
  hardwareAssets: many(hardwareAssets),
}))

export const lifecycleEventsRelations = relations(lifecycleEvents, ({ one }) => ({
  employee: one(employees, {
    fields: [lifecycleEvents.employeeId],
    references: [employees.id],
  }),
  checklist: one(onboardingChecklists, {
    fields: [lifecycleEvents.id],
    references: [onboardingChecklists.lifecycleEventId],
  }),
}))

export const onboardingChecklistsRelations = relations(onboardingChecklists, ({ one }) => ({
  lifecycleEvent: one(lifecycleEvents, {
    fields: [onboardingChecklists.lifecycleEventId],
    references: [lifecycleEvents.id],
  }),
}))

export const loaRecordsRelations = relations(loaRecords, ({ one }) => ({
  lifecycleEvent: one(lifecycleEvents, {
    fields: [loaRecords.lifecycleEventId],
    references: [lifecycleEvents.id],
  }),
}))

export const hardwareAssetsRelations = relations(hardwareAssets, ({ one }) => ({
  employee: one(employees, {
    fields: [hardwareAssets.employeeId],
    references: [employees.id],
  }),
}))
