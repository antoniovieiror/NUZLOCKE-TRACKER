import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Shield, Skull, Zap, Trophy, Swords, CircleOff, Percent } from 'lucide-react'
import type { ReactNode } from 'react'

import { createClient } from '@/lib/supabase/server'
import type { Profile, LeaderboardEntry } from '@/lib/types'

import { AvatarUpload } from './_components/avatar-upload'
import { UsernameEditor } from './_components/username-editor'
import { EditStateDialog } from './_components/edit-state-dialog'
import { PokemonSection } from './_components/pokemon-section'
import { MvpCard, MvpEmpty } from './_components/mvp-card'
import { SaveSyncWidget } from './_components/save-sync-widget'

function HudStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Rajdhani:wght@500;600;700&display=swap');

      @keyframes hudIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes badgeGlow {
        0%, 100% { filter: drop-shadow(0 0 5px rgba(255,220,120,0.18)); }
        50% { filter: drop-shadow(0 0 16px rgba(255,220,120,0.55)); }
      }

      @keyframes scanMove {
        0%, 100% { opacity: 0; transform: translateY(-8%); }
        50% { opacity: .07; transform: translateY(8%); }
      }

      .hud-in {
        animation: hudIn .42s ease forwards;
        opacity: 0;
      }
      .hud-in-1 { animation-delay: .03s; }
      .hud-in-2 { animation-delay: .10s; }
      .hud-in-3 { animation-delay: .17s; }
      .hud-in-4 { animation-delay: .24s; }
      .hud-in-5 { animation-delay: .31s; }

      .badge-earned {
        animation: badgeGlow 2.8s ease-in-out infinite;
      }

      .hud-scan {
        animation: scanMove 6s ease-in-out infinite;
      }

      .hud-scrollbar::-webkit-scrollbar {
        width: 5px;
      }
      .hud-scrollbar::-webkit-scrollbar-track {
        background: rgba(255,255,255,0.04);
        border-radius: 999px;
      }
      .hud-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(0,200,232,0.28);
        border-radius: 999px;
      }
      .hud-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(0,200,232,0.48);
      }
    `}</style>
  )
}

function PanelCard({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(10,14,26,0.96) 0%, rgba(5,8,16,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: [
          'inset 0 1px 0 rgba(255,255,255,0.06)',
          'inset 0 -1px 0 rgba(0,0,0,0.55)',
          '0 10px 28px rgba(0,0,0,0.34)',
          '0 0 0 1px rgba(0,200,232,0.04)',
        ].join(', '),
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 10% 0%, rgba(0,200,232,0.05), transparent 24%), radial-gradient(circle at 100% 100%, rgba(66,105,255,0.06), transparent 22%)',
        }}
      />
      <div
        aria-hidden
        className="hud-scan absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(180deg, transparent, transparent 4px, rgba(0,200,232,0.014) 5px)',
        }}
      />
      <div className={padded ? 'relative p-4' : 'relative'}>{children}</div>
    </div>
  )
}

function SectionTitle({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            background: '#00c8e8',
            boxShadow: '0 0 8px rgba(0,200,232,0.65)',
          }}
        />
        <span className="font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200/90">
          {title}
        </span>
      </div>
      {action}
    </div>
  )
}

function Chip({
  children,
  tone = 'cyan',
}: {
  children: ReactNode
  tone?: 'cyan' | 'amber' | 'slate'
}) {
  const style =
    tone === 'amber'
      ? {
          background: 'rgba(245, 158, 11, 0.16)',
          border: '1px solid rgba(245, 158, 11, 0.24)',
          color: '#fcd34d',
        }
      : tone === 'slate'
      ? {
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: 'rgba(255,255,255,0.72)',
        }
      : {
          background: 'rgba(0,200,232,0.14)',
          border: '1px solid rgba(0,200,232,0.22)',
          color: '#9be8f4',
        }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
      style={style}
    >
      {children}
    </span>
  )
}

function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode
  label: string
  value: string | number
  accent: string
}) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="mb-1 flex items-center gap-2">
        <span style={{ color: accent }}>{icon}</span>
        <span className="font-heading text-[10px] uppercase tracking-[0.16em] text-white/45">
          {label}
        </span>
      </div>
      <div className="font-heading text-[22px] font-bold leading-none" style={{ color: accent }}>
        {value}
      </div>
    </div>
  )
}

function CircularRing({
  value,
  max,
  label,
  accent,
  suffix = '',
}: {
  value: number
  max: number
  label: string
  accent: string
  suffix?: string
}) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const size = 112
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={label}>
      <defs>
        <linearGradient id={`ring-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="transparent"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="transparent"
        stroke={`url(#ring-${label})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 10px ${accent}55)` }}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r - 15}
        fill="rgba(8,12,22,0.95)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />
      <text
        x="50%"
        y="48%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 700,
          fontSize: '28px',
          fill: accent,
        }}
      >
        {value}
        {suffix}
      </text>
      <text
        x="50%"
        y="66%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 600,
          fontSize: '8px',
          letterSpacing: '0.16em',
          fill: 'rgba(255,255,255,0.42)',
        }}
      >
        {label.toUpperCase()}
      </text>
    </svg>
  )
}

