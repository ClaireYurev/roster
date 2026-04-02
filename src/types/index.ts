import type { employees, lifecycleEvents, onboardingChecklists, hardwareAssets, loaRecords } from '@/db/schema'

// Inferred row types from Drizzle schema
export type Employee = typeof employees.$inferSelect
export type NewEmployee = typeof employees.$inferInsert

export type LifecycleEvent = typeof lifecycleEvents.$inferSelect
export type NewLifecycleEvent = typeof lifecycleEvents.$inferInsert

export type OnboardingChecklist = typeof onboardingChecklists.$inferSelect
export type NewOnboardingChecklist = typeof onboardingChecklists.$inferInsert

export type HardwareAsset = typeof hardwareAssets.$inferSelect
export type NewHardwareAsset = typeof hardwareAssets.$inferInsert

export type LoaRecord = typeof loaRecords.$inferSelect

// Payload types for lifecycle events
export type NameChangePayload = { oldName: string; newName: string }
export type RoleChangePayload = { oldRole: string; newRole: string; oldDepartment?: string; newDepartment?: string }
export type ConvertToFtePayload = { previousType: string }
export type HardwarePayload = { systemName: string; assetId: string; model: string }

// Composed types for UI
export type EmployeeWithLatestChecklist = Employee & {
  latestChecklist: OnboardingChecklist | null
  assignedHardware: HardwareAsset | null
}

export type EmployeeWithFullHistory = Employee & {
  lifecycleEvents: (LifecycleEvent & { checklist: OnboardingChecklist | null })[]
  hardwareAssets: HardwareAsset[]
}

export type WeeklyOnboarding = {
  employee: Employee
  event: LifecycleEvent
  checklist: OnboardingChecklist | null
}

export type MonthlyHardwareAsset = HardwareAsset & {
  employeeName: string | null
}

// For the import tool
export type ImportRowRaw = Record<string, string>
export type ImportRowValidated = {
  currentName: string
  currentRole: string
  currentDepartment: string
  employmentType: 'CONTRACTOR' | 'FTE'
  startDate: string
  mailingAddress?: string
  computerType?: string
  computerSize?: string
  _valid: boolean
  _errors: string[]
  _rowIndex: number
}
