import Link from 'next/link'
import { Trophy, Calendar, Swords, Crown, CheckCircle2, Ban, Shield } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import type { League, Match, Profile } from '@/lib/types'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

// ─── Standings computation ────────────────────────────────────────────────────

type PlayerRow = {
  id: string
  username: string
  avatar_url: string | null
  points: number
  wins: number
  losses: number
  winrate: number
  matchesPlayed: number
}

function computeStandings(
  matches: Match[],
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url'>[]
): PlayerRow[] {
  const map = new Map<string, PlayerRow>()
  for (const p of profiles) {
    map.set(p.id, {
      id: p.id, username: p.username, avatar_url: p.avatar_url,
      points: 0, wins: 0, losses: 0, winrate: 0, matchesPlayed: 0,
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

  return [...map.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.winrate !== a.winrate) return b.winrate - a.winrate
    return a.username.localeCompare(b.username)
  })
}

// ─── Rank pill ────────────────────────────────────────────────────────────────

function HistoryRank({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950">
        1
      </span>
    )
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black bg-gradient-to-br from-slate-400 to-slate-500 text-slate-100">
        2
      </span>
    )
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black bg-gradient-to-br from-orange-600 to-amber-700 text-orange-100">
        3
      </span>
    )
  return (
    <span className="text-xs text-muted-foreground tabular-nums font-medium w-5 text-center">
      {rank}
    </span>
  )
}

// ─── Duration helper ──────────────────────────────────────────────────────────

