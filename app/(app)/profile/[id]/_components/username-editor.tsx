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

export function UsernameEditor({ profileId, initialUsername, canEdit }: UsernameEditorProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialUsername)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function startEditing() {
    setValue(initialUsername)
    setEditing(true)
    // Focus after render
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
    return <h1 className="tc-trainer-name">{initialUsername}</h1>
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          maxLength={30}
          style={{
            background: 'rgba(0,200,232,0.08)',
            border: '1px solid #00c8e8',
            color: '#fff',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 30,
            textAlign: 'center',
            padding: '2px 8px',
            borderRadius: 6,
            outline: 'none',
            minWidth: 160,
          }}
        />
        <button
          onClick={save}
          disabled={isPending}
          aria-label="Confirmar nombre"
          className="text-green-500 hover:text-green-400 disabled:opacity-40 transition-colors"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={cancel}
          disabled={isPending}
          aria-label="Cancelar"
          className="text-[#5d647a] hover:text-white disabled:opacity-40 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 group/username cursor-pointer" onClick={startEditing}>
      <h1 className="tc-trainer-name" title="Click para editar">
        {initialUsername}
      </h1>
    </div>
  )
}
