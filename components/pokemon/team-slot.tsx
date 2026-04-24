'use client'

import { useEffect, useState } from 'react'
import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { PokemonEntry } from '@/lib/types'

interface TeamSlotProps {
  entry: PokemonEntry | null
  isMvp?: boolean
}

export function TeamSlot({ entry, isMvp = false }: TeamSlotProps) {
  const [sprite, setSprite] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!entry) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`https://pokeapi.co/api/v2/pokemon/${entry.species}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setSprite(
          data.sprites?.other?.['official-artwork']?.front_default ??
            data.sprites?.front_default ??
            null,
        )
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [entry])

  if (!entry) {
    return (
      <div className="mv-team-slot is-empty" aria-hidden>
        <div className="mv-team-slot-sprite" />
      </div>
    )
  }

  return (
    <div className={cn('mv-team-slot', isMvp && 'is-mvp')}>
      {isMvp && (
        <span className="mv-team-slot-crown" aria-label="MVP">
          <Crown className="h-3 w-3" strokeWidth={2.6} />
        </span>
      )}
      <div className="mv-team-slot-sprite">
        {loading ? (
          <Skeleton className="w-full h-full rounded-md" />
        ) : sprite ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sprite}
            alt={entry.nickname || entry.species}
            className={cn(
              'w-full h-full object-contain transition-all',
              isMvp && 'drop-shadow-[0_0_10px_rgba(251,191,36,0.85)]',
            )}
          />
        ) : (
          <div className="mv-team-slot-fallback">?</div>
        )}
      </div>
      <span className="mv-team-slot-name" title={entry.nickname || entry.species}>
        {entry.nickname || entry.species}
      </span>
    </div>
  )
}
