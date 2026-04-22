import { createClient } from '@/lib/supabase/server'
import type { League, Match, Profile } from '@/lib/types'

import {
  LeagueHero,
  Leaderboard,
  CurrentMatch,
  MatchArchive,
  type PlayerRow,
} from './_components/league-sections'
import './league.css'

// ─── Standings computation ────────────────────────────────────────

function computeStandings(
  matches: Match[],
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url'>[],
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
      matchesPlayed: 0,
    })
  }

  const resolved = matches.filter(
    (m) => m.status === 'validated' || m.status === 'admin_resolved',
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

  for (const row of map.values()) {
    row.winrate =
      row.matchesPlayed > 0
        ? Math.round((row.wins / row.matchesPlayed) * 1000) / 10
        : 0
  }

  return [...map.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.winrate !== a.winrate) return b.winrate - a.winrate
    return a.username.localeCompare(b.username)
  })
}

// ─── Page ─────────────────────────────────────────────────────────

export default async function LeaguePage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  const currentUserId = authUser?.id ?? null

  const { data: leagueData } = await supabase
    .from('leagues')
    .select('*')
    .eq('status', 'active')
    .single()

  const league = leagueData as League | null

  if (!league) {
    return (
      <>
        <div className="lc-scene" />
        <div className="league-console relative z-10">
          <div className="lc-console">
            <span className="lc-rivet tl" />
            <span className="lc-rivet tr" />
            <span className="lc-rivet bl" />
            <span className="lc-rivet br" />
            <span className="lc-stripes tl" />
            <span className="lc-stripes tr" />
            <span className="lc-stripes bl" />
            <span className="lc-stripes br" />
            <div className="lc-console-inner">
              <div className="lc-page">
                <LeagueHero
                  title="Sin Liga Activa"
                  startedAt={null}
                  totalMatches={0}
                  resolvedMatches={0}
                  inactive
                />
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 13,
                    color: 'var(--lc-ink-muted)',
                  }}
                >
                  El admin iniciará una nueva liga cuando todos estén listos.
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Fetch matches + player profiles ─────────────────────────────
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

  const profiles = (profilesRaw ?? []) as Pick<
    Profile,
    'id' | 'username' | 'avatar_url'
  >[]
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  // ── Derived data ────────────────────────────────────────────────
  const standings = computeStandings(matches, profiles)
  const standingsMap = new Map(standings.map((s) => [s.id, s]))

  const resolvedCount = matches.filter(
    (m) =>
      m.status === 'validated' ||
      m.status === 'admin_resolved' ||
      m.status === 'voided',
  ).length

  const pending = matches.filter((m) => m.status === 'pending')
  const disputed = matches.filter((m) => m.status === 'disputed')
  const done = matches.filter(
    (m) => m.status === 'validated' || m.status === 'admin_resolved',
  )
  const voided = matches.filter((m) => m.status === 'voided')

  const myPending = pending.filter(
    (m) =>
      m.player_a_id === currentUserId || m.player_b_id === currentUserId,
  )
  const otherPending = pending.filter((m) => !myPending.includes(m))

  // Pick the featured (current) match — prioritise user involvement.
  // Disputed matches live in the archive (admin review), so they're
  // excluded from the rotating active-duel slot.
  const featured: Match | null = myPending[0] ?? otherPending[0] ?? null

  const featuredA = featured ? profileMap.get(featured.player_a_id) ?? null : null
  const featuredB = featured ? profileMap.get(featured.player_b_id) ?? null : null
  const featuredAStats = featured ? standingsMap.get(featured.player_a_id) : undefined
  const featuredBStats = featured ? standingsMap.get(featured.player_b_id) : undefined

  return (
    <>
      <div className="lc-scene" />
      <div className="league-console relative z-10">
        <div className="lc-console">
          <span className="lc-rivet tl" />
          <span className="lc-rivet tr" />
          <span className="lc-rivet bl" />
          <span className="lc-rivet br" />
          <span className="lc-stripes tl" />
          <span className="lc-stripes tr" />
          <span className="lc-stripes bl" />
          <span className="lc-stripes br" />

          <div className="lc-console-inner">
            <div className="lc-page">
              <LeagueHero
                title={league.title}
                startedAt={league.created_at}
                totalMatches={matches.length}
                resolvedMatches={resolvedCount}
              />

              <Leaderboard
                standings={standings}
                currentUserId={currentUserId}
              />

              <CurrentMatch
                match={featured}
                playerA={featuredA}
                playerB={featuredB}
                playerAStats={featuredAStats}
                playerBStats={featuredBStats}
                currentUserId={currentUserId}
              />

              <MatchArchive
                profileMap={profileMap}
                currentUserId={currentUserId}
                disputed={disputed}
                completed={done}
                voided={voided}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
