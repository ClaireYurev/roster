'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { ArrowUpDown, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { LOAEmployeeWithRecord } from '@/actions/loa'
import { EditableCell, EditableToggle } from '@/components/shared/editable-cell'
import { updateLoaRecordDetails } from '@/actions/loa'
import { updateEmployeeProfile } from '@/actions/employees'

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------
function buildColumns(): ColumnDef<LOAEmployeeWithRecord>[] {
  function saveEmp(id: string, field: Parameters<typeof updateEmployeeProfile>[1]) {
    return updateEmployeeProfile(id, field, 'MANUAL').then((r) =>
      'error' in r ? { error: r.error as string } : undefined,
    )
  }
  function saveLoa(loaRecordId: number, updates: Parameters<typeof updateLoaRecordDetails>[1]) {
    return updateLoaRecordDetails(loaRecordId, updates).then((r) =>
      'error' in r ? { error: r.error as string } : undefined,
    )
  }

  return [
  {
    accessorKey: 'currentName',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Name <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link href={`/employees/${row.original.id}`} className="font-medium hover:underline">
        {row.getValue('currentName')}
      </Link>
    ),
  },
  {
    accessorKey: 'currentRole',
    header: 'Role',
    cell: ({ row }) => (
      <EditableCell
        value={row.original.currentRole}
        onSave={(v) => saveEmp(row.original.id, { currentRole: v })}
        className="min-w-[110px] text-muted-foreground"
      />
    ),
  },
  {
    accessorKey: 'currentDepartment',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Dept <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <EditableCell
        value={row.original.currentDepartment}
        onSave={(v) => saveEmp(row.original.id, { currentDepartment: v })}
        className="min-w-[90px] text-muted-foreground"
      />
    ),
  },
  {
    id: 'loaStart',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        LOA Start <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">{formatDate(row.original.loaStartDate)}</span>
    ),
    sortingFn: (a, b) =>
      a.original.loaStartDate.getTime() - b.original.loaStartDate.getTime(),
  },
  {
    id: 'expectedReturn',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Expected Return <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = row.original.loaRecord.expectedEndDate
      const overdue = row.original.isOverdue
      const display = d ? formatDate(d instanceof Date ? d : new Date(d)) : undefined
      return (
        <div className={`flex items-center gap-1 ${overdue ? 'text-red-600 dark:text-red-400' : ''}`}>
          {overdue && <AlertTriangle className="h-3 w-3 shrink-0 text-red-600 dark:text-red-400" />}
          <EditableCell
            value={d}
            display={display}
            type="date"
            emptyLabel="Not set"
            onSave={(v) => saveLoa(row.original.loaRecord.id, { expectedEndDate: v || null })}
            className={`min-w-[120px] tabular-nums ${overdue ? 'font-semibold' : ''}`}
          />
        </div>
      )
    },
    sortingFn: (a, b) => {
      const da = a.original.loaRecord.expectedEndDate
      const db = b.original.loaRecord.expectedEndDate
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      const ta = da instanceof Date ? da.getTime() : new Date(da).getTime()
      const tb = db instanceof Date ? db.getTime() : new Date(db).getTime()
      return ta - tb
    },
  },
  {
    id: 'daysOnLOA',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Days Out <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = row.original.daysOnLOA
      const color = d > 30 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
      return <span className={`text-sm tabular-nums ${color}`}>{d}d</span>
    },
    sortingFn: (a, b) => a.original.daysOnLOA - b.original.daysOnLOA,
  },
  {
    id: 'pcConfirmed',
    header: 'P&C Date',
    cell: ({ row }) => (
      <EditableToggle
        value={!!row.original.loaRecord.pcEndDateConfirmed}
        onToggle={(next) => saveLoa(row.original.loaRecord.id, { pcEndDateConfirmed: next })}
        trueLabel="Confirmed"
        falseLabel="Pending"
        trueClass="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
        falseClass="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
      />
    ),
  },
  {
    id: 'jumpcloud',
    header: 'JumpCloud',
    cell: ({ row }) => (
      <EditableToggle
        value={!!row.original.loaRecord.jumpcloudSuspended}
        onToggle={(next) => saveLoa(row.original.loaRecord.id, { jumpcloudSuspended: next })}
        trueLabel="Suspended"
        falseLabel="Not done"
        trueClass="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
        falseClass="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
      />
    ),
  },
  {
    id: 'notes',
    header: 'Notes',
    cell: ({ row }) => (
      <EditableCell
        value={row.original.loaRecord.notes}
        onSave={(v) => saveLoa(row.original.loaRecord.id, { notes: v || null })}
        placeholder="Add notes…"
        emptyLabel="—"
        multiline
        className="min-w-[160px] max-w-[220px] text-xs text-muted-foreground"
      />
    ),
  },
  ]
}

// ---------------------------------------------------------------------------
// Quick filters
// ---------------------------------------------------------------------------
const QUICK_FILTERS = [
  { id: 'all', label: 'All on LOA' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'jumpcloud-pending', label: 'JumpCloud Pending' },
  { id: 'pc-pending', label: 'P&C Pending' },
]

export function LOATable({ data }: { data: LOAEmployeeWithRecord[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const columns = useMemo(() => buildColumns(), [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const q = filterValue.toLowerCase()
      return (
        row.original.currentName.toLowerCase().includes(q) ||
        row.original.currentRole.toLowerCase().includes(q) ||
        row.original.currentDepartment.toLowerCase().includes(q)
      )
    },
  })

  const filtered = activeFilter === 'all'
    ? table.getRowModel().rows
    : table.getRowModel().rows.filter((row) => {
        if (activeFilter === 'overdue') return row.original.isOverdue
        if (activeFilter === 'jumpcloud-pending') return !row.original.loaRecord.jumpcloudSuspended
        if (activeFilter === 'pc-pending') return !row.original.loaRecord.pcEndDateConfirmed
        return true
      })

  const overdueCount = data.filter((r) => r.isOverdue).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by name, role, dept…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs h-8 text-sm"
        />
        <div className="flex gap-1 flex-wrap">
          {QUICK_FILTERS.map((f) => (
            <Button
              key={f.id}
              variant={activeFilter === f.id ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
              {f.id === 'overdue' && overdueCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0 text-xs leading-4">
                  {overdueCount}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="whitespace-nowrap">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground h-24">
                  No employees on LOA.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow
                  key={row.id}
                  className={row.original.isOverdue ? 'bg-red-50/50 dark:bg-red-950/20' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} employee{filtered.length !== 1 ? 's' : ''} shown
      </p>
    </div>
  )
}
