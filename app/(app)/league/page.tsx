import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Trophy, Swords, Clock, CheckCircle2, AlertCircle, Ban, Shield } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import type { League, Match, Profile } from '@/lib/types'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

// ─── Types ─────────────────────────────────────────────────────────────────────

type PlayerRow = {
  id: string
  username: string
  avatar_url: string | null
  points: number
  wins: number
  losses: number
  winrate: number
  streak: number
  matchesPlayed: number
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function computeStandings(
  matches: Match[],
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url'>[]
): PlayerRow[] {
  const map = new Map<string, PlayerRow>()

  for (const p of profiles) {
    map.set(p.id, {
      id: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
      points: 0,
      wins: 0,
      losses: 0,
      winrate: 0,
      streak: 0,
      matchesPlayed: 0,
    })
  }

  const resolved = matches.filter(
    (m) => m.status === 'validated' || m.status === 'admin_resolved'
  )

  for (const m of resolved) {
    if (!m.winner_id) continue
    const loserId = m.winner_id === m.player_a_id ? m.player_b_id : m.player_a_id
    const winner = map.get(m.winner_id)
    const loser = map.get(loserId)
    if (winner) { winner.points += 2; winner.wins += 1; winner.matchesPlayed += 1 }
    if (loser) { loser.losses += 1; loser.matchesPlayed += 1 }
  }

  for (const row of map.values()) {
    row.winrate =
      row.matchesPlayed > 0
        ? Math.round((row.wins / row.matchesPlayed) * 1000) / 10
        : 0
  }

  const chronoResolved = [...resolved].sort(
    (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
  )

  for (const row of map.values()) {
    const playerMatches = chronoResolved.filter(
      (m) => m.player_a_id === row.id || m.player_b_id === row.id
    )
    let streak = 0
    for (let i = playerMatches.length - 1; i >= 0; i--) {
      const m = playerMatches[i]
      const won = m.winner_id === row.id
      if (streak === 0) {
        streak = won ? 1 : -1
      } else if ((streak > 0 && won) || (streak < 0 && !won)) {
        streak += won ? 1 : -1
      } else {
        break
      }
    }
    row.streak = streak
  }

  return [...map.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.winrate !== a.winrate) return b.winrate - a.winrate
    return a.username.localeCompare(b.username)
  })
}

function streakLabel(streak: number) {
  if (Math.abs(streak) < 2) return null
  const count = Math.abs(streak)
  const isWin = streak > 0
  return (
    <span
      className={cn(
        'text-[10px] font-black px-1 py-0.5 rounded tracking-wide',
        isWin
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      )}
    >
      {isWin ? `W${count}` : `L${count}`}
    </span>
  )
}

// ─── Rank indicator (no emojis) ────────────────────────────────────────────────

function StandingsRank({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950">
        1
      </span>
    )
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 dark:from-slate-500 dark:to-slate-600 dark:text-slate-100">
        2
      </span>
    )
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black bg-gradient-to-br from-orange-300 to-amber-400 text-orange-950 dark:from-orange-600 dark:to-amber-700 dark:text-orange-100">
        3
      </span>
    )
  return (
    <span className="text-xs text-muted-foreground tabular-nums font-medium w-5 text-center">
      {rank}
    </span>
  )
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Match['status'] }) {
  const cfg = {
    pending:        { label: 'Pendiente', icon: Clock,         cls: 'text-amber-700 bg-amber-50 border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/60' },
    validated:      { label: 'Validado',  icon: CheckCircle2,  cls: 'text-green-700 bg-green-50 border-green-200/80 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/60' },
    disputed:       { label: 'Disputado', icon: AlertCircle,   cls: 'text-red-700 bg-red-50 border-red-200/80 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/60' },
    voided:         { label: 'Anulado',   icon: Ban,           cls: 'text-muted-foreground bg-muted/60 border-border/60' },
    admin_resolved: { label: 'Resuelto',  icon: Shield,        cls: 'text-blue-700 bg-blue-50 border-blue-200/80 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/60' },
  } as const

  const { label, icon: Icon, cls } = cfg[status]
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold', cls)}>
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  )
}

// ─── Vote dots ─────────────────────────────────────────────────────────────────

function VoteDots({ voteA, voteB }: { voteA: Match['vote_a']; voteB: Match['vote_b'] }) {
  return (
    <span className="flex gap-0.5" title={`${voteA ? 'A voted' : 'A pending'} / ${voteB ? 'B voted' : 'B pending'}`}>
      <span className={cn('w-1.5 h-1.5 rounded-full', voteA ? 'bg-foreground' : 'bg-muted-foreground/25')} />
      <span className={cn('w-1.5 h-1.5 rounded-full', voteB ? 'bg-foreground' : 'bg-muted-foreground/25')} />
    </span>
  )
}

// ─── Match card ────────────────────────────────────────────────────────────────

function MatchCard({
  match,
  playerA,
  playerB,
  currentUserId,
}: {
  match: Match
  playerA: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  playerB: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  currentUserId: string | null
}) {
  const isParticipant =
    currentUserId === match.player_a_id || currentUserId === match.player_b_id
  const isResolved =
    match.status === 'validated' || match.status === 'admin_resolved'
  const winnerName =
    match.winner_id === playerA.id
      ? playerA.username
      : match.winner_id === playerB.id
      ? playerB.username
      : null

  return (
    <Link
      href={`/match/${match.id}`}
      className={cn(
        'block rounded-xl border p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-px',
        isParticipant && match.status === 'pending'
          ? 'border-amber-300/60 bg-amber-50/40 dark:border-amber-700/40 dark:bg-amber-950/20 shadow-sm'
          : match.status === 'disputed'
          ? 'border-red-300/60 bg-red-50/25 dark:border-red-800/40 dark:bg-red-950/12'
          : 'bg-card/80 border-border/50 hover:border-border'
      )}
    >
      {/* Players row */}
      <div className="flex items-center gap-2">
        {/* Player A */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Avatar className="h-6 w-6 shrink-0 ring-1 ring-border/40">
            <AvatarImage src={playerA.avatar_url ?? undefined} />
            <AvatarFallback className="text-[9px] font-bold">
              {playerA.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              'text-sm font-semibold truncate',
              match.winner_id === playerA.id
                ? 'text-green-600 dark:text-green-400'
                : isResolved && match.winner_id !== null
                ? 'text-muted-foreground/60 line-through decoration-1'
                : ''
            )}
          >
            {playerA.username}
          </span>
        </div>

        {/* VS / result */}
        <div className="flex flex-col items-center shrink-0 w-14">
          <span className="text-[9px] font-black text-muted-foreground/60 tracking-[0.2em]">
            {isResolved ? 'FIN' : 'VS'}
          </span>
          {match.status === 'pending' && (
            <VoteDots voteA={match.vote_a} voteB={match.vote_b} />
          )}
        </div>

        {/* Player B */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span
            className={cn(
              'text-sm font-semibold truncate text-right',
              match.winner_id === playerB.id
                ? 'text-green-600 dark:text-green-400'
                : isResolved && match.winner_id !== null
                ? 'text-muted-foreground/60 line-through decoration-1'
                : ''
            )}
          >
            {playerB.username}
          </span>
          <Avatar className="h-6 w-6 shrink-0 ring-1 ring-border/40">
            <AvatarImage src={playerB.avatar_url ?? undefined} />
            <AvatarFallback className="text-[9px] font-bold">
              {playerB.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-2">
        <StatusBadge status={match.status} />
        {isParticipant && match.status === 'pending' && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold tracking-wide">
            TU TURNO
          </span>
        )}
      </div>
    </Link>
  )
}

// ─── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const isComplete = pct === 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-wide text-[10px]">
          Progreso de la liga
        </span>
        <div className="flex items-center gap-2">
          <span>{done} / {total} partidas resueltas</span>
          <span className={cn(
            'font-black tabular-nums text-sm',
            isComplete ? 'text-green-600 dark:text-green-400' : 'text-foreground'
          )}>
            {pct}%
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            isComplete
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : 'bg-gradient-to-r from-amber-400 to-amber-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function LeaguePage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: leagueData } = await supabase
    .from('leagues')
    .select('*')
    .eq('status', 'active')
    .single()

  const league = leagueData as League | null

  if (!league) {
    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Swords className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Liga Activa</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-10.5">Clasificación y partidas de la ronda actual</p>
        </div>
        <Card>
          <CardContent className="py-16 text-center space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">Sin liga activa</p>
            <p className="text-xs text-muted-foreground">
              El admin iniciará una nueva liga cuando todos estén listos.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: matchesRaw } = await supabase
    .from('matches')
    .select('*')
    .eq('league_id', league.id)
    .order('created_at', { ascending: true })

  const matches = (matchesRaw ?? []) as Match[]

  const playerIds = [
    ...new Set(matches.flatMap((m) => [m.player_a_id, m.player_b_id])),
  ]

  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', playerIds)

  const profiles = (profilesRaw ?? []) as Pick<Profile, 'id' | 'username' | 'avatar_url'>[]
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  const standings = computeStandings(matches, profiles)

  const resolvedCount = matches.filter(
    (m) => m.status === 'validated' || m.status === 'admin_resolved' || m.status === 'voided'
  ).length
  const totalCount = matches.length

  const pending = matches.filter((m) => m.status === 'pending')
  const disputed = matches.filter((m) => m.status === 'disputed')
  const done = matches.filter(
    (m) => m.status === 'validated' || m.status === 'admin_resolved'
  )
  const voided = matches.filter((m) => m.status === 'voided')

  const currentUserId = authUser?.id ?? null

  const myPendingMatches = pending.filter(
    (m) => m.player_a_id === currentUserId || m.player_b_id === currentUserId
  )

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-500/25">
              <Swords className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">{league.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-10.5">
            Liga activa · iniciada el{' '}
            {new Date(league.created_at).toLocaleDateString('es-ES', {
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Trophy className="h-7 w-7 text-amber-400/50 dark:text-amber-500/40 shrink-0 mt-1" />
      </div>

      {/* ── Progress bar ── */}
      <ProgressBar done={resolvedCount} total={totalCount} />

      {/* ── Main grid: standings + matches ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">

        {/* Left: Standings */}
        <Card className="self-start overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold">Clasificación</CardTitle>
            <CardDescription className="text-xs">Solo esta liga</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 text-center pl-3 text-[10px] font-black uppercase tracking-wide text-muted-foreground/60">#</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wide text-muted-foreground/60">Jugador</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-wide text-muted-foreground/60">Pts</TableHead>
                  <TableHead className="text-right pr-3 text-[10px] font-black uppercase tracking-wide text-muted-foreground/60">V-D</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((row, i) => {
                  const rank = i + 1
                  const isMe = row.id === currentUserId
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        'transition-colors border-border/30',
                        isMe && 'bg-blue-50/40 dark:bg-blue-950/15',
                        rank === 1 && 'bg-amber-50/50 dark:bg-amber-950/15',
                      )}
                    >
                      <TableCell className="text-center pl-3">
                        <StandingsRank rank={rank} />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/profile/${row.id}`}
                          className="flex items-center gap-1.5 group w-fit"
                        >
                          <Avatar className="h-5 w-5 shrink-0">
                            <AvatarImage src={row.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[8px] font-bold">
                              {row.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-xs font-semibold truncate group-hover:underline underline-offset-4">
                              {row.username}
                            </span>
                            {streakLabel(row.streak)}
                            {isMe && (
                              <span className="text-[9px] text-muted-foreground/50 font-medium">(tú)</span>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-black tabular-nums text-sm">
                        {row.points}
                      </TableCell>
                      <TableCell className="text-right pr-3 tabular-nums text-xs">
                        <span className="text-green-600 dark:text-green-400 font-semibold">{row.wins}</span>
                        <span className="text-muted-foreground/40 mx-0.5">-</span>
                        <span className="text-red-500 dark:text-red-400 font-semibold">{row.losses}</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right: Match groups */}
        <div className="space-y-5">

          {/* Your pending matches */}
          {myPendingMatches.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.18em] flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Esperando tu voto
              </p>
              {myPendingMatches.map((m) => {
                const pA = profileMap.get(m.player_a_id)
                const pB = profileMap.get(m.player_b_id)
                if (!pA || !pB) return null
                return (
                  <MatchCard key={m.id} match={m} playerA={pA} playerB={pB} currentUserId={currentUserId} />
                )
              })}
              <Separator className="mt-1 opacity-50" />
            </div>
          )}

          {/* Disputed */}
          {disputed.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.18em]">
                Disputados — Revisión admin
              </p>
              {disputed.map((m) => {
                const pA = profileMap.get(m.player_a_id)
                const pB = profileMap.get(m.player_b_id)
                if (!pA || !pB) return null
                return (
                  <MatchCard key={m.id} match={m} playerA={pA} playerB={pB} currentUserId={currentUserId} />
                )
              })}
              <Separator className="mt-1 opacity-50" />
            </div>
          )}

          {/* All pending (not mine) */}
          {pending.filter((m) => !myPendingMatches.includes(m)).length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.18em]">
                Pendientes ({pending.length})
              </p>
              {pending
                .filter((m) => !myPendingMatches.includes(m))
                .map((m) => {
                  const pA = profileMap.get(m.player_a_id)
                  const pB = profileMap.get(m.player_b_id)
                  if (!pA || !pB) return null
                  return (
                    <MatchCard key={m.id} match={m} playerA={pA} playerB={pB} currentUserId={currentUserId} />
                  )
                })}
            </div>
          )}

          {/* Resolved */}
          {done.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.18em]">
                Completados ({done.length})
              </p>
              {done.map((m) => {
                const pA = profileMap.get(m.player_a_id)
                const pB = profileMap.get(m.player_b_id)
                if (!pA || !pB) return null
                return (
                  <MatchCard key={m.id} match={m} playerA={pA} playerB={pB} currentUserId={currentUserId} />
                )
              })}
            </div>
          )}

          {/* Voided */}
          {voided.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.18em]">
                Anulados ({voided.length})
              </p>
              {voided.map((m) => {
                const pA = profileMap.get(m.player_a_id)
                const pB = profileMap.get(m.player_b_id)
                if (!pA || !pB) return null
                return (
                  <MatchCard key={m.id} match={m} playerA={pA} playerB={pB} currentUserId={currentUserId} />
                )
              })}
            </div>
          )}

          {matches.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">Sin partidas generadas aún.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
