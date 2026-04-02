import { LifecycleEventType, EmploymentType, HardwareStatus } from '@/db/schema'

export { LifecycleEventType, EmploymentType, HardwareStatus }

export const LIFECYCLE_EVENT_LABELS: Record<string, string> = {
  ONBOARDED: 'Onboarded',
  NAME_CHANGE: 'Name Change',
  ROLE_CHANGE: 'Role Change',
  CONVERTED_TO_FTE: 'Converted to FTE',
  RESIGNED: 'Resigned',
  TERMINATED: 'Terminated',
  REHIRED: 'Rehired',
  HARDWARE_ASSIGNED: 'Hardware Assigned',
  HARDWARE_UNASSIGNED: 'Hardware Unassigned',
}

export const LIFECYCLE_EVENT_COLORS: Record<string, string> = {
  ONBOARDED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  NAME_CHANGE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ROLE_CHANGE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  CONVERTED_TO_FTE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  RESIGNED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  TERMINATED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  REHIRED: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  HARDWARE_ASSIGNED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  HARDWARE_UNASSIGNED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
}

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  CONTRACTOR: 'Contractor',
  FTE: 'Full-Time',
}

export const HARDWARE_STATUS_LABELS: Record<string, string> = {
  UNASSIGNED: 'Unassigned',
  ASSIGNED: 'Assigned',
  RETIRED: 'Retired',
}

export const HARDWARE_STATUS_COLORS: Record<string, string> = {
  UNASSIGNED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ASSIGNED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  RETIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
}

export const COMPUTER_TYPES = ['MacBook Air', 'MacBook Pro', 'Windows Laptop', 'Linux Workstation', 'Other']
export const COMPUTER_SIZES = ['13"', '14"', '15"', '16"', 'Other']
