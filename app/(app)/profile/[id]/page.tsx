import { notFound } from 'next/navigation'
import { Crown } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import type { Profile, LeaderboardEntry } from '@/lib/types'

import { AvatarUpload } from './_components/avatar-upload'
import { UsernameEditor } from './_components/username-editor'
import { LastMatchPanel, type LastMatchData } from './_components/last-match-panel'
import { Logbook } from './_components/logbook'
import { NuzlockeStats } from './_components/nuzlocke-stats'
import { SaveSyncWidget } from './_components/save-sync-widget'
import { RunVitalsWing, SysLinkWing } from './_components/diagnostic-wing'
import { StatGauges } from './_components/stat-gauges'
import { TeamHex } from './_components/team-hex'
import { PCStorageGrid } from './_components/pc-storage-grid'
import { GraveyardGrid } from './_components/graveyard-grid'
import { MvpPodium, MvpPodiumEmpty } from './_components/mvp-podium'
import './profile.css'

interface GlobalRank {
  rank: number
  total: number
}

// ─── Dragon Ball badge SVG ───────────────────────────────────────────────────

const BADGE_NAMES = [
  '1 Estrella', '2 Estrellas', '3 Estrellas', '4 Estrellas',
  '5 Estrellas', '6 Estrellas', '7 Estrellas', '8 Estrellas',
  '9 Estrellas', '10 Estrellas', '11 Estrellas', '12 Estrellas',
]

// Star positions for 1-12 stars, laid out inside a unit circle (cx, cy in 0-100 space)
const STAR_LAYOUTS: [number, number][][] = [
  /* 1  */ [[50, 50]],
  /* 2  */ [[50, 36], [50, 64]],
  /* 3  */ [[50, 32], [34, 60], [66, 60]],
  /* 4  */ [[50, 28], [72, 50], [50, 72], [28, 50]],
  /* 5  */ [[50, 26], [72, 42], [64, 68], [36, 68], [28, 42]],
  /* 6  */ [[50, 26], [72, 38], [72, 62], [50, 74], [28, 62], [28, 38]],
  /* 7  */ [[50, 50], [50, 26], [72, 38], [72, 62], [50, 74], [28, 62], [28, 38]],
  /* 8  */ [[50, 50], [50, 24], [74, 34], [74, 58], [56, 74], [44, 74], [26, 58], [26, 34]],
  /* 9  */ [[50, 50], [50, 22], [72, 30], [78, 54], [64, 74], [36, 74], [22, 54], [28, 30], [50, 74]],
  /* 10 */ [[50, 50], [50, 22], [73, 28], [80, 50], [73, 72], [50, 78], [27, 72], [20, 50], [27, 28], [50, 42]],
  /* 11 */ [[50, 50], [50, 20], [72, 26], [82, 44], [78, 66], [62, 78], [38, 78], [22, 66], [18, 44], [28, 26], [50, 36]],
  /* 12 */ [[50, 50], [50, 20], [72, 24], [84, 40], [84, 60], [72, 76], [50, 80], [28, 76], [16, 60], [16, 40], [28, 24], [50, 36]],
]

function DragonBallSvg({ stars }: { stars: number }) {
  const positions = STAR_LAYOUTS[stars - 1]
  // Star size scales down as count increases
  const starR = stars <= 4 ? 7 : stars <= 7 ? 6 : stars <= 9 ? 5 : 4.5

  return (
    <svg viewBox="0 0 100 100" className="tc-dragonball-svg" aria-hidden>
      <defs>
        <radialGradient id={`db-grad-${stars}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffe47a" />
          <stop offset="40%" stopColor="#f5a623" />
          <stop offset="100%" stopColor="#c46c0a" />
        </radialGradient>
        <radialGradient id={`db-shine-${stars}`} cx="32%" cy="28%" r="30%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      {/* Main sphere */}
      <circle cx="50" cy="50" r="46" fill={`url(#db-grad-${stars})`} />
      {/* Specular highlight */}
      <circle cx="50" cy="50" r="46" fill={`url(#db-shine-${stars})`} />
      {/* Stars */}
      {positions.map(([cx, cy], i) => (
        <polygon
          key={i}
          points={starPoints(cx, cy, starR)}
          fill="#c0392b"
          stroke="#922b21"
          strokeWidth="0.8"
        />
      ))}
      {/* Rim highlight */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
    </svg>
  )
}

/** Generate a 4-pointed star polygon at (cx,cy) with radius r */
function starPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  const innerR = r * 0.4
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 2
    const rad = i % 2 === 0 ? r : innerR
    pts.push(`${cx + rad * Math.cos(angle)},${cy + rad * Math.sin(angle)}`)
  }
  return pts.join(' ')
}

// ─── Gym Badges (console style) ──────────────────────────────────────────────

function GymBadgesPanel({ count }: { count: number }) {
  return (
    <div className="tc-panel tc-fade-in-up">
      <span className="tc-mini-rivet tl" /><span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" /><span className="tc-mini-rivet br" />
      <div className="tc-panel-header">
        <h2>Medallas de Gimnasio</h2>
      </div>
      <div className="tc-panel-inner">
        <div className="tc-badges-grid">
          {Array.from({ length: 12 }).map((_, i) => {
            const earned = i < count
            return (
              <div
                key={i}
                className={`tc-badge-slot ${earned ? 'earned' : 'empty'}`}
                title={earned ? `${BADGE_NAMES[i]} (${i + 1}/12)` : undefined}
                style={{ '--db-index': i } as React.CSSProperties}
              >
                {earned ? (
                  <DragonBallSvg stars={i + 1} />
                ) : (
                  <div className="tc-badge-empty-circle" />
                )}
              </div>
            )
          })}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: 'var(--tc-accent)', textAlign: 'center', marginTop: 10, letterSpacing: '0.1em' }}>
          {count}/12
        </div>
      </div>
    </div>
  )
}

