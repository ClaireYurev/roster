import { z } from 'zod'

export const createEmployeeSchema = z.object({
  // Legal name — required for HR/payroll
  legalFirstName: z.string().min(1, 'Legal first name is required').max(100),
  legalLastName: z.string().min(1, 'Legal last name is required').max(100),
  // Preferred name — shown in all views/dashboards; falls back to legal name if blank
  preferredFirstName: z.string().max(100).optional(),
  preferredLastName: z.string().max(100).optional(),
  currentRole: z.string().min(1, 'Role is required').max(200),
  currentDepartment: z.string().min(1, 'Department is required').max(200),
  employmentType: z.enum(['CONTRACTOR', 'FTE']),
  // Required for contractors, ignored for FTE
  contractEndDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }).optional(),
  mailingAddress: z.string().max(500).optional(),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  computerType: z.string().optional(),
  computerSize: z.string().optional(),
  peripheralsNotes: z.string().optional(),
  notes: z.string().optional(),
})
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>

export const nameChangeSchema = z.object({
  employeeId: z.string().uuid(),
  // Legal name fields — both required; this is the official name change event
  newLegalFirstName: z.string().min(1, 'Legal first name is required').max(100),
  newLegalLastName: z.string().min(1, 'Legal last name is required').max(100),
  eventDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  notes: z.string().optional(),
})
export type NameChangeInput = z.infer<typeof nameChangeSchema>

export const roleChangeSchema = z.object({
  employeeId: z.string().uuid(),
  newRole: z.string().min(1, 'New role is required').max(200),
  newDepartment: z.string().optional(),
  eventDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  notes: z.string().optional(),
})
export type RoleChangeInput = z.infer<typeof roleChangeSchema>

export const convertToFteSchema = z.object({
  employeeId: z.string().uuid(),
  eventDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  notes: z.string().optional(),
})
export type ConvertToFteInput = z.infer<typeof convertToFteSchema>

export const separationSchema = z.object({
  employeeId: z.string().uuid(),
  eventType: z.enum(['RESIGNED', 'TERMINATED']),
  eventDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  notes: z.string().optional(),
})
export type SeparationInput = z.infer<typeof separationSchema>

export const rehireSchema = z.object({
  employeeId: z.string().uuid(),
  newRole: z.string().min(1, 'Role is required').max(200),
  newDepartment: z.string().min(1, 'Department is required').max(200),
  employmentType: z.enum(['CONTRACTOR', 'FTE']),
  contractEndDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }).optional(),
  eventDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  computerType: z.string().optional(),
  computerSize: z.string().optional(),
  notes: z.string().optional(),
})
export type RehireInput = z.infer<typeof rehireSchema>

export const upsertChecklistSchema = z.object({
  lifecycleEventId: z.number().int().positive(),
  jumpCloudProvisioned: z.boolean(),
  laptopAssigned: z.boolean(),
  emailAliasCreated: z.boolean(),
  computerType: z.string().optional(),
  computerSize: z.string().optional(),
  peripheralsNotes: z.string().optional(),
  additionalNotes: z.string().optional(),
})
export type UpsertChecklistInput = z.infer<typeof upsertChecklistSchema>

export const createAssetSchema = z.object({
  systemName: z.string().min(1, 'System name is required').max(50),
  assetTag: z.string().max(100).optional(),
  model: z.string().min(1, 'Model is required').max(200),
  description: z.string().optional(),
  costDollars: z.string().optional(), // user inputs "$1,899.99" — converted to cents
  purchaseDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
})
export type CreateAssetInput = z.infer<typeof createAssetSchema>

export const assignAssetSchema = z.object({
  assetId: z.string().uuid(),
  employeeId: z.string().uuid(),
  assignedDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  notes: z.string().optional(),
})
export type AssignAssetInput = z.infer<typeof assignAssetSchema>

export const importRowSchema = z.object({
  currentName: z.string().min(1, 'Name is required'),
  currentRole: z.string().min(1, 'Role is required'),
  currentDepartment: z.string().min(1, 'Department is required'),
  employmentType: z.enum(['CONTRACTOR', 'FTE']).default('FTE'),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  mailingAddress: z.string().optional(),
  computerType: z.string().optional(),
  computerSize: z.string().optional(),
})
export type ImportRow = z.infer<typeof importRowSchema>