function TrainerHeroCard({
  profile,
  stats,
  canEdit,
  isOwnProfile,
}: {
  profile: Profile
  stats: LeaderboardEntry | null
  canEdit: boolean
  isOwnProfile: boolean
}) {
  return (
    <div className="hud-in hud-in-1">
      <div
        className="relative overflow-hidden rounded-[24px]"
        style={{
          background: 'linear-gradient(180deg, rgba(10,14,25,0.97), rgba(6,8,16,0.98))',
          border: '1px solid rgba(154, 177, 210, 0.14)',
          boxShadow: [
            'inset 0 1px 0 rgba(255,255,255,0.08)',
            'inset 0 -1px 0 rgba(0,0,0,0.55)',
            '0 14px 36px rgba(0,0,0,0.4)',
            '0 0 0 1px rgba(0,200,232,0.06)',
          ].join(', '),
        }}
      >
        <div className="relative aspect-[2.25/1] w-full">
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background:
                'radial-gradient(circle at 20% 48%, rgba(0,200,232,0.12), transparent 18%), linear-gradient(90deg, rgba(0,200,232,0.05), transparent 35%)',
            }}
          />

          <div className="absolute left-[8.4%] top-[21.5%] z-[2] flex h-[42%] w-[14.5%] items-center justify-center">
            <AvatarUpload
              profileId={profile.id}
              avatarUrl={profile.avatar_url}
              username={profile.username}
              canEdit={canEdit}
            />
          </div>

          <img
            src="/ASSETS/trainer-card-Photoroom.png"
            alt=""
            aria-hidden
            className="absolute inset-0 z-10 h-full w-full object-contain pointer-events-none"
          />

          <div className="absolute inset-0 z-20">
            <div className="absolute left-[34%] right-[14%] top-[18%]">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <UsernameEditor
                  profileId={profile.id}
                  initialUsername={profile.username}
                  canEdit={canEdit}
                />
                {profile.role === 'admin' && (
                  <Chip tone="cyan">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Chip>
                )}
                {isOwnProfile && <Chip tone="amber">Tú</Chip>}
                {profile.status === 'inactive' && <Chip tone="slate">Inactivo</Chip>}
              </div>

              <p className="font-heading text-sm text-white/55">
                Entrenador desde{' '}
                {new Date(profile.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>

            <div className="absolute bottom-[13.5%] left-[31%] right-[12%]">
              <div
                className="rounded-[14px] px-4 py-2 text-center font-heading text-[clamp(14px,1.7vw,22px)] font-bold leading-none"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(101, 239, 255, 0.18), rgba(43, 151, 255, 0.10))',
                  border: '1px solid rgba(114, 228, 255, 0.20)',
                  color: '#8fefff',
                  textShadow: '0 0 12px rgba(0,200,232,0.35)',
                }}
              >
                {stats
                  ? `${stats.total_points ?? 0} pts · ${stats.total_wins ?? 0}V-${stats.total_losses ?? 0}D · ${Number(
                      stats.winrate ?? 0,
                    ).toFixed(1)}%`
                  : 'Sin estadísticas todavía'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GymBadgesPanel({
  count,
  canEdit,
  profileId,
  profile,
}: {
  count: number
  canEdit: boolean
  profileId: string
  profile: Profile
}) {
  const COLS = ['17%', '37%', '57%', '77%'] as const
  const ROWS = ['40%', '62%', '83%'] as const
  const slots: Array<{ left: string; top: string }> = []
  for (const row of ROWS) for (const col of COLS) slots.push({ left: col, top: row })

  const badgeColors = [
    '#f7b267',
    '#74d7ff',
    '#ffe16a',
    '#6ee7b7',
    '#c084fc',
    '#fca5a5',
    '#93c5fd',
    '#f9a8d4',
    '#a7f3d0',
    '#fde68a',
    '#c4b5fd',
    '#fdba74',
  ]

  return (
    <div className="hud-in hud-in-2">
      <PanelCard padded={false}>
        <div className="relative aspect-[2400/1308] w-full">
          <div className="absolute inset-0 z-[1]">
            {slots.map((slot, index) => {
              const earned = index < count
              return (
                <div
                  key={index}
                  className={earned ? 'badge-earned' : undefined}
                  style={{
                    position: 'absolute',
                    left: slot.left,
                    top: slot.top,
                    width: '12.8%',
                    aspectRatio: '1 / 1',
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '999px',
                    background: earned
                      ? `radial-gradient(circle at 35% 35%, ${badgeColors[index]}, rgba(10,16,28,0.92) 72%)`
                      : 'rgba(4,6,15,0.88)',
                    border: earned
                      ? '1px solid rgba(255,255,255,0.16)'
                      : '1px solid rgba(255,255,255,0.05)',
                  }}
                />
              )
            })}
          </div>

          <img
            src="/ASSETS/badge-assets.png"
            alt=""
            aria-hidden
            className="absolute inset-0 z-10 h-full w-full object-fill pointer-events-none"
          />

          <div className="absolute right-[6.5%] top-[7%] z-20">
            {canEdit && (
              <EditStateDialog
                profileId={profileId}
                initialValues={{
                  badges: profile.badges,
                  deaths: profile.deaths,
                  wipes: profile.wipes,
                  notes: profile.notes,
                }}
              />
            )}
          </div>

          <div className="absolute bottom-[5.5%] left-1/2 z-20 -translate-x-1/2 font-heading text-[clamp(12px,1.2vw,20px)] font-bold tracking-[0.18em] text-white/72">
            {count}/12
          </div>
        </div>
      </PanelCard>
    </div>
  )
}

function NuzlockeStatsCard({ profile }: { profile: Profile }) {
  return (
    <PanelCard className="hud-in hud-in-3">
      <SectionTitle title="Nuzlocke Stats" />
      <div className="grid gap-3 sm:grid-cols-2">
        <StatTile
          icon={<Skull className="h-4 w-4" />}
          label="Muertes"
          value={profile.deaths}
          accent={profile.deaths > 0 ? '#ff8b8b' : '#dbe4f0'}
        />
        <StatTile
          icon={<Zap className="h-4 w-4" />}
          label="Wipes"
          value={profile.wipes}
          accent={profile.wipes > 0 ? '#ffd667' : '#dbe4f0'}
        />
      </div>

      <div
        className="mt-3 rounded-2xl px-4 py-3 text-center"
        style={{
          background: 'linear-gradient(180deg, rgba(0,200,232,0.10), rgba(0,200,232,0.04))',
          border: '1px solid rgba(0,200,232,0.18)',
        }}
      >
        <div className="font-heading text-[10px] uppercase tracking-[0.24em] text-cyan-100/55">
          Estado
        </div>
        <div className="font-heading text-[28px] font-bold text-cyan-100">Nuzlocke Certified</div>
      </div>
    </PanelCard>
  )
}

function StatsDashboard({ stats }: { stats: LeaderboardEntry | null }) {
  const points = stats?.total_points ?? 0
  const wins = stats?.total_wins ?? 0
  const losses = stats?.total_losses ?? 0
  const winrate = Number(stats?.winrate ?? 0)
  const played = wins + losses

  return (
    <PanelCard className="hud-in hud-in-3">
      <SectionTitle title="League Overview" />
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="grid grid-cols-2 gap-3">
          <StatTile icon={<Trophy className="h-4 w-4" />} label="Puntos" value={points} accent="#79e5f4" />
          <StatTile icon={<Swords className="h-4 w-4" />} label="Victorias" value={wins} accent="#8df7b0" />
          <StatTile icon={<CircleOff className="h-4 w-4" />} label="Derrotas" value={losses} accent="#ff8b8b" />
          <StatTile icon={<Percent className="h-4 w-4" />} label="% Victorias" value={`${winrate.toFixed(1)}%`} accent="#ffd667" />
        </div>

        <div className="grid grid-cols-2 place-items-center rounded-2xl border border-white/7 bg-black/15 px-2 py-3">
          <CircularRing value={wins} max={Math.max(played, 1)} label="Victorias" accent="#8df7b0" />
          <CircularRing value={Math.round(winrate)} max={100} label="% Victorias" accent="#79e5f4" suffix="%" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-white/7 bg-black/20 px-3 py-2 text-sm text-white/55">
        <span>Partidas registradas</span>
        <span className="font-heading text-base font-bold text-cyan-100">{played}</span>
      </div>
    </PanelCard>
  )
}

function NotesLogBook({ notes }: { notes: string | null }) {
  return (
    <div className="hud-in hud-in-5">
      <PanelCard padded={false}>
        <div className="relative aspect-[993/357] w-full">
          <img
            src="/ASSETS/notes-asset.png"
            alt=""
            aria-hidden
            className="absolute inset-0 z-10 h-full w-full object-fill pointer-events-none"
          />
          <div className="absolute left-[4.2%] right-[10%] top-[29%] bottom-[10%] z-20 overflow-hidden">
            {notes ? (
              <p
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 'clamp(18px, 2vw, 30px)',
                  lineHeight: 1.2,
                  color: 'rgba(44,22,6,0.9)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {notes}
              </p>
            ) : (
              <p
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 'clamp(18px, 2vw, 30px)',
                  lineHeight: 1.2,
                  color: 'rgba(44,22,6,0.52)',
                  fontStyle: 'italic',
                }}
              >
                Sin notas todavía…
              </p>
            )}
          </div>
        </div>
      </PanelCard>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/"
      className="absolute left-3 top-3 z-30 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/65 backdrop-blur-sm transition hover:bg-white/10 hover:text-white sm:left-4 sm:top-4"
    >
      <ChevronLeft className="h-3.5 w-3.5" />
      Volver
    </Link>
  )
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
    const { data: cp } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()
    currentUserRole = cp?.role ?? 'player'
  }

  const canEdit = !!currentUser && (currentUser.id === profile.id || currentUserRole === 'admin')
  const isOwnProfile = currentUser?.id === profile.id

  return (
    <>
      <HudStyles />
      <div
        className="min-h-[calc(100vh-56px)]"
        style={{
          background:
            'radial-gradient(circle at 20% 0%, rgba(0,200,232,0.08), transparent 20%), radial-gradient(circle at 100% 100%, rgba(47,84,235,0.10), transparent 24%), linear-gradient(180deg, #060912 0%, #090d18 100%)',
        }}
      >
        <div className="mx-auto w-full max-w-[2200px] px-0 py-0">
          <div
            className="relative mx-auto w-full overflow-hidden"
            style={{
              maxWidth: '1920px',
              aspectRatio: '2048 / 1152',
            }}
          >
            <BackLink />

            <img
              src="/ASSETS/panel-frame.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 h-full w-full object-fill"
            />

            <div className="absolute inset-[4.2%_4.4%_8.1%_4.4%] z-10 grid grid-cols-[29%_37%_34%] grid-rows-[24%_28%_29%_19%] gap-[1.2%]">
              <div className="col-start-1 row-start-1">
                <GymBadgesPanel
                  count={profile.badges}
                  canEdit={canEdit}
                  profileId={profile.id}
                  profile={profile}
                />
              </div>

              <div className="col-start-2 row-start-1">
                <TrainerHeroCard
                  profile={profile}
                  stats={stats}
                  canEdit={canEdit}
                  isOwnProfile={isOwnProfile}
                />
              </div>

              <div className="col-start-3 row-span-3 row-start-1">
                <PokemonSection
                  key={profile.save_synced_at ?? 'never'}
                  profileId={profile.id}
                  initialTeam={profile.team}
                  initialBox={profile.box}
                  initialMvp={profile.mvp}
                  canEdit={canEdit}
                />
              </div>

              <div className="col-start-1 row-start-2">
                <NuzlockeStatsCard profile={profile} />
              </div>

              <div className="col-start-2 row-start-2">
                <StatsDashboard stats={stats} />
              </div>

              <div className="col-start-1 row-start-3">
                <PanelCard className="h-full hud-in hud-in-4">
                  <SectionTitle title="MVP" />
                  {profile.mvp ? (
                    <MvpCard
                      species={profile.mvp}
                      nickname={profile.team.find((e) => e.species === profile.mvp)?.nickname ?? ''}
                    />
                  ) : (
                    <MvpEmpty />
                  )}
                </PanelCard>
              </div>

              <div className="col-start-2 row-start-3">
                {canEdit && (
                  <div className="h-full">
                    <SaveSyncWidget
                      profileId={profile.id}
                      saveSyncedAt={profile.save_synced_at ?? null}
                      saveSyncStatus={profile.save_sync_status ?? 'never'}
                      saveParseError={profile.save_parse_error ?? null}
                    />
                  </div>
                )}
              </div>

              <div className="col-span-2 col-start-1 row-start-4">
                <NotesLogBook notes={profile.notes} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}