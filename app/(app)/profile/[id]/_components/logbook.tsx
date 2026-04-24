'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'

import { updateNotes } from '@/lib/actions/profile'

const MAX_NOTES = 1000

export function Logbook({
  profileId,
  initialNotes,
  canEdit,
}: {
  profileId: string
  initialNotes: string | null
  canEdit: boolean
}) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialNotes ?? '')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setNotes(initialNotes ?? '') }, [initialNotes])

  function startEdit() {
    if (!canEdit) return
    setDraft(notes)
    setEditing(true)
    setTimeout(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.selectionStart = el.selectionEnd = el.value.length
    }, 0)
  }

  function cancel() {
    setDraft(notes)
    setEditing(false)
  }

  function save() {
    const trimmed = draft.trim().slice(0, MAX_NOTES)
    if (trimmed === notes) { setEditing(false); return }
    const prev = notes
    setNotes(trimmed)
    setEditing(false)
    startTransition(async () => {
      const res = await updateNotes(profileId, trimmed)
      if (res.error) {
        toast.error('Error al guardar las notas', { description: String(res.error) })
        setNotes(prev)
        return
      }
      router.refresh()
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') { e.preventDefault(); cancel() }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save() }
  }

  return (
    <div className="tc-panel tc-fade-in-up">
      <span className="tc-mini-rivet tl" /><span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" /><span className="tc-mini-rivet br" />
      <div className="tc-panel-header">
        <h2>Log Book</h2>
      </div>
      <div className="tc-panel-inner" style={{ padding: 14 }}>
        <div className={`tc-logbook ${editing ? 'editing' : ''} ${canEdit && !editing ? 'tc-logbook-editable' : ''}`}>
          <div className="tc-logbook-title">Notas</div>

          {editing ? (
            <>
              <textarea
                ref={textareaRef}
                className="tc-logbook-textarea"
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_NOTES))}
                onKeyDown={handleKeyDown}
                placeholder="Pensamientos sobre tu partida, momentos memorables…"
                maxLength={MAX_NOTES}
                rows={5}
                disabled={isPending}
              />
              <div className="tc-logbook-controls">
                <span className="tc-logbook-counter">
                  {draft.length}/{MAX_NOTES}
                </span>
                <div className="tc-logbook-actions">
                  <button
                    type="button"
                    className="tc-logbook-btn cancel"
                    onClick={cancel}
                    disabled={isPending}
                  >
                    <X size={12} strokeWidth={2.8} />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="tc-logbook-btn save"
                    onClick={save}
                    disabled={isPending}
                  >
                    {isPending
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Check size={12} strokeWidth={2.8} />}
                    Guardar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <button
              type="button"
              className={`tc-logbook-text ${!notes ? 'empty' : ''} ${canEdit ? 'clickable' : ''}`}
              onClick={startEdit}
              disabled={!canEdit}
            >
              <span className="tc-logbook-body">
                {notes || 'Sin notas todavia'}
              </span>
              {canEdit && (
                <span className="tc-logbook-hint">
                  <Pencil size={10} strokeWidth={2.8} />
                  Haz clic para editar
                </span>
              )}
            </button>
          )}

          {!editing && (
            <div className="tc-logbook-pencil" aria-hidden>
              &#x270E;
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