// ─── Trainer Card (console style) ────────────────────────────────────────────

function TrainerCardConsole({
  profile, stats, canEdit, isOwnProfile, globalRank,
}: {
  profile: Profile
  stats: LeaderboardEntry | null
  canEdit: boolean
  isOwnProfile: boolean
  globalRank: GlobalRank | null
}) {
  const points = stats?.total_points ?? 0
  const wins = stats?.total_wins ?? 0
  const losses = stats?.total_losses ?? 0
  const winrate = Number(stats?.winrate ?? 0)

  return (
    <div className="tc-trainer-card tc-fade-in-up">
      <span className="tc-corner tl" /><span className="tc-corner tr" />
      <span className="tc-corner bl" /><span className="tc-corner br" />
      <div className="tc-halo" />

      {/* Avatar ring */}
      <div className="tc-avatar-ring">
        <AvatarUpload
          profileId={profile.id}
          avatarUrl={profile.avatar_url}
          username={profile.username}
          canEdit={canEdit}
        />
      </div>

      {/* Name + tags */}
      <div className="flex items-center justify-center gap-2.5 mb-2">
        <UsernameEditor profileId={profile.id} initialUsername={profile.username} canEdit={canEdit} />
        {profile.role === 'admin' && <span className="tc-tag admin">ADMIN</span>}
        {isOwnProfile && <span className="tc-tag me">TU</span>}
        {profile.status === 'inactive' && <span className="tc-tag inactive">Inactivo</span>}
      </div>

      <p style={{ margin: '4px 0 12px', fontSize: 12, color: '#8b92a8', textAlign: 'center' }}>
        Entrenador desde{' '}
        {new Date(profile.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
      </p>

      {(points > 0 || wins > 0) && (
        <div className="flex justify-center">
          <div className="tc-stats-inline">
            <span>{points}<span className="lb">PTS</span></span>
            <span className="dot">&middot;</span>
            <span>{wins}V-{losses}D</span>
            <span className="dot">&middot;</span>
            <span>{winrate.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {globalRank && (
        <div className="flex justify-center mt-3">
          <div className="tc-rank-chip">
            <span className="tc-rank-glow" aria-hidden />
            <span className="tc-rank-icon"><Crown size={13} strokeWidth={2.6} /></span>
            <span className="tc-rank-label">Global Rank</span>
            <span className="tc-rank-divider" aria-hidden />
            <span className="tc-rank-pos">#{globalRank.rank}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Save Sync Panel (console wrapper) ───────────────────────────────────────

function SaveSyncPanel({ profileId, profile }: { profileId: string; profile: Profile }) {
  return (
    <div className="tc-panel tc-fade-in-up">
      <span className="tc-mini-rivet tl" /><span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" /><span className="tc-mini-rivet br" />
      <div className="tc-panel-header"><h2>Save Sync</h2></div>
      <div className="tc-panel-inner">
        <SaveSyncWidget
          profileId={profileId}
          saveSyncedAt={profile.save_synced_at ?? null}
          saveSyncStatus={profile.save_sync_status ?? 'never'}
          saveParseError={profile.save_parse_error ?? null}
        />
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [profileResult, statsResult, userResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('leaderboard').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (profileResult.error || !profileResult.data) notFound()

  const profile = profileResult.data as Profile
  const stats = statsResult.data as LeaderboardEntry | null
  const currentUser = userResult.data.user

  let currentUserRole: 'admin' | 'player' = 'player'
  if (currentUser) {
    const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single()
    currentUserRole = currentProfile?.role ?? 'player'
  }

  const canEdit = !!currentUser && (currentUser.id === profile.id || currentUserRole === 'admin')
  const isOwnProfile = currentUser?.id === profile.id

  // ── Global rank + last-match queries (run in parallel) ───────────────────────
  const [leaderboardRes, lastWinRes] = await Promise.all([
    supabase.from('leaderboard').select('id, username, total_points, total_wins, winrate'),
    supabase
      .from('matches')
      .select('id, player_a_id, player_b_id, winner_id, created_at, replay_url, league_id')
      .eq('winner_id', id)
      .in('status', ['validated', 'admin_resolved'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  let globalRank: GlobalRank | null = null
  if (leaderboardRes.data && leaderboardRes.data.length > 0) {
    const sorted = leaderboardRes.data.slice().sort((a, b) =>
      (b.total_points ?? 0) - (a.total_points ?? 0) ||
      (b.total_wins ?? 0) - (a.total_wins ?? 0) ||
      Number(b.winrate ?? 0) - Number(a.winrate ?? 0) ||
      (a.username ?? '').localeCompare(b.username ?? '')
    )
    const idx = sorted.findIndex((e) => e.id === profile.id)
    if (idx >= 0) globalRank = { rank: idx + 1, total: sorted.length }
  }

  let lastMatchData: LastMatchData | null = null
  if (lastWinRes.data) {
    const lastWin = lastWinRes.data
    const opponentId =
      lastWin.player_a_id === profile.id ? lastWin.player_b_id : lastWin.player_a_id

    const [oppRes, leagueRes] = await Promise.all([
      supabase.from('profiles').select('id, username, avatar_url').eq('id', opponentId).maybeSingle(),
      supabase.from('leagues').select('title').eq('id', lastWin.league_id).maybeSingle(),
    ])

    lastMatchData = {
      matchId: lastWin.id,
      winnerId: profile.id,
      winnerUsername: profile.username,
      winnerAvatarUrl: profile.avatar_url,
      opponentId,
      opponentUsername: oppRes.data?.username ?? 'Desconocido',
      opponentAvatarUrl: oppRes.data?.avatar_url ?? null,
      leagueTitle: leagueRes.data?.title ?? 'Liga',
      createdAt: lastWin.created_at,
      replayUrl: lastWin.replay_url,
    }
  }

  return (
    <>
      {/* Scene background */}
      <div className="tc-scene" />

      <div className="relative z-10 pb-10">
        {/* Console frame — full width */}
        <div className="trainer-console px-3 pt-2">
          <div className="tc-console">
            <span className="tc-rivet tl" /><span className="tc-rivet tr" />
            <span className="tc-rivet bl" /><span className="tc-rivet br" />
            <span className="tc-stripes tl" /><span className="tc-stripes tr" />
            <span className="tc-stripes bl" /><span className="tc-stripes br" />

            <div className="tc-console-inner">
              {/* 3-column grid */}
              <div className="tc-main-grid">
                {/* LEFT COLUMN */}
                <div className="tc-col">
                  <GymBadgesPanel count={profile.badges} />
                  <NuzlockeStats
                    profileId={id}
                    deaths={(profile.graveyard ?? []).length}
                    initialWipes={profile.wipes}
                    canEdit={canEdit}
                  />
                  <div className="tc-flex-grow-panel">
                    {profile.mvp ? (
                      <MvpPodium
                        species={profile.mvp}
                        nickname={profile.team.find(e => e.species === profile.mvp)?.nickname ?? ''}
                      />
                    ) : (
                      <MvpPodiumEmpty />
                    )}
                  </div>
                </div>

                {/* CENTER COLUMN */}
                <div className="tc-col tc-col-center">
                  <TrainerCardConsole
                    profile={profile}
                    stats={stats}
                    canEdit={canEdit}
                    isOwnProfile={isOwnProfile}
                    globalRank={globalRank}
                  />
                  <StatGauges stats={stats} />
                  {(profile.graveyard ?? []).length > 0 && (
                    <div className="tc-flex-grow-panel">
                      <GraveyardGrid graveyard={profile.graveyard ?? []} />
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="tc-col">
                  <div className="tc-flex-grow-panel">
                    <TeamHex
                      profileId={profile.id}
                      initialTeam={profile.team}
                      initialMvp={profile.mvp}
                      canEdit={canEdit}
                    />
                  </div>
                  <PCStorageGrid box={profile.box} />
                </div>
              </div>

              {/* BOTTOM ROW — Logbook + Last Victory (always visible) */}
              <div className="tc-bottom-row">
                <Logbook profileId={id} initialNotes={profile.notes} canEdit={canEdit} />
                <LastMatchPanel data={lastMatchData} />
              </div>

              {/* SYNC ROW — Save Sync (owner only) */}
              {isOwnProfile && (
                <div className="tc-sync-row">
                  <RunVitalsWing
                    badges={profile.badges}
                    deaths={profile.deaths}
                    teamSize={profile.team?.length ?? 0}
                  />
                  <SaveSyncPanel profileId={id} profile={profile} />
                  <SysLinkWing
                    syncedAt={profile.save_synced_at ?? null}
                    status={profile.save_sync_status ?? 'never'}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
