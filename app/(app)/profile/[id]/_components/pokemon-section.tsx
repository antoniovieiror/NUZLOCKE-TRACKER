'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, Search, Pencil, Check, Crown } from 'lucide-react'
import { toast } from 'sonner'

import { updateTeam, updateBox, updateMvp } from '@/lib/actions/profile'
import type { PokemonEntry } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ActiveTeamDisplay } from './active-team-display'

function HubCard({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(12,16,28,0.97), rgba(7,10,18,0.98))',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: [
          'inset 0 1px 0 rgba(255,255,255,0.07)',
          'inset 0 -1px 0 rgba(0,0,0,0.6)',
          '0 10px 24px rgba(0,0,0,0.35)',
          '0 0 0 1px rgba(0,200,232,0.05)',
        ].join(', '),
      }}
    >
      <div
        className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3"
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: '#00c8e8',
                boxShadow: '0 0 10px rgba(0,200,232,0.65)',
              }}
            />
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200/90">
              {title}
            </span>
          </div>
          {subtitle && (
            <p className="mt-1 font-heading text-[11px] text-white/42">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

interface PokeListItem {
  name: string
  url: string
}

let cachedPokemonList: PokeListItem[] | null = null
let listFetchPromise: Promise<PokeListItem[]> | null = null

async function getPokemonList(): Promise<PokeListItem[]> {
  if (cachedPokemonList) return cachedPokemonList
  if (listFetchPromise) return listFetchPromise

  listFetchPromise = fetch('https://pokeapi.co/api/v2/pokemon?limit=2000')
    .then((r) => r.json())
    .then((data) => {
      cachedPokemonList = data.results
      return cachedPokemonList!
    })

  return listFetchPromise
}

function NicknameEditor({
  nickname,
  canEdit,
  onSave,
}: {
  nickname: string
  canEdit: boolean
  onSave: (nick: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(nickname)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(nickname)
  }, [nickname])

  function startEditing() {
    if (!canEdit) return
    setValue(nickname)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function save() {
    onSave(value.trim())
    setEditing(false)
  }

  function cancel() {
    setValue(nickname)
    setEditing(false)
  }

  if (!canEdit) {
    return nickname ? (
      <span className="max-w-[84px] truncate text-center text-[10px] font-semibold leading-none text-white/86">
        {nickname}
      </span>
    ) : null
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') cancel()
          }}
          maxLength={16}
          placeholder="Apodo"
          className="w-16 border-b border-cyan-300/35 bg-transparent pb-px text-center text-[10px] font-semibold text-white focus:outline-none"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            save()
          }}
          aria-label="Guardar apodo"
        >
          <Check className="h-3 w-3 text-green-400" />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="group/nick inline-flex min-h-[16px] items-center gap-1"
      onClick={startEditing}
      title="Editar apodo"
    >
      <span
        className={cn(
          'max-w-[84px] truncate text-center text-[10px] font-semibold leading-none',
          nickname ? 'text-white/86' : 'italic text-white/32',
        )}
      >
        {nickname || 'Apodo'}
      </span>
      <Pencil className="h-2.5 w-2.5 shrink-0 text-white/28 opacity-0 transition-opacity group-hover/nick:opacity-100" />
    </button>
  )
}

interface PokemonCardProps {
  entry: PokemonEntry
  canEdit: boolean
  editMode: boolean
  isMvp: boolean
  onRemove: () => void
  onNicknameChange: (nickname: string) => void
  onToggleMvp: () => void
  isTeam: boolean
  compact?: boolean
}

function PokemonCard({
  entry,
  canEdit,
  editMode,
  isMvp,
  onRemove,
  onNicknameChange,
  onToggleMvp,
  isTeam,
  compact = false,
}: PokemonCardProps) {
  const [sprite, setSprite] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(`https://pokeapi.co/api/v2/pokemon/${entry.species}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setSprite(
            data.sprites?.other?.['official-artwork']?.front_default ??
              data.sprites?.front_default ??
              null,
          )
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [entry.species])

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-1 rounded-xl border border-white/6 bg-white/[0.03] p-2',
        compact ? 'min-h-[118px]' : 'min-h-[132px]',
      )}
    >
      <div className="min-h-[16px]">
        <NicknameEditor nickname={entry.nickname} canEdit={canEdit} onSave={onNicknameChange} />
      </div>

      <div className={cn('relative', compact ? 'h-14 w-14' : 'h-16 w-16 sm:h-20 sm:w-20')}>
        {sprite ? (
          <img
            src={sprite}
            alt={entry.species}
            className={cn(
              'h-full w-full object-contain transition-all duration-200',
              isMvp && 'drop-shadow-[0_0_10px_rgba(251,191,36,0.75)]',
            )}
          />
        ) : (
          <Skeleton className="h-full w-full rounded-lg" />
        )}

        {isTeam && editMode && canEdit && (
          <button
            type="button"
            onClick={onToggleMvp}
            aria-label={isMvp ? 'Quitar MVP' : 'Marcar como MVP'}
            title={isMvp ? 'Quitar MVP' : 'Marcar como MVP'}
            className={cn(
              'absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full shadow-md transition-all',
              isMvp
                ? 'bg-amber-400 text-amber-950'
                : 'bg-black/60 text-white/65 hover:bg-amber-400/20 hover:text-amber-300',
            )}
          >
            <Crown className="h-3 w-3" />
          </button>
        )}

        {editMode && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Eliminar ${entry.species}`}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition hover:bg-red-400"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="max-w-full truncate text-center text-[11px] capitalize leading-tight text-white/60">
        {entry.species.replace(/-/g, ' ')}
      </div>

      {isTeam && isMvp && !editMode && (
        <div className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-200">
          MVP
        </div>
      )}
    </div>
  )
}

