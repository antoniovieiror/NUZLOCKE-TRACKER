// ═════════════════════════════════════════════════════════════════
// league-sections.tsx — Presentational pieces for the Active League
// page. All server-renderable; no client-state here.
//
// Consumers pass already-computed data (standings rows, grouped
// matches, etc.). The file is intentionally consolidated so the
// whole visual language of the page lives in one place.
// ═════════════════════════════════════════════════════════════════

import Link from 'next/link'
import {
  Crown,
  Swords,
  Trophy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  Shield,
  Film,
  CalendarDays,
} from 'lucide-react'
import type { Match, MatchStatus, Profile } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────

export type PlayerRow = {
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

// ─── Helpers ──────────────────────────────────────────────────────

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase()
}

function AvatarBubble({
  url,
  username,
  className,
}: {
  url: string | null | undefined
  username: string
  className?: string
}) {
  if (url) {
    // Plain <img>: avatars are external/supabase URLs; no Next/Image config needed here.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={username} className={className} />
  }
  return <span className="fallback">{initials(username)}</span>
}

// ─── LeagueHero ───────────────────────────────────────────────────

export function LeagueHero({
  title,
  startedAt,
  totalMatches,
  resolvedMatches,
  inactive = false,
}: {
  title: string
  startedAt: string | null
  totalMatches: number
  resolvedMatches: number
  inactive?: boolean
}) {
  const pct =
    totalMatches === 0 ? 0 : Math.round((resolvedMatches / totalMatches) * 100)
  const dashTotal = 2 * Math.PI * 44
  const dashOffset = dashTotal - (pct / 100) * dashTotal
  const startedLabel = startedAt
    ? new Date(startedAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
      })
    : null

  return (
    <div className="lc-hero lc-fade-in-up">
      <span className="lc-hero-corner tl" />
      <span className="lc-hero-corner tr" />
      <span className="lc-hero-corner bl" />
      <span className="lc-hero-corner br" />

      <div className={`lc-hero-medal ${inactive ? 'inactive' : ''}`}>
        <div className="lc-hero-medal-ring" />
        <div className="lc-hero-medal-core">
          <Trophy className="lc-hero-medal-icon" strokeWidth={2.2} />
        </div>
      </div>

      <div className="lc-hero-text">
        <p className={`lc-hero-kicker ${inactive ? 'inactive' : ''}`}>
          {inactive ? 'Sin Liga Activa' : 'Liga Activa · en curso'}
        </p>
        <h1 className="lc-hero-title">{title}</h1>
        <div className="lc-hero-meta">
          {startedLabel && (
            <span>
              Iniciada el <strong>{startedLabel}</strong>
            </span>
          )}
          <span>
            Partidas <strong>{resolvedMatches}</strong>/{totalMatches}
          </span>
        </div>
      </div>

      <div className="lc-progress-ring" aria-label={`${pct}% de la liga completada`}>
        <svg viewBox="0 0 100 100" aria-hidden>
          <defs>
            <linearGradient id="lc-progress-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4de0f5" />
              <stop offset="100%" stopColor="#007a8c" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="44" className="track" />
          <circle
            cx="50"
            cy="50"
            r="44"
            className="fill"
            style={{
              strokeDasharray: dashTotal,
              strokeDashoffset: dashOffset,
            }}
          />
        </svg>
        <div className="lc-progress-ring-label">
          <span className="lc-progress-ring-pct">{pct}%</span>
          <span className="lc-progress-ring-sub">Progreso</span>
        </div>
      </div>
    </div>
  )
}

// ─── Leaderboard (Podium + Standings combined) ────────────────────

