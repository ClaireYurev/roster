'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

export type TreemapItem = {
  id: string
  label: string
  sublabel?: string
  value: number  // determines tile area; must be > 0
  color: string  // CSS color string
  href: string
}

type Rect = { x: number; y: number; w: number; h: number }

type PositionedItem = TreemapItem & Rect

// ── Squarified treemap algorithm ─────────────────────────────────────────────
// Sizes passed to squarify are pre-normalized to pixel areas (sum = w * h).

/** Worst aspect ratio across all tiles in a strip of shorter-side length `w`. */
function worst(row: number[], w: number): number {
  if (row.length === 0) return Infinity
  const s = row.reduce((a, b) => a + b, 0)
  const rmax = Math.max(...row)
  const rmin = Math.min(...row)
  // For each tile: thickness = s/w, tileLen = size/(s/w) = size*w/s
  // aspect = max(thickness/tileLen, tileLen/thickness) = max(s/(w*size), w*size/s)
  // worst = max over all tiles → driven by max and min sizes
  return Math.max((w * w * rmax) / (s * s), (s * s) / (w * w * rmin))
}

function squarify(
  items: TreemapItem[],
  sizes: number[], // pre-normalized pixel areas, sum = w * h
  x: number, y: number, w: number, h: number,
  result: PositionedItem[],
): void {
  if (items.length === 0 || w <= 0 || h <= 0) return
  if (items.length === 1) {
    result.push({ ...items[0], x, y, w, h })
    return
  }

  const short = Math.min(w, h)
  const isWide = w >= h // strips run along the long axis

  let row: number[] = []
  let i = 0

  while (i < items.length) {
    const candidate = [...row, sizes[i]]
    if (row.length === 0 || worst(candidate, short) <= worst(row, short)) {
      row = candidate
      i++
    } else {
      break
    }
  }

  // Lay out the current row as a strip
  const rowSum = row.reduce((a, b) => a + b, 0)
  const thickness = rowSum / short // extent along the long axis
  const startIdx = i - row.length

  // isWide: strip is on the LEFT (fixed x), tiles stack along h (y changes)
  // !isWide: strip is on the TOP  (fixed y), tiles arrange along w (x changes)
  let offset = isWide ? y : x
  for (let j = 0; j < row.length; j++) {
    const tileLen = row[j] / thickness // extent along short axis
    result.push(
      isWide
        ? { ...items[startIdx + j], x, y: offset, w: thickness, h: tileLen }
        : { ...items[startIdx + j], x: offset, y, w: tileLen, h: thickness },
    )
    offset += tileLen
  }

  // Recurse on remaining area — sizes still sum correctly to new rect area:
  // isWide:  remaining = (w − thickness) × h = w*h − rowSum ✓
  // !isWide: remaining = w × (h − thickness) = w*h − rowSum ✓
  if (i < items.length) {
    if (isWide) {
      squarify(items.slice(i), sizes.slice(i), x + thickness, y, w - thickness, h, result)
    } else {
      squarify(items.slice(i), sizes.slice(i), x, y + thickness, w, h - thickness, result)
    }
  }
}

function layout(items: TreemapItem[], width: number, height: number): PositionedItem[] {
  if (items.length === 0 || width <= 0 || height <= 0) return []
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const totalValue = sorted.reduce((s, item) => s + item.value, 0)
  if (totalValue <= 0) return []
  const area = width * height
  // Normalize: each size is its proportional share of pixel area
  const sizes = sorted.map((item) => (item.value / totalValue) * area)
  const result: PositionedItem[] = []
  squarify(sorted, sizes, 0, 0, width, height, result)
  return result
}

// ── Component ─────────────────────────────────────────────────────────────────

const GAP = 2

export function TreemapView({ items }: { items: TreemapItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)

  const updateDims = useCallback(() => {
    if (containerRef.current) {
      setDims({
        w: containerRef.current.offsetWidth,
        h: containerRef.current.offsetHeight,
      })
    }
  }, [])

  useEffect(() => {
    updateDims()
    const ro = new ResizeObserver(updateDims)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [updateDims])

  const tiles = dims ? layout(items, dims.w, dims.h) : []

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {tiles.map((tile) => {
        const tileW = tile.w - GAP
        const tileH = tile.h - GAP
        if (tileW < 4 || tileH < 4) return null

        const fontSize = Math.min(
          Math.max(9, Math.min(tileW / 8, tileH / 3, 18)),
          18
        )
        const subFontSize = Math.max(8, fontSize * 0.75)
        const showSub = tile.sublabel && tileH > 50 && tileW > 60

        return (
          <Link
            key={tile.id}
            href={tile.href}
            style={{
              position: 'absolute',
              left: tile.x,
              top: tile.y,
              width: tileW,
              height: tileH,
              backgroundColor: tile.color,
              borderRadius: 4,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 6px',
              textDecoration: 'none',
              transition: 'opacity 0.15s, filter 0.15s',
              cursor: 'pointer',
            }}
            className="hover:brightness-110 hover:z-10 group"
          >
            <span
              style={{
                fontSize,
                fontWeight: 600,
                color: '#fff',
                textAlign: 'center',
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              {tile.label}
            </span>
            {showSub && (
              <span
                style={{
                  fontSize: subFontSize,
                  color: 'rgba(255,255,255,0.85)',
                  textAlign: 'center',
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                }}
              >
                {tile.sublabel}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