function EmptySlot() {
  return (
    <div className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
      <div className="text-2xl text-white/18">?</div>
      <span className="text-[11px] text-white/28">Vacío</span>
    </div>
  )
}

function PokemonSearch({
  onAdd,
  disabled,
  disabledReason,
}: {
  onAdd: (name: string) => void
  disabled?: boolean
  disabledReason?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [listReady, setListReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [allPokemon, setAllPokemon] = useState<PokeListItem[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getPokemonList()
      .then((list) => {
        if (!mounted) return
        setAllPokemon(list)
        setListReady(true)
      })
      .catch(() => {
        toast.error('No se pudo cargar la Pokédex')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setSuggestions([])
      return
    }

    const next = allPokemon
      .map((p) => p.name)
      .filter((name) => name.includes(q))
      .slice(0, 8)

    setSuggestions(next)
  }, [query, allPokemon])

  function select(name: string) {
    onAdd(name)
    setQuery('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  return (
    <div className="relative mt-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/36" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            disabled
              ? disabledReason ?? 'Desactivado'
              : listReady
              ? 'Buscar Pokémon…'
              : 'Cargando Pokédex…'
          }
          disabled={disabled || !listReady}
          autoComplete="off"
          className="border-white/10 bg-black/20 pl-9 text-sm text-white placeholder:text-white/30"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-white/35" />
        )}
      </div>

      {suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b1020] shadow-2xl">
          {suggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm capitalize text-white/82 transition hover:bg-white/6"
                onMouseDown={(e) => {
                  e.preventDefault()
                  select(name)
                }}
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

function PokemonGrid({
  pokemon,
  canEdit,
  editMode,
  mvpSpecies,
  isTeam,
  onRemove,
  onAdd,
  onNicknameChange,
  onToggleMvp,
  slots,
  compact = false,
  addDisabled,
  addDisabledReason,
  emptyMessage = 'Nada aquí todavía.',
  maxHeight,
}: {
  pokemon: PokemonEntry[]
  canEdit: boolean
  editMode: boolean
  mvpSpecies: string | null
  isTeam: boolean
  onRemove: (index: number) => void
  onAdd: (name: string) => void
  onNicknameChange: (index: number, nickname: string) => void
  onToggleMvp: (species: string) => void
  slots?: number
  compact?: boolean
  addDisabled?: boolean
  addDisabledReason?: string
  emptyMessage?: string
  maxHeight?: string
}) {
  const cells = slots ? Array.from({ length: slots }, (_, i) => pokemon[i] ?? null) : pokemon

  return (
    <div>
      {cells.length === 0 && !slots ? (
        <p className="py-6 text-center text-sm text-white/40">{emptyMessage}</p>
      ) : (
        <div
          className={cn(maxHeight && 'hud-scrollbar overflow-y-auto pr-1')}
          style={maxHeight ? { maxHeight } : undefined}
        >
          <div
            className={cn(
              'grid',
              compact
                ? 'grid-cols-4 gap-2'
                : slots === 6
                ? 'grid-cols-2 gap-3 sm:grid-cols-3'
                : 'grid-cols-4 gap-2',
            )}
          >
            {cells.map((entry, i) =>
              entry ? (
                <PokemonCard
                  key={`${entry.species}-${i}`}
                  entry={entry}
                  canEdit={canEdit}
                  editMode={editMode}
                  isMvp={isTeam && entry.species === mvpSpecies}
                  isTeam={isTeam}
                  compact={compact}
                  onRemove={() => onRemove(i)}
                  onNicknameChange={(nick) => onNicknameChange(i, nick)}
                  onToggleMvp={() => onToggleMvp(entry.species)}
                />
              ) : slots ? (
                <EmptySlot key={`empty-${i}`} />
              ) : null,
            )}
          </div>
        </div>
      )}

      {editMode && (
        <PokemonSearch onAdd={onAdd} disabled={addDisabled} disabledReason={addDisabledReason} />
      )}
    </div>
  )
}

export function PokemonSection({
  profileId,
  initialTeam,
  initialBox,
  initialMvp,
  canEdit,
}: {
  profileId: string
  initialTeam: PokemonEntry[]
  initialBox: PokemonEntry[]
  initialMvp: string | null
  canEdit: boolean
}) {
  const router = useRouter()
  const [team, setTeam] = useState<PokemonEntry[]>(initialTeam)
  const [box, setBox] = useState<PokemonEntry[]>(initialBox)
  const [mvp, setMvp] = useState<string | null>(initialMvp)
  const [teamEditMode, setTeamEditMode] = useState(false)
  const [boxEditMode, setBoxEditMode] = useState(false)
  const [isPending, startTransition] = useTransition()

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
        router.refresh()
      }
    })
  }

  function saveBox(next: PokemonEntry[]) {
    const prev = box
    setBox(next)

    startTransition(async () => {
      const result = await updateBox(profileId, next)
      if (result.error) {
        toast.error('Error al actualizar la caja', { description: String(result.error) })
        setBox(prev)
      }
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
      toast.warning(`${species} ya está en tu equipo`)
      return
    }
    saveTeam([...team, { species, nickname: '' }])
  }

  function removeFromTeam(index: number) {
    const removed = team[index]
    saveTeam(
      team.filter((_, i) => i !== index),
      removed?.species,
    )
  }

  function updateTeamNickname(index: number, nickname: string) {
    saveTeam(team.map((e, i) => (i === index ? { ...e, nickname } : e)))
  }

  function addToBox(species: string) {
    if (box.some((e) => e.species === species)) {
      toast.warning(`${species} ya está en tu caja`)
      return
    }
    saveBox([...box, { species, nickname: '' }])
  }

  function removeFromBox(index: number) {
    saveBox(box.filter((_, i) => i !== index))
  }

  function updateBoxNickname(index: number, nickname: string) {
    saveBox(box.map((e, i) => (i === index ? { ...e, nickname } : e)))
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <HubCard
        title="Team Hub"
        subtitle={teamEditMode && canEdit ? 'Modo edición · 👑 para MVP' : 'Equipo activo'}
        className="flex-[0_0_40%]"
        action={
          canEdit ? (
            <Button
              variant={teamEditMode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTeamEditMode((v) => !v)}
              disabled={isPending}
              className="h-8 gap-1.5 border-white/10 bg-white/5 px-2.5 text-xs text-white/84 hover:bg-white/10"
            >
              {teamEditMode ? 'Listo' : (
                <>
                  <Plus className="h-3 w-3" />
                  Editar
                </>
              )}
            </Button>
          ) : undefined
        }
      >
        {teamEditMode ? (
          <PokemonGrid
            pokemon={team}
            canEdit={canEdit}
            editMode={teamEditMode}
            mvpSpecies={mvp}
            isTeam
            onRemove={removeFromTeam}
            onAdd={addToTeam}
            onNicknameChange={updateTeamNickname}
            onToggleMvp={handleToggleMvp}
            slots={6}
            addDisabled={team.length >= 6}
            addDisabledReason="Equipo completo (6/6)"
          />
        ) : (
          <>
            <ActiveTeamDisplay team={team} />
            <div className="mt-3 flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm">
              <span className="text-white/48">Equipo activo</span>
              <span className="font-heading text-[24px] font-bold text-cyan-100">{team.length}/6 Pokémon</span>
            </div>
          </>
        )}
      </HubCard>

      <HubCard
        title="PC Storage"
        subtitle={`${box.length} Pokémon almacenados`}
        className="min-h-0 flex-1"
        action={
          canEdit ? (
            <Button
              variant={boxEditMode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBoxEditMode((v) => !v)}
              disabled={isPending}
              className="h-8 gap-1.5 border-white/10 bg-white/5 px-2.5 text-xs text-white/84 hover:bg-white/10"
            >
              {boxEditMode ? 'Listo' : (
                <>
                  <Plus className="h-3 w-3" />
                  Editar
                </>
              )}
            </Button>
          ) : undefined
        }
      >
        <PokemonGrid
          pokemon={box}
          canEdit={canEdit}
          editMode={boxEditMode}
          mvpSpecies={null}
          isTeam={false}
          compact
          onRemove={removeFromBox}
          onAdd={addToBox}
          onNicknameChange={updateBoxNickname}
          onToggleMvp={() => {}}
          emptyMessage="La caja está vacía."
          maxHeight={boxEditMode ? '420px' : '300px'}
        />
      </HubCard>
    </div>
  )
}