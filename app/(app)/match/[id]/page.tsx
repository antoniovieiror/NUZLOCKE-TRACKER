import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Swords } from 'lucide-react'

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
      <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <span>All-time head-to-head</span>
        <span>{aWins} — {bWins}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {total === 0 ? (
          <div className="flex-1 bg-muted rounded-full" />
        ) : (
          <>
            <div
              className="bg-blue-400 dark:bg-blue-500 transition-all"
              style={{ width: `${aPct}%` }}
            />
            <div
              className="bg-rose-400 dark:bg-rose-500 transition-all"
              style={{ width: `${bPct}%` }}
            />
          </>
        )}
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span className="text-blue-500">{aName} {total > 0 ? `${aPct}%` : ''}</span>
        <span className="text-rose-500">{total > 0 ? `${bPct}%` : ''} {bName}</span>
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
      <CardContent className="p-0">
        <div className="grid grid-cols-[1fr_auto_1fr]">

          {/* Player A */}
          <div
            className={cn(
              'relative flex flex-col items-center gap-2.5 p-6 overflow-hidden transition-all duration-300',
              aWon
                ? 'bg-gradient-to-br from-green-50 to-emerald-50/30 dark:from-green-950/30 dark:to-emerald-950/10'
                : isResolved && !aWon
                ? 'bg-muted/20 opacity-55'
                : 'bg-gradient-to-br from-blue-50/60 to-transparent dark:from-blue-950/20 dark:to-transparent'
            )}
          >
            {/* Subtle side glow */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className={cn(
                'absolute inset-0 opacity-0 transition-opacity duration-300',
                !isResolved && 'bg-gradient-to-r from-blue-400/5 to-transparent'
              )} />
            </div>

            <Avatar className={cn(
              'h-16 w-16 sm:h-20 sm:w-20 ring-2 transition-all duration-200',
              aWon
                ? 'ring-green-300 dark:ring-green-700 shadow-lg shadow-green-200/50 dark:shadow-green-900/30 scale-105'
                : 'ring-border/60'
            )}>
              <AvatarImage src={playerA.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {playerA.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Link
              href={`/profile/${playerA.id}`}
              className="relative font-semibold text-sm sm:text-base text-center hover:underline underline-offset-4 truncate max-w-[100px]"
            >
              {playerA.username}
            </Link>
            {aWon && (
              <span className="text-[11px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">
                ✦ Winner
              </span>
            )}
          </div>

          {/* Center divider */}
          <div className="flex flex-col items-center justify-center px-3 py-6 gap-1.5 bg-muted/30 dark:bg-muted/10 border-x border-border/40">
            <Swords className={cn(
              'h-5 w-5 transition-colors',
              isVoided ? 'text-muted-foreground/40' : 'text-muted-foreground'
            )} />
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest">
              {isVoided ? 'VOID' : isResolved ? 'FIN' : 'VS'}
            </span>
          </div>

          {/* Player B */}
          <div
            className={cn(
              'relative flex flex-col items-center gap-2.5 p-6 overflow-hidden transition-all duration-300',
              bWon
                ? 'bg-gradient-to-bl from-green-50 to-emerald-50/30 dark:from-green-950/30 dark:to-emerald-950/10'
                : isResolved && !bWon
                ? 'bg-muted/20 opacity-55'
                : 'bg-gradient-to-bl from-rose-50/60 to-transparent dark:from-rose-950/20 dark:to-transparent'
            )}
          >
            <Avatar className={cn(
              'h-16 w-16 sm:h-20 sm:w-20 ring-2 transition-all duration-200',
              bWon
                ? 'ring-green-300 dark:ring-green-700 shadow-lg shadow-green-200/50 dark:shadow-green-900/30 scale-105'
                : 'ring-border/60'
            )}>
              <AvatarImage src={playerB.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {playerB.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Link
              href={`/profile/${playerB.id}`}
              className="relative font-semibold text-sm sm:text-base text-center hover:underline underline-offset-4 truncate max-w-[100px]"
            >
              {playerB.username}
            </Link>
            {bWon && (
              <span className="text-[11px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">
                ✦ Winner
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

  // Current user + match in parallel
  const [{ data: matchRaw }, { data: { user: authUser } }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (!matchRaw) notFound()
  const match = matchRaw as Match

  // Fetch profiles for both players
  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role')
    .in('id', [match.player_a_id, match.player_b_id])

  const profiles = (profilesRaw ?? []) as Pick<Profile, 'id' | 'username' | 'avatar_url' | 'role'>[]
  const playerA = profiles.find((p) => p.id === match.player_a_id)
  const playerB = profiles.find((p) => p.id === match.player_b_id)
  if (!playerA || !playerB) notFound()

  // Current user info
  const currentUserId = authUser?.id ?? null

  let isAdmin = false
  if (authUser) {
    const me = profiles.find((p) => p.id === authUser.id)
    if (me?.role === 'admin') {
      isAdmin = true
    } else {
      // Admin might not be a participant — fetch separately
      const { data: adminCheck } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single()
      isAdmin = adminCheck?.role === 'admin'
    }
  }

  // Head-to-head: all matches between these two players across all leagues
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

  // Determine vote visibility (double-blind)
  const isPlayerA = currentUserId === playerA.id
  const isPlayerB = currentUserId === playerB.id
  const isParticipant = isPlayerA || isPlayerB
  const isResolved = match.status === 'validated' || match.status === 'admin_resolved'

  // My vote / other player voted (boolean)
  let myVote = null
  let otherVoted = false
  if (isPlayerA) {
    myVote = match.vote_a
    otherVoted = !!match.vote_b
  } else if (isPlayerB) {
    myVote = match.vote_b
    otherVoted = !!match.vote_a
  } else if (isAdmin || isResolved) {
    // Admin or resolved: can see both
    myVote = null
    otherVoted = !!(match.vote_a || match.vote_b)
  }

  // League title for breadcrumb
  const { data: leagueRaw } = await supabase
    .from('leagues')
    .select('id, title, status')
    .eq('id', match.league_id)
    .single()

  return (
    <div className="space-y-5 pb-10 max-w-xl mx-auto">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Leaderboard
        </Link>
        <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
        {leagueRaw?.status === 'active' ? (
          <Link href="/league" className="hover:text-foreground transition-colors">
            {leagueRaw.title}
          </Link>
        ) : (
          <Link href="/history" className="hover:text-foreground transition-colors">
            {leagueRaw?.title ?? 'League'}
          </Link>
        )}
        <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
        <span className="text-foreground font-medium">Match</span>
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

      <Separator />

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
        <div className="rounded-lg border p-4 text-sm text-muted-foreground text-center">
          Winner: <span className="font-semibold text-foreground">
            {match.winner_id === playerA.id ? playerA.username : playerB.username}
          </span>
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
