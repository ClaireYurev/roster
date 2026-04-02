'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { ArrowUpDown, AlertCircle } from 'lucide-react'
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants'
import type { OffboardedEmployee } from '@/actions/offboarding'

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------
const columns: ColumnDef<OffboardedEmployee>[] = [
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
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue('currentRole')}</span>,
  },
  {
    accessorKey: 'currentDepartment',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Dept <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue('currentDepartment')}</span>,
  },
  {
    accessorKey: 'employmentType',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant={row.original.employmentType === 'FTE' ? 'default' : 'secondary'}>
        {EMPLOYMENT_TYPE_LABELS[row.original.employmentType]}
      </Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Offboard Type',
    cell: ({ row }) => {
      const voluntary = row.original.status === 'DISABLED_VOLUNTARY'
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${voluntary
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {voluntary ? 'Voluntary' : 'Involuntary'}
        </span>
      )
    },
    filterFn: (row, _id, value) => value.includes(row.original.status),
  },
  {
    id: 'separationDate',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Separation Date <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = row.original.separationDate
      return d
        ? <span className="text-sm tabular-nums">{formatDate(d)}</span>
        : <span className="text-xs text-muted-foreground">—</span>
    },
    sortingFn: (a, b) => {
      const da = a.original.separationDate
      const db = b.original.separationDate
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      return db.getTime() - da.getTime()
    },
  },
  {
    id: 'servicenow',
    header: 'ServiceNow',
    cell: ({ row }) => {
      if (!row.original.requiresServiceNow) {
        return <span className="text-xs text-muted-foreground">N/A</span>
      }
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 dark:text-orange-400">
          <AlertCircle className="h-3.5 w-3.5" />
          Required
        </span>
      )
    },
  },
]

// ---------------------------------------------------------------------------
// Quick filters
// ---------------------------------------------------------------------------
const QUICK_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'voluntary', label: 'Voluntary' },
  { id: 'involuntary', label: 'Involuntary' },
  { id: 'fte', label: 'FTE' },
  { id: 'contractor', label: 'Contractor' },
  { id: 'servicenow', label: 'ServiceNow Required' },
]

export function OffboardingTable({ data }: { data: OffboardedEmployee[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'separationDate', desc: false },
  ])
  const [globalFilter, setGlobalFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

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
        if (activeFilter === 'voluntary') return row.original.status === 'DISABLED_VOLUNTARY'
        if (activeFilter === 'involuntary') return row.original.status === 'DISABLED_INVOLUNTARY'
        if (activeFilter === 'fte') return row.original.employmentType === 'FTE'
        if (activeFilter === 'contractor') return row.original.employmentType === 'CONTRACTOR'
        if (activeFilter === 'servicenow') return row.original.requiresServiceNow
        return true
      })

  const serviceNowCount = data.filter((r) => r.requiresServiceNow).length

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
              {f.id === 'servicenow' && serviceNowCount > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white rounded-full px-1.5 py-0 text-xs leading-4">
                  {serviceNowCount}
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
                  No offboarded employees match this filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
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
