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
import { ArrowUpDown, AlertTriangle, Clock, XCircle, CheckCircle2, HelpCircle } from 'lucide-react'
import type { ContractorWithStatus } from '@/actions/contractors'

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
  EXPIRED: {
    label: 'Expired',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  CRITICAL: {
    label: 'Expiring ≤14 days',
    icon: AlertTriangle,
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  WARNING: {
    label: 'Expiring ≤30 days',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  OK: {
    label: 'Active',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  NO_DATE: {
    label: 'No End Date',
    icon: HelpCircle,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
}

function StatusBadge({ status }: { status: ContractorWithStatus['expiryStatus'] }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

function daysLabel(days: number | null): string {
  if (days === null) return '—'
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------
const columns: ColumnDef<ContractorWithStatus>[] = [
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
    header: 'Dept',
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue('currentDepartment')}</span>,
  },
  {
    accessorKey: 'contractEndDate',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Contract End <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = row.original.contractEndDate
      return d ? (
        <span className="text-sm font-medium tabular-nums">{formatDate(d)}</span>
      ) : (
        <span className="text-xs text-muted-foreground">Not set</span>
      )
    },
    sortingFn: (a, b) => {
      const da = a.original.contractEndDate
      const db = b.original.contractEndDate
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      return (da instanceof Date ? da.getTime() : da) - (db instanceof Date ? db.getTime() : db)
    },
  },
  {
    id: 'daysRemaining',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Remaining <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const days = row.original.daysRemaining
      const status = row.original.expiryStatus
      const color =
        status === 'EXPIRED' ? 'text-red-600 dark:text-red-400 font-semibold' :
        status === 'CRITICAL' ? 'text-orange-600 dark:text-orange-400 font-semibold' :
        status === 'WARNING' ? 'text-yellow-600 dark:text-yellow-400' :
        'text-muted-foreground'
      return <span className={`text-sm tabular-nums ${color}`}>{daysLabel(days)}</span>
    },
    sortingFn: (a, b) => {
      const da = a.original.daysRemaining ?? 99999
      const db = b.original.daysRemaining ?? 99999
      return da - db
    },
  },
  {
    id: 'expiryStatus',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.expiryStatus} />,
    filterFn: (row, _id, filterValue: string) => {
      if (filterValue === 'all') return true
      if (filterValue === 'urgent') return row.original.expiryStatus === 'EXPIRED' || row.original.expiryStatus === 'CRITICAL'
      if (filterValue === 'warning') return row.original.expiryStatus === 'WARNING'
      if (filterValue === 'ok') return row.original.expiryStatus === 'OK'
      if (filterValue === 'expired') return row.original.expiryStatus === 'EXPIRED'
      return true
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Active',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'outline' : 'secondary'}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
]

// ---------------------------------------------------------------------------
// Quick filters
// ---------------------------------------------------------------------------
const QUICK_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'urgent', label: 'Urgent (≤14 days)' },
  { id: 'warning', label: 'Warning (≤30 days)' },
  { id: 'ok', label: 'Active' },
  { id: 'expired', label: 'Expired' },
]

export function ContractorEndDatesTable({ data }: { data: ContractorWithStatus[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'daysRemaining', desc: false },
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

  // Apply status quick-filter manually on top of TanStack
  const statusFiltered = activeFilter === 'all'
    ? table.getRowModel().rows
    : table.getRowModel().rows.filter((row) => {
        if (activeFilter === 'urgent') return row.original.expiryStatus === 'EXPIRED' || row.original.expiryStatus === 'CRITICAL'
        if (activeFilter === 'warning') return row.original.expiryStatus === 'WARNING'
        if (activeFilter === 'ok') return row.original.expiryStatus === 'OK'
        if (activeFilter === 'expired') return row.original.expiryStatus === 'EXPIRED'
        return true
      })

  const urgentCount = data.filter((c) => c.expiryStatus === 'EXPIRED' || c.expiryStatus === 'CRITICAL').length

  return (
    <div className="space-y-4">
      {/* Search + quick filters */}
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
              {f.id === 'urgent' && urgentCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0 text-xs leading-4">
                  {urgentCount}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
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
            {statusFiltered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground h-24">
                  No contractors match this filter.
                </TableCell>
              </TableRow>
            ) : (
              statusFiltered.map((row) => (
                <TableRow
                  key={row.id}
                  className={
                    row.original.expiryStatus === 'EXPIRED' ? 'bg-red-50/50 dark:bg-red-950/20' :
                    row.original.expiryStatus === 'CRITICAL' ? 'bg-orange-50/50 dark:bg-orange-950/20' :
                    row.original.expiryStatus === 'WARNING' ? 'bg-yellow-50/30 dark:bg-yellow-950/10' :
                    undefined
                  }
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
        {statusFiltered.length} contractor{statusFiltered.length !== 1 ? 's' : ''} shown
      </p>
    </div>
  )
}
