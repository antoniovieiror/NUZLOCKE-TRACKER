import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import type { LeaderboardEntry, Match, Profile } from '@/lib/types'

import { ArenaHero } from './_components/arena-hero'
import { TeamsUsed } from './_components/teams-used'
import { RivalryTimeline } from './_components/rivalry-timeline'
import { VoteCard } from './_components/vote-card'
import { AdminControls } from './_components/admin-controls'
import './match.css'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: matchRaw }, { data: { user: authUser } }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (!matchRaw) notFound()
  const match = matchRaw as Match

  // Parallel: profiles + leaderboard + league + all-league-matches + pair-history
  const [
    { data: profilesRaw },
    { data: leaderboardRaw },
    { data: leagueRaw },
    { data: leagueMatchesRaw },
    { data: pairMatchesRaw },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, avatar_url, role')
      .in('id', [match.player_a_id, match.player_b_id]),
    supabase.from('leaderboard').select('*'),
    supabase.from('leagues').select('id, title, status, active_match_id').eq('id', match.league_id).single(),
    supabase
      .from('matches')
      .select('id, created_at')
      .eq('league_id', match.league_id)
      .order('created_at', { ascending: true }),
    supabase
      .from('matches')
      .select('id, status, winner_id, player_a_id, player_b_id, created_at, league_id')
      .or(`and(player_a_id.eq.${match.player_a_id},player_b_id.eq.${match.player_b_id}),and(player_a_id.eq.${match.player_b_id},player_b_id.eq.${match.player_a_id})`)
      .order('created_at', { ascending: true }),
  ])

  const profiles = (profilesRaw ?? []) as Pick<Profile, 'id' | 'username' | 'avatar_url' | 'role'>[]
  const playerA = profiles.find((p) => p.id === match.player_a_id)
  const playerB = profiles.find((p) => p.id === match.player_b_id)
  if (!playerA || !playerB) notFound()

  const currentUserId = authUser?.id ?? null

  // Resolve admin status
  let isAdmin = false
  if (authUser) {
    const me = profiles.find((p) => p.id === authUser.id)
    if (me?.role === 'admin') {
      isAdmin = true
    } else {
      const { data: adminCheck } = await supabase.from('profiles').select('role').eq('id', authUser.id).single()
      isAdmin = adminCheck?.role === 'admin'
    }
  }

  // Derive rank per player from the global leaderboard (already sorted by the view)
  const leaderboard = (leaderboardRaw ?? []) as LeaderboardEntry[]
  const lookup = new Map<string, { entry: LeaderboardEntry; rank: number }>()
  leaderboard.forEach((entry, idx) => lookup.set(entry.id, { entry, rank: idx + 1 }))

  const aStats = lookup.get(playerA.id)
  const bStats = lookup.get(playerB.id)

  const playerAEnriched = {
    id: playerA.id,
    username: playerA.username,
    avatar_url: playerA.avatar_url,
    rank: aStats?.rank ?? null,
    points: aStats?.entry.total_points ?? null,
    wins: aStats?.entry.total_wins ?? null,
    losses: aStats?.entry.total_losses ?? null,
    winrate: aStats?.entry.winrate ?? null,
  }
  const playerBEnriched = {
    id: playerB.id,
    username: playerB.username,
    avatar_url: playerB.avatar_url,
    rank: bStats?.rank ?? null,
    points: bStats?.entry.total_points ?? null,
    wins: bStats?.entry.total_wins ?? null,
    losses: bStats?.entry.total_losses ?? null,
    winrate: bStats?.entry.winrate ?? null,
  }

  // Derive "Round X of N" within the league
  const leagueMatches = (leagueMatchesRaw ?? []) as { id: string; created_at: string }[]
  const matchIndex = leagueMatches.findIndex((m) => m.id === match.id)
  const matchTotal = leagueMatches.length || null
  const displayIndex = matchIndex >= 0 ? matchIndex + 1 : null

  // Rivalry entries
  const pairMatches = (pairMatchesRaw ?? []) as Pick<Match, 'id' | 'status' | 'winner_id' | 'player_a_id' | 'player_b_id' | 'created_at' | 'league_id'>[]
  // Attach league titles if available — small N, quick per-match fetch not needed since we have league_id.
  // For the timeline we'll just show league title for the current league; others use "Liga".
  const rivalryEntries = pairMatches.map((m) => ({
    id: m.id,
    status: m.status,
    winnerId: m.winner_id,
    playerAId: m.player_a_id,
    playerBId: m.player_b_id,
    createdAt: m.created_at,
    leagueTitle: m.league_id === leagueRaw?.id ? leagueRaw?.title ?? null : null,
  }))

  // Double-blind vote derivation
  const isPlayerA = currentUserId === playerA.id
  const isPlayerB = currentUserId === playerB.id
  const isResolved = match.status === 'validated' || match.status === 'admin_resolved'

  let myVote = null
  let otherVoted = false
  if (isPlayerA) { myVote = match.vote_a; otherVoted = !!match.vote_b }
  else if (isPlayerB) { myVote = match.vote_b; otherVoted = !!match.vote_a }
  else if (isAdmin || isResolved) { myVote = null; otherVoted = !!(match.vote_a || match.vote_b) }

  return (
    <div className="mv-root max-w-2xl mx-auto space-y-4 pb-12">
      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors">Clasificación</Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-40" />
        {leagueRaw?.status === 'active' ? (
          <Link href="/league" className="hover:text-foreground transition-colors">{leagueRaw.title}</Link>
        ) : (
          <Link href="/history" className="hover:text-foreground transition-colors">{leagueRaw?.title ?? 'Liga'}</Link>
        )}
        <ChevronRight className="h-3.5 w-3.5 opacity-40" />
        <span className="text-foreground font-semibold">Partida</span>
      </nav>

      {/* ── Arena hero ─────────────────────────────────────────── */}
      <ArenaHero
        leagueTitle={leagueRaw?.title ?? null}
        matchIndex={displayIndex}
        matchTotal={matchTotal}
        playerA={playerAEnriched}
        playerB={playerBEnriched}
        winnerId={match.winner_id}
        status={match.status}
      />

      {/* ── Teams used (snapshot at activation) ────────────────── */}
      <TeamsUsed
        playerA={{ username: playerA.username }}
        playerB={{ username: playerB.username }}
        teamA={match.team_a_snapshot}
        teamB={match.team_b_snapshot}
        mvpA={match.mvp_a_snapshot}
        mvpB={match.mvp_b_snapshot}
      />

      {/* ── Rivalry timeline ───────────────────────────────────── */}
      <RivalryTimeline
        entries={rivalryEntries}
        currentMatchId={match.id}
        playerA={{ id: playerA.id, username: playerA.username }}
        playerB={{ id: playerB.id, username: playerB.username }}
      />

      {/* ── Battle decision + replay ───────────────────────────── */}
      {currentUserId && (
        <VoteCard
          matchId={match.id}
          status={match.status}
          currentUserId={currentUserId}
          playerAId={playerA.id}
          playerBId={playerB.id}
          playerAUsername={playerA.username}
          playerBUsername={playerB.username}
          playerAAvatar={playerA.avatar_url}
          playerBAvatar={playerB.avatar_url}
          myVote={myVote}
          otherVoted={otherVoted}
          replayUrl={match.replay_url}
          winnerId={match.winner_id}
        />
      )}

      {/* ── Admin controls ─────────────────────────────────────── */}
      {isAdmin && (
        <AdminControls
          matchId={match.id}
          status={match.status}
          playerAId={playerA.id}
          playerBId={playerB.id}
          playerAUsername={playerA.username}
          playerBUsername={playerB.username}
          isActiveDuel={leagueRaw?.active_match_id === match.id}
        />
      )}
    </div>
  )
}
