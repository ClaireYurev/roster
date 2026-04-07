'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { LayoutGrid, Table2, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'

type View = 'table' | 'map' | 'calendar'

export function ViewToggle({ showCalendar = false }: { showCalendar?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentView = (searchParams.get('view') ?? 'table') as View

  function setView(view: View) {
    const params = new URLSearchParams(searchParams.toString())
    if (view === 'table') {
      params.delete('view')
    } else {
      params.set('view', view)
    }
    // When switching to calendar, clear the week param
    if (view === 'calendar') params.delete('week')
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
      {showCalendar && (
        <Button
          variant={currentView === 'calendar' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-2"
          onClick={() => setView('calendar')}
        >
          <CalendarDays className="h-3.5 w-3.5 mr-1" />
          Calendar
        </Button>
      )}
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
