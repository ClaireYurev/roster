import { Navbar } from '@/components/layout/navbar'
import { ImportTool } from '@/components/import/import-tool'

export default function ImportPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 space-y-4 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-xl font-semibold">Bulk Import</h1>
          <p className="text-sm text-muted-foreground">
            Import employees from Freshservice, JumpCloud, or any CSV/JSON export.
          </p>
        </div>
        <ImportTool />
      </main>
    </div>
  )
}
