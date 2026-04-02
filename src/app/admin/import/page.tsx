import { Navbar } from '@/components/layout/navbar'
import { ImportTool } from '@/components/import/import-tool'
import { FreshserviceImportTool } from '@/components/import/freshservice-import-tool'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Zap } from 'lucide-react'

export default function ImportPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 space-y-4 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-xl font-semibold">Import Employees</h1>
          <p className="text-sm text-muted-foreground">
            Create or update employee records from multiple sources. Existing records are matched by
            Freshservice ID or exact name — only non-blank fields are overwritten, and every change
            is logged in the employee's history.
          </p>
        </div>

        <Tabs defaultValue="freshservice">
          <TabsList>
            <TabsTrigger value="freshservice" className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Freshservice Ticket
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              CSV / JSON Bulk
            </TabsTrigger>
          </TabsList>

          <TabsContent value="freshservice" className="mt-4">
            <FreshserviceImportTool />
          </TabsContent>

          <TabsContent value="csv" className="mt-4">
            <ImportTool />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
