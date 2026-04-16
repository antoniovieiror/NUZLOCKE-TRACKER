'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { updateNuzlockeState } from '@/lib/actions/profile'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const schema = z.object({
  badges: z.number().int().min(0).max(12),
  deaths: z.number().int().min(0),
  wipes: z.number().int().min(0),
  notes: z.string().max(1000),
})

type FormValues = z.infer<typeof schema>

interface Props {
  profileId: string
  initialValues: {
    badges: number
    deaths: number
    wipes: number
    notes: string | null
  }
}

export function EditStateDialog({ profileId, initialValues }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      badges: initialValues.badges,
      deaths: initialValues.deaths,
      wipes: initialValues.wipes,
      notes: initialValues.notes ?? '',
    },
  })

  function onOpenChange(next: boolean) {
    if (!next) {
      reset({
        badges: initialValues.badges,
        deaths: initialValues.deaths,
        wipes: initialValues.wipes,
        notes: initialValues.notes ?? '',
      })
    }
    setOpen(next)
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await updateNuzlockeState(profileId, values)
      if (result.error) {
        toast.error('Error al guardar', { description: String(result.error) })
        return
      }
      toast.success('Perfil actualizado')
      setOpen(false)
    })
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 border-white/10 bg-black/25 px-2.5 text-[11px] uppercase tracking-[0.12em] text-cyan-100 hover:bg-white/10"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg border-white/10 bg-[#0b1020] text-slate-100">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Editar estado Nuzlocke</DialogTitle>
            <DialogDescription className="text-white/55">
              Actualiza medallas, muertes, wipes y notas. El MVP se sigue seleccionando desde el equipo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="badges">Medallas</Label>
                <Input
                  id="badges"
                  type="number"
                  min={0}
                  max={12}
                  {...register('badges', { valueAsNumber: true })}
                  aria-invalid={!!errors.badges}
                  className="border-white/10 bg-black/20"
                />
                {errors.badges && (
                  <p className="text-xs text-red-400">{errors.badges.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deaths">Muertes</Label>
                <Input
                  id="deaths"
                  type="number"
                  min={0}
                  {...register('deaths', { valueAsNumber: true })}
                  aria-invalid={!!errors.deaths}
                  className="border-white/10 bg-black/20"
                />
                {errors.deaths && (
                  <p className="text-xs text-red-400">{errors.deaths.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wipes">Wipes</Label>
                <Input
                  id="wipes"
                  type="number"
                  min={0}
                  {...register('wipes', { valueAsNumber: true })}
                  aria-invalid={!!errors.wipes}
                  className="border-white/10 bg-black/20"
                />
                {errors.wipes && (
                  <p className="text-xs text-red-400">{errors.wipes.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                rows={5}
                placeholder="Momentos memorables, reglas caseras, observaciones…"
                className="resize-none border-white/10 bg-black/20"
                {...register('notes')}
                aria-invalid={!!errors.notes}
              />
              {errors.notes && (
                <p className="text-xs text-red-400">{errors.notes.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="text-white/70 hover:text-white"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}