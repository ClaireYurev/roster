'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AssignAssetDialog } from './assign-employee-dialog'
import { formatCents, formatDate } from '@/lib/utils'
import { HARDWARE_STATUS_LABELS, HARDWARE_STATUS_COLORS } from '@/lib/constants'
import type { HardwareAsset, Employee } from '@/types'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { EditableCell } from '@/components/shared/editable-cell'
import { updateHardwareAsset } from '@/actions/hardware'

type AssetWithEmployee = HardwareAsset & { employee?: Employee | null }

const STATUS_FILTERS = [
  { label: 'All', id: 'all' },
  { label: 'Unassigned', id: 'UNASSIGNED' },
  { label: 'Assigned', id: 'ASSIGNED' },
  { label: 'Retired', id: 'RETIRED' },
]

export function AssetsTable({
  assets,
  employees,
}: {
  assets: AssetWithEmployee[]
  employees: Employee[]
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredData = statusFilter === 'all' ? assets : assets.filter((a) => a.status === statusFilter)

  function save(id: string, updates: Parameters<typeof updateHardwareAsset>[1]) {
    return updateHardwareAsset(id, updates).then((r) =>
      'error' in r ? { error: r.error as string } : undefined,
    )
  }

  const columns: ColumnDef<AssetWithEmployee>[] = [
    {
      accessorKey: 'systemName',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          System Name <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <EditableCell
          value={row.original.systemName}
          onSave={(v) => save(row.original.id, { systemName: v })}
          className="min-w-[140px] font-mono font-medium"
        />
      ),
    },
    {
      accessorKey: 'assetTag',
      header: 'Asset Tag',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.assetTag}
          onSave={(v) => save(row.original.id, { assetTag: v })}
          placeholder="—"
          emptyLabel="—"
          className="min-w-[80px]"
        />
      ),
    },
    {
      accessorKey: 'model',
      header: 'Model',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.model}
          onSave={(v) => save(row.original.id, { model: v })}
          className="min-w-[120px]"
        />
      ),
    },
    {
      accessorKey: 'cost',
      header: 'Cost',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.cost != null ? String(row.original.cost / 100) : null}
          display={formatCents(row.original.cost)}
          type="number"
          placeholder="0.00"
          emptyLabel="—"
          onSave={(v) => save(row.original.id, { costDollars: v })}
          className="min-w-[80px] tabular-nums"
        />
      ),
    },
    {
      accessorKey: 'purchaseDate',
      header: 'Purchased',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.purchaseDate}
          display={formatDate(row.original.purchaseDate)}
          type="date"
          onSave={(v) => save(row.original.id, { purchaseDate: v })}
          className="min-w-[110px] text-muted-foreground tabular-nums"
        />
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.status}
          type="select"
          options={[
            { value: 'UNASSIGNED', label: 'Unassigned' },
            { value: 'ASSIGNED', label: 'Assigned' },
            { value: 'RETIRED', label: 'Retired' },
          ]}
          onSave={(v) => save(row.original.id, { status: v as 'UNASSIGNED' | 'ASSIGNED' | 'RETIRED' })}
          display={HARDWARE_STATUS_LABELS[row.original.status]}
          className={`min-w-[90px] rounded-full px-2 py-0.5 text-xs font-medium ${HARDWARE_STATUS_COLORS[row.original.status]}`}
        />
      ),
    },
    {
      id: 'employee',
      header: 'Assigned To',
      cell: ({ row }) => {
        const emp = row.original.employee
        return emp ? (
          <span className="text-sm">{emp.currentName}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        row.original.status !== 'RETIRED' ? (
          <AssignAssetDialog
            assetId={row.original.id}
            currentEmployeeId={row.original.employeeId ?? null}
            employees={employees}
          />
        ) : null
      ),
    },
  ]

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search assets..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-8 w-[200px]"
        />
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.id}
              variant={statusFilter === f.id ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setStatusFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredData.length} assets
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="py-2">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-20 text-center text-muted-foreground">
                  No assets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
