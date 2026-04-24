import Link from 'next/link'
import { ChevronRight, Film, Trophy } from 'lucide-react'

export interface LastMatchData {
  matchId: string
  opponentId: string
  opponentUsername: string
  opponentAvatarUrl: string | null
  leagueTitle: string
  createdAt: string
  replayUrl: string | null
}

function relative(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const day = 86400000
  const days = Math.floor(diff / day)
  if (days < 1) return 'hoy'
  if (days === 1) return 'hace 1 día'
  if (days < 30) return `hace ${days} días`
  const months = Math.floor(days / 30)
  if (months === 1) return 'hace 1 mes'
  if (months < 12) return `hace ${months} meses`
  const years = Math.floor(months / 12)
  return years === 1 ? 'hace 1 año' : `hace ${years} años`
}

export function LastMatchPanel({ data }: { data: LastMatchData | null }) {
  return (
    <div className="tc-panel tc-fade-in-up">
      <span className="tc-mini-rivet tl" /><span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" /><span className="tc-mini-rivet br" />
      <div className="tc-panel-header tc-victory-header">
        <h2>Última Victoria</h2>
        {data && (
          <span className="tc-victory-timestamp">{relative(data.createdAt)}</span>
        )}
      </div>
      <div className="tc-panel-inner" style={{ padding: 14 }}>
        {!data ? (
          <div className="tc-last-empty">
            <Trophy size={30} strokeWidth={1.5} />
            <p>Sin victorias registradas todavía</p>
            <span className="tc-last-empty-hint">¡La primera está por llegar!</span>
          </div>
        ) : (
          <Link href={`/match/${data.matchId}`} className="tc-last-link">
            <div className="tc-last-body">
              <div className="tc-last-opponent">
                <div className="tc-last-avatar">
                  {data.opponentAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.opponentAvatarUrl} alt={data.opponentUsername} />
                  ) : (
                    <span>{data.opponentUsername.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="tc-last-trophy-badge" aria-hidden>
                  <Trophy size={12} strokeWidth={2.6} />
                </span>
              </div>
              <div className="tc-last-text">
                <div className="tc-last-label">DERROTADO</div>
                <div className="tc-last-name">{data.opponentUsername}</div>
                <div className="tc-last-meta">
                  <span className="tc-last-league">{data.leagueTitle}</span>
                  {data.replayUrl && (
                    <span className="tc-last-replay">
                      <Film size={10} strokeWidth={2.4} />
                      Replay
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} strokeWidth={2.2} className="tc-last-chevron" />
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
