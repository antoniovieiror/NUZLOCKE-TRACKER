import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Swords } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import type { Match, Profile } from '@/lib/types'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { VoteCard } from './_components/vote-card'
import { AdminControls } from './_components/admin-controls'

// ─── Head-to-head record ───────────────────────────────────────────────────────

function H2HBar({
  aWins,
  bWins,
  aName,
  bName,
}: {
  aWins: number
  bWins: number
  aName: string
  bName: string
}) {
  const total = aWins + bWins
  const aPct = total === 0 ? 50 : Math.round((aWins / total) * 100)
  const bPct = 100 - aPct

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
          Historial H2H
        </p>
        <span className="text-xs font-bold tabular-nums text-muted-foreground">
          {aWins} — {bWins}
        </span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        {total === 0 ? (
          <div className="flex-1 bg-muted rounded-full" />
        ) : (
          <>
            <div
              className="bg-blue-400 dark:bg-blue-500 rounded-l-full transition-all duration-500"
              style={{ width: `${aPct}%` }}
            />
            <div
              className="bg-rose-400 dark:bg-rose-500 rounded-r-full transition-all duration-500"
              style={{ width: `${bPct}%` }}
            />
          </>
        )}
      </div>
      <div className="flex justify-between text-[11px] font-semibold">
        <span className="text-blue-500 dark:text-blue-400">{aName}{total > 0 ? ` ${aPct}%` : ''}</span>
        <span className="text-rose-500 dark:text-rose-400">{total > 0 ? `${bPct}% ` : ''}{bName}</span>
      </div>
    </div>
  )
}

// ─── VS hero card ──────────────────────────────────────────────────────────────

