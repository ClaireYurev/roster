'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import {
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  RefreshCw,
} from 'lucide-react'

type PreviewData = {
  legalFirstName?: string
  legalLastName?: string
  preferredFirstName?: string
  preferredLastName?: string
  currentRole?: string
  currentDepartment?: string
  employmentType?: string
  personalEmail?: string
  mobilePhone?: string
  workLocation?: string
  workLocationType?: string
  managerName?: string
  mailingAddress?: string
  startDate?: string
  notes?: string
  _fsSubject?: string
}

type ImportResult = {
  status: 'created' | 'updated' | 'no_changes'
  employeeId: string
}

const WORK_LOCATION_TYPE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
}

function PreviewField({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground min-w-[130px] shrink-0">{label}</span>
      <span className="font-medium break-all">{value}</span>
    </div>
  )
}

export function FreshserviceImportTool() {
  const [ticketId, setTicketId] = useState('')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [previewTicketId, setPreviewTicketId] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isPreviewing, startPreview] = useTransition()
  const [isImporting, startImport] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const handlePreview = () => {
    const id = ticketId.trim().replace(/^SR-/i, '')
    if (!id) return

    setPreviewError(null)
    setPreview(null)
    setImportResult(null)

    startPreview(async () => {
      const res = await fetch(`/api/import/freshservice?ticketId=${encodeURIComponent(id)}`)
      const json = await res.json()

      if (!res.ok || json.error) {
        setPreviewError(json.error ?? 'Failed to fetch ticket')
        return
      }
      setPreview(json.preview)
      setPreviewTicketId(json.ticketId)
    })
  }

  const handleImport = () => {
    if (!previewTicketId) return

    startImport(async () => {
      const res = await fetch('/api/import/freshservice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: previewTicketId }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        toast({ title: 'Import failed', description: json.error, variant: 'destructive' })
        return
      }

      setImportResult(json)
      toast({
        title: json.status === 'created' ? 'Employee created' : json.status === 'updated' ? 'Profile updated' : 'No changes',
        description: json.status === 'no_changes'
          ? 'All fields already matched — nothing to update.'
          : `Employee record ${json.status}.`,
      })
      router.refresh()
    })
  }

  const reset = () => {
    setTicketId('')
    setPreview(null)
    setPreviewTicketId(null)
    setPreviewError(null)
    setImportResult(null)
  }

  return (
    <div className="space-y-6">
      {/* Ticket lookup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Look up Freshservice Service Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 max-w-sm">
            <div className="flex-1">
              <Label htmlFor="ticketId" className="sr-only">Ticket ID</Label>
              <Input
                id="ticketId"
                placeholder="SR-10597 or 10597"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePreview()}
              />
            </div>
            <Button onClick={handlePreview} disabled={isPreviewing || !ticketId.trim()}>
              {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Fetch
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Fetches the ticket via{' '}
            <code className="font-mono bg-muted px-1 rounded">FRESHSERVICE_API_KEY</code> +{' '}
            <code className="font-mono bg-muted px-1 rounded">FRESHSERVICE_DOMAIN</code>{' '}
            in <code className="font-mono bg-muted px-1 rounded">.env.local</code>.
          </p>
        </CardContent>
      </Card>

      {/* Error */}
      {previewError && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{previewError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {preview && !importResult && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Preview — SR-{previewTicketId}</CardTitle>
                {preview._fsSubject && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                    {preview._fsSubject}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={reset}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Clear
                </Button>
                <Button size="sm" onClick={handleImport} disabled={isImporting}>
                  {isImporting ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Download className="h-3 w-3 mr-1" />
                  )}
                  Import / Update
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              {(preview.legalFirstName || preview.legalLastName) && (
                <PreviewField label="Legal Name" value={[preview.legalFirstName, preview.legalLastName].filter(Boolean).join(' ')} />
              )}
              {(preview.preferredFirstName || preview.preferredLastName) && (
                <PreviewField label="Preferred Name" value={[preview.preferredFirstName, preview.preferredLastName].filter(Boolean).join(' ')} />
              )}
              <PreviewField label="Job Title" value={preview.currentRole} />
              <PreviewField label="Department" value={preview.currentDepartment} />
              <PreviewField
                label="Employment Type"
                value={preview.employmentType === 'CONTRACTOR' ? 'Contractor' : preview.employmentType ? 'Full-Time' : undefined}
              />
              <PreviewField label="Start Date" value={preview.startDate} />
              <PreviewField label="Personal Email" value={preview.personalEmail} />
              <PreviewField label="Mobile" value={preview.mobilePhone} />
              <PreviewField label="Location" value={preview.workLocation} />
              <PreviewField
                label="Work Type"
                value={preview.workLocationType ? (WORK_LOCATION_TYPE_LABELS[preview.workLocationType] ?? preview.workLocationType) : undefined}
              />
              <PreviewField label="Manager" value={preview.managerName} />
            </div>
            {preview.mailingAddress && (
              <div className="flex items-start gap-2 text-sm pt-1">
                <span className="text-muted-foreground min-w-[130px] shrink-0">Mailing Address</span>
                <span className="font-medium whitespace-pre-line">{preview.mailingAddress}</span>
              </div>
            )}
            {preview.notes && (
              <div className="flex items-start gap-2 text-sm pt-1">
                <span className="text-muted-foreground min-w-[130px] shrink-0">Notes</span>
                <span className="font-medium">{preview.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {importResult && (
        <Card className="border-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {importResult.status === 'created' && 'Employee record created'}
                  {importResult.status === 'updated' && 'Profile updated successfully'}
                  {importResult.status === 'no_changes' && 'No changes — already up to date'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">ID: {importResult.employeeId}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/employees/${importResult.employeeId}`)}
                >
                  View Profile
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Import Another
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
