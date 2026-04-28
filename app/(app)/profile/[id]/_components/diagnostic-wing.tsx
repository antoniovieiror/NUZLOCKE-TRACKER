import { Activity, Radio } from 'lucide-react'
import type { CSSProperties } from 'react'

import type { SaveSyncStatus } from '@/lib/types'

type LedTone = 'cyan' | 'amber' | 'red' | 'green' | 'grey'

const HOUR = 3_600_000

function badgeTone(badges: number): LedTone {
  if (badges >= 8) return 'cyan'
  if (badges >= 4) return 'amber'
  return 'red'
}

function deathsTone(deaths: number): LedTone {
  if (deaths === 0) return 'green'
  if (deaths <= 3) return 'amber'
  return 'red'
}

function teamTone(size: number): LedTone {
  if (size === 6) return 'cyan'
  if (size > 0) return 'amber'
  return 'red'
}

function syncTone(syncedAt: string | null, status: SaveSyncStatus): LedTone {
  if (status === 'failed') return 'red'
  if (status === 'never' || !syncedAt) return 'grey'
  const ageHours = (Date.now() - new Date(syncedAt).getTime()) / HOUR
  if (ageHours < 24) return 'green'
  if (ageHours < 24 * 7) return 'amber'
  return 'red'
}

function syncLabel(status: SaveSyncStatus, syncedAt: string | null): string {
  if (status === 'failed') return 'OFFLINE'
  if (status === 'never' || !syncedAt) return 'NEVER'
  const ageHours = (Date.now() - new Date(syncedAt).getTime()) / HOUR
  if (ageHours < 24) return 'STABLE'
  return 'STALE'
}

const EKG_PATH =
  'M0 30 L26 30 L34 30 L39 16 L44 44 L49 22 L54 38 L59 30 L100 30 L126 30 L134 30 L139 16 L144 44 L149 22 L154 38 L159 30 L200 30'

export function RunVitalsWing({
  badges,
  deaths,
  teamSize,
}: {
  badges: number
  deaths: number
  teamSize: number
}) {
  return (
    <div
      className="tc-wing tc-wing-vitals tc-panel tc-fade-in-up"
      role="status"
      aria-label="Estado de la run"
    >
      <span className="tc-mini-rivet tl" />
      <span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" />
      <span className="tc-mini-rivet br" />
      <div className="tc-panel-header">
        <h2>Run Vitals</h2>
        <Activity size={13} className="tc-wing-icon" aria-hidden />
      </div>
      <div className="tc-panel-inner tc-wing-inner">
        <div className="tc-wing-ekg" aria-hidden>
          <svg viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="tc-ekg-grad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="rgba(0,200,232,0)" />
                <stop offset="50%" stopColor="rgba(77,224,245,0.95)" />
                <stop offset="100%" stopColor="rgba(0,200,232,0)" />
              </linearGradient>
            </defs>
            <path className="tc-ekg-bg" d={EKG_PATH} />
            <path className="tc-ekg-trace" d={EKG_PATH} />
          </svg>
          <span className="tc-ekg-sweep" aria-hidden />
        </div>
        <ul className="tc-wing-leds">
          <li className={`tc-wing-led tc-wing-led-${badgeTone(badges)}`}>
            <span className="tc-wing-led-dot" aria-hidden />
            <span className="tc-wing-led-label">BDG</span>
            <span className="tc-wing-led-value">
              {String(badges).padStart(2, '0')}
            </span>
          </li>
          <li className={`tc-wing-led tc-wing-led-${deathsTone(deaths)}`}>
            <span className="tc-wing-led-dot" aria-hidden />
            <span className="tc-wing-led-label">KO</span>
            <span className="tc-wing-led-value">
              {String(deaths).padStart(2, '0')}
            </span>
          </li>
          <li className={`tc-wing-led tc-wing-led-${teamTone(teamSize)}`}>
            <span className="tc-wing-led-dot" aria-hidden />
            <span className="tc-wing-led-label">TM</span>
            <span className="tc-wing-led-value">{teamSize}/6</span>
          </li>
        </ul>
        <div className="tc-wing-readout">
          <span className="tc-wing-readout-dot tc-wing-led-cyan" aria-hidden />
          <span>STATUS: ACTIVE</span>
        </div>
      </div>
    </div>
  )
}

export function SysLinkWing({
  syncedAt,
  status,
}: {
  syncedAt: string | null
  status: SaveSyncStatus
}) {
  const tone = syncTone(syncedAt, status)
  const label = syncLabel(status, syncedAt)

  return (
    <div
      className="tc-wing tc-wing-syslink tc-panel tc-fade-in-up"
      role="status"
      aria-label="Estado de sincronización"
    >
      <span className="tc-mini-rivet tl" />
      <span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" />
      <span className="tc-mini-rivet br" />
      <div className="tc-panel-header">
        <h2>Sys.Link</h2>
        <Radio size={13} className="tc-wing-icon" aria-hidden />
      </div>
      <div className="tc-panel-inner tc-wing-inner">
        <div className="tc-wing-spectrum" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="tc-wing-bar"
              style={{ '--bar-i': i } as CSSProperties}
            />
          ))}
        </div>
        <div className="tc-wing-txrx">
          <span className="tc-wing-txrx-label">TX</span>
          <span className={`tc-wing-led-dot tc-wing-led-${tone} tc-wing-blink-a`} aria-hidden />
          <span className="tc-wing-txrx-spacer" />
          <span className={`tc-wing-led-dot tc-wing-led-${tone} tc-wing-blink-b`} aria-hidden />
          <span className="tc-wing-txrx-label">RX</span>
        </div>
        <div className="tc-wing-readout">
          <span className={`tc-wing-readout-dot tc-wing-led-${tone}`} aria-hidden />
          <span>LINK: {label}</span>
        </div>
      </div>
    </div>
  )
}
