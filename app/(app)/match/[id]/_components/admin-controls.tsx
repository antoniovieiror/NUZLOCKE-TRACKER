'use client'

import { useState, useTransition } from 'react'
import { Shield, Loader2, Gavel, Ban, Crosshair, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { activateMatch, adminResolveMatch, adminVoidMatch } from '@/lib/actions/match'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AdminControlsProps {
  matchId: string
  status: string
  playerAId: string
  playerBId: string
  playerAUsername: string
  playerBUsername: string
  isActiveDuel: boolean
}

export function AdminControls({
  matchId,
  status,
  playerAId,
  playerBId,
  playerAUsername,
  playerBUsername,
  isActiveDuel,
}: AdminControlsProps) {
  const [resolveOpen, setResolveOpen] = useState(false)
  const [voidOpen, setVoidOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isPending_ = status === 'pending'
  const isResolved = status === 'validated' || status === 'admin_resolved'
  const isVoided = status === 'voided'

  function handleActivate() {
    startTransition(async () => {
      const result = await activateMatch(matchId)
      if (result.error) {
        toast.error('No se pudo activar', { description: String(result.error) })
      } else {
        toast.success('Duelo activo actualizado')
      }
    })
  }

  function resolveAs(winnerId: string) {
    startTransition(async () => {
      const result = await adminResolveMatch(matchId, winnerId)
      if (result.error) {
        toast.error('Failed to resolve', { description: String(result.error) })
      } else {
        toast.success('Match resolved')
        setResolveOpen(false)
      }
    })
  }

  function handleVoid() {
    startTransition(async () => {
      const result = await adminVoidMatch(matchId)
      if (result.error) {
        toast.error('Failed to void', { description: String(result.error) })
      } else {
        toast.success('Match voided')
        setVoidOpen(false)
      }
    })
  }

  if (isVoided) return null

  return (
    <>
      <section className="mv-warroom relative p-4 overflow-hidden">
        <div className="mv-warroom-stripes" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="grid place-items-center w-8 h-8 rounded-md bg-blue-500/15 border border-blue-400/35">
                <Shield className="w-4 h-4 text-blue-300" strokeWidth={2} />
              </div>
              <div>
                <p className="mv-font-display font-bold text-sm uppercase tracking-[0.22em] text-blue-100">
                  War Room
                </p>
                <p className="mv-font-mono text-[9.5px] uppercase tracking-[0.24em] text-blue-300/60">
                  Controles de la dirección
                </p>
              </div>
            </div>
            {isActiveDuel ? (
              <span className="mv-active-chip">
                <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.6} />
                Duelo Activo
              </span>
            ) : (
              <span className="mv-font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-blue-300/60 hidden sm:inline">
                Solo admin
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            {isPending_ && !isActiveDuel && (
              <button
                type="button"
                onClick={handleActivate}
                disabled={isPending}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-emerald-400/25 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.12] hover:border-emerald-400/50 text-emerald-100 transition-colors text-left sm:col-span-2 disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 text-emerald-300 shrink-0 animate-spin" strokeWidth={2} />
                ) : (
                  <Crosshair className="w-4 h-4 text-emerald-300 shrink-0" strokeWidth={2} />
                )}
                <div className="flex-1">
                  <p className="mv-font-display text-sm font-bold uppercase tracking-[0.14em]">
                    Activar duelo
                  </p>
                  <p className="mv-font-mono text-[10px] text-emerald-300/65 tracking-[0.1em] uppercase">
                    Fija este como el duelo activo global
                  </p>
                </div>
              </button>
            )}
            {!isResolved && (
              <button
                type="button"
                onClick={() => setResolveOpen(true)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-blue-400/30 bg-blue-500/[0.06] hover:bg-blue-500/[0.14] hover:border-blue-400/55 text-blue-100 transition-colors text-left"
              >
                <Gavel className="w-4 h-4 text-blue-300 shrink-0" strokeWidth={2} />
                <div className="flex-1">
                  <p className="mv-font-display text-sm font-bold uppercase tracking-[0.14em]">
                    Resolver manualmente
                  </p>
                  <p className="mv-font-mono text-[10px] text-blue-300/60 tracking-[0.1em] uppercase">
                    Fija un ganador sin votos
                  </p>
                </div>
              </button>
            )}
            <button
              type="button"
              onClick={() => setVoidOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-rose-400/25 bg-rose-500/[0.04] hover:bg-rose-500/[0.12] hover:border-rose-400/50 text-rose-100 transition-colors text-left"
            >
              <Ban className="w-4 h-4 text-rose-300 shrink-0" strokeWidth={2} />
              <div className="flex-1">
                <p className="mv-font-display text-sm font-bold uppercase tracking-[0.14em]">
                  Anular partida
                </p>
                <p className="mv-font-mono text-[10px] text-rose-300/60 tracking-[0.1em] uppercase">
                  Sin puntos ni winrate
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ── Force Resolve dialog ── */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="mv-font-display tracking-[0.18em] uppercase">Forzar veredicto</DialogTitle>
            <DialogDescription>
              Fija manualmente el ganador. Esto reemplaza el sistema de votos normal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => resolveAs(playerAId)}
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Gana {playerAUsername}
            </Button>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => resolveAs(playerBId)}
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Gana {playerBUsername}
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setResolveOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Void dialog ── */}
      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="mv-font-display tracking-[0.18em] uppercase">¿Anular la partida?</DialogTitle>
            <DialogDescription>
              Marcará la partida como anulada. No se repartirán puntos y no contará para el winrate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setVoidOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleVoid}
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Anular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