function duration(start: string, end: string | null): string {
  if (!end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const days = Math.round(ms / (1000 * 60 * 60 * 24))
  if (days < 7) return `${days}d`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks}sem`
  return `${Math.round(days / 30)}mes`
}

// ─── Match result row ─────────────────────────────────────────────────────────

function MatchResultRow({
  match,
  profileMap,
}: {
  match: Match
  profileMap: Map<string, Pick<Profile, 'id' | 'username' | 'avatar_url'>>
}) {
  const pA = profileMap.get(match.player_a_id)
  const pB = profileMap.get(match.player_b_id)
  if (!pA || !pB) return null

  const isVoided = match.status === 'voided'
  const isResolved = match.status === 'validated' || match.status === 'admin_resolved'
  const winnerId = match.winner_id
  const winner = winnerId ? profileMap.get(winnerId) : null
  const loser = winner?.id === pA.id ? pB : pA

  return (
    <Link
      href={`/match/${match.id}`}
      className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors group"
    >
      {isVoided ? (
        <>
          <Ban className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          <span className="text-xs text-muted-foreground/50 line-through">
            {pA.username} vs {pB.username}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground/40 font-semibold">ANULADO</span>
        </>
      ) : isResolved && winner && loser ? (
        <>
          <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
          <span className="text-xs">
            <span className="font-bold text-green-400">{winner.username}</span>
            <span className="text-muted-foreground/60 mx-1.5 text-[11px]">def.</span>
            <span className="text-muted-foreground">{loser.username}</span>
          </span>
          {match.status === 'admin_resolved' && (
            <span title="Admin resolved" className="ml-auto">
              <Shield className="h-3 w-3 text-primary/70 shrink-0" />
            </span>
          )}
        </>
      ) : (
        <>
          <span className="h-3 w-3 rounded-full border border-muted-foreground/30 shrink-0" />
          <span className="text-xs text-muted-foreground">
            {pA.username} vs {pB.username}
          </span>
          <span className="ml-auto text-[10px] text-primary/70 font-semibold">PENDIENTE</span>
        </>
      )}
    </Link>
  )
}

// ─── Champion showcase ────────────────────────────────────────────────────────

function ChampionBanner({ champion }: { champion: PlayerRow }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-700/40 bg-gradient-to-b from-amber-950/30 to-card shadow-lg shadow-amber-900/20 p-5">
      <div className="h-0.5 absolute top-0 inset-x-0 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
      <Trophy className="absolute -right-2 -top-2 h-20 w-20 text-amber-600/12 rotate-12 pointer-events-none" />

      <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.18em] mb-4 flex items-center gap-1.5">
        <Crown className="h-3 w-3 fill-amber-400" strokeWidth={0} />
        Campeón de temporada
      </p>

      <div className="flex items-center gap-4">
        <Link href={`/profile/${champion.id}`} className="shrink-0 group">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-amber-600/40 shadow-md shadow-amber-800/30 transition-transform duration-200 group-hover:scale-105 rank-glow-gold">
              <AvatarImage src={champion.avatar_url ?? undefined} />
              <AvatarFallback className="text-lg font-black bg-gradient-to-br from-amber-900 to-yellow-900 text-amber-200">
                {champion.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Crown className="h-4 w-4 text-amber-400 fill-amber-400" strokeWidth={1} />
            </div>
          </div>
        </Link>

        <div className="min-w-0">
          <Link
            href={`/profile/${champion.id}`}
            className="font-black text-lg leading-tight text-amber-200 hover:underline underline-offset-4 truncate block tracking-tight"
          >
            {champion.username}
          </Link>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-2xl font-black tabular-nums text-amber-400 leading-none">
              {champion.points}
              <span className="text-xs font-normal ml-0.5 text-amber-500/70">pts</span>
            </span>
            <div className="text-xs space-y-0.5">
              <p>
                <span className="text-green-400 font-bold">{champion.wins}V</span>
                {' '}
                <span className="text-red-400 font-bold">{champion.losses}D</span>
              </p>
              <p className="text-muted-foreground">{champion.winrate.toFixed(1)}% winrate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── League card ──────────────────────────────────────────────────────────────

function LeagueCard({
  league, standings, matches, profileMap,
}: {
  league: League
  standings: PlayerRow[]
  matches: Match[]
  profileMap: Map<string, Pick<Profile, 'id' | 'username' | 'avatar_url'>>
}) {
  const champion = standings[0] ?? null
  const totalMatches = matches.length
  const resolvedMatches = matches.filter(
    (m) => m.status === 'validated' || m.status === 'admin_resolved'
  ).length
  const voidedMatches = matches.filter((m) => m.status === 'voided').length

  const sortedMatches = [...matches].sort((a, b) => {
    const order = { validated: 0, admin_resolved: 1, pending: 2, disputed: 3, voided: 4 }
    return (order[a.status] ?? 5) - (order[b.status] ?? 5)
  })

  const dur = duration(league.created_at, league.closed_at)
  const closedDate = league.closed_at
    ? new Date(league.closed_at).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40 shrink-0 border border-border/50">
            <Swords className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-heading font-700 text-xl leading-tight tracking-widest uppercase">{league.title}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <Calendar className="h-3 w-3" />
              <span>Cerrada el {closedDate}</span>
              <span className="text-muted-foreground/30">·</span>
              <span>{dur} de duración</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 shrink-0 font-medium">
          <span>{standings.length} jugadores</span>
          <span className="text-muted-foreground/30">·</span>
          <span>{resolvedMatches}/{totalMatches} resueltas</span>
          {voidedMatches > 0 && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span>{voidedMatches} anuladas</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
        <div className="space-y-3">
          {champion && <ChampionBanner champion={champion} />}

          <Card className="overflow-hidden border-border/50">
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">
                Clasificación Final
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-center pl-4 text-[10px] font-black uppercase tracking-wide text-muted-foreground/60">#</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wide text-muted-foreground/60">Jugador</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-wide text-muted-foreground/60">Pts</TableHead>
                    <TableHead className="text-right hidden sm:table-cell text-[10px] font-black uppercase tracking-wide text-muted-foreground/60">V — D</TableHead>
                    <TableHead className="text-right pr-4 hidden sm:table-cell text-[10px] font-black uppercase tracking-wide text-muted-foreground/60">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((row, i) => {
                    const rank = i + 1
                    return (
                      <TableRow
                        key={row.id}
                        className={cn('transition-colors border-border/20', rank === 1 && 'bg-amber-950/15')}
                      >
                        <TableCell className="text-center pl-4"><HistoryRank rank={rank} /></TableCell>
                        <TableCell>
                          <Link href={`/profile/${row.id}`} className="flex items-center gap-2 group w-fit">
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={row.avatar_url ?? undefined} />
                              <AvatarFallback className="text-[10px] font-bold">
                                {row.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold group-hover:underline underline-offset-4">
                              {row.username}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-right font-black tabular-nums text-primary">
                          {row.points}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">
                          <span className="text-green-400 font-semibold">{row.wins}</span>
                          <span className="text-muted-foreground/40 mx-1">—</span>
                          <span className="text-red-400 font-semibold">{row.losses}</span>
                        </TableCell>
                        <TableCell className="text-right pr-4 tabular-nums text-sm text-muted-foreground hidden sm:table-cell">
                          {row.winrate.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="self-start overflow-hidden border-border/50">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 space-y-0.5">
            {sortedMatches.map((m) => (
              <MatchResultRow key={m.id} match={m} profileMap={profileMap} />
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

// ─── History hero banner ──────────────────────────────────────────────────────

function HistoryHero({ subtitle }: { subtitle: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/8 shadow-xl">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 200"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="hhBase" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#07060c"/>
            <stop offset="100%" stopColor="#040508"/>
          </linearGradient>
          <radialGradient id="hhGlow" cx="50%" cy="80%" r="60%">
            <stop offset="0%" stopColor="#4060ff" stopOpacity="0.12"/>
            <stop offset="100%" stopColor="#4060ff" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="hhLeft" cx="8%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00c8e8" stopOpacity="0.08"/>
            <stop offset="100%" stopColor="#00c8e8" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="hhRight" cx="92%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4060ff" stopOpacity="0.08"/>
            <stop offset="100%" stopColor="#4060ff" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="hhMtn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c0e20"/>
            <stop offset="100%" stopColor="#06060a"/>
          </linearGradient>
          <filter id="hhBlur"><feGaussianBlur stdDeviation="7"/></filter>
        </defs>

        <rect width="1200" height="200" fill="url(#hhBase)"/>
        <rect width="1200" height="200" fill="url(#hhGlow)"/>
        <rect width="1200" height="200" fill="url(#hhLeft)"/>
        <rect width="1200" height="200" fill="url(#hhRight)"/>

        {[[55,10],[120,18],[200,8],[310,14],[430,6],[550,12],[680,9],[800,16],[920,7],[1040,13],[1160,20],[1180,5],[90,30],[380,28],[700,32],[1000,26]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={i%4===0?0.85:0.5} fill="white" opacity={0.12+((i*11)%5)*0.05}/>
        ))}

        <g stroke="rgba(64,96,255,0.025)" strokeWidth="0.7" fill="none">
          <ellipse cx="180" cy="100" rx="170" ry="108"/>
          <ellipse cx="180" cy="100" rx="126" ry="80"/>
          <ellipse cx="180" cy="100" rx="84" ry="52"/>
          <ellipse cx="180" cy="100" rx="46" ry="29"/>
        </g>
        <g stroke="rgba(0,200,232,0.020)" strokeWidth="0.6" fill="none">
          <ellipse cx="1020" cy="95" rx="155" ry="100"/>
          <ellipse cx="1020" cy="95" rx="112" ry="72"/>
          <ellipse cx="1020" cy="95" rx="72" ry="46"/>
        </g>
        <g stroke="rgba(245,158,11,0.055)" strokeWidth="0.8" fill="none">
          <circle cx="600" cy="100" r="68"/>
          <circle cx="600" cy="100" r="50"/>
          <circle cx="600" cy="100" r="34"/>
        </g>
        <path d="M588,68 L612,68 L614,82 C622,82 628,88 628,96 C628,104 622,110 614,110 L612,118 L620,122 L580,122 L588,118 L586,110 C578,110 572,104 572,96 C572,88 578,82 586,82 Z"
          fill="none" stroke="rgba(245,158,11,0.06)" strokeWidth="0.8"/>

        <path d="M0,200 L70,150 L150,165 L240,138 L360,158 L480,130 L600,148 L720,125 L840,145 L960,122 L1080,142 L1170,130 L1200,135 L1200,200Z" fill="url(#hhMtn)" opacity="0.9"/>

        <g opacity="0.05" filter="url(#hhBlur)">
          <line x1="600" y1="200" x2="520" y2="0" stroke="#00c8e8" strokeWidth="80"/>
          <line x1="600" y1="200" x2="680" y2="0" stroke="#4060ff" strokeWidth="60"/>
        </g>

        <ellipse cx="600" cy="198" rx="130" ry="8" fill="rgba(0,200,232,0.25)" filter="url(#hhBlur)"/>
        <ellipse cx="600" cy="198" rx="90" ry="6" fill="none" stroke="rgba(0,200,232,0.35)" strokeWidth="0.6" opacity="0.35"/>

        <circle cx="30" cy="200" r="65" fill="none" stroke="rgba(255,255,255,0.016)" strokeWidth="0.6"/>
        <circle cx="1170" cy="195" r="75" fill="none" stroke="rgba(255,255,255,0.016)" strokeWidth="0.6"/>
      </svg>

      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-primary/40 via-blue-400/50 to-primary/40"/>

      <div className="relative px-8 py-7 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.30em] text-primary/60 mb-2">
            Hall of Champions
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-700 tracking-widest leading-none text-white/95 mb-1.5 uppercase">
            Archivo de{' '}
            <span className="text-primary drop-shadow-[0_0_15px_rgba(0,200,232,0.4)]">Ligas</span>
          </h1>
          <p className="text-sm text-white/35 font-medium">{subtitle}</p>
        </div>
        <div className="shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/25 shadow-lg shadow-primary/10">
            <Trophy className="h-5 w-5 text-primary" strokeWidth={2}/>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HistoryPage() {
  const supabase = await createClient()

  const { data: leaguesRaw } = await supabase
    .from('leagues')
    .select('*')
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })

  const leagues = (leaguesRaw ?? []) as League[]

  if (leagues.length === 0) {
    return (
      <div className="space-y-6 pb-10">
        <HistoryHero subtitle="Ninguna temporada completada todavía" />
        <Card className="border-border/50">
          <CardContent className="py-16 text-center space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">Ninguna temporada completada</p>
            <p className="text-xs text-muted-foreground">
              Las ligas cerradas aparecerán aquí como registro permanente.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const leagueIds = leagues.map((l) => l.id)
  const { data: allMatchesRaw } = await supabase
    .from('matches')
    .select('*')
    .in('league_id', leagueIds)

  const allMatches = (allMatchesRaw ?? []) as Match[]

  const playerIds = [
    ...new Set(allMatches.flatMap((m) => [m.player_a_id, m.player_b_id])),
  ]

  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', playerIds)

  const profiles = (profilesRaw ?? []) as Pick<Profile, 'id' | 'username' | 'avatar_url'>[]
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  const leagueData = leagues.map((league) => {
    const matches = allMatches.filter((m) => m.league_id === league.id)
    const participantIds = [...new Set(matches.flatMap((m) => [m.player_a_id, m.player_b_id]))]
    const participants = participantIds
      .map((id) => profileMap.get(id))
      .filter((p): p is Pick<Profile, 'id' | 'username' | 'avatar_url'> => !!p)

    return { league, matches, standings: computeStandings(matches, participants) }
  })

  const historySubtitle = `${leagues.length} temporada${leagues.length !== 1 ? 's' : ''} completada${leagues.length !== 1 ? 's' : ''} · registro permanente`

  return (
    <div className="space-y-10 pb-10">

      <HistoryHero subtitle={historySubtitle} />

      {leagueData.length > 1 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.18em]">
            Hall of Champions
          </p>
          <div className="flex flex-wrap gap-2">
            {leagueData.map(({ league, standings }) => {
              const champ = standings[0]
              if (!champ) return null
              return (
                <div
                  key={league.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-800/50 bg-amber-950/20 text-xs"
                >
                  <Crown className="h-3 w-3 text-amber-400 fill-amber-400" strokeWidth={0} />
                  <span className="font-bold text-amber-300">{champ.username}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-muted-foreground truncate max-w-[100px]">{league.title}</span>
                </div>
              )
            })}
          </div>
          <Separator className="mt-4 opacity-30" />
        </div>
      )}

      {leagueData.map(({ league, standings, matches }, i) => (
        <div key={league.id}>
          <LeagueCard league={league} standings={standings} matches={matches} profileMap={profileMap} />
          {i < leagueData.length - 1 && <Separator className="mt-10 opacity-30" />}
        </div>
      ))}
    </div>
  )
}
