/**
 * Fix script — hardware asset costs were stored as dollar amounts
 * instead of cents (1999 → $19.99 instead of $1,999.00).
 * Updates each asset to its correct 2026 retail price in cents.
 *
 * Run with:  npx tsx scripts/fix-hardware-costs.ts
 */

import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'roster.db')
const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

const now = Date.now()

// Correct 2026 retail prices in cents, matched by SQL LIKE on model column
// Ordered most-specific first so M3 Max/Pro match before plain M3
const PRICE_RULES: Array<{ pattern: string; cents: number; label: string }> = [
  { pattern: '%MacBook Pro 16%M3 Max%',  cents: 349900, label: 'MacBook Pro 16" M3 Max'  }, // $3,499
  { pattern: '%MacBook Pro 14%M3 Max%',  cents: 249900, label: 'MacBook Pro 14" M3 Max'  }, // $2,499
  { pattern: '%MacBook Pro 14%M3 Pro%',  cents: 199900, label: 'MacBook Pro 14" M3 Pro'  }, // $1,999
  { pattern: '%MacBook Pro 14%M3%',      cents: 159900, label: 'MacBook Pro 14" M3'       }, // $1,599
  { pattern: '%MacBook Pro 13%Intel%',   cents: 109900, label: 'MacBook Pro 13" Intel'    }, // $1,099 (retired)
  { pattern: '%MacBook Air 15%M3%',      cents: 129900, label: 'MacBook Air 15" M3'       }, // $1,299
  { pattern: '%MacBook Air 13%M3%',      cents: 109900, label: 'MacBook Air 13" M3'       }, // $1,099
  { pattern: '%MacBook Air 13%M2%',      cents:  99900, label: 'MacBook Air 13" M2'       }, // $999
]

type Asset = { id: string; system_name: string; model: string; cost: number | null }

const getAssets = sqlite.prepare('SELECT id, system_name, model, cost FROM hardware_assets ORDER BY system_name')
const updateCost = sqlite.prepare('UPDATE hardware_assets SET cost = @cents, updated_at = @now WHERE id = @id')

const fix = sqlite.transaction(() => {
  const assets = getAssets.all() as Asset[]
  let fixed = 0, skipped = 0

  for (const asset of assets) {
    const rule = PRICE_RULES.find((r) =>
      // SQLite LIKE is case-insensitive; replicate with JS toLower + wildcard
      new RegExp(r.pattern.replace(/%/g, '.*').replace(/"/g, '.'), 'i').test(asset.model)
    )

    if (rule) {
      const old = asset.cost != null ? `$${(asset.cost / 100).toFixed(2)}` : '(null)'
      updateCost.run({ id: asset.id, cents: rule.cents, now })
      const newVal = `$${(rule.cents / 100).toFixed(2)}`
      console.log(`  ✓  ${asset.system_name.padEnd(10)}  ${asset.model.padEnd(32)}  ${old.padStart(9)} → ${newVal}`)
      fixed++
    } else {
      console.log(`  ?  ${asset.system_name.padEnd(10)}  ${asset.model.padEnd(32)}  (no rule — left unchanged)`)
      skipped++
    }
  }

  return { fixed, skipped }
})

console.log('\n🔧 Fixing hardware asset costs to 2026 retail prices...\n')
const { fixed, skipped } = fix()
console.log(`\n✅ Updated ${fixed} asset${fixed !== 1 ? 's' : ''}.${skipped ? ` ${skipped} skipped (no matching rule).` : ''}\n`)
sqlite.close()
