'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

import { castVote, setReplayUrl } from '@/lib/actions/match'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Vote } from '@/lib/types'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface VoteCardProps {
  matchId: string
  status: 'pending' | 'validated' | 'disputed' | 'voided' | 'admin_resolved'
  currentUserId: string
  playerAId: string
  playerBId: string
  playerAUsername: string
  playerBUsername: string
  // The current user's own stored vote (null = not voted yet)
  myVote: Vote | null
  // Whether the OTHER player has voted (direction hidden until resolved)
  otherVoted: boolean
  replayUrl: string | null
  // After resolution, show both
  winnerId: string | null
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function VoteCard({
  matchId,
  status,
  currentUserId,
  playerAId,
  playerBId,
  playerAUsername,
  playerBUsername,
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

  // Map vote value → username for display
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

  if (isVoided) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-1">
          <p className="text-sm font-medium text-muted-foreground">This match was voided.</p>
          <p className="text-xs text-muted-foreground">No points were awarded.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* ── Vote section ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {isResolved ? 'Result' : isParticipant ? 'Cast your vote' : 'Votes'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Participant view: pending */}
          {isParticipant && !isResolved && (
            <>
              {myVote ? (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      You voted: <span className="font-bold">{voteToName(myVote)}</span>
                    </p>
                    <p className="text-xs text-green-600/70 dark:text-green-400/70">
                      {otherVoted
                        ? status === 'disputed'
                          ? 'Votes conflict — admin will resolve.'
                          : 'Both voted — processing…'
                        : 'Waiting for the other player to vote.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Who won this match?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isPending}
                      onClick={() => handleVote('a')}
                    >
                      {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      {playerAUsername}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isPending}
                      onClick={() => handleVote('b')}
                    >
                      {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      {playerBUsername}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {otherVoted ? 'Other player has already voted.' : 'Other player has not voted yet.'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Non-participant view: pending */}
          {!isParticipant && !isResolved && (
            <div className="flex items-center gap-3">
              <VoteDot voted={true} label={playerAUsername} />
              <VoteDot voted={otherVoted} label={playerBUsername} />
            </div>
          )}

          {/* Resolved view */}
          {isResolved && (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Winner</p>
                <p className="text-base font-bold text-green-700 dark:text-green-300">
                  {winnerId === playerAId ? playerAUsername : playerBUsername}
                </p>
              </div>
              {status === 'admin_resolved' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-blue-500" />
                  Resolved by admin
                </p>
              )}
            </div>
          )}

          {/* Disputed info */}
          {status === 'disputed' && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 p-3 text-sm text-red-600 dark:text-red-400">
              Votes conflict — the admin will review and decide the outcome.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Replay URL ── */}
      {isParticipant && !isVoided && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Showdown Replay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {replayUrl && !editingReplay ? (
              <div className="flex items-center gap-2">
                <a
                  href={replayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline underline-offset-4 hover:text-primary/80 flex items-center gap-1 truncate"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{replayUrl}</span>
                </a>
                <Button
                  variant="ghost"
                  size="xs"
                  className="shrink-0"
                  onClick={() => setEditingReplay(true)}
                >
                  Edit
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="replay-url" className="text-xs">
                  Replay URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="replay-url"
                    value={replayInput}
                    onChange={(e) => setReplayInput(e.target.value)}
                    placeholder="https://replay.pokemonshowdown.com/…"
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    disabled={replayPending}
                    onClick={handleSaveReplay}
                  >
                    {replayPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Save
                  </Button>
                  {editingReplay && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingReplay(false)
                        setReplayInput(replayUrl ?? '')
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Non-participant replay (read-only) */}
      {!isParticipant && replayUrl && (
        <a
          href={replayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-primary underline underline-offset-4 hover:text-primary/80"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          Watch replay
        </a>
      )}
    </div>
  )
}

// ─── Vote dot helper ────────────────────────────────────────────────────────────

function VoteDot({ voted, label }: { voted: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'w-2.5 h-2.5 rounded-full border',
          voted
            ? 'bg-foreground border-foreground'
            : 'bg-transparent border-muted-foreground/40'
        )}
      />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">
        {voted ? 'voted' : 'pending'}
      </span>
    </div>
  )
}
