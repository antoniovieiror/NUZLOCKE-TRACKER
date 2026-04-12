'use client'

import { useState, useTransition } from 'react'
import { Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { adminResolveMatch, adminVoidMatch } from '@/lib/actions/match'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AdminControlsProps {
  matchId: string
  status: string
  playerAId: string
  playerBId: string
  playerAUsername: string
  playerBUsername: string
}

export function AdminControls({
  matchId,
  status,
  playerAId,
  playerBId,
  playerAUsername,
  playerBUsername,
}: AdminControlsProps) {
  const [resolveOpen, setResolveOpen] = useState(false)
  const [voidOpen, setVoidOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isResolved = status === 'validated' || status === 'admin_resolved'
  const isVoided = status === 'voided'

  function resolveAs(winnerId: string) {
    startTransition(async () => {
      const result = await adminResolveMatch(matchId, winnerId)
      if (result.error) {
        toast.error('Failed to resolve', { description: String(result.error) })
      } else {
        toast.success('Match resolved')
        setResolveOpen(false)
      }
    })
  }

  function handleVoid() {
    startTransition(async () => {
      const result = await adminVoidMatch(matchId)
      if (result.error) {
        toast.error('Failed to void', { description: String(result.error) })
      } else {
        toast.success('Match voided')
        setVoidOpen(false)
      }
    })
  }

  if (isVoided) return null

  return (
    <>
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-blue-500" />
            Admin Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!isResolved && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setResolveOpen(true)}
            >
              Force Resolve
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            onClick={() => setVoidOpen(true)}
          >
            Void Match
          </Button>
        </CardContent>
      </Card>

      {/* ── Force Resolve dialog ── */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Force Resolve</DialogTitle>
            <DialogDescription>
              Manually set the winner. This bypasses the normal vote flow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => resolveAs(playerAId)}
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {playerAUsername} wins
            </Button>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => resolveAs(playerBId)}
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {playerBUsername} wins
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setResolveOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Void dialog ── */}
      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Void this match?</DialogTitle>
            <DialogDescription>
              This will set the match to Voided. No points will be awarded and it won&apos;t
              count toward either player&apos;s winrate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setVoidOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleVoid}
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Void match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
