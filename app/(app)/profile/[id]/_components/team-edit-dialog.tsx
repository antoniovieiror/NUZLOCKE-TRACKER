'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Search, Check, Crown } from 'lucide-react'
import { toast } from 'sonner'

import { updateTeam, updateMvp } from '@/lib/actions/profile'
import type { PokemonEntry } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// ─── PokéAPI cache ─────────────────────────────────────────────────────────────

interface PokeListItem { name: string; url: string }
let cachedPokemonList: PokeListItem[] | null = null
let listFetchPromise: Promise<PokeListItem[]> | null = null

async function getPokemonList(): Promise<PokeListItem[]> {
  if (cachedPokemonList) return cachedPokemonList
  if (listFetchPromise) return listFetchPromise
  listFetchPromise = fetch('https://pokeapi.co/api/v2/pokemon?limit=2000')
    .then((r) => r.json())
    .then((data) => { cachedPokemonList = data.results; return cachedPokemonList! })
  return listFetchPromise
}

// ─── Nickname inline editor ────────────────────────────────────────────────────

function NicknameEditor({
  nickname,
  onSave,
}: {
  nickname: string
  onSave: (nick: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(nickname)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setValue(nickname) }, [nickname])

  function startEditing() {
    setValue(nickname)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function save() {
    onSave(value.trim())
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') { setValue(nickname); setEditing(false) }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={save}
          maxLength={16}
          placeholder="Apodo…"
          className="text-xs font-semibold w-20 bg-transparent border-b border-primary focus:outline-none text-center pb-px"
        />
        <button onMouseDown={(e) => { e.preventDefault(); save() }} aria-label="Confirmar">
          <Check className="h-3 w-3 text-green-500" />
        </button>
      </div>
    )
  }

  return (
    <button
      className="flex items-center gap-1 cursor-pointer group/nick min-h-[16px]"
      onClick={startEditing}
      title="Editar apodo"
    >
      <span className={cn(
        'text-xs font-semibold text-center leading-none truncate max-w-[80px]',
        nickname ? 'text-foreground' : 'text-muted-foreground/40 italic'
      )}>
        {nickname || 'Apodo'}
      </span>
    </button>
  )
}

// ─── Pokémon card (for dialog grid) ──────────────────────────────────────────

