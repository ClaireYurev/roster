import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert cents (integer) to a formatted dollar string: 189999 → "$1,899.99" */
export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

/** Convert a dollar string/number to cents integer: "1899.99" → 189999 */
export function dollarsToCents(dollars: string | number): number {
  return Math.round(Number(dollars) * 100)
}

/** Format a Date or timestamp_ms number for display */
export function formatDate(date: Date | number | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'number' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Compute the display name from preferred + legal name fields.
 * Preferred first/last overrides the corresponding legal parts independently,
 * e.g. preferredFirst="Alex" + legalLast="Smith" → "Alex Smith"
 */
export function computeDisplayName(
  preferredFirst: string | null | undefined,
  preferredLast: string | null | undefined,
  legalFirst: string | null | undefined,
  legalLast: string | null | undefined,
  fallback = ''
): string {
  const first = preferredFirst?.trim() || legalFirst?.trim() || ''
  const last = preferredLast?.trim() || legalLast?.trim() || ''
  const full = [first, last].filter(Boolean).join(' ')
  return full || fallback
}

/** Get the next Monday and Wednesday from today */
export function getNextMondayAndWednesday(): { monday: Date; wednesday: Date } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ..., 6=Sat

  // Days until next Monday (day 1)
  const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7 || 7
  // Days until next Wednesday (day 3)
  const daysUntilWednesday = dayOfWeek === 3 ? 7 : (10 - dayOfWeek) % 7 || 7

  const monday = new Date(today)
  monday.setDate(today.getDate() + daysUntilMonday)

  const wednesday = new Date(today)
  wednesday.setDate(today.getDate() + daysUntilWednesday)

  return { monday, wednesday }
}
