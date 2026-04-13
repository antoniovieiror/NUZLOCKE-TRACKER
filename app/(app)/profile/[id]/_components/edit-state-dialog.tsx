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
  badges: z.number().int().min(0).max(8),
  deaths: z.number().int().min(0),
  wipes: z.number().int().min(0),
  mvp: z.string().max(100),
  notes: z.string().max(1000),
})

type FormValues = z.infer<typeof schema>

interface Props {
  profileId: string
  initialValues: {
    badges: number
    deaths: number
    wipes: number
    mvp: string | null
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
      mvp: initialValues.mvp ?? '',
      notes: initialValues.notes ?? '',
    },
  })

  function onOpenChange(next: boolean) {
    if (!next) {
      reset({
        badges: initialValues.badges,
        deaths: initialValues.deaths,
        wipes: initialValues.wipes,
        mvp: initialValues.mvp ?? '',
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
      {/* Trigger — plain button, dialog is fully controlled */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar estado Nuzlocke</DialogTitle>
            <DialogDescription>
              Actualiza medallas, muertes, wipes, Pokémon MVP y notas de tu partida.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* Badges / Deaths / Wipes */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="badges">Medallas</Label>
                <Input
                  id="badges"
                  type="number"
                  min={0}
                  max={8}
                  {...register('badges', { valueAsNumber: true })}
                  aria-invalid={!!errors.badges}
                />
                {errors.badges && (
                  <p className="text-xs text-destructive">{errors.badges.message}</p>
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
                />
                {errors.deaths && (
                  <p className="text-xs text-destructive">{errors.deaths.message}</p>
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
                />
                {errors.wipes && (
                  <p className="text-xs text-destructive">{errors.wipes.message}</p>
                )}
              </div>
            </div>

            {/* MVP */}
            <div className="space-y-2">
              <Label htmlFor="mvp">Pokémon MVP</Label>
              <Input
                id="mvp"
                placeholder="ej. Typhlosion"
                {...register('mvp')}
                aria-invalid={!!errors.mvp}
              />
              {errors.mvp && (
                <p className="text-xs text-destructive">{errors.mvp.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas de la partida</Label>
              <Textarea
                id="notes"
                placeholder="Pensamientos sobre tu partida, momentos memorables…"
                className="resize-none"
                rows={4}
                {...register('notes')}
                aria-invalid={!!errors.notes}
              />
              {errors.notes && (
                <p className="text-xs text-destructive">{errors.notes.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
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
