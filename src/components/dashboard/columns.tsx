'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { EmployeeWithLatestChecklist } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { EMPLOYMENT_TYPE_LABELS, EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '@/lib/constants'
import { ArrowUpDown } from 'lucide-react'

function ITStatus({ checklist }: { checklist: EmployeeWithLatestChecklist['latestChecklist'] }) {
  if (!checklist) return <span className="text-muted-foreground text-xs">—</span>
  const done = [checklist.jumpCloudProvisioned, checklist.laptopAssigned, checklist.emailAliasCreated].filter(Boolean).length
  const total = 3
  const color = done === total ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : done > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {done}/{total}
    </span>
  )
}

export const columns: ColumnDef<EmployeeWithLatestChecklist>[] = [
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
  },
  {
    accessorKey: 'currentDepartment',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Department <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
  },
  {
    accessorKey: 'employmentType',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant={row.original.employmentType === 'FTE' ? 'default' : 'secondary'}>
        {EMPLOYMENT_TYPE_LABELS[row.original.employmentType]}
      </Badge>
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status ?? (row.original.isActive ? 'ACTIVE' : 'DISABLED_VOLUNTARY')
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${EMPLOYEE_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'}`}>
          {EMPLOYEE_STATUS_LABELS[status] ?? status}
        </span>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'createdAt',
    header: 'Start Date',
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    sortingFn: 'datetime',
  },
  {
    id: 'itStatus',
    header: 'IT Tasks',
    cell: ({ row }) => <ITStatus checklist={row.original.latestChecklist} />,
    filterFn: (row, _id, value) => {
      if (value === 'pending') {
        const c = row.original.latestChecklist
        if (!c) return true
        return !(c.jumpCloudProvisioned && c.laptopAssigned && c.emailAliasCreated)
      }
      return true
    },
  },
  {
    id: 'hardware',
    header: 'Hardware',
    cell: ({ row }) => {
      const hw = row.original.assignedHardware
      return hw ? (
        <span className="text-xs font-mono">{hw.systemName}</span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )
    },
  },
]
