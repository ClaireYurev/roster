'use client'

import { useState, useCallback, useTransition } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { bulkImportEmployees } from '@/actions/employees'
import type { ImportRowRaw, ImportRowValidated } from '@/types'
import { Upload, FileText, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ---------------------------------------------------------------------------
// Column name auto-mapping (case-insensitive)
// ---------------------------------------------------------------------------
const COLUMN_MAP: Record<string, keyof ImportRowValidated> = {
  fullname: 'currentName',
  name: 'currentName',
  'employee name': 'currentName',
  'full name': 'currentName',
  jobtitle: 'currentRole',
  title: 'currentRole',
  role: 'currentRole',
  'job title': 'currentRole',
  position: 'currentRole',
  department: 'currentDepartment',
  dept: 'currentDepartment',
  employmenttype: 'employmentType',
  type: 'employmentType',
  'employment type': 'employmentType',
  startdate: 'startDate',
  'start date': 'startDate',
  hiredate: 'startDate',
  'hire date': 'startDate',
  mailingaddress: 'mailingAddress',
  address: 'mailingAddress',
  'mailing address': 'mailingAddress',
  computertype: 'computerType',
  'computer type': 'computerType',
  computersize: 'computerSize',
  'computer size': 'computerSize',
}

function normalizeEmploymentType(val: string): 'FTE' | 'CONTRACTOR' {
  const v = val.toLowerCase().trim()
  if (v === 'contractor' || v === 'contract' || v === 'c') return 'CONTRACTOR'
  return 'FTE'
}

function mapRow(raw: ImportRowRaw): ImportRowValidated {
  const mapped: Partial<ImportRowValidated> = { _valid: true, _errors: [], _rowIndex: 0 }

  for (const [col, val] of Object.entries(raw)) {
    const key = COLUMN_MAP[col.toLowerCase().trim()]
    if (key && val) {
      if (key === 'employmentType') {
        mapped[key] = normalizeEmploymentType(val)
      } else {
        (mapped as Record<string, unknown>)[key] = val.trim()
      }
    }
  }

  // Validation
  const errors: string[] = []
  if (!mapped.currentName) errors.push('Name is required')
  if (!mapped.currentRole) errors.push('Role/Title is required')
  if (!mapped.currentDepartment) errors.push('Department is required')
  if (!mapped.startDate) {
    errors.push('Start date is required')
  } else if (isNaN(Date.parse(mapped.startDate as string))) {
    errors.push('Start date is invalid')
  }
  if (!mapped.employmentType) mapped.employmentType = 'FTE'

  mapped._errors = errors
  mapped._valid = errors.length === 0

  return mapped as ImportRowValidated
}

function parseJSON(text: string): ImportRowRaw[] {
  const parsed = JSON.parse(text)
  const arr = Array.isArray(parsed) ? parsed : parsed.employees ?? parsed.data ?? []
  return arr.map((item: unknown) => {
    const flat: ImportRowRaw = {}
    for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
      flat[k] = String(v ?? '')
    }
    return flat
  })
}

