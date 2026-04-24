import Link from 'next/link'
import {
  Trophy,
  Crown,
  Calendar,
  Ban,
  Shield,
  Clock,
  Swords,
  Users,
  Medal,
  Flame,
  ScrollText,
  ChevronDown,
  Archive,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import type { League, Match, Profile } from '@/lib/types'

import './history.css'

// ═════════════════════════════════════════════════════════════════
// Types + helpers
// ═════════════════════════════════════════════════════════════════

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

type SlimProfile = Pick<Profile, 'id' | 'username' | 'avatar_url'>

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase()
}

function AvatarImg({
  url,
  username,
  className,
}: {
  url: string | null | undefined
  username: string
  className?: string
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={username} className={className} />
  }
  return <span className="fallback">{initials(username)}</span>
}

// Inline SVG laurel branch — drawn as a single right-leaning half so we can
// mirror it via CSS `scaleX(-1)` for the left side of each medallion.
function LaurelHalf({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 22 54"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g fill="currentColor">
        <path
          d="M11 2 C 10 15 10 30 10 52"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.55"
        />
        <ellipse cx="7" cy="8" rx="4.5" ry="2" transform="rotate(-45 7 8)" />
        <ellipse cx="5" cy="16" rx="5.5" ry="2.2" transform="rotate(-32 5 16)" />
        <ellipse cx="4" cy="25" rx="6" ry="2.4" transform="rotate(-20 4 25)" />
        <ellipse cx="4" cy="34" rx="6" ry="2.4" transform="rotate(-10 4 34)" />
        <ellipse cx="5" cy="42" rx="5.5" ry="2.2" transform="rotate(-2 5 42)" />
        <ellipse cx="7" cy="49" rx="4.5" ry="2" transform="rotate(8 7 49)" />
      </g>
    </svg>
  )
}

// Tiny filled star used in the multi-title badge.
function StarDot({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 10 10"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M5 0.6 L6.2 3.6 L9.4 3.9 L7 6 L7.7 9.2 L5 7.5 L2.3 9.2 L3 6 L0.6 3.9 L3.8 3.6 Z" />
    </svg>
  )
}