function PokemonCard({
  entry,
  isMvp,
  onRemove,
  onNicknameChange,
  onToggleMvp,
}: {
  entry: PokemonEntry
  isMvp: boolean
  onRemove: () => void
  onNicknameChange: (nickname: string) => void
  onToggleMvp: () => void
}) {
  const [sprite, setSprite] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`https://pokeapi.co/api/v2/pokemon/${entry.species}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled)
          setSprite(
            data.sprites?.other?.['official-artwork']?.front_default ??
              data.sprites?.front_default ?? null
          )
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [entry.species])

  return (
    <div className="relative group/card flex flex-col items-center gap-1">
      <NicknameEditor nickname={entry.nickname} onSave={onNicknameChange} />

      <div className="relative w-16 h-16 sm:w-20 sm:h-20">
        {sprite ? (
          <img
            src={sprite}
            alt={entry.species}
            width={80}
            height={80}
            className={cn(
              'object-contain w-full h-full drop-shadow-sm transition-all duration-200',
              isMvp && 'drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]'
            )}
          />
        ) : (
          <Skeleton className="w-full h-full rounded-lg" />
        )}

        {/* Crown toggle */}
        <button
          onClick={onToggleMvp}
          aria-label={isMvp ? 'Quitar MVP' : 'Marcar como MVP'}
          title={isMvp ? 'Quitar MVP' : 'Marcar como MVP'}
          className={cn(
            'absolute -top-2 -left-2 z-10 flex items-center justify-center w-5 h-5 rounded-full',
            'shadow-sm transition-all duration-200',
            isMvp
              ? 'bg-amber-400 dark:bg-amber-500 shadow-amber-300/60 dark:shadow-amber-700/60 scale-110'
              : 'bg-muted/80 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-muted-foreground hover:text-amber-600'
          )}
        >
          <Crown className={cn('h-3 w-3 transition-colors', isMvp ? 'text-amber-900' : '')} />
        </button>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 z-10 flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-colors"
          aria-label={`Eliminar ${entry.species}`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <span className="text-[11px] text-muted-foreground capitalize text-center leading-tight truncate max-w-[80px]">
        {entry.species.replace(/-/g, ' ')}
      </span>
    </div>
  )
}

// ─── Empty slot ───────────────────────────────────────────────────────────────

function EmptySlot() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
        <span className="text-muted-foreground/40 text-2xl select-none">?</span>
      </div>
      <span className="text-[11px] text-muted-foreground/40">&mdash;</span>
    </div>
  )
}

// ─── Pokémon search ───────────────────────────────────────────────────────────

function PokemonSearch({
  onAdd,
  disabled,
  disabledReason,
}: {
  onAdd: (name: string) => void
  disabled?: boolean
  disabledReason?: string
}) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [listReady, setListReady] = useState(!!cachedPokemonList)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cachedPokemonList) { setListReady(true); return }
    setLoading(true)
    getPokemonList().then(() => { setListReady(true); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!listReady || query.length < 2) { setSuggestions([]); return }
    const q = query.toLowerCase()
    setSuggestions(
      (cachedPokemonList ?? []).filter((p) => p.name.startsWith(q)).slice(0, 8).map((p) => p.name)
    )
  }, [query, listReady])

  function select(name: string) {
    onAdd(name)
    setQuery('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  return (
    <div className="relative mt-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={disabled ? (disabledReason ?? 'Desactivado') : listReady ? 'Buscar Pokemon...' : 'Cargando Pokedex...'}
          disabled={disabled || !listReady}
          className="pl-8 text-sm"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
        )}
      </div>
      {suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-popover border rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((name) => (
            <li key={name}>
              <button
                className="w-full text-left px-3 py-1.5 text-sm capitalize hover:bg-accent transition-colors"
                onMouseDown={(e) => { e.preventDefault(); select(name) }}
              >
                {name.replace(/-/g, ' ')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

interface Props {
  profileId: string
  initialTeam: PokemonEntry[]
  initialMvp: string | null
}

export function TeamEditDialog({ profileId, initialTeam, initialMvp }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [team, setTeam] = useState<PokemonEntry[]>(initialTeam)
  const [mvp, setMvp] = useState<string | null>(initialMvp)
  const [isPending, startTransition] = useTransition()

  // Reset state when dialog opens
  function onOpenChange(next: boolean) {
    if (next) {
      setTeam(initialTeam)
      setMvp(initialMvp)
    }
    setOpen(next)
  }

  function saveTeam(next: PokemonEntry[], clearMvpSpecies?: string) {
    const prevTeam = team
    const prevMvp = mvp
    const shouldClear = !!clearMvpSpecies && mvp === clearMvpSpecies

    setTeam(next)
    if (shouldClear) setMvp(null)

    startTransition(async () => {
      const teamResult = await updateTeam(profileId, next)
      if (teamResult.error) {
        toast.error('Error al actualizar el equipo', { description: String(teamResult.error) })
        setTeam(prevTeam)
        if (shouldClear) setMvp(prevMvp)
        return
      }
      if (shouldClear) {
        await updateMvp(profileId, null)
      }
      router.refresh()
    })
  }

  function handleToggleMvp(species: string) {
    const next = mvp === species ? null : species
    const prev = mvp
    setMvp(next)
    startTransition(async () => {
      const result = await updateMvp(profileId, next)
      if (result.error) {
        toast.error('Error al actualizar el MVP', { description: String(result.error) })
        setMvp(prev)
        return
      }
      router.refresh()
    })
  }

  function addToTeam(species: string) {
    if (team.length >= 6) return
    if (team.some((e) => e.species === species)) {
      toast.warning(`${species} ya esta en tu equipo`)
      return
    }
    saveTeam([...team, { species, nickname: '' }])
  }

  function removeFromTeam(index: number) {
    const removed = team[index]
    saveTeam(
      team.filter((_, i) => i !== index),
      removed?.species
    )
  }

  function updateTeamNickname(index: number, nickname: string) {
    saveTeam(team.map((e, i) => (i === index ? { ...e, nickname } : e)))
  }

  const slots = Array.from({ length: 6 }, (_, i) => team[i] ?? null)

  return (
    <>
      <button className="tc-btn-edit" onClick={() => setOpen(true)}>
        Editar
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Equipo</DialogTitle>
            <DialogDescription>
              Busca y agrega Pokemon a tu equipo. Usa la corona para marcar tu MVP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              {team.length}/6 Pokemon
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                · Corona para marcar MVP
              </span>
            </p>

            <div className="grid gap-3 grid-cols-3 sm:grid-cols-6">
              {slots.map((entry, i) =>
                entry ? (
                  <PokemonCard
                    key={`${entry.species}-${i}`}
                    entry={entry}
                    isMvp={entry.species === mvp}
                    onRemove={() => removeFromTeam(i)}
                    onNicknameChange={(nick) => updateTeamNickname(i, nick)}
                    onToggleMvp={() => handleToggleMvp(entry.species)}
                  />
                ) : (
                  <EmptySlot key={`empty-${i}`} />
                )
              )}
            </div>

            <PokemonSearch
              onAdd={addToTeam}
              disabled={team.length >= 6}
              disabledReason="Equipo completo (6/6)"
            />

            {isPending && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Guardando...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
