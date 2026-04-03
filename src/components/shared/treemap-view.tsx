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

function worstRatio(row: number[], short: number, total: number, rowLen: number): number {
  const rowSum = row.reduce((s, v) => s + v, 0)
  const scale = (short * rowLen) / total
  const max = Math.max(...row)
  const min = Math.min(...row)
  return Math.max((scale * scale * max) / (rowSum * rowSum), (rowSum * rowSum) / (scale * scale * min))
}

function squarify(
  items: TreemapItem[],
  rect: Rect,
  total: number,
  result: PositionedItem[],
): void {
  if (items.length === 0) return

  const { x, y, w, h } = rect
  const short = Math.min(w, h)

  let row: number[] = []
  let i = 0

  while (i < items.length) {
    const next = (items[i].value / total) * (w * h)
    const candidate = [...row, next]
    const rowLen = short * short
    const rowLenWithCand = rowLen

    if (row.length === 0 || worstRatio(candidate, short, w * h, rowLenWithCand) <= worstRatio(row, short, w * h, rowLenWithCand)) {
      row = candidate
      i++
    } else {
      break
    }
  }

  // Lay out the current row
  const rowSum = row.reduce((s, v) => s + v, 0)
  const scale = w * h
  const isWide = w >= h

  let offset = isWide ? x : y
  let newRect: Rect

  const rowThickness = (rowSum / scale) * (isWide ? w : h)

  const startIdx = i - row.length
  for (let j = 0; j < row.length; j++) {
    const fraction = row[j] / rowSum
    const tileLen = fraction * (isWide ? h : w)

    const tileRect: Rect = isWide
      ? { x: offset, y, w: rowThickness, h: tileLen }
      : { x, y: offset, w: tileLen, h: rowThickness }

    result.push({ ...items[startIdx + j], ...tileRect })
    offset += tileLen
  }

  // Recurse on the remaining area
  if (i < items.length) {
    newRect = isWide
      ? { x: x + rowThickness, y, w: w - rowThickness, h }
      : { x, y: y + rowThickness, w, h: h - rowThickness }
    squarify(items.slice(i), newRect, total - rowSum, result)
  }
}

function layout(items: TreemapItem[], width: number, height: number): PositionedItem[] {
  if (items.length === 0 || width <= 0 || height <= 0) return []
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const total = sorted.reduce((s, item) => s + item.value, 0)
  if (total <= 0) return []
  const result: PositionedItem[] = []
  squarify(sorted, { x: 0, y: 0, w: width, h: height }, total, result)
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