export function ImportTool() {
  const [rows, setRows] = useState<ImportRowValidated[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const processFile = useCallback((file: File) => {
    setFileName(file.name)
    setImportResult(null)

    if (file.name.endsWith('.json')) {
      file.text().then((text) => {
        try {
          const raw = parseJSON(text)
          setRows(raw.map((r, i) => ({ ...mapRow(r), _rowIndex: i + 1 })))
        } catch {
          toast({ title: 'Invalid JSON file', variant: 'destructive' })
        }
      })
    } else {
      Papa.parse<ImportRowRaw>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setRows(result.data.map((r, i) => ({ ...mapRow(r), _rowIndex: i + 1 })))
        },
        error: () => {
          toast({ title: 'Error parsing CSV', variant: 'destructive' })
        },
      })
    }
  }, [toast])

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) processFile(accepted[0])
    },
    [processFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] },
    maxFiles: 1,
  })

  const validRows = rows.filter((r) => r._valid)
  const invalidRows = rows.filter((r) => !r._valid)

  function handleImport() {
    startTransition(async () => {
      const result = await bulkImportEmployees(rows)
      if ('error' in result) {
        toast({ title: 'Import failed', description: String(result.error), variant: 'destructive' })
      } else {
        setImportResult({ imported: result.imported ?? 0 })
        toast({ title: `Imported ${result.imported} employees` })
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">Drop your CSV or JSON file here, or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports: Freshservice CSV exports, JumpCloud JSON, or any custom CSV
        </p>
      </div>

      {/* Expected columns hint */}
      <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground mb-2">Expected column names (case-insensitive):</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          {[
            'FullName / Name *',
            'JobTitle / Title *',
            'Department *',
            'StartDate / HireDate *',
            'EmploymentType (FTE/Contractor)',
            'MailingAddress',
            'ComputerType',
            'ComputerSize',
          ].map((col) => (
            <code key={col} className="bg-background rounded px-1.5 py-0.5">{col}</code>
          ))}
        </div>
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{fileName}</span>
              <span className="text-xs text-muted-foreground">{rows.length} rows parsed</span>
              {invalidRows.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {invalidRows.length} errors
                </span>
              )}
              {validRows.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {validRows.length} valid
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setRows([]); setFileName(null); setImportResult(null) }}
            >
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Department</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Start Date</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Address</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Computer</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row._rowIndex}
                    className={`border-t ${
                      row._valid
                        ? 'hover:bg-muted/30'
                        : 'bg-destructive/5 dark:bg-destructive/10'
                    }`}
                  >
                    <td className="py-1.5 px-3 text-muted-foreground">{row._rowIndex}</td>
                    <td className="py-1.5 px-3">
                      {row._valid ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <span title={row._errors.join(', ')}>
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        </span>
                      )}
                    </td>
                    <td className={`py-1.5 px-3 ${!row.currentName ? 'text-destructive font-medium' : ''}`}>
                      {row.currentName || <span className="italic">missing</span>}
                    </td>
                    <td className={`py-1.5 px-3 ${!row.currentRole ? 'text-destructive' : ''}`}>
                      {row.currentRole || <span className="italic">missing</span>}
                    </td>
                    <td className={`py-1.5 px-3 ${!row.currentDepartment ? 'text-destructive' : ''}`}>
                      {row.currentDepartment || <span className="italic">missing</span>}
                    </td>
                    <td className="py-1.5 px-3">{row.employmentType ?? 'FTE'}</td>
                    <td className={`py-1.5 px-3 ${!row.startDate || isNaN(Date.parse(row.startDate)) ? 'text-destructive' : ''}`}>
                      {row.startDate || <span className="italic">missing</span>}
                    </td>
                    <td className="py-1.5 px-3 max-w-[120px] truncate text-muted-foreground">
                      {row.mailingAddress || '—'}
                    </td>
                    <td className="py-1.5 px-3 text-muted-foreground">
                      {row.computerType ? `${row.computerType}${row.computerSize ? ` ${row.computerSize}` : ''}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Error summary */}
          {invalidRows.length > 0 && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 space-y-1">
              <p className="text-xs font-semibold text-destructive">Rows with errors (will be skipped):</p>
              {invalidRows.slice(0, 5).map((row) => (
                <p key={row._rowIndex} className="text-xs text-destructive">
                  Row {row._rowIndex}: {row._errors.join(', ')}
                </p>
              ))}
              {invalidRows.length > 5 && (
                <p className="text-xs text-muted-foreground">…and {invalidRows.length - 5} more</p>
              )}
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Successfully imported {importResult.imported} employees.{' '}
                <a href="/dashboard" className="underline">View dashboard →</a>
              </p>
            </div>
          )}

          {/* Confirm import button */}
          {!importResult && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleImport}
                disabled={isPending || validRows.length === 0}
                className="gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isPending ? 'Importing...' : `Import ${validRows.length} Employee${validRows.length !== 1 ? 's' : ''}`}
              </Button>
              {invalidRows.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {invalidRows.length} invalid rows will be skipped.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
