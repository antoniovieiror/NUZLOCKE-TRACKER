'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { PokemonEntry } from '@/lib/types'

const SLOT_POSITIONS = [
  { left: '28%', top: '23%', labelTop: '36%' },
  { left: '50%', top: '10%', labelTop: '24%' },
  { left: '72%', top: '23%', labelTop: '36%' },
  { left: '28%', top: '74%', labelTop: '87%' },
  { left: '50%', top: '87%', labelTop: '99%' },
  { left: '72%', top: '74%', labelTop: '87%' },
] as const

const spriteCache: Record<string, string | null> = {}

async function fetchSprite(species: string): Promise<string | null> {
  if (species in spriteCache) return spriteCache[species]

  try {
    const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${species}`)
    const data = await r.json()
    const sprite =
      data.sprites?.other?.['official-artwork']?.front_default ??
      data.sprites?.front_default ??
      null
    spriteCache[species] = sprite
    return sprite
  } catch {
    spriteCache[species] = null
    return null
  }
}

function SpriteSlot({ species }: { species: string }) {
  const [sprite, setSprite] = useState<string | null | 'loading'>('loading')

  useEffect(() => {
    let cancelled = false
    if (species in spriteCache) {
      setSprite(spriteCache[species])
      return
    }

    setSprite('loading')
    fetchSprite(species).then((s) => {
      if (!cancelled) setSprite(s)
    })

    return () => {
      cancelled = true
    }
  }, [species])

  if (sprite === 'loading') {
    return <Skeleton className="h-full w-full rounded-full" />
  }

  if (!sprite) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-full bg-cyan-400/5 text-xs text-white/25">
        ?
      </div>
    )
  }

  return (
    <img
      src={sprite}
      alt={species}
      className="h-full w-full object-contain"
      style={{
        filter:
          'drop-shadow(0 0 10px rgba(0,200,232,0.35)) drop-shadow(0 2px 8px rgba(0,0,0,0.65))',
      }}
    />
  )
}

export function ActiveTeamDisplay({ team }: { team: PokemonEntry[] }) {
  return (
    <div
      className="relative mx-auto w-full"
      style={{
        maxWidth: '620px',
        aspectRatio: '1600 / 980',
      }}
    >
      <div className="absolute inset-0 z-[1]">
        {SLOT_POSITIONS.map((slot, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: slot.left,
              top: slot.top,
              width: '18%',
              aspectRatio: '1 / 1',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {team[i] ? (
              <SpriteSlot species={team[i].species} />
            ) : (
              <div
                className="h-full w-full rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed rgba(255,255,255,0.10)',
                }}
              />
            )}
          </div>
        ))}
      </div>

      <img
        src="/ASSETS/current-team-asset.png"
        alt=""
        aria-hidden
        className="absolute inset-0 z-10 h-full w-full object-fill pointer-events-none"
      />

      <div className="pointer-events-none absolute inset-0 z-20">
        {SLOT_POSITIONS.map((slot, i) => {
          const entry = team[i]
          if (!entry) return null

          const nickname = entry.nickname || entry.species.replace(/-/g, ' ')
          const species = entry.species.replace(/-/g, ' ')

          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 text-center"
              style={{
                left: slot.left,
                top: slot.labelTop,
                width: '29%',
              }}
            >
              <div
                className="truncate font-heading text-[clamp(11px,1.25vw,16px)] font-bold uppercase leading-none text-white"
                style={{
                  textShadow: '0 0 10px rgba(0,0,0,0.95), 0 0 8px rgba(0,200,232,0.35)',
                }}
              >
                {nickname}
              </div>
              <div
                className="truncate font-heading text-[clamp(10px,1vw,13px)] leading-none text-white/74"
                style={{
                  textShadow: '0 0 8px rgba(0,0,0,0.95)',
                }}
              >
                {species}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}