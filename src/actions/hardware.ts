'use server'

import { db } from '@/db'
import { hardwareAssets, lifecycleEvents, employees } from '@/db/schema'
import { eq, and, gte, lte, desc, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createAssetSchema, assignAssetSchema } from '@/lib/validators'
import { dollarsToCents } from '@/lib/utils'
import type { MonthlyHardwareAsset } from '@/types'
import type { z } from 'zod'

export async function createAsset(input: z.infer<typeof createAssetSchema>) {
  const parsed = createAssetSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const data = parsed.data
  const now = new Date()
  const id = crypto.randomUUID()

  await db.insert(hardwareAssets).values({
    id,
    systemName: data.systemName,
    assetTag: data.assetTag ?? null,
    model: data.model,
    description: data.description ?? null,
    cost: data.costDollars ? dollarsToCents(data.costDollars) : null,
    purchaseDate: new Date(data.purchaseDate),
    status: 'UNASSIGNED',
    employeeId: null,
    assignedDate: null,
    createdAt: now,
    updatedAt: now,
  })

  revalidatePath('/hardware')
  revalidatePath('/hardware/monthly')
  return { success: true, assetId: id }
}

export async function assignAsset(input: z.infer<typeof assignAssetSchema>) {
  const parsed = assignAssetSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { assetId, employeeId, assignedDate, notes } = parsed.data
  const now = new Date()

  const asset = await db.query.hardwareAssets.findFirst({
    where: eq(hardwareAssets.id, assetId),
  })
  if (!asset) return { error: 'Asset not found' }

  await db.transaction(async (tx) => {
    await tx
      .update(hardwareAssets)
      .set({
        status: 'ASSIGNED',
        employeeId,
        assignedDate: new Date(assignedDate),
        updatedAt: now,
      })
      .where(eq(hardwareAssets.id, assetId))

    await tx.insert(lifecycleEvents).values({
      employeeId,
      eventType: 'HARDWARE_ASSIGNED',
      eventDate: new Date(assignedDate),
      payload: {
        assetId,
        systemName: asset.systemName,
        model: asset.model,
      } as unknown as null,
      notes: notes ?? null,
      createdAt: now,
    })
  })

  revalidatePath('/hardware')
  revalidatePath('/hardware/monthly')
  revalidatePath(`/employees/${employeeId}`)
  return { success: true }
}

export async function unassignAsset(assetId: string) {
  const now = new Date()

  const asset = await db.query.hardwareAssets.findFirst({
    where: eq(hardwareAssets.id, assetId),
  })
  if (!asset) return { error: 'Asset not found' }
  if (!asset.employeeId) return { error: 'Asset is not currently assigned' }

  const employeeId = asset.employeeId

  await db.transaction(async (tx) => {
    await tx
      .update(hardwareAssets)
      .set({
        status: 'UNASSIGNED',
        employeeId: null,
        assignedDate: null,
        updatedAt: now,
      })
      .where(eq(hardwareAssets.id, assetId))

    await tx.insert(lifecycleEvents).values({
      employeeId,
      eventType: 'HARDWARE_UNASSIGNED',
      eventDate: now,
      payload: {
        assetId,
        systemName: asset.systemName,
        model: asset.model,
      } as unknown as null,
      notes: null,
      createdAt: now,
    })
  })

  revalidatePath('/hardware')
  revalidatePath(`/employees/${employeeId}`)
  return { success: true }
}

export async function retireAsset(assetId: string) {
  const now = new Date()
  await db
    .update(hardwareAssets)
    .set({ status: 'RETIRED', employeeId: null, updatedAt: now })
    .where(eq(hardwareAssets.id, assetId))

  revalidatePath('/hardware')
  return { success: true }
}

export async function getAssets() {
  return db.query.hardwareAssets.findMany({
    orderBy: [desc(hardwareAssets.purchaseDate)],
    with: { employee: true },
  })
}

export async function getMonthlyAssets(year: number, month: number): Promise<{
  purchased: MonthlyHardwareAsset[]
  assignedThisMonth: MonthlyHardwareAsset[]
  totalPurchasedCents: number
  totalAssignedCents: number
}> {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)

  // Assets purchased this month
  const purchasedRaw = await db.query.hardwareAssets.findMany({
    where: and(
      gte(hardwareAssets.purchaseDate, start),
      lte(hardwareAssets.purchaseDate, end)
    ),
    orderBy: [hardwareAssets.purchaseDate],
    with: { employee: true },
  })

  // Assets assigned this month (but possibly purchased earlier)
  const assignedRaw = await db.query.hardwareAssets.findMany({
    where: and(
      gte(hardwareAssets.assignedDate, start),
      lte(hardwareAssets.assignedDate, end)
    ),
    orderBy: [hardwareAssets.assignedDate],
    with: { employee: true },
  })

  const toMonthly = (a: (typeof purchasedRaw)[0]): MonthlyHardwareAsset => ({
    ...a,
    employeeName: (a as unknown as { employee?: { currentName: string } }).employee?.currentName ?? null,
  })

  const purchased = purchasedRaw.map(toMonthly)
  const assignedThisMonth = assignedRaw
    .filter((a) => !purchased.find((p) => p.id === a.id))
    .map(toMonthly)

  const totalPurchasedCents = purchased.reduce((sum, a) => sum + (a.cost ?? 0), 0)
  const totalAssignedCents = assignedRaw.reduce((sum, a) => sum + (a.cost ?? 0), 0)

  return { purchased, assignedThisMonth, totalPurchasedCents, totalAssignedCents }
}

export async function getAsset(id: string) {
  return db.query.hardwareAssets.findFirst({
    where: eq(hardwareAssets.id, id),
    with: { employee: true },
  })
}
