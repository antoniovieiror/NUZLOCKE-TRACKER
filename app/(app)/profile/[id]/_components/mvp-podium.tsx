'use client'

import { useEffect, useState } from 'react'

interface MvpPodiumProps {
  species: string
  nickname: string
}

export function MvpPodium({ species, nickname }: MvpPodiumProps) {
  const [sprite, setSprite] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`https://pokeapi.co/api/v2/pokemon/${species}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled)
          setSprite(data.sprites?.other?.['official-artwork']?.front_default ?? data.sprites?.front_default ?? null)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [species])

  return (
    <div className="tc-panel tc-fade-in-up">
      <span className="tc-mini-rivet tl" /><span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" /><span className="tc-mini-rivet br" />
      <div className="tc-panel-header"><h2>MVP</h2></div>
      <div className="tc-panel-inner">
        <div className="tc-mvp-stage">
          {sprite && (
            <div className="tc-mvp-poke" style={{ backgroundImage: `url(${sprite})` }} />
          )}
          <div className="tc-mvp-podium" />
          <div className="tc-mvp-name">{nickname || species.replace(/-/g, ' ')}</div>
          <div className="tc-mvp-species">{species.replace(/-/g, ' ')}</div>
          <div className="tc-mvp-tag">MVP</div>
        </div>
      </div>
    </div>
  )
}

export function MvpPodiumEmpty() {
  return (
    <div className="tc-panel tc-fade-in-up">
      <span className="tc-mini-rivet tl" /><span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" /><span className="tc-mini-rivet br" />
      <div className="tc-panel-header"><h2>MVP</h2></div>
      <div className="tc-panel-inner">
        <div className="tc-mvp-stage" style={{ padding: '24px 10px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#5d647a', textAlign: 'center' }}>
            Sin definir
          </p>
        </div>
      </div>
    </div>
  )
}
