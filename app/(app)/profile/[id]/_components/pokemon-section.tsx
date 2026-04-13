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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  if (!canEdit) {
    return nickname ? (
      <span className="text-[10px] font-semibold text-center leading-none truncate max-w-[72px] sm:max-w-[80px]">
        {nickname}
      </span>
    ) : null
  }

  if (editing) {
    return (
      <div className="flex items-center gap-0.5">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={save}
          maxLength={16}
          placeholder="Apodo…"
          className="text-[10px] font-semibold w-14 sm:w-16 bg-transparent border-b border-primary focus:outline-none text-center pb-px"
        />
        <button onMouseDown={(e) => { e.preventDefault(); save() }} aria-label="Confirmar">
          <Check className="h-2.5 w-2.5 text-green-500" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-0.5 cursor-pointer group/nick min-h-[14px]"
      onClick={startEditing}
      title="Editar apodo"
    >
      <span className={cn(
        'text-[10px] font-semibold text-center leading-none truncate max-w-[72px] sm:max-w-[80px]',
        nickname ? 'text-foreground' : 'text-muted-foreground/40 italic'
      )}>
        {nickname || 'Apodo'}
      </span>
      <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover/nick:opacity-100 transition-opacity shrink-0" />
    </div>
  )
}

// ─── Individual Pokémon card ───────────────────────────────────────────────────

interface PokemonCardProps {
  entry: PokemonEntry
  canEdit: boolean
  editMode: boolean
  isMvp: boolean
  onRemove: () => void
  onNicknameChange: (nickname: string) => void
  onToggleMvp: () => void
  isTeam: boolean // crown only on team cards
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
}: PokemonCardProps) {
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
    <div className="relative group/card flex flex-col items-center gap-0.5">
      {/* Nickname */}
      <NicknameEditor nickname={entry.nickname} canEdit={canEdit} onSave={onNicknameChange} />

      {/* Sprite container */}
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

        {/* Crown toggle — top-left, only on team cards in edit mode */}
        {isTeam && editMode && canEdit && (
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
        )}

        {/* MVP glow ring when not in edit mode */}
        {isTeam && isMvp && !editMode && (
          <span className="absolute -top-2 -right-2 text-xs select-none drop-shadow" aria-hidden>
            👑
          </span>
        )}

        {/* Remove button — top-right */}
        {editMode && (
          <button
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 z-10 flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-colors"
            aria-label={`Eliminar ${entry.species}`}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Species name */}
      <span className="text-[11px] text-muted-foreground capitalize text-center leading-tight max-w-[80px] truncate">
        {entry.species.replace(/-/g, ' ')}
      </span>
    </div>
  )
}

// ─── Empty slot ────────────────────────────────────────────────────────────────

function EmptySlot() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
        <span className="text-muted-foreground/40 text-2xl select-none">?</span>
      </div>
      <span className="text-[11px] text-muted-foreground/40">—</span>
    </div>
  )
}

// ─── Autocomplete search ───────────────────────────────────────────────────────

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
    <div className="relative mt-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={disabled ? (disabledReason ?? 'Desactivado') : listReady ? 'Buscar Pokémon…' : 'Cargando Pokédex…'}
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

// ─── Pokemon grid ──────────────────────────────────────────────────────────────

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
  addDisabled,
  addDisabledReason,
  emptyMessage = 'Nada aquí todavía.',
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
  addDisabled?: boolean
  addDisabledReason?: string
  emptyMessage?: string
}) {
  const cells = slots
    ? Array.from({ length: slots }, (_, i) => pokemon[i] ?? null)
    : pokemon

  return (
    <div>
      {cells.length === 0 && !slots ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{emptyMessage}</p>
      ) : (
        <div className={cn(
          'grid gap-3',
          slots === 6 ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8'
        )}>
          {cells.map((entry, i) =>
            entry ? (
              <PokemonCard
                key={`${entry.species}-${i}`}
                entry={entry}
                canEdit={canEdit}
                editMode={editMode}
                isMvp={isTeam && entry.species === mvpSpecies}
                isTeam={isTeam}
                onRemove={() => onRemove(i)}
                onNicknameChange={(nick) => onNicknameChange(i, nick)}
                onToggleMvp={() => onToggleMvp(entry.species)}
              />
            ) : slots ? (
              <EmptySlot key={`empty-${i}`} />
            ) : null
          )}
        </div>
      )}
      {editMode && (
        <PokemonSearch onAdd={onAdd} disabled={addDisabled} disabledReason={addDisabledReason} />
      )}
    </div>
  )
}

// ─── Main exported component ───────────────────────────────────────────────────

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

  // ── Team save helper ──

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

  // ── Box save helper ──

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

  // ── MVP toggle ──

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
      router.refresh() // re-renders Nuzlocke State card with updated MVP display
    })
  }

  // ── Team handlers ──

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
      removed?.species // pass species so saveTeam can clear MVP if needed
    )
  }

  function updateTeamNickname(index: number, nickname: string) {
    saveTeam(team.map((e, i) => (i === index ? { ...e, nickname } : e)))
  }

  // ── Box handlers ──

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
    <div className="space-y-4">
      {/* ── Team ── */}
      <Card className="overflow-visible">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Equipo Activo</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {team.length}/6 Pokémon
              {teamEditMode && canEdit && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  · 👑 para marcar MVP
                </span>
              )}
            </p>
          </div>
          {canEdit && (
            <Button
              variant={teamEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTeamEditMode((v) => !v)}
              disabled={isPending}
              className="gap-1.5 shrink-0"
            >
              {teamEditMode ? 'Listo' : <><Plus className="h-3.5 w-3.5" />Editar</>}
            </Button>
          )}
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* ── Box ── */}
      <Card className="overflow-visible">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Caja PC</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{box.length} Pokémon almacenados</p>
          </div>
          {canEdit && (
            <Button
              variant={boxEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBoxEditMode((v) => !v)}
              disabled={isPending}
              className="gap-1.5 shrink-0"
            >
              {boxEditMode ? 'Listo' : <><Plus className="h-3.5 w-3.5" />Editar</>}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <PokemonGrid
            pokemon={box}
            canEdit={canEdit}
            editMode={boxEditMode}
            mvpSpecies={null}
            isTeam={false}
            onRemove={removeFromBox}
            onAdd={addToBox}
            onNicknameChange={updateBoxNickname}
            onToggleMvp={() => {}}
            emptyMessage="La caja está vacía. Añade Pokémon que formen parte de tu partida pero no estén en tu equipo activo."
          />
        </CardContent>
      </Card>
    </div>
  )
}