function computeStandings(matches: Match[], profiles: SlimProfile[]): PlayerRow[] {
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
    const loserId = m.winner_id === m.player_a_id ? m.player_b_id : m.player_a_id
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

function toRoman(n: number): string {
  if (n <= 0) return ''
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let out = ''
  let x = n
  for (const [v, s] of map) {
    while (x >= v) { out += s; x -= v }
  }
  return out
}

function durationDays(start: string, end: string | null): number | null {
  if (!end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

function formatDuration(days: number | null): string {
  if (days === null) return '—'
  if (days < 7) return `${days} día${days === 1 ? '' : 's'}`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks} sem`
  return `${Math.round(days / 30)} mes`
}

function formatClosedDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ═════════════════════════════════════════════════════════════════
// Hero
// ═════════════════════════════════════════════════════════════════

function HistoryHero({ totalSeasons }: { totalSeasons: number }) {
  return (
    <div className="hc-hero hc-fade-up">
      <span className="hc-hero-corner tl" />
      <span className="hc-hero-corner tr" />
      <span className="hc-hero-corner bl" />
      <span className="hc-hero-corner br" />

      <div className="hc-hero-emblem">
        <div className="hc-hero-emblem-laurel" />
        <div className="hc-hero-emblem-ring" />
        <div className="hc-hero-emblem-core">
          <Trophy strokeWidth={1.6} />
        </div>
      </div>

      <div className="hc-hero-text">
        <p className="hc-hero-kicker">Archivo Oficial · Registro Eterno</p>
        <h1 className="hc-hero-title">
          Hall of <span className="accent">Champions</span>
        </h1>
        <p className="hc-hero-subtitle">
          Temporadas selladas. Honores grabados. Leyendas que permanecen.
        </p>
      </div>

      <div className="hc-hero-counter">
        <div className="hc-hero-counter-num">
          {String(totalSeasons).padStart(2, '0')}
        </div>
        <div className="hc-hero-counter-label">
          {totalSeasons === 1 ? 'Temporada' : 'Temporadas'}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// Champions shelf
// ═════════════════════════════════════════════════════════════════

function ChampionsShelf({
  entries,
  championCounts,
}: {
  entries: { leagueId: string; league: League; champion: PlayerRow; seasonNum: number }[]
  championCounts: Map<string, number>
}) {
  if (entries.length === 0) return null
  return (
    <div>
      <div className="hc-section-head">
        <span className="hc-section-head-label">
          <Crown /> Galería de Campeones
        </span>
      </div>
      <div className="hc-shelf-wrap hc-fade-up">
        <div className="hc-shelf">
          {entries.map(({ leagueId, champion, seasonNum }) => {
            const titles = championCounts.get(champion.id) ?? 1
            return (
              <Link
                key={leagueId}
                href={`#season-${leagueId}`}
                className="hc-medal"
              >
                <div className="hc-medal-crest">
                  <LaurelHalf className="hc-medal-laurel left" />
                  <LaurelHalf className="hc-medal-laurel right" />
                  <div className="hc-medal-ring">
                    <AvatarImg url={champion.avatar_url} username={champion.username} />
                  </div>
                  {titles > 1 && (
                    <span
                      className="hc-medal-titles"
                      title={`${titles} títulos`}
                    >
                      <StarDot />×{titles}
                    </span>
                  )}
                </div>
                <span className="hc-medal-name">{champion.username}</span>
                <span className="hc-medal-plaque">
                  Temp
                  <span className="hc-medal-plaque-roman">{toRoman(seasonNum)}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// Legacy stats
// ═════════════════════════════════════════════════════════════════

type LegacyStats = {
  totalSeasons: number
  totalMatchesResolved: number
  totalMatchesVoided: number
  avgDurationDays: number | null
  dominantChampion: { profile: SlimProfile; titles: number } | null
  mostActive: { profile: SlimProfile; matches: number } | null
}

function LegacyStrip({ stats }: { stats: LegacyStats }) {
  return (
    <div>
      <div className="hc-section-head">
        <span className="hc-section-head-label">
          <Archive /> Registro Eterno
        </span>
      </div>

      <div className="hc-legacy hc-fade-up">
        {stats.dominantChampion ? (
          <Link
            href={`/profile/${stats.dominantChampion.profile.id}`}
            className="hc-legacy-feature"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="hc-legacy-feature-portrait">
              <span className="hc-legacy-feature-badge">
                <Crown strokeWidth={2} />
              </span>
              <AvatarImg
                url={stats.dominantChampion.profile.avatar_url}
                username={stats.dominantChampion.profile.username}
              />
            </div>
            <div className="hc-legacy-feature-body">
              <span className="hc-legacy-feature-kicker">
                Campeón absoluto
              </span>
              <span className="hc-legacy-feature-name">
                {stats.dominantChampion.profile.username}
              </span>
              <span className="hc-legacy-feature-meta">
                <strong>{stats.dominantChampion.titles}</strong>{' '}
                {stats.dominantChampion.titles === 1 ? 'título' : 'títulos'}
              </span>
            </div>
          </Link>
        ) : (
          <div className="hc-legacy-card">
            <span className="hc-legacy-card-label">
              <Crown /> Campeón absoluto
            </span>
            <div className="hc-legacy-card-value">—</div>
            <p className="hc-legacy-card-sub">Aún sin corona</p>
          </div>
        )}

        {stats.mostActive ? (
          <Link
            href={`/profile/${stats.mostActive.profile.id}`}
            className="hc-legacy-feature cyan"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="hc-legacy-feature-portrait">
              <span className="hc-legacy-feature-badge">
                <Flame strokeWidth={2} />
              </span>
              <AvatarImg
                url={stats.mostActive.profile.avatar_url}
                username={stats.mostActive.profile.username}
              />
            </div>
            <div className="hc-legacy-feature-body">
              <span className="hc-legacy-feature-kicker">Más activo</span>
              <span className="hc-legacy-feature-name">
                {stats.mostActive.profile.username}
              </span>
              <span className="hc-legacy-feature-meta">
                <strong>{stats.mostActive.matches}</strong> combates disputados
              </span>
            </div>
          </Link>
        ) : (
          <div className="hc-legacy-card">
            <span className="hc-legacy-card-label">
              <Flame /> Más activo
            </span>
            <div className="hc-legacy-card-value">—</div>
            <p className="hc-legacy-card-sub">Sin datos</p>
          </div>
        )}

        <div className="hc-legacy-card">
          <span className="hc-legacy-card-label">
            <Swords /> Combates resueltos
          </span>
          <div className="hc-legacy-card-value">{stats.totalMatchesResolved}</div>
          <p className="hc-legacy-card-sub">
            {stats.totalMatchesVoided > 0
              ? `${stats.totalMatchesVoided} anulados`
              : 'sin anulaciones'}
          </p>
        </div>

        <div className="hc-legacy-card">
          <span className="hc-legacy-card-label">
            <Clock /> Duración media
          </span>
          <div className="hc-legacy-card-value">
            {stats.avgDurationDays === null
              ? '—'
              : formatDuration(stats.avgDurationDays)}
          </div>
          <p className="hc-legacy-card-sub">por temporada</p>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// Match result card
// ═════════════════════════════════════════════════════════════════

type MatchGroup = 'resolved' | 'voided' | 'pending'

function groupMatches(matches: Match[]): Record<MatchGroup, Match[]> {
  const out: Record<MatchGroup, Match[]> = {
    resolved: [],
    voided: [],
    pending: [],
  }
  for (const m of matches) {
    if (m.status === 'validated' || m.status === 'admin_resolved') {
      out.resolved.push(m)
    } else if (m.status === 'voided') {
      out.voided.push(m)
    } else {
      out.pending.push(m)
    }
  }
  return out
}

function MatchResult({
  match,
  index,
  profileMap,
}: {
  match: Match
  index: number
  profileMap: Map<string, SlimProfile>
}) {
  const pA = profileMap.get(match.player_a_id)
  const pB = profileMap.get(match.player_b_id)
  if (!pA || !pB) return null

  const isVoided = match.status === 'voided'
  const isResolved =
    match.status === 'validated' || match.status === 'admin_resolved'
  const winnerIsA = isResolved && match.winner_id === pA.id
  const winnerIsB = isResolved && match.winner_id === pB.id

  const classes = ['hc-match']
  if (winnerIsA) classes.push('win-a')
  else if (winnerIsB) classes.push('win-b')
  else if (isVoided) classes.push('void')
  else classes.push('pending')

  const nameClassA = isVoided
    ? 'hc-match-name void'
    : winnerIsA
    ? 'hc-match-name winner'
    : winnerIsB
    ? 'hc-match-name loser'
    : 'hc-match-name'
  const nameClassB = isVoided
    ? 'hc-match-name void'
    : winnerIsB
    ? 'hc-match-name winner'
    : winnerIsA
    ? 'hc-match-name loser'
    : 'hc-match-name'
  const faceClassA = isVoided
    ? 'hc-match-face void'
    : winnerIsA
    ? 'hc-match-face winner'
    : 'hc-match-face'
  const faceClassB = isVoided
    ? 'hc-match-face void'
    : winnerIsB
    ? 'hc-match-face winner'
    : 'hc-match-face'

  const midClass = isVoided
    ? 'hc-match-mid void'
    : isResolved
    ? 'hc-match-mid win'
    : 'hc-match-mid pending'
  const MidIcon = isVoided ? Ban : isResolved ? Trophy : Swords

  return (
    <Link href={`/match/${match.id}`} className={classes.join(' ')}>
      <span className="hc-match-idx">{String(index).padStart(2, '0')}</span>
      <div className="hc-match-body">
        <div className="hc-match-side">
          <div className={faceClassA}>
            <AvatarImg url={pA.avatar_url} username={pA.username} />
          </div>
          <span className={nameClassA}>{pA.username}</span>
        </div>
        <span className={midClass}>
          <MidIcon strokeWidth={2} />
        </span>
        <div className="hc-match-side right">
          <div className={faceClassB}>
            <AvatarImg url={pB.avatar_url} username={pB.username} />
          </div>
          <span className={nameClassB}>{pB.username}</span>
        </div>
      </div>
      {match.status === 'admin_resolved' && (
        <span className="hc-match-flag admin">
          <Shield strokeWidth={2.2} />
          Admin
        </span>
      )}
      {isVoided && (
        <span className="hc-match-flag void">
          <Ban strokeWidth={2.2} />
          Anulado
        </span>
      )}
      {!isVoided && !isResolved && (
        <span className="hc-match-flag pending">
          <Clock strokeWidth={2.2} />
          Pendiente
        </span>
      )}
    </Link>
  )
}

// ═════════════════════════════════════════════════════════════════
// Season capsule
// ═════════════════════════════════════════════════════════════════

function SeasonCapsule({
  league,
  seasonNum,
  standings,
  matches,
  profileMap,
}: {
  league: League
  seasonNum: number
  standings: PlayerRow[]
  matches: Match[]
  profileMap: Map<string, SlimProfile>
}) {
  const champion = standings[0] ?? null
  const top3 = standings.slice(0, 3)

  const resolvedMatches = matches.filter(
    (m) => m.status === 'validated' || m.status === 'admin_resolved',
  ).length
  const voidedMatches = matches.filter((m) => m.status === 'voided').length
  const totalMatches = matches.length

  const dur = durationDays(league.created_at, league.closed_at)
  const closed = formatClosedDate(league.closed_at)

  const grouped = groupMatches(matches)
  const matchIndex = new Map<string, number>()
  matches.forEach((m, i) => matchIndex.set(m.id, i + 1))

  return (
    <article id={`season-${league.id}`} className="hc-capsule hc-fade-up">
      <span className="hc-capsule-corner tl" />
      <span className="hc-capsule-corner tr" />
      <span className="hc-capsule-corner bl" />
      <span className="hc-capsule-corner br" />

      <div className="hc-seal">
        <div className="hc-seal-wax" />
        <div className="hc-seal-inner">
          <span className="hc-seal-roman">{toRoman(seasonNum)}</span>
        </div>
        <span className="hc-seal-grade">Temporada</span>
      </div>

      <div className="hc-capsule-body">
        <header className="hc-capsule-head">
          <h2 className="hc-capsule-title">{league.title}</h2>
          <div className="hc-capsule-meta">
            <span className="hc-capsule-meta-item">
              <Calendar /> Cerrada el <strong>{closed}</strong>
            </span>
            <span className="hc-capsule-meta-item">
              <Clock /> <strong>{formatDuration(dur)}</strong>
            </span>
            <span className="hc-capsule-meta-item">
              <Swords /> <strong>{resolvedMatches}</strong> / {totalMatches} combates
            </span>
            {voidedMatches > 0 && (
              <span className="hc-capsule-meta-item">
                <Ban /> <strong>{voidedMatches}</strong> anulados
              </span>
            )}
            <span className="hc-capsule-meta-item">
              <Users /> <strong>{standings.length}</strong> entrenadores
            </span>
          </div>
        </header>

        {champion && (
          <div className="hc-capsule-champion">
            <div className="hc-capsule-champion-portrait">
              <Crown className="crown" size={14} strokeWidth={2} />
              <AvatarImg url={champion.avatar_url} username={champion.username} />
            </div>
            <div className="hc-capsule-champion-info">
              <span className="hc-capsule-champion-kicker">Campeón de temporada</span>
              <Link
                href={`/profile/${champion.id}`}
                className="hc-capsule-champion-name"
              >
                {champion.username}
              </Link>
              <div className="hc-capsule-champion-stats">
                <span>
                  <span className="pts">{champion.points}</span> pts
                </span>
                <span>
                  <span className="wins">{champion.wins}V</span>
                  {' '}
                  <span className="losses">{champion.losses}D</span>
                </span>
                <span>{champion.winrate.toFixed(1)}% WR</span>
              </div>
            </div>
          </div>
        )}

        {top3.length > 0 && (
          <div className="hc-capsule-top3">
            {top3.map((row, i) => {
              const rank = i + 1
              const cls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'
              return (
                <Link
                  key={row.id}
                  href={`/profile/${row.id}`}
                  className="hc-capsule-top3-row"
                >
                  <span className={`hc-mini-rank ${cls}`}>{rank}</span>
                  <div className="hc-mini-user">
                    <div className="hc-mini-avatar">
                      <AvatarImg url={row.avatar_url} username={row.username} />
                    </div>
                    <span className="hc-mini-name">{row.username}</span>
                  </div>
                  <span className="hc-mini-wl">
                    <span className="w">{row.wins}V</span>
                    {' '}
                    <span className="l">{row.losses}D</span>
                  </span>
                  <span className="hc-mini-pts">{row.points}</span>
                </Link>
              )
            })}
          </div>
        )}

        <details className="hc-capsule-details">
          <summary>
            <ScrollText size={13} strokeWidth={2} />
            Ver registro completo
            <ChevronDown className="chevron" strokeWidth={2.5} />
          </summary>

          <div className="hc-capsule-expand">
            <div>
              <div className="hc-standings-head">
                <span>#</span>
                <span>Jugador</span>
                <span>Pts</span>
                <span>V — D</span>
                <span>WR</span>
              </div>
              <div className="hc-standings-list">
                {standings.map((row, i) => {
                  const rank = i + 1
                  const rankCls =
                    rank === 1
                      ? 'gold'
                      : rank === 2
                      ? 'silver'
                      : rank === 3
                      ? 'bronze'
                      : ''
                  return (
                    <Link
                      key={row.id}
                      href={`/profile/${row.id}`}
                      className={`hc-standings-row${rank === 1 ? ' champ' : ''}`}
                    >
                      <span className={`hc-srow-rank ${rankCls}`}>{rank}</span>
                      <div className="hc-srow-user">
                        <div className="hc-mini-avatar">
                          <AvatarImg url={row.avatar_url} username={row.username} />
                        </div>
                        <span className="hc-srow-name">{row.username}</span>
                      </div>
                      <span className="hc-srow-pts">{row.points}</span>
                      <span className="hc-srow-wl">
                        <span className="w">{row.wins}</span>
                        <span className="sep">—</span>
                        <span className="l">{row.losses}</span>
                      </span>
                      <span className="hc-srow-wr">
                        {row.winrate.toFixed(1)}%
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="hc-results-wrap">
              <div className="hc-results-head">
                <Medal /> Resultados
              </div>
              <div className="hc-results">
                {grouped.resolved.length > 0 && (
                  <>
                    <div className="hc-match-group win">
                      Resueltos
                      <span className="count">{grouped.resolved.length}</span>
                    </div>
                    {grouped.resolved.map((m) => (
                      <MatchResult
                        key={m.id}
                        match={m}
                        index={matchIndex.get(m.id) ?? 0}
                        profileMap={profileMap}
                      />
                    ))}
                  </>
                )}
                {grouped.voided.length > 0 && (
                  <>
                    <div className="hc-match-group void">
                      Anulados
                      <span className="count">{grouped.voided.length}</span>
                    </div>
                    {grouped.voided.map((m) => (
                      <MatchResult
                        key={m.id}
                        match={m}
                        index={matchIndex.get(m.id) ?? 0}
                        profileMap={profileMap}
                      />
                    ))}
                  </>
                )}
                {grouped.pending.length > 0 && (
                  <>
                    <div className="hc-match-group pending">
                      Pendientes
                      <span className="count">{grouped.pending.length}</span>
                    </div>
                    {grouped.pending.map((m) => (
                      <MatchResult
                        key={m.id}
                        match={m}
                        index={matchIndex.get(m.id) ?? 0}
                        profileMap={profileMap}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </details>
      </div>
    </article>
  )
}

// ═════════════════════════════════════════════════════════════════
// Console shell
// ═════════════════════════════════════════════════════════════════

function ConsoleShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="hc-scene" />
      <div className="history-console relative z-10">
        <div className="hc-console">
          <span className="hc-rivet tl" />
          <span className="hc-rivet tr" />
          <span className="hc-rivet bl" />
          <span className="hc-rivet br" />
          <span className="hc-stripes tl" />
          <span className="hc-stripes tr" />
          <span className="hc-stripes bl" />
          <span className="hc-stripes br" />
          <span className="hc-nameplate">
            <Archive size={11} strokeWidth={2.2} />
            Archivo · Hall of Champions
          </span>

          <div className="hc-console-inner">
            <div className="hc-page">{children}</div>
          </div>
        </div>
      </div>
    </>
  )
}

// ═════════════════════════════════════════════════════════════════
// Page
// ═════════════════════════════════════════════════════════════════

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
      <ConsoleShell>
        <HistoryHero totalSeasons={0} />
        <div className="hc-empty">
          <div className="hc-empty-emblem">
            <Trophy size={28} strokeWidth={1.5} />
          </div>
          <h3>Aún sin temporadas selladas</h3>
          <p>
            Las ligas cerradas se archivarán aquí como registro permanente del
            torneo. Cuando el admin cierre una liga, su campeón entrará al Hall.
          </p>
        </div>
      </ConsoleShell>
    )
  }

  // Fetch matches + profiles
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

  const profiles = (profilesRaw ?? []) as SlimProfile[]
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  // Pre-compute per-league data
  const leagueData = leagues.map((league) => {
    const matches = allMatches.filter((m) => m.league_id === league.id)
    const participantIds = [
      ...new Set(matches.flatMap((m) => [m.player_a_id, m.player_b_id])),
    ]
    const participants = participantIds
      .map((id) => profileMap.get(id))
      .filter((p): p is SlimProfile => !!p)

    return { league, matches, standings: computeStandings(matches, participants) }
  })

  // Seasons numbered ascending by chronology (oldest = I). leagues are
  // sorted DESC by closed_at, so season number = (total - index).
  const totalSeasons = leagueData.length
  const numbered = leagueData.map((d, i) => ({
    ...d,
    seasonNum: totalSeasons - i,
  }))

  // Legacy stats
  const championCounts = new Map<string, number>()
  for (const { standings } of leagueData) {
    const c = standings[0]
    if (c) championCounts.set(c.id, (championCounts.get(c.id) ?? 0) + 1)
  }
  let dominantChampion: LegacyStats['dominantChampion'] = null
  for (const [id, titles] of championCounts.entries()) {
    const profile = profileMap.get(id)
    if (!profile) continue
    if (!dominantChampion || titles > dominantChampion.titles) {
      dominantChampion = { profile, titles }
    }
  }

  const activityCounts = new Map<string, number>()
  for (const m of allMatches) {
    if (m.status === 'validated' || m.status === 'admin_resolved') {
      activityCounts.set(m.player_a_id, (activityCounts.get(m.player_a_id) ?? 0) + 1)
      activityCounts.set(m.player_b_id, (activityCounts.get(m.player_b_id) ?? 0) + 1)
    }
  }
  let mostActive: LegacyStats['mostActive'] = null
  for (const [id, matches] of activityCounts.entries()) {
    const profile = profileMap.get(id)
    if (!profile) continue
    if (!mostActive || matches > mostActive.matches) {
      mostActive = { profile, matches }
    }
  }

  const totalMatchesResolved = allMatches.filter(
    (m) => m.status === 'validated' || m.status === 'admin_resolved',
  ).length
  const totalMatchesVoided = allMatches.filter((m) => m.status === 'voided').length

  const durations = leagueData
    .map((d) => durationDays(d.league.created_at, d.league.closed_at))
    .filter((d): d is number => d !== null)
  const avgDurationDays =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null

  const legacyStats: LegacyStats = {
    totalSeasons,
    totalMatchesResolved,
    totalMatchesVoided,
    avgDurationDays,
    dominantChampion,
    mostActive,
  }

  // Champions shelf entries (drop seasons with no champion, if any)
  const shelfEntries = numbered
    .map(({ league, standings, seasonNum }) => {
      const champion = standings[0]
      if (!champion) return null
      return { leagueId: league.id, league, champion, seasonNum }
    })
    .filter(
      (e): e is { leagueId: string; league: League; champion: PlayerRow; seasonNum: number } =>
        !!e,
    )

  return (
    <ConsoleShell>
      <HistoryHero totalSeasons={totalSeasons} />

      <ChampionsShelf entries={shelfEntries} championCounts={championCounts} />

      <LegacyStrip stats={legacyStats} />

      <div>
        <div className="hc-section-head">
          <span className="hc-section-head-label">
            <ScrollText /> Crónica de Temporadas
          </span>
        </div>

        <div className="hc-capsules">
          {numbered.map(({ league, standings, matches, seasonNum }) => (
            <SeasonCapsule
              key={league.id}
              league={league}
              seasonNum={seasonNum}
              standings={standings}
              matches={matches}
              profileMap={profileMap}
            />
          ))}
        </div>
      </div>
    </ConsoleShell>
  )
}