function VSHero({
  playerA,
  playerB,
  winnerId,
  status,
}: {
  playerA: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  playerB: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  winnerId: string | null
  status: Match['status']
}) {
  const isResolved = status === 'validated' || status === 'admin_resolved'
  const isVoided = status === 'voided'
  const aWon = isResolved && winnerId === playerA.id
  const bWon = isResolved && winnerId === playerB.id

  return (
    <Card className="overflow-hidden border-border/50 shadow-md">
      {/* Top accent bar */}
      <div className={cn(
        'h-0.5 w-full',
        isVoided
          ? 'bg-muted'
          : isResolved
          ? 'bg-gradient-to-r from-blue-400 via-green-400 to-rose-400'
          : 'bg-gradient-to-r from-blue-400 via-muted-foreground/30 to-rose-400'
      )} />
      <CardContent className="p-0">
        <div className="grid grid-cols-[1fr_auto_1fr]">

          {/* Player A */}
          <div
            className={cn(
              'relative flex flex-col items-center gap-3 p-6 overflow-hidden transition-all duration-300',
              aWon
                ? 'bg-gradient-to-br from-green-50/80 to-emerald-50/20 dark:from-green-950/25 dark:to-transparent'
                : isResolved && !aWon
                ? 'bg-muted/15 opacity-50'
                : 'bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/15 dark:to-transparent'
            )}
          >
            <Avatar className={cn(
              'h-16 w-16 sm:h-20 sm:w-20 ring-2 transition-all duration-200',
              aWon
                ? 'ring-green-300 dark:ring-green-700 shadow-lg shadow-green-200/50 dark:shadow-green-900/30 scale-105'
                : 'ring-border/50'
            )}>
              <AvatarImage src={playerA.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl font-black bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {playerA.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Link
              href={`/profile/${playerA.id}`}
              className="font-bold text-sm sm:text-base text-center hover:underline underline-offset-4 truncate max-w-[100px]"
            >
              {playerA.username}
            </Link>
            {aWon && (
              <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.18em]">
                Ganador
              </span>
            )}
          </div>

          {/* Center divider */}
          <div className="flex flex-col items-center justify-center px-4 py-6 gap-2 border-x border-border/40 bg-muted/20 dark:bg-muted/10">
            <Swords className={cn(
              'h-5 w-5 transition-colors',
              isVoided ? 'text-muted-foreground/30' : 'text-muted-foreground/70'
            )} strokeWidth={1.5} />
            <span className="text-[9px] font-black text-muted-foreground/60 tracking-[0.25em]">
              {isVoided ? 'VOID' : isResolved ? 'FIN' : 'VS'}
            </span>
          </div>

          {/* Player B */}
          <div
            className={cn(
              'relative flex flex-col items-center gap-3 p-6 overflow-hidden transition-all duration-300',
              bWon
                ? 'bg-gradient-to-bl from-green-50/80 to-emerald-50/20 dark:from-green-950/25 dark:to-transparent'
                : isResolved && !bWon
                ? 'bg-muted/15 opacity-50'
                : 'bg-gradient-to-bl from-rose-50/50 to-transparent dark:from-rose-950/15 dark:to-transparent'
            )}
          >
            <Avatar className={cn(
              'h-16 w-16 sm:h-20 sm:w-20 ring-2 transition-all duration-200',
              bWon
                ? 'ring-green-300 dark:ring-green-700 shadow-lg shadow-green-200/50 dark:shadow-green-900/30 scale-105'
                : 'ring-border/50'
            )}>
              <AvatarImage src={playerB.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl font-black bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {playerB.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Link
              href={`/profile/${playerB.id}`}
              className="font-bold text-sm sm:text-base text-center hover:underline underline-offset-4 truncate max-w-[100px]"
            >
              {playerB.username}
            </Link>
            {bWon && (
              <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.18em]">
                Ganador
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: matchRaw }, { data: { user: authUser } }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (!matchRaw) notFound()
  const match = matchRaw as Match

  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role')
    .in('id', [match.player_a_id, match.player_b_id])

  const profiles = (profilesRaw ?? []) as Pick<Profile, 'id' | 'username' | 'avatar_url' | 'role'>[]
  const playerA = profiles.find((p) => p.id === match.player_a_id)
  const playerB = profiles.find((p) => p.id === match.player_b_id)
  if (!playerA || !playerB) notFound()

  const currentUserId = authUser?.id ?? null

  let isAdmin = false
  if (authUser) {
    const me = profiles.find((p) => p.id === authUser.id)
    if (me?.role === 'admin') {
      isAdmin = true
    } else {
      const { data: adminCheck } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single()
      isAdmin = adminCheck?.role === 'admin'
    }
  }

  const { data: allMatchesRaw } = await supabase
    .from('matches')
    .select('winner_id, player_a_id, player_b_id, status')
    .or(
      `and(player_a_id.eq.${playerA.id},player_b_id.eq.${playerB.id}),and(player_a_id.eq.${playerB.id},player_b_id.eq.${playerA.id})`
    )

  const allMatches = (allMatchesRaw ?? []) as Pick<
    Match,
    'winner_id' | 'player_a_id' | 'player_b_id' | 'status'
  >[]

  const h2h = allMatches.reduce(
    (acc, m) => {
      if (m.status !== 'validated' && m.status !== 'admin_resolved') return acc
      if (m.winner_id === playerA.id) acc.aWins++
      else if (m.winner_id === playerB.id) acc.bWins++
      return acc
    },
    { aWins: 0, bWins: 0 }
  )

  const isPlayerA = currentUserId === playerA.id
  const isPlayerB = currentUserId === playerB.id
  const isParticipant = isPlayerA || isPlayerB
  const isResolved = match.status === 'validated' || match.status === 'admin_resolved'

  let myVote = null
  let otherVoted = false
  if (isPlayerA) {
    myVote = match.vote_a
    otherVoted = !!match.vote_b
  } else if (isPlayerB) {
    myVote = match.vote_b
    otherVoted = !!match.vote_a
  } else if (isAdmin || isResolved) {
    myVote = null
    otherVoted = !!(match.vote_a || match.vote_b)
  }

  const { data: leagueRaw } = await supabase
    .from('leagues')
    .select('id, title, status')
    .eq('id', match.league_id)
    .single()

  return (
    <div className="space-y-5 pb-10 max-w-xl mx-auto">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Clasificación
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-40" />
        {leagueRaw?.status === 'active' ? (
          <Link href="/league" className="hover:text-foreground transition-colors">
            {leagueRaw.title}
          </Link>
        ) : (
          <Link href="/history" className="hover:text-foreground transition-colors">
            {leagueRaw?.title ?? 'Liga'}
          </Link>
        )}
        <ChevronRight className="h-3.5 w-3.5 opacity-40" />
        <span className="text-foreground font-semibold">Partida</span>
      </div>

      {/* ── VS Hero ── */}
      <VSHero
        playerA={playerA}
        playerB={playerB}
        winnerId={match.winner_id}
        status={match.status}
      />

      {/* ── Head-to-head ── */}
      <H2HBar
        aWins={h2h.aWins}
        bWins={h2h.bWins}
        aName={playerA.username}
        bName={playerB.username}
      />

      <Separator className="opacity-50" />

      {/* ── Vote card ── */}
      {currentUserId && (
        <VoteCard
          matchId={match.id}
          status={match.status}
          currentUserId={currentUserId}
          playerAId={playerA.id}
          playerBId={playerB.id}
          playerAUsername={playerA.username}
          playerBUsername={playerB.username}
          myVote={myVote}
          otherVoted={otherVoted}
          replayUrl={match.replay_url}
          winnerId={match.winner_id}
        />
      )}

      {!currentUserId && isResolved && (
        <div className="rounded-xl border border-border/50 bg-card p-5 text-sm text-center">
          <p className="text-muted-foreground">Ganador</p>
          <p className="font-black text-lg mt-0.5">
            {match.winner_id === playerA.id ? playerA.username : playerB.username}
          </p>
        </div>
      )}

      {/* ── Admin controls ── */}
      {isAdmin && (
        <AdminControls
          matchId={match.id}
          status={match.status}
          playerAId={playerA.id}
          playerBId={playerB.id}
          playerAUsername={playerA.username}
          playerBUsername={playerB.username}
        />
      )}
    </div>
  )
}