function PodiumSlots({ standings }: { standings: PlayerRow[] }) {
  const first = standings[0]
  const second = standings[1]
  const third = standings[2]

  // Display order: 2 · 1 · 3 (center pedestal is tallest)
  const order = [second, first, third]
  const rankFor = (p: PlayerRow | undefined) =>
    p === first ? 1 : p === second ? 2 : 3

  return (
    <div className="lc-podium">
      {order.map((p, idx) => {
        if (!p) {
          const placeholderRank = idx === 0 ? 2 : idx === 1 ? 1 : 3
          return (
            <div
              key={`empty-${placeholderRank}`}
              className={`lc-podium-slot rank-${placeholderRank}`}
            >
              <div className="lc-podium-avatar">
                <span className="fallback">?</span>
              </div>
              <span className="lc-podium-name">—</span>
              <span className="lc-podium-points">0 pts</span>
              <div className="lc-podium-pedestal">{placeholderRank}</div>
            </div>
          )
        }
        const rank = rankFor(p)
        return (
          <Link
            key={p.id}
            href={`/profile/${p.id}`}
            className={`lc-podium-slot rank-${rank}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {rank === 1 && (
              <Crown className="lc-podium-crown" size={22} strokeWidth={2.4} />
            )}
            <div className="lc-podium-avatar">
              <AvatarBubble url={p.avatar_url} username={p.username} />
            </div>
            <span className="lc-podium-name">{p.username}</span>
            <span className="lc-podium-points">{p.points} pts</span>
            <div className="lc-podium-pedestal">{rank}</div>
          </Link>
        )
      })}
    </div>
  )
}

function StandingsTable({
  rows,
  currentUserId,
  startRank,
}: {
  rows: PlayerRow[]
  currentUserId: string | null
  startRank: number
}) {
  return (
    <div className="lc-standings">
      <div className="lc-standings-head" aria-hidden>
        <span>#</span>
        <span>Jugador</span>
        <span>V</span>
        <span>D</span>
        <span>Pts</span>
      </div>
      <div className="lc-standings-list">
        {rows.map((row, i) => {
          const rank = startRank + i
          const chipClass =
            rank === 1
              ? 'gold'
              : rank === 2
              ? 'silver'
              : rank === 3
              ? 'bronze'
              : ''
          const isMe = row.id === currentUserId
          return (
            <Link
              key={row.id}
              href={`/profile/${row.id}`}
              className={`lc-standings-row ${isMe ? 'me' : ''}`}
            >
              <span className={`lc-rank-chip ${chipClass}`}>{rank}</span>
              <div className="lc-standings-user">
                <div className="lc-standings-avatar">
                  <AvatarBubble url={row.avatar_url} username={row.username} />
                </div>
                <div className="lc-standings-username">
                  {row.username}
                  {isMe && <span className="lc-me-tag">tú</span>}
                </div>
              </div>
              <span className="lc-standings-num wins">{row.wins}</span>
              <span className="lc-standings-num losses">{row.losses}</span>
              <span className="lc-standings-points">{row.points}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function Leaderboard({
  standings,
  currentUserId,
}: {
  standings: PlayerRow[]
  currentUserId: string | null
}) {
  const rest = standings.slice(3)

  return (
    <div className="lc-panel lc-fade-in-up">
      <span className="lc-mini-rivet tl" />
      <span className="lc-mini-rivet tr" />
      <span className="lc-mini-rivet bl" />
      <span className="lc-mini-rivet br" />
      <div className="lc-panel-header">
        <h2>Clasificación</h2>
        <span className="sub">{standings.length} jugadores</span>
      </div>
      <div className="lc-panel-inner">
        {standings.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: 'var(--lc-ink-muted)',
            }}
          >
            Aún no hay jugadores en esta liga.
          </div>
        ) : (
          <div className="lc-leaderboard-body">
            <PodiumSlots standings={standings} />
            {rest.length > 0 && (
              <>
                <div className="lc-leaderboard-divider" aria-hidden />
                <StandingsTable
                  rows={rest}
                  currentUserId={currentUserId}
                  startRank={4}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Current Match (dominant block) ───────────────────────────────

export function CurrentMatch({
  match,
  playerA,
  playerB,
  playerAStats,
  playerBStats,
  currentUserId,
}: {
  match: Match | null
  playerA: SlimProfile | null
  playerB: SlimProfile | null
  playerAStats?: Pick<PlayerRow, 'wins' | 'losses' | 'points'>
  playerBStats?: Pick<PlayerRow, 'wins' | 'losses' | 'points'>
  currentUserId: string | null
}) {
  if (!match || !playerA || !playerB) {
    return (
      <div className="lc-current empty lc-fade-in-up">
        <div className="lc-current-head">
          <span className="lc-current-kicker">Duelo Activo</span>
          <span className="lc-current-status">sin duelos</span>
        </div>
        <p
          style={{
            textAlign: 'center',
            margin: 0,
            padding: '30px 0',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            letterSpacing: '0.08em',
            color: 'var(--lc-ink-muted)',
          }}
        >
          Todos los duelos resueltos. Cierra la liga para archivarla.
        </p>
      </div>
    )
  }

  const isMine =
    currentUserId === match.player_a_id || currentUserId === match.player_b_id

  const statusLabel = (() => {
    if (match.status === 'disputed') return 'disputado'
    if (match.status === 'pending') return 'en vivo'
    return match.status
  })()

  const statusClass = match.status === 'pending' ? 'live' : ''

  const ctaLabel = isMine ? 'Registrar Duelo' : 'Ver Duelo'

  return (
    <div className="lc-current lc-fade-in-up">
      <div className="lc-current-head">
        <span className="lc-current-kicker">
          Duelo Activo
          {isMine && <span className="lc-te-toca">Te toca</span>}
        </span>
        <span className={`lc-current-status ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="lc-current-duel">
        <Link
          href={`/profile/${playerA.id}`}
          className="lc-duelist"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="lc-duelist-avatar">
            <AvatarBubble url={playerA.avatar_url} username={playerA.username} />
          </div>
          <span className="lc-duelist-name">{playerA.username}</span>
          {playerAStats && (
            <span className="lc-duelist-stats">
              <strong>{playerAStats.points}</strong> pts · {playerAStats.wins}V-
              {playerAStats.losses}D
            </span>
          )}
        </Link>

        <div className="lc-vs">
          <div className="lc-vs-badge">VS</div>
          <span className="lc-vs-sub">Combate</span>
        </div>

        <Link
          href={`/profile/${playerB.id}`}
          className="lc-duelist right"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="lc-duelist-avatar">
            <AvatarBubble url={playerB.avatar_url} username={playerB.username} />
          </div>
          <span className="lc-duelist-name">{playerB.username}</span>
          {playerBStats && (
            <span className="lc-duelist-stats">
              <strong>{playerBStats.points}</strong> pts · {playerBStats.wins}V-
              {playerBStats.losses}D
            </span>
          )}
        </Link>
      </div>

      <div className="lc-current-cta">
        <Link href={`/match/${match.id}`} className="lc-btn primary">
          <Swords size={16} strokeWidth={2.4} />
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}

// ─── Archive (compact vs cards) ───────────────────────────────────

function statusMeta(status: MatchStatus) {
  switch (status) {
    case 'validated':
      return { label: 'Validado', Icon: CheckCircle2, cls: 'validated' }
    case 'admin_resolved':
      return { label: 'Resuelto', Icon: Shield, cls: 'resolved' }
    case 'disputed':
      return { label: 'Disputado', Icon: AlertTriangle, cls: 'disputed' }
    case 'voided':
      return { label: 'Anulado', Icon: Ban, cls: 'voided' }
    case 'pending':
    default:
      return { label: 'Pendiente', Icon: Clock, cls: 'pending' }
  }
}

function formatMatchDate(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  })
  const time = d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return { date, time }
}

function VsCard({
  match,
  playerA,
  playerB,
  currentUserId,
  matchNumber,
  variant,
}: {
  match: Match
  playerA: SlimProfile
  playerB: SlimProfile
  currentUserId: string | null
  matchNumber: number
  variant?: 'pending-mine' | 'pending' | 'disputed' | null
}) {
  const isMine =
    currentUserId === match.player_a_id || currentUserId === match.player_b_id
  const resolved =
    match.status === 'validated' || match.status === 'admin_resolved'
  const voided = match.status === 'voided'
  const { label, cls } = statusMeta(match.status)

  const winnerA = resolved && match.winner_id === playerA.id
  const winnerB = resolved && match.winner_id === playerB.id
  const loserA = resolved && match.winner_id && match.winner_id !== playerA.id
  const loserB = resolved && match.winner_id && match.winner_id !== playerB.id

  const cardCls = [
    'lc-vs-card',
    variant === 'pending-mine' && isMine && match.status === 'pending'
      ? 'pending-mine'
      : variant === 'disputed'
      ? 'disputed'
      : variant === 'pending' || match.status === 'pending'
      ? 'pending'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  const { date, time } = formatMatchDate(match.updated_at ?? match.created_at)
  const hasReplay = Boolean(match.replay_url)
  const paddedNumber = String(matchNumber).padStart(2, '0')

  return (
    <Link href={`/match/${match.id}`} className={cardCls}>
      <span className="lc-vs-index">#{paddedNumber}</span>
      {match.status !== 'validated' && match.status !== 'voided' && (
        <span className={`lc-vs-status-pill ${cls}`}>{label}</span>
      )}

      <div className="lc-vs-body">
        <div className="lc-vs-side">
          <div className="lc-vs-avatar">
            <AvatarBubble url={playerA.avatar_url} username={playerA.username} />
          </div>
          <div className="lc-vs-person">
            <span
              className={`lc-vs-name ${winnerA ? 'winner' : loserA ? 'loser' : ''}`}
            >
              {playerA.username}
            </span>
            {resolved && (
              <span className={`lc-vs-points ${winnerA ? 'win' : 'loss'}`}>
                {winnerA ? '+2 pts' : '0 pts'}
              </span>
            )}
            {voided && <span className="lc-vs-points void">0 pts</span>}
          </div>
        </div>

        <div className="lc-vs-mid-wrap">
          {resolved ? (
            <>
              <Trophy size={14} strokeWidth={2.4} className="lc-vs-trophy" />
              <span className="lc-vs-mid">FIN</span>
            </>
          ) : voided ? (
            <>
              <Ban size={14} strokeWidth={2.4} className="lc-vs-void" />
              <span className="lc-vs-mid">—</span>
            </>
          ) : (
            <span className="lc-vs-mid pulse">VS</span>
          )}
        </div>

        <div className="lc-vs-side right">
          <div className="lc-vs-person right">
            <span
              className={`lc-vs-name ${winnerB ? 'winner' : loserB ? 'loser' : ''}`}
            >
              {playerB.username}
            </span>
            {resolved && (
              <span className={`lc-vs-points ${winnerB ? 'win' : 'loss'}`}>
                {winnerB ? '+2 pts' : '0 pts'}
              </span>
            )}
            {voided && <span className="lc-vs-points void">0 pts</span>}
          </div>
          <div className="lc-vs-avatar">
            <AvatarBubble url={playerB.avatar_url} username={playerB.username} />
          </div>
        </div>
      </div>

      <div className="lc-vs-meta">
        <span className="lc-vs-meta-chip">
          <CalendarDays size={11} strokeWidth={2.4} />
          {date} · {time}
        </span>
        {hasReplay && (
          <span className="lc-vs-meta-chip replay">
            <Film size={11} strokeWidth={2.4} />
            Replay
          </span>
        )}
        {isMine && match.status === 'pending' && (
          <span className="lc-vs-meta-chip accent">Tu voto pendiente</span>
        )}
      </div>
    </Link>
  )
}

export function MatchArchive({
  profileMap,
  currentUserId,
  disputed,
  completed,
  voided,
}: {
  profileMap: Map<string, SlimProfile>
  currentUserId: string | null
  disputed: Match[]
  completed: Match[]
  voided: Match[]
}) {
  const total = disputed.length + completed.length + voided.length
  const nothing = total === 0

  // Assign stable match numbers by creation order across the full archive.
  const numberFor = new Map<string, number>()
  const all = [...disputed, ...completed, ...voided].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  )
  all.forEach((m, i) => numberFor.set(m.id, i + 1))

  const renderGroup = (
    list: Match[],
    variant: 'pending-mine' | 'pending' | 'disputed' | null,
  ) => (
    <div className="lc-archive-list">
      {list.map((m) => {
        const pA = profileMap.get(m.player_a_id)
        const pB = profileMap.get(m.player_b_id)
        if (!pA || !pB) return null
        return (
          <VsCard
            key={m.id}
            match={m}
            playerA={pA}
            playerB={pB}
            currentUserId={currentUserId}
            matchNumber={numberFor.get(m.id) ?? 0}
            variant={variant}
          />
        )
      })}
    </div>
  )

  return (
    <div className="lc-panel lc-fade-in-up">
      <span className="lc-mini-rivet tl" />
      <span className="lc-mini-rivet tr" />
      <span className="lc-mini-rivet bl" />
      <span className="lc-mini-rivet br" />
      <div className="lc-panel-header">
        <h2>Archivo de Batallas</h2>
        <span className="sub">
          {completed.length + voided.length}/{total}
        </span>
      </div>
      <div className="lc-panel-inner">
        <div className="lc-archive-scroll">
          <div className="lc-archive-section">
            {disputed.length > 0 && (
              <div>
                <p className="lc-archive-group-label danger">
                  Disputados — Revisión admin
                </p>
                {renderGroup(disputed, 'disputed')}
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <p className="lc-archive-group-label">
                  Completados ({completed.length})
                </p>
                {renderGroup(completed, null)}
              </div>
            )}
            {voided.length > 0 && (
              <div>
                <p className="lc-archive-group-label">
                  Anulados ({voided.length})
                </p>
                {renderGroup(voided, null)}
              </div>
            )}
            {nothing && (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12,
                  color: 'var(--lc-ink-muted)',
                }}
              >
                Aún no hay combates archivados en esta liga.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
