import type { LeaderboardEntry } from '@/lib/types'

export function StatGauges({ stats }: { stats: LeaderboardEntry | null }) {
  const points = stats?.total_points ?? 0
  const wins = stats?.total_wins ?? 0
  const losses = stats?.total_losses ?? 0
  const winrate = Number(stats?.winrate ?? 0)
  const gamesPlayed = wins + losses

  const pointsDeg = Math.min(360, (points / 10) * 360)
  const totalGames = wins + losses || 1
  const winsDeg = (wins / totalGames) * 360
  const lossesDeg = (losses / totalGames) * 360
  const winrateDeg = Math.min(360, (winrate / 100) * 360)

  return (
    <div className="tc-panel tc-fade-in-up">
      <span className="tc-mini-rivet tl" /><span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" /><span className="tc-mini-rivet br" />
      <div className="tc-panel-header"><h2>Balance de Batalla</h2></div>
      <div className="tc-panel-inner">
        <div className="tc-stats-grid">
          <div className="tc-stat-cell">
            <span className="tc-stat-label">Puntos</span>
            <div className="tc-gauge-wrap">
              <div className="tc-gauge" style={{ '--gauge-deg': `${pointsDeg}deg`, '--gauge-color': 'var(--tc-accent)' } as React.CSSProperties}>
                <span className="tc-gauge-value">{points}</span>
              </div>
            </div>
            <span className="tc-stat-sub">en todas las ligas</span>
          </div>
          <div className="tc-stat-cell">
            <span className="tc-stat-label">Victorias</span>
            <div className="tc-gauge-wrap">
              <div className="tc-gauge" style={{ '--gauge-deg': `${winsDeg}deg`, '--gauge-color': '#ffcc3a' } as React.CSSProperties}>
                <span className="tc-gauge-value">{wins}</span>
              </div>
            </div>
            <span className="tc-stat-sub">{gamesPlayed} partidas</span>
          </div>
          <div className="tc-stat-cell">
            <span className="tc-stat-label">Derrotas</span>
            <div className="tc-gauge-wrap">
              <div className="tc-gauge" style={{ '--gauge-deg': `${lossesDeg}deg`, '--gauge-color': '#ff6b6b' } as React.CSSProperties}>
                <span className="tc-gauge-value">{losses}</span>
              </div>
            </div>
            <span className="tc-stat-sub">{losses > 0 ? 'a superar' : 'invicto'}</span>
          </div>
          <div className="tc-stat-cell">
            <span className="tc-stat-label">% Victorias</span>
            <div className="tc-gauge-wrap">
              <div className="tc-gauge" style={{ '--gauge-deg': `${winrateDeg}deg`, '--gauge-color': 'var(--tc-accent-soft)' } as React.CSSProperties}>
                <span className="tc-gauge-value small">{winrate.toFixed(0)}%</span>
              </div>
            </div>
            <span className="tc-stat-sub">ratio de exito</span>
          </div>
        </div>
        <div className="tc-winrate-bar" style={{ marginTop: 18 }}>
          <div className="fill" style={{ width: `calc(${winrate}% - 4px)` }} />
          <div className="shimmer" />
          <div className="label">{winrate.toFixed(1)}% WIN RATE</div>
        </div>
      </div>
    </div>
  )
}
