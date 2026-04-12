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
  streak: number          // positive = win streak, negative = loss streak
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

  // Only count validated / admin_resolved for points; voided = skip
  const resolved = matches.filter(
    (m) => m.status === 'validated' || m.status === 'admin_resolved'
  )

  for (const m of resolved) {
    if (!m.winner_id) continue
    const loserId =
      m.winner_id === m.player_a_id ? m.player_b_id : m.player_a_id

    const winner = map.get(m.winner_id)
    const loser = map.get(loserId)

    if (winner) {
      winner.points += 2
      winner.wins += 1
      winner.matchesPlayed += 1
    }
    if (loser) {
      loser.losses += 1
      loser.matchesPlayed += 1
    }
  }

  // Winrate
  for (const row of map.values()) {
    row.winrate =
      row.matchesPlayed > 0
        ? Math.round((row.wins / row.matchesPlayed) * 1000) / 10
        : 0
  }

  // Streak: look at each player's last N resolved matches in chrono order
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
        'text-[10px] font-bold px-1 py-0.5 rounded',
        isWin
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      )}
    >
      {isWin ? `W${count}` : `L${count}`}
    </span>
  )
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Match['status'] }) {
  const cfg = {
    pending:        { label: 'Pending',   icon: Clock,         cls: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
    validated:      { label: 'Done',      icon: CheckCircle2,  cls: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' },
    disputed:       { label: 'Disputed',  icon: AlertCircle,   cls: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' },
    voided:         { label: 'Voided',    icon: Ban,           cls: 'text-muted-foreground bg-muted border-border' },
    admin_resolved: { label: 'Resolved',  icon: Shield,        cls: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' },
  } as const

  const { label, icon: Icon, cls } = cfg[status]
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[11px] font-medium', cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

// ─── Vote dots ─────────────────────────────────────────────────────────────────

function VoteDots({ voteA, voteB }: { voteA: Match['vote_a']; voteB: Match['vote_b'] }) {
  return (
    <span className="flex gap-0.5" title={`${voteA ? 'A voted' : 'A pending'} / ${voteB ? 'B voted' : 'B pending'}`}>
      <span className={cn('w-2 h-2 rounded-full', voteA ? 'bg-foreground' : 'bg-muted-foreground/30')} />
      <span className={cn('w-2 h-2 rounded-full', voteB ? 'bg-foreground' : 'bg-muted-foreground/30')} />
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
          ? 'border-amber-300/70 bg-amber-50/50 dark:border-amber-700/50 dark:bg-amber-950/25 shadow-sm shadow-amber-100 dark:shadow-amber-900/20'
          : 'bg-card/80 hover:border-foreground/15',
        match.status === 'disputed' && 'border-red-300/70 bg-red-50/30 dark:border-red-800/50 dark:bg-red-950/15'
      )}
    >
      {/* Players row */}
      <div className="flex items-center gap-2">
        {/* Player A */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={playerA.avatar_url ?? undefined} />
            <AvatarFallback className="text-[10px]">
              {playerA.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              'text-sm font-medium truncate',
              match.winner_id === playerA.id && 'text-green-600 dark:text-green-400'
            )}
          >
            {playerA.username}
          </span>
        </div>

        {/* VS / result */}
        <div className="flex flex-col items-center shrink-0 w-16">
          <span className="text-[10px] font-bold text-muted-foreground tracking-widest">
            {isResolved ? (winnerName ? 'WIN' : 'VOID') : 'VS'}
          </span>
          {match.status === 'pending' && (
            <VoteDots voteA={match.vote_a} voteB={match.vote_b} />
          )}
        </div>

        {/* Player B */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span
            className={cn(
              'text-sm font-medium truncate text-right',
              match.winner_id === playerB.id && 'text-green-600 dark:text-green-400'
            )}
          >
            {playerB.username}
          </span>
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={playerB.avatar_url ?? undefined} />
            <AvatarFallback className="text-[10px]">
              {playerB.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-2">
        <StatusBadge status={match.status} />
        {isParticipant && match.status === 'pending' && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            Your match
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
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="font-medium">
          {done} / {total} matches resolved
        </span>
        <span className={cn('font-semibold tabular-nums', isComplete ? 'text-green-600 dark:text-green-400' : '')}>
          {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted/60 overflow-hidden shadow-inner">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            isComplete
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-sm shadow-green-400/40'
              : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 shadow-sm shadow-amber-400/30'
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

  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // Fetch active league
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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Swords className="h-6 w-6 text-muted-foreground shrink-0" />
            Active League
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Current round standings and matches</p>
        </div>
        <Card>
          <CardContent className="py-16 text-center space-y-1">
            <p className="text-sm font-medium text-muted-foreground">No active league</p>
            <p className="text-xs text-muted-foreground">
              The admin will start a new league when everyone is ready.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch all matches for this league
  const { data: matchesRaw } = await supabase
    .from('matches')
    .select('*')
    .eq('league_id', league.id)
    .order('created_at', { ascending: true })

  const matches = (matchesRaw ?? []) as Match[]

  // Collect unique player IDs
  const playerIds = [
    ...new Set(matches.flatMap((m) => [m.player_a_id, m.player_b_id])),
  ]

  // Fetch profiles for those players
  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', playerIds)

  const profiles = (profilesRaw ?? []) as Pick<Profile, 'id' | 'username' | 'avatar_url'>[]
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  // Compute standings
  const standings = computeStandings(matches, profiles)

  // Progress
  const resolvedCount = matches.filter(
    (m) => m.status === 'validated' || m.status === 'admin_resolved' || m.status === 'voided'
  ).length
  const totalCount = matches.length

  // Group matches by status for tabs
  const pending = matches.filter((m) => m.status === 'pending')
  const disputed = matches.filter((m) => m.status === 'disputed')
  const done = matches.filter(
    (m) => m.status === 'validated' || m.status === 'admin_resolved'
  )
  const voided = matches.filter((m) => m.status === 'voided')

  const currentUserId = authUser?.id ?? null

  // "Your matches" = current user's pending matches
  const myPendingMatches = pending.filter(
    (m) => m.player_a_id === currentUserId || m.player_b_id === currentUserId
  )

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Swords className="h-6 w-6 text-amber-500 shrink-0" />
            {league.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Active league · started{' '}
            {new Date(league.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Trophy className="h-8 w-8 text-amber-400/60 shrink-0 mt-1" />
      </div>

      {/* ── Progress bar ── */}
      <ProgressBar done={resolvedCount} total={totalCount} />

      {/* ── Main grid: standings + matches ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">

        {/* Left: Standings */}
        <Card className="self-start">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Standings</CardTitle>
            <CardDescription className="text-xs">This league only</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 text-center pl-4">#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Pts</TableHead>
                  <TableHead className="text-right pr-4">W-L</TableHead>
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
                        'transition-colors',
                        isMe && 'bg-primary/5',
                        rank === 1 && 'bg-amber-50/60 dark:bg-amber-950/20',
                      )}
                    >
                      <TableCell className="text-center pl-4 text-sm text-muted-foreground tabular-nums">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/profile/${row.id}`}
                          className="flex items-center gap-2 group w-fit"
                        >
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={row.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                              {row.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm font-medium truncate group-hover:underline underline-offset-4">
                              {row.username}
                            </span>
                            {streakLabel(row.streak)}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        {row.points}
                      </TableCell>
                      <TableCell className="text-right pr-4 tabular-nums text-sm text-muted-foreground">
                        <span className="text-green-600 dark:text-green-400">{row.wins}</span>
                        <span className="mx-0.5">-</span>
                        <span className="text-red-500 dark:text-red-400">{row.losses}</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right: Match groups */}
        <div className="space-y-4">

          {/* Your pending matches — highlighted */}
          {myPendingMatches.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Waiting for your vote
              </p>
              {myPendingMatches.map((m) => {
                const pA = profileMap.get(m.player_a_id)
                const pB = profileMap.get(m.player_b_id)
                if (!pA || !pB) return null
                return (
                  <MatchCard
                    key={m.id}
                    match={m}
                    playerA={pA}
                    playerB={pB}
                    currentUserId={currentUserId}
                  />
                )
              })}
              <Separator />
            </div>
          )}

          {/* Disputed */}
          {disputed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">
                Disputed — Admin review needed
              </p>
              {disputed.map((m) => {
                const pA = profileMap.get(m.player_a_id)
                const pB = profileMap.get(m.player_b_id)
                if (!pA || !pB) return null
                return (
                  <MatchCard
                    key={m.id}
                    match={m}
                    playerA={pA}
                    playerB={pB}
                    currentUserId={currentUserId}
                  />
                )
              })}
              <Separator />
            </div>
          )}

          {/* All pending (excluding "my" ones already shown above) */}
          {pending.filter((m) => !myPendingMatches.includes(m)).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Pending ({pending.length})
              </p>
              {pending
                .filter((m) => !myPendingMatches.includes(m))
                .map((m) => {
                  const pA = profileMap.get(m.player_a_id)
                  const pB = profileMap.get(m.player_b_id)
                  if (!pA || !pB) return null
                  return (
                    <MatchCard
                      key={m.id}
                      match={m}
                      playerA={pA}
                      playerB={pB}
                      currentUserId={currentUserId}
                    />
                  )
                })}
            </div>
          )}

          {/* Resolved */}
          {done.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Completed ({done.length})
              </p>
              {done.map((m) => {
                const pA = profileMap.get(m.player_a_id)
                const pB = profileMap.get(m.player_b_id)
                if (!pA || !pB) return null
                return (
                  <MatchCard
                    key={m.id}
                    match={m}
                    playerA={pA}
                    playerB={pB}
                    currentUserId={currentUserId}
                  />
                )
              })}
            </div>
          )}

          {/* Voided */}
          {voided.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Voided ({voided.length})
              </p>
              {voided.map((m) => {
                const pA = profileMap.get(m.player_a_id)
                const pB = profileMap.get(m.player_b_id)
                if (!pA || !pB) return null
                return (
                  <MatchCard
                    key={m.id}
                    match={m}
                    playerA={pA}
                    playerB={pB}
                    currentUserId={currentUserId}
                  />
                )
              })}
            </div>
          )}

          {matches.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No matches generated yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
