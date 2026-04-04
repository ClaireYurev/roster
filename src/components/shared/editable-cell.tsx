'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export type SelectOption = { value: string; label: string }

type Props = {
  /** Raw stored value — used as the initial draft in edit mode */
  value: string | number | Date | null | undefined
  /** Formatted string for display. Falls back to String(value) if omitted. */
  display?: string
  /** Called with the committed string value. Return { error } to signal failure. */
  onSave: (value: string) => Promise<void | { error?: string }>
  type?: 'text' | 'number' | 'date' | 'select'
  options?: SelectOption[]
  placeholder?: string
  /** What to show when value is null / empty */
  emptyLabel?: string
  className?: string
  /** Allow multiline textarea (text type only) */
  multiline?: boolean
}

/** Convert any date-ish value to YYYY-MM-DD for <input type="date"> */
function toDateInput(v: string | number | Date | null | undefined): string {
  if (!v) return ''
  const d = v instanceof Date ? v : new Date(v as number)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

/** Convert a stored numeric/Date value to a usable draft string */
function toDraft(value: string | number | Date | null | undefined, type: string): string {
  if (value == null) return ''
  if (type === 'date') return toDateInput(value)
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export function EditableCell({
  value,
  display,
  onSave,
  type = 'text',
  options,
  placeholder,
  emptyLabel = '—',
  className,
  multiline = false,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null)

  // Keep display value in local state for optimistic update
  const rawDisplay = display ?? (value != null && value !== '' ? String(value) : null)
  const [optimistic, setOptimistic] = useState<string | null>(null)
  const shown = optimistic ?? rawDisplay

  // Reset optimistic when parent value changes (after router.refresh)
  useEffect(() => { setOptimistic(null) }, [value])

  function startEdit() {
    if (saving) return
    setDraft(toDraft(value, type))
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
  }

  async function commit() {
    const original = toDraft(value, type)
    if (draft === original) { setEditing(false); return }
    setEditing(false)
    setSaving(true)
    setOptimistic(type === 'date' && draft ? new Date(draft + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : draft || emptyLabel)
    try {
      const res = await onSave(draft)
      if (res && 'error' in res && res.error) {
        setOptimistic(null)
        toast({ title: 'Failed to save', description: res.error, variant: 'destructive' })
      } else {
        router.refresh()
      }
    } catch {
      setOptimistic(null)
      toast({ title: 'Failed to save', description: 'Unexpected error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { cancelEdit(); return }
    if (e.key === 'Enter' && !multiline) commit()
    if (e.key === 'Enter' && e.metaKey) commit()
  }

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current instanceof HTMLInputElement) inputRef.current.select()
    }
  }, [editing])

  // ── Edit mode ────────────────────────────────────────────────
  if (editing) {
    const inputClass = cn(
      'w-full min-w-0 rounded border border-ring bg-background px-1.5 py-0.5 text-sm',
      'focus:outline-none focus:ring-1 focus:ring-ring',
      'disabled:opacity-50',
    )
    if (type === 'select' && options) {
      return (
        <select
          ref={inputRef as React.Ref<HTMLSelectElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          className={cn(inputClass, className)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )
    }
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.Ref<HTMLTextAreaElement>}
          value={draft}
          placeholder={placeholder}
          rows={2}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          className={cn(inputClass, 'resize-none', className)}
        />
      )
    }
    return (
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        className={cn(inputClass, className)}
      />
    )
  }

  // ── View mode ────────────────────────────────────────────────
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={startEdit}
      onKeyDown={(e) => e.key === 'Enter' && startEdit()}
      className={cn(
        'group flex min-h-7 cursor-text items-center gap-1 rounded px-1 py-0.5',
        'hover:bg-accent/50 transition-colors focus:outline-none focus:ring-1 focus:ring-ring',
        saving && 'pointer-events-none',
        className,
      )}
    >
      {saving && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />}
      <span className={cn('flex-1 truncate text-sm', !shown && 'italic text-muted-foreground', saving && 'opacity-50')}>
        {shown || emptyLabel}
      </span>
      {!saving && (
        <Pencil className="h-2.5 w-2.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60" />
      )}
    </div>
  )
}

// ── Inline boolean toggle ────────────────────────────────────────────────────

type ToggleProps = {
  value: boolean
  onToggle: (next: boolean) => Promise<void | { error?: string }>
  trueLabel?: string
  falseLabel?: string
  trueClass?: string
  falseClass?: string
}

export function EditableToggle({
  value,
  onToggle,
  trueLabel = 'Done',
  falseLabel = 'Pending',
  trueClass = 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  falseClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
}: ToggleProps) {
  const { toast } = useToast()
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const current = optimistic ?? value

  async function handleClick() {
    if (saving) return
    const next = !current
    setSaving(true)
    setOptimistic(next)
    try {
      const res = await onToggle(next)
      if (res && 'error' in res && res.error) {
        setOptimistic(null)
        toast({ title: 'Failed to save', description: res.error, variant: 'destructive' })
      }
    } catch {
      setOptimistic(null)
      toast({ title: 'Failed to save', description: 'Unexpected error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={saving}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all',
        'hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer',
        current ? trueClass : falseClass,
        saving && 'opacity-50 pointer-events-none',
      )}
    >
      {saving && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
      {current ? trueLabel : falseLabel}
    </button>
  )
}
