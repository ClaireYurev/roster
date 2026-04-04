'use client'

import { useTheme } from 'next-themes'
import { Palette, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ThemeDef = {
  id: string
  name: string
  // swatch: [background, primary, muted]
  swatch: [string, string, string]
  dark: boolean
}

const THEMES: ThemeDef[] = [
  // ── Light ────────────────────────────────────────────────────
  { id: 'zinc',     name: 'Zinc',     swatch: ['#ffffff', '#18181b', '#f4f4f5'], dark: false },
  { id: 'arctic',   name: 'Arctic',   swatch: ['#f2f8fc', '#0284c7', '#e0eef6'], dark: false },
  { id: 'petal',    name: 'Petal',    swatch: ['#fef4f6', '#c8194f', '#f7e8ec'], dark: false },
  // ── Dark ─────────────────────────────────────────────────────
  { id: 'dark',     name: 'Slate',    swatch: ['#09090b', '#fafafa', '#27272a'], dark: true  },
  { id: 'midnight', name: 'Midnight', swatch: ['#050c1e', '#3b82f6', '#0f1d3b'], dark: true  },
  { id: 'obsidian', name: 'Obsidian', swatch: ['#110f0d', '#f59d06', '#24201b'], dark: true  },
  { id: 'forest',   name: 'Forest',   swatch: ['#060e09', '#22c55e', '#121e14'], dark: true  },
  { id: 'noir',     name: 'Noir',     swatch: ['#0a0a0a', '#ede9e3', '#1a1a1a'], dark: true  },
  { id: 'copper',   name: 'Copper',   swatch: ['#120f0c', '#f97316', '#261f18'], dark: true  },
  { id: 'dusk',     name: 'Dusk',     swatch: ['#0d0a12', '#7c55f0', '#1d1430'], dark: true  },
]

const LIGHT_THEMES = THEMES.filter((t) => !t.dark)
const DARK_THEMES  = THEMES.filter((t) => t.dark)

function Swatch({ colors }: { colors: [string, string, string] }) {
  return (
    <span
      className="flex items-center rounded overflow-hidden shrink-0"
      style={{ width: 36, height: 16, border: '1px solid rgba(128,128,128,0.2)' }}
    >
      {colors.map((c, i) => (
        <span key={i} style={{ background: c, flex: 1, height: '100%' }} />
      ))}
    </span>
  )
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const current = THEMES.find((t) => t.id === theme)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 px-2.5 text-muted-foreground hover:text-foreground"
        >
          {current ? <Swatch colors={current.swatch} /> : <Palette className="h-4 w-4" />}
          <span className="text-xs font-medium hidden sm:inline">
            {current?.name ?? 'Theme'}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-1.5">
          Light
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {LIGHT_THEMES.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="flex items-center gap-2.5 cursor-pointer py-1.5"
            >
              <Swatch colors={t.swatch} />
              <span className="flex-1 text-sm">{t.name}</span>
              {theme === t.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-1.5">
          Dark
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {DARK_THEMES.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="flex items-center gap-2.5 cursor-pointer py-1.5"
            >
              <Swatch colors={t.swatch} />
              <span className="flex-1 text-sm">{t.name}</span>
              {theme === t.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
