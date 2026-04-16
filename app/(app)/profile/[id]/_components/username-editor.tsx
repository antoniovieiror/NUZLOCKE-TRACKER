'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { updateUsername } from '@/lib/actions/profile'
import { cn } from '@/lib/utils'

interface UsernameEditorProps {
  profileId: string
  initialUsername: string
  canEdit: boolean
}

export function UsernameEditor({
  profileId,
  initialUsername,
  canEdit,
}: UsernameEditorProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialUsername)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function startEditing() {
    if (!canEdit) return
    setValue(initialUsername)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function cancel() {
    setValue(initialUsername)
    setEditing(false)
  }

  function save() {
    const trimmed = value.trim()
    if (!trimmed || trimmed === initialUsername) {
      cancel()
      return
    }

    startTransition(async () => {
      const result = await updateUsername(profileId, trimmed)
      if (result.error) {
        toast.error('Error al guardar', { description: result.error })
        return
      }
      toast.success('Nombre actualizado')
      setEditing(false)
      router.refresh()
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') cancel()
  }

  if (!canEdit) {
    return (
      <h1 className="font-heading text-[clamp(22px,3vw,42px)] font-bold leading-none tracking-tight text-slate-100">
        {initialUsername}
      </h1>
    )
  }

  if (editing) {
    return (
      <div className="flex max-w-full items-center gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          maxLength={30}
          className={cn(
            'min-w-0 flex-1 border-b-2 border-cyan-300/50 bg-transparent pb-1',
            'font-heading text-[clamp(22px,3vw,42px)] font-bold leading-none tracking-tight text-slate-100',
            'focus:outline-none disabled:opacity-60',
          )}
        />
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          aria-label="Confirmar nombre"
          className="rounded-full bg-emerald-400/12 p-1.5 text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-40"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={isPending}
          aria-label="Cancelar"
          className="rounded-full bg-white/6 p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white/85 disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="group/username flex max-w-full items-center gap-2">
      <h1 className="truncate font-heading text-[clamp(22px,3vw,42px)] font-bold leading-none tracking-tight text-slate-100">
        {initialUsername}
      </h1>
      <button
        type="button"
        onClick={startEditing}
        aria-label="Editar nombre"
        className="rounded-full bg-white/0 p-1.5 text-white/40 opacity-0 transition group-hover/username:opacity-100 hover:bg-white/10 hover:text-cyan-200"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}