'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, ExternalLink, AlertTriangle, Film, Crown, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { castVote, setReplayUrl } from '@/lib/actions/match'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Vote } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────────────────────

interface VoteCardProps {
  matchId: string
  status: 'pending' | 'validated' | 'disputed' | 'voided' | 'admin_resolved'
  currentUserId: string
  playerAId: string
  playerBId: string
  playerAUsername: string
  playerBUsername: string
  playerAAvatar: string | null
  playerBAvatar: string | null
  myVote: Vote | null
  otherVoted: boolean
  replayUrl: string | null
  winnerId: string | null
}

// ─── Component ──────────────────────────────────────────────────────────

export function VoteCard({
  matchId,
  status,
  currentUserId,
  playerAId,
  playerBId,
  playerAUsername,
  playerBUsername,
  playerAAvatar,
  playerBAvatar,
  myVote,
  otherVoted,
  replayUrl,
  winnerId,
}: VoteCardProps) {
  const [isPending, startTransition] = useTransition()
  const [replayInput, setReplayInput] = useState(replayUrl ?? '')
  const [editingReplay, setEditingReplay] = useState(false)
  const [replayPending, startReplayTransition] = useTransition()

  const isPlayerA = currentUserId === playerAId
  const isPlayerB = currentUserId === playerBId
  const isParticipant = isPlayerA || isPlayerB
  const isResolved = status === 'validated' || status === 'admin_resolved'
  const isVoided = status === 'voided'
  const isDisputed = status === 'disputed'

  function voteToName(vote: Vote | null) {
    if (!vote) return null
    return vote === 'win_a' ? playerAUsername : playerBUsername
  }

  function handleVote(choice: 'a' | 'b') {
    const voteValue: Vote = choice === 'a' ? 'win_a' : 'win_b'
    startTransition(async () => {
      const result = await castVote(matchId, voteValue)
      if (result.error) {
        toast.error('Vote failed', { description: String(result.error) })
      } else {
        toast.success('Vote cast!')
      }
    })
  }

  function handleSaveReplay() {
    startReplayTransition(async () => {
      const result = await setReplayUrl(matchId, replayInput)
      if (result.error) {
        toast.error('Failed to save replay', { description: String(result.error) })
      } else {
        toast.success('Replay saved')
        setEditingReplay(false)
      }
    })
  }

  // ── Voided state — simple banner
  if (isVoided) {
    return (
      <section className="mv-section mv-enter-3">
        <div className="py-5 text-center space-y-1">
          <p className="mv-font-display uppercase tracking-[0.28em] text-sm font-bold text-white/55">Partida anulada</p>
          <p className="mv-font-mono text-[11px] text-white/40 tracking-[0.12em]">No se otorgaron puntos a ninguno de los entrenadores.</p>
        </div>
      </section>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <section className="mv-section mv-enter-3" aria-labelledby="decision-title">
        <header className="mv-section-head">
          <h2 id="decision-title" className="mv-section-title">
            <span className="mv-idx">03</span>
            {isResolved ? 'Veredicto' : 'Decisión del combate'}
          </h2>
          {!isResolved && !isVoided && (
            <span className="mv-font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
              Doble ciego
            </span>
          )}
        </header>

        {/* Resolved view */}
        {isResolved && (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl border border-green-400/30 bg-gradient-to-br from-green-500/[0.09] via-green-500/[0.02] to-transparent p-4">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green-400/70 to-transparent" />
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-green-400/50 shadow-[0_0_18px_-4px_rgba(34,197,94,0.55)]">
                  <AvatarImage src={(winnerId === playerAId ? playerAAvatar : playerBAvatar) ?? undefined} />
                  <AvatarFallback className="bg-green-950/80 text-green-200 font-black">
                    {(winnerId === playerAId ? playerAUsername : playerBUsername).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="mv-font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-green-300/70">
                    Ganador
                  </p>
                  <p className="mv-font-display text-xl font-bold text-white truncate">
                    {winnerId === playerAId ? playerAUsername : playerBUsername}
                  </p>
                </div>
                <Crown className="w-6 h-6 text-green-300" strokeWidth={2} />
              </div>
            </div>

            {status === 'admin_resolved' && (
              <p className="flex items-center gap-2 mv-font-mono text-[10px] uppercase tracking-[0.2em] text-blue-300/80">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]" />
                Resuelto por la dirección
              </p>
            )}
          </div>
        )}

        {/* Participant: has voted */}
        {isParticipant && !isResolved && myVote && (
          <div className="space-y-3">
            <div className="mv-vote-locked">
              <div className="relative flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-300 shrink-0" strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <p className="mv-font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-green-300/80">
                    Voto registrado
                  </p>
                  <p className="mv-font-display text-base font-bold text-white truncate">
                    {voteToName(myVote)}
                  </p>
                </div>
              </div>
            </div>

            <VoteLights
              myVoteIn={true}
              otherVoteIn={otherVoted}
              meLabel="Tu voto"
              themLabel="Rival"
            />

            <p className="mv-font-mono text-[10px] text-white/45 tracking-[0.15em] uppercase leading-relaxed">
              {isDisputed
                ? 'Votos en conflicto. La dirección revisará la partida.'
                : otherVoted
                ? 'Ambos votos recibidos. Procesando…'
                : 'Esperando al otro entrenador.'}
            </p>
          </div>
        )}

        {/* Participant: hasn't voted */}
        {isParticipant && !isResolved && !myVote && (
          <div className="space-y-3">
            <p className="mv-font-mono text-[11px] text-white/55 tracking-[0.1em]">
              ¿Quién ganó este combate?
            </p>

            <div className="grid gap-2">
              <button
                type="button"
                className="mv-pick-btn is-A"
                disabled={isPending}
                onClick={() => handleVote('a')}
              >
                <Avatar className="h-10 w-10 ring-2 ring-cyan-400/30">
                  <AvatarImage src={playerAAvatar ?? undefined} />
                  <AvatarFallback className="bg-cyan-950 text-cyan-200 font-black">
                    {playerAUsername.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="mv-font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-cyan-300/60">
                    Arena A
                  </p>
                  <p className="mv-font-display text-base font-bold text-white truncate uppercase tracking-wide">
                    {playerAUsername}
                  </p>
                </div>
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-300/80" />
                ) : (
                  <span className="mv-font-mono text-[10px] text-cyan-300/60 tracking-[0.2em]">
                    VOTAR →
                  </span>
                )}
              </button>

              <button
                type="button"
                className="mv-pick-btn is-B"
                disabled={isPending}
                onClick={() => handleVote('b')}
              >
                <Avatar className="h-10 w-10 ring-2 ring-rose-400/30">
                  <AvatarImage src={playerBAvatar ?? undefined} />
                  <AvatarFallback className="bg-rose-950 text-rose-200 font-black">
                    {playerBUsername.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="mv-font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-rose-300/60">
                    Arena B
                  </p>
                  <p className="mv-font-display text-base font-bold text-white truncate uppercase tracking-wide">
                    {playerBUsername}
                  </p>
                </div>
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-300/80" />
                ) : (
                  <span className="mv-font-mono text-[10px] text-rose-300/60 tracking-[0.2em]">
                    VOTAR →
                  </span>
                )}
              </button>
            </div>

            <VoteLights
              myVoteIn={false}
              otherVoteIn={otherVoted}
              meLabel="Tu voto"
              themLabel="Rival"
            />
          </div>
        )}

        {/* Non-participant viewing: pending */}
        {!isParticipant && !isResolved && (
          <div className="space-y-3">
            <VoteLights
              myVoteIn={false}
              otherVoteIn={otherVoted}
              meLabel={playerAUsername}
              themLabel={playerBUsername}
              hideMineLabelPrefix
            />
            <p className="mv-font-mono text-[10px] text-white/40 tracking-[0.15em] uppercase">
              A la espera de los votos. La dirección mantiene el escrutinio a doble ciego.
            </p>
          </div>
        )}

        {/* Disputed badge for everyone */}
        {isDisputed && (
          <div className="mv-dispute-box mt-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" strokeWidth={2.25} />
            <p className="mv-font-mono text-[11px] leading-relaxed tracking-[0.08em]">
              Los votos no coinciden. La dirección revisará los replays y emitirá veredicto.
            </p>
          </div>
        )}
      </section>

      {/* ── Replay console ── */}
      {(isParticipant || replayUrl) && !isVoided && (
        <section className="mv-section">
          <header className="mv-section-head">
            <h2 className="mv-section-title">
              <span className="mv-idx">04</span>
              Replay Showdown
            </h2>
            <span className="mv-font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
              {replayUrl ? 'Disponible' : 'Opcional'}
            </span>
          </header>

          {replayUrl && !editingReplay && (
            <div className="mv-replay-panel flex items-center gap-3 p-3">
              <div className="grid place-items-center w-10 h-10 rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 to-cyan-500/0 shrink-0">
                <Film className="w-5 h-5 text-cyan-300" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="mv-font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/70">
                  Grabación enlazada
                </p>
                <a
                  href={replayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mv-font-mono text-xs text-white/80 hover:text-cyan-200 transition-colors truncate block"
                >
                  {replayUrl}
                </a>
              </div>
              <a
                href={replayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mv-font-mono text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-md border border-cyan-400/30 bg-cyan-500/5 text-cyan-200 hover:bg-cyan-500/15 hover:border-cyan-400/50 transition-colors inline-flex items-center gap-1.5 shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
                Abrir
              </a>
              {isParticipant && (
                <button
                  type="button"
                  onClick={() => setEditingReplay(true)}
                  className="grid place-items-center w-8 h-8 rounded-md border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-colors shrink-0"
                  aria-label="Editar enlace"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {isParticipant && (!replayUrl || editingReplay) && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="replay-url"
                  value={replayInput}
                  onChange={(e) => setReplayInput(e.target.value)}
                  placeholder="https://replay.pokemonshowdown.com/…"
                  className={cn(
                    'text-xs mv-font-mono bg-black/30 border-white/10',
                    'focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400/30'
                  )}
                />
                <Button
                  size="sm"
                  disabled={replayPending || !replayInput.trim()}
                  onClick={handleSaveReplay}
                  className="mv-font-mono tracking-widest text-[11px]"
                >
                  {replayPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Guardar
                </Button>
                {editingReplay && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mv-font-mono text-[11px] tracking-widest"
                    onClick={() => {
                      setEditingReplay(false)
                      setReplayInput(replayUrl ?? '')
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
              <p className="mv-font-mono text-[10px] text-white/35 tracking-[0.12em]">
                Pega la URL del replay de Pokémon Showdown.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

// ─── Vote lights (double-blind status row) ─────────────────────────────

function VoteLights({
  myVoteIn,
  otherVoteIn,
  meLabel,
  themLabel,
  hideMineLabelPrefix,
}: {
  myVoteIn: boolean
  otherVoteIn: boolean
  meLabel: string
  themLabel: string
  hideMineLabelPrefix?: boolean
}) {
  return (
    <div className="mv-vote-lights">
      <div className={cn('mv-vote-light', myVoteIn ? 'is-in' : 'is-waiting')}>
        <span className="mv-l-dot" />
        <span className="mv-font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
          {hideMineLabelPrefix ? meLabel : meLabel}
          <span className={cn('ml-2 font-bold', myVoteIn ? 'text-green-300' : 'text-amber-300/80')}>
            {myVoteIn ? 'OK' : '···'}
          </span>
        </span>
      </div>

      <span className="text-white/10 mv-font-mono text-[10px]">|</span>

      <div className={cn('mv-vote-light', otherVoteIn ? 'is-in' : 'is-waiting')}>
        <span className="mv-l-dot" />
        <span className="mv-font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
          {themLabel}
          <span className={cn('ml-2 font-bold', otherVoteIn ? 'text-green-300' : 'text-amber-300/80')}>
            {otherVoteIn ? 'OK' : '···'}
          </span>
        </span>
      </div>
    </div>
  )
}
