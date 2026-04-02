'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { createAsset } from '@/actions/hardware'
import { createAssetSchema, type CreateAssetInput } from '@/lib/validators'
import { Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddAssetDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateAssetInput>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: { purchaseDate: today },
  })

  function onSubmit(data: CreateAssetInput) {
    startTransition(async () => {
      const result = await createAsset(data)
      if ('error' in result) {
        toast({ title: 'Validation error', variant: 'destructive' })
      } else {
        toast({ title: `Asset ${data.systemName} added` })
        reset()
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Hardware Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="systemName">System Name *</Label>
              <Input id="systemName" {...register('systemName')} placeholder="LIV-499" className="font-mono" />
              {errors.systemName && <p className="text-xs text-destructive">{errors.systemName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="assetTag">Asset Tag</Label>
              <Input id="assetTag" {...register('assetTag')} placeholder="AT-2025-001" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="model">Model *</Label>
            <Input id="model" {...register('model')} placeholder='MacBook Pro 14" M3 Max' />
            {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="costDollars">Cost ($)</Label>
              <Input id="costDollars" {...register('costDollars')} placeholder="1899.99" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="purchaseDate">Purchase Date *</Label>
              <Input id="purchaseDate" type="date" {...register('purchaseDate')} />
              {errors.purchaseDate && <p className="text-xs text-destructive">{errors.purchaseDate.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Notes</Label>
            <Textarea id="description" {...register('description')} rows={2} />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Asset
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
