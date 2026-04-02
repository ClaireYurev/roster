import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { getAsset } from '@/actions/hardware'
import { getEmployees } from '@/actions/employees'
import { AssignAssetDialog } from '@/components/hardware/assign-employee-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCents, formatDate } from '@/lib/utils'
import { HARDWARE_STATUS_LABELS, HARDWARE_STATUS_COLORS } from '@/lib/constants'
import { ArrowLeft, Monitor } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const [asset, employees] = await Promise.all([getAsset(params.id), getEmployees()])
  if (!asset) notFound()

  const emp = (asset as unknown as { employee?: { currentName: string; currentRole: string; id: string } }).employee

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Link href="/hardware" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Monitor className="h-5 w-5" />
          <h1 className="text-lg font-semibold font-mono">{asset.systemName}</h1>
          <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${HARDWARE_STATUS_COLORS[asset.status]}`}>
            {HARDWARE_STATUS_LABELS[asset.status]}
          </span>
          {asset.status !== 'RETIRED' && (
            <div className="ml-auto">
              <AssignAssetDialog
                assetId={asset.id}
                currentEmployeeId={asset.employeeId ?? null}
                employees={employees}
              />
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asset Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Detail label="System Name" value={<span className="font-mono font-medium">{asset.systemName}</span>} />
            <Detail label="Asset Tag" value={asset.assetTag ?? '—'} />
            <Detail label="Model" value={asset.model} />
            <Detail label="Cost" value={formatCents(asset.cost)} />
            <Detail label="Purchase Date" value={formatDate(asset.purchaseDate)} />
            <Detail label="Status" value={HARDWARE_STATUS_LABELS[asset.status]} />
            {emp && (
              <>
                <Detail
                  label="Assigned To"
                  value={
                    <Link href={`/employees/${emp.id}`} className="hover:underline text-primary">
                      {emp.currentName}
                    </Link>
                  }
                />
                <Detail label="Assigned Date" value={formatDate(asset.assignedDate)} />
              </>
            )}
            {asset.description && (
              <div className="col-span-2">
                <Detail label="Notes" value={asset.description} />
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
