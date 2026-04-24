'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Trophy, Lock, Swords, AlertTriangle, Dices } from 'lucide-react'
import { toast } from 'sonner'

import { createLeague, closeLeague } from '@/lib/actions/admin'
import { rollActiveMatch } from '@/lib/actions/match'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { League } from '@/lib/types'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LeaguesPanelProps {
  leagues: League[]
  matchStats: { league_id: string; status: string }[]
  activePlayerCount: number
}

// ─── Helper ────────────────────────────────────────────────────────────────────

function getMatchSummary(
  leagueId: string,
  matchStats: { league_id: string; status: string }[]
) {
  const all = matchStats.filter((m) => m.league_id === leagueId)
  return {
    total: all.length,
    resolved: all.filter((m) =>
      ['validated', 'admin_resolved', 'voided'].includes(m.status)
    ).length,
    disputed: all.filter((m) => m.status === 'disputed').length,
    pending: all.filter((m) => m.status === 'pending').length,
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function LeaguesPanel({
  leagues,
  matchStats,
  activePlayerCount,
}: LeaguesPanelProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [closeTarget, setCloseTarget] = useState<League | null>(null)
  const [title, setTitle] = useState('')
  const [isPending, startTransition] = useTransition()

  const activeLeague = leagues.find((l) => l.status === 'active') ?? null
  const closedLeagues = leagues.filter((l) => l.status === 'closed')

  // Expected match count for info in the create dialog
  const expectedMatches =
    activePlayerCount > 1
      ? (activePlayerCount * (activePlayerCount - 1)) / 2
      : 0

  function handleCreate() {
    const trimmed = title.trim()
    if (!trimmed) return
    startTransition(async () => {
      const result = await createLeague(trimmed)
      if (result.error) {
        toast.error('Failed to create league', { description: String(result.error) })
        return
      }
      toast.success(`"${trimmed}" is live!`, {
        description: `${result.matchCount} matches generated.`,
      })
      setTitle('')
      setCreateOpen(false)
      router.refresh()
    })
  }

  function handleClose() {
    if (!closeTarget) return
    startTransition(async () => {
      const result = await closeLeague(closeTarget.id)
      if (result.error) {
        toast.error('Failed to close league', { description: String(result.error) })
        return
      }
      toast.success(`"${closeTarget.title}" archived.`)
      setCloseTarget(null)
      router.refresh()
    })
  }

  function handleRoll() {
    if (!activeLeague) return
    startTransition(async () => {
      const result = await rollActiveMatch(activeLeague.id)
      if (result.error) {
        toast.error('Failed to roll', { description: String(result.error) })
        return
      }
      toast.success('Nuevo duelo activo sorteado.')
      router.refresh()
    })
  }

  const activeStats = activeLeague ? getMatchSummary(activeLeague.id, matchStats) : null

  return (
    <>
      <div className="space-y-4">

        {/* ── Active League ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Active League
            </p>
            {!activeLeague && (
              <Button
                size="sm"
                className="gap-1.5"
                disabled={activePlayerCount < 2}
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Create League
              </Button>
            )}
          </div>

          {activeLeague && activeStats ? (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20">
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Swords className="h-4 w-4 text-amber-500" />
                    {activeLeague.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Started{' '}
                    {new Date(activeLeague.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Badge className="shrink-0 bg-amber-500 hover:bg-amber-500 text-white">
                  Active
                </Badge>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                {/* Match stats mini grid */}
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {[
                    { label: 'Total', value: activeStats.total, accent: '' },
                    { label: 'Done', value: activeStats.resolved, accent: 'text-green-600 dark:text-green-400' },
                    { label: 'Pending', value: activeStats.pending, accent: 'text-amber-600 dark:text-amber-400' },
                    {
                      label: 'Disputed',
                      value: activeStats.disputed,
                      accent: activeStats.disputed > 0 ? 'text-red-500 dark:text-red-400' : '',
                    },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className="rounded-lg bg-background/70 p-2">
                      <p className={cn('text-lg font-bold tabular-nums', accent)}>{value}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
                    </div>
                  ))}
                </div>

                {activeStats.disputed > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {activeStats.disputed} disputed match{activeStats.disputed > 1 ? 'es' : ''} need
                    {activeStats.disputed === 1 ? 's' : ''} your attention.
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push('/league')}
                  >
                    View League
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-muted-foreground"
                    onClick={() => setCloseTarget(activeLeague)}
                  >
                    <Lock className="h-3.5 w-3.5 mr-1" />
                    Close League
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={handleRoll}
                  disabled={isPending || activeStats.pending === 0}
                  title={
                    activeStats.pending === 0
                      ? 'No quedan duelos pendientes'
                      : 'Sortea aleatoriamente el próximo duelo activo'
                  }
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Dices className="h-3.5 w-3.5" />
                  )}
                  Tirar dado — sortear duelo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground">No active league</p>
                {activePlayerCount < 2 ? (
                  <p className="text-xs text-muted-foreground">
                    Add at least 2 active players first.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Creating a league will generate a full round-robin fixture for all{' '}
                    {activePlayerCount} active players ({expectedMatches} matches).
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Closed Leagues ── */}
        {closedLeagues.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                History ({closedLeagues.length})
              </p>
              {closedLeagues.map((league) => {
                const s = getMatchSummary(league.id, matchStats)
                return (
                  <Card key={league.id} className="opacity-70">
                    <CardContent className="p-3 flex items-center gap-3">
                      <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{league.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Closed{' '}
                          {league.closed_at
                            ? new Date(league.closed_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                          {' · '}
                          {s.total} matches
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        Closed
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Create League Dialog ── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) setTitle('')
          setCreateOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create League</DialogTitle>
            <DialogDescription>
              A round-robin fixture will be generated automatically for all{' '}
              <strong>{activePlayerCount} active players</strong> — that&apos;s{' '}
              <strong>{expectedMatches} matches</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="league-title">League Name</Label>
              <Input
                id="league-title"
                placeholder="e.g. Season 3 — Summer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && title.trim()) handleCreate()
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending || !title.trim()}>
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Create &amp; generate fixture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Close League Dialog ── */}
      <Dialog
        open={!!closeTarget}
        onOpenChange={(open) => {
          if (!open) setCloseTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Close &ldquo;{closeTarget?.title}&rdquo;?</DialogTitle>
            <DialogDescription>
              This archives the league. All points will count toward the global leaderboard.
              Resolve any disputed matches before closing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCloseTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={handleClose}>
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Close league
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
