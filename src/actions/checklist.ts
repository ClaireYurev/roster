'use server'

import { db } from '@/db'
import { onboardingChecklists } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { upsertChecklistSchema } from '@/lib/validators'
import type { z } from 'zod'

export async function upsertChecklist(input: z.infer<typeof upsertChecklistSchema>) {
  const parsed = upsertChecklistSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const data = parsed.data
  const now = new Date()

  const existing = await db.query.onboardingChecklists.findFirst({
    where: eq(onboardingChecklists.lifecycleEventId, data.lifecycleEventId),
  })

  if (existing) {
    await db
      .update(onboardingChecklists)
      .set({
        jumpCloudProvisioned: data.jumpCloudProvisioned,
        laptopAssigned: data.laptopAssigned,
        emailAliasCreated: data.emailAliasCreated,
        computerType: data.computerType ?? existing.computerType,
        computerSize: data.computerSize ?? existing.computerSize,
        peripheralsNotes: data.peripheralsNotes ?? existing.peripheralsNotes,
        additionalNotes: data.additionalNotes ?? existing.additionalNotes,
        updatedAt: now,
      })
      .where(eq(onboardingChecklists.lifecycleEventId, data.lifecycleEventId))
  } else {
    await db.insert(onboardingChecklists).values({
      lifecycleEventId: data.lifecycleEventId,
      jumpCloudProvisioned: data.jumpCloudProvisioned,
      laptopAssigned: data.laptopAssigned,
      emailAliasCreated: data.emailAliasCreated,
      computerType: data.computerType ?? null,
      computerSize: data.computerSize ?? null,
      peripheralsNotes: data.peripheralsNotes ?? null,
      additionalNotes: data.additionalNotes ?? null,
      createdAt: now,
      updatedAt: now,
    })
  }

  revalidatePath('/employees/[id]', 'page')
  revalidatePath('/onboarding/weekly')
  return { success: true }
}

export async function getChecklist(lifecycleEventId: number) {
  return db.query.onboardingChecklists.findFirst({
    where: eq(onboardingChecklists.lifecycleEventId, lifecycleEventId),
  })
}
