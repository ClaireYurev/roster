'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type GlobalFilterTableState,
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
import { columns } from './columns'
import type { EmployeeWithLatestChecklist } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const QUICK_FILTERS = [
  { label: 'All Active', id: 'active', filter: (r: EmployeeWithLatestChecklist) => r.isActive },
  { label: 'New FTE', id: 'fte', filter: (r: EmployeeWithLatestChecklist) => r.employmentType === 'FTE' && r.isActive },
  { label: 'Contractor', id: 'contractor', filter: (r: EmployeeWithLatestChecklist) => r.employmentType === 'CONTRACTOR' && r.isActive },
  { label: 'Pending IT', id: 'pending-it', filter: (r: EmployeeWithLatestChecklist) => {
    const c = r.latestChecklist
    if (!c) return true
    return !(c.jumpCloudProvisioned && c.laptopAssigned && c.emailAliasCreated)
  }},
  { label: 'Inactive', id: 'inactive', filter: (r: EmployeeWithLatestChecklist) => !r.isActive },
]

export function EmployeeTable({ data }: { data: EmployeeWithLatestChecklist[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('active')

  const filteredData = QUICK_FILTERS.find((f) => f.id === activeFilter)?.filter
    ? data.filter(QUICK_FILTERS.find((f) => f.id === activeFilter)!.filter)
    : data

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
          placeholder="Search employees..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-8 w-[200px] lg:w-[280px]"
        />
        <div className="flex flex-wrap gap-1">
          {QUICK_FILTERS.map((f) => (
            <Button
              key={f.id}
              variant={activeFilter === f.id ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {table.getRowModel().rows.length} of {filteredData.length} employees
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
                  No employees found.
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
