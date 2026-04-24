'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Pencil, ShieldCheck, Skull, X, Zap } from 'lucide-react'
import { toast } from 'sonner'

import { updateWipes } from '@/lib/actions/profile'

export function NuzlockeStats({
  profileId,
  deaths,
  initialWipes,
  canEdit,
}: {
  profileId: string
  deaths: number
  initialWipes: number
  canEdit: boolean
}) {
  const router = useRouter()
  const [wipes, setWipes] = useState(initialWipes)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialWipes)
  const [isPending, startTransition] = useTransition()

  function startEdit() {
    if (!canEdit) return
    setDraft(wipes)
    setEditing(true)
  }

  function save() {
    const value = Math.max(0, Math.floor(Number(draft) || 0))
    if (value === wipes) { setEditing(false); return }
    const prev = wipes
    setWipes(value)
    setEditing(false)
    startTransition(async () => {
      const res = await updateWipes(profileId, value)
      if (res.error) {
        toast.error('Error al guardar wipes', { description: String(res.error) })
        setWipes(prev)
        return
      }
      router.refresh()
    })
  }

  function cancel() { setEditing(false) }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { e.preventDefault(); cancel() }
    if (e.key === 'Enter') { e.preventDefault(); save() }
  }

  return (
    <div className="tc-panel tc-fade-in-up">
      <span className="tc-mini-rivet tl" /><span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" /><span className="tc-mini-rivet br" />
      <div className="tc-panel-header"><h2>Nuzlocke Stats</h2></div>
      <div className="tc-panel-inner">
        <div className="flex flex-col gap-2.5">
          <div className="tc-nuz-row">
            <span className="lbl">
              <Skull size={15} strokeWidth={2.3} className="tc-nuz-glyph red" />
              Muertes
            </span>
            <span className={`val ${deaths > 0 ? 'red' : ''}`}>{deaths}</span>
          </div>

          <div
            className={`tc-nuz-row ${canEdit && !editing ? 'editable' : ''}`}
            onClick={canEdit && !editing ? startEdit : undefined}
            role={canEdit && !editing ? 'button' : undefined}
            tabIndex={canEdit && !editing ? 0 : undefined}
            onKeyDown={canEdit && !editing ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit() }
            } : undefined}
          >
            <span className="lbl">
              <Zap size={15} strokeWidth={2.3} className="tc-nuz-glyph amber" />
              Wipes
            </span>
            {editing ? (
              <div className="tc-nuz-edit" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="tc-nuz-step"
                  onClick={() => setDraft((d) => Math.max(0, d - 1))}
                  disabled={isPending}
                  aria-label="Disminuir"
                >
                  &minus;
                </button>
                <input
                  type="number"
                  min={0}
                  className="tc-nuz-input"
                  value={draft}
                  onChange={(e) => setDraft(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  onKeyDown={handleKeyDown}
                  disabled={isPending}
                  autoFocus
                />
                <button
                  type="button"
                  className="tc-nuz-step"
                  onClick={() => setDraft((d) => d + 1)}
                  disabled={isPending}
                  aria-label="Aumentar"
                >
                  +
                </button>
                <button
                  type="button"
                  className="tc-nuz-confirm save"
                  onClick={save}
                  disabled={isPending}
                  aria-label="Guardar"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={2.8} />}
                </button>
                <button
                  type="button"
                  className="tc-nuz-confirm cancel"
                  onClick={cancel}
                  disabled={isPending}
                  aria-label="Cancelar"
                >
                  <X size={12} strokeWidth={2.8} />
                </button>
              </div>
            ) : (
              <span className={`val ${wipes > 0 ? 'amber' : 'green'}`}>
                {wipes}
                {canEdit && <Pencil size={10} strokeWidth={2.6} className="tc-nuz-pencil" />}
              </span>
            )}
          </div>

          {deaths === 0 && wipes === 0 && (
            <div className="tc-nuz-cert-wrap">
              <span className="tc-cert-badge">
                <ShieldCheck size={11} strokeWidth={2.6} />
                Nuzlocke Certified
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
