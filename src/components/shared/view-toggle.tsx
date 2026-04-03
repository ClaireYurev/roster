'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { LayoutGrid, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ViewToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') ?? 'table'

  function setView(view: 'table' | 'map') {
    const params = new URLSearchParams(searchParams.toString())
    if (view === 'table') {
      params.delete('view')
    } else {
      params.set('view', view)
    }
    const qs = params.toString()
    router.push(pathname + (qs ? `?${qs}` : ''))
  }

  return (
    <div className="flex items-center gap-1 rounded-md border p-0.5 bg-muted/40">
      <Button
        variant={currentView === 'table' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 px-2"
        onClick={() => setView('table')}
      >
        <Table2 className="h-3.5 w-3.5 mr-1" />
        Table
      </Button>
      <Button
        variant={currentView === 'map' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 px-2"
        onClick={() => setView('map')}
      >
        <LayoutGrid className="h-3.5 w-3.5 mr-1" />
        Map
      </Button>
    </div>
  )
}
