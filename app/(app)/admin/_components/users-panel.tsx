'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, KeyRound, UserCheck, UserX, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { createPlayer, toggleUserStatus, setUserPassword, deletePlayer } from '@/lib/actions/admin'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Profile, UserStatus } from '@/lib/types'

// ─── Schemas ───────────────────────────────────────────────────────────────────

const createSchema = z.object({
  username: z.string().min(2, 'Min 2 characters').max(30, 'Max 30 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Min 6 characters'),
})
type CreateFormValues = z.infer<typeof createSchema>

const pwSchema = z.object({
  password: z.string().min(6, 'Min 6 characters'),
})
type PwFormValues = z.infer<typeof pwSchema>

// ─── Types ─────────────────────────────────────────────────────────────────────

type UserRow = Pick<Profile, 'id' | 'username' | 'role' | 'status' | 'avatar_url' | 'created_at'>

interface UsersPanelProps {
  users: UserRow[]
  currentUserId: string
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function UsersPanel({ users, currentUserId }: UsersPanelProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [pwTarget, setPwTarget] = useState<UserRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: '', email: '', password: '' },
  })

  const pwForm = useForm<PwFormValues>({
    resolver: zodResolver(pwSchema),
    defaultValues: { password: '' },
  })

  function handleToggleStatus(user: UserRow) {
    const newStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active'
    startTransition(async () => {
      const result = await toggleUserStatus(user.id, newStatus)
      if (result.error) {
        toast.error('Failed to update status', { description: String(result.error) })
      } else {
        toast.success(`${user.username} set to ${newStatus}`)
        router.refresh()
      }
    })
  }

  function handleCreatePlayer(values: CreateFormValues) {
    startTransition(async () => {
      const result = await createPlayer(values)
      if (result.error) {
        toast.error('Failed to create player', { description: String(result.error) })
        return
      }
      toast.success(`"${values.username}" created!`, {
        description: 'Share the credentials with the player out of band.',
      })
      createForm.reset()
      setCreateOpen(false)
      router.refresh()
    })
  }

  function handleDeletePlayer() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deletePlayer(deleteTarget.id)
      if (result.error) {
        toast.error('Error al eliminar jugador', { description: String(result.error) })
        return
      }
      toast.success(`"${deleteTarget.username}" eliminado`)
      setDeleteTarget(null)
      router.refresh()
    })
  }

  function handleSetPassword(values: PwFormValues) {
    if (!pwTarget) return
    startTransition(async () => {
      const result = await setUserPassword(pwTarget.id, values.password)
      if (result.error) {
        toast.error('Failed to set password', { description: String(result.error) })
        return
      }
      toast.success(`Password updated for ${pwTarget.username}`)
      pwForm.reset()
      setPwTarget(null)
    })
  }

  return (
    <>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {users.length} player{users.length !== 1 ? 's' : ''} registered
          </p>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Player
          </Button>
        </div>

        {/* Player list */}
        <div className="space-y-2">
          {users.map((user) => {
            const isMe = user.id === currentUserId
            return (
              <Card
                key={user.id}
                className={cn(
                  'transition-opacity',
                  user.status === 'inactive' && 'opacity-55'
                )}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs font-bold">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm">{user.username}</span>
                      {user.role === 'admin' && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1">
                          Admin
                        </Badge>
                      )}
                      {isMe && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1">
                          You
                        </Badge>
                      )}
                      <Badge
                        variant={user.status === 'active' ? 'default' : 'outline'}
                        className="text-[10px] py-0 px-1"
                      >
                        {user.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Joined{' '}
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Cambiar contraseña"
                      onClick={() => {
                        pwForm.reset()
                        setPwTarget(user)
                      }}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    {!isMe && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={isPending}
                          title={user.status === 'active' ? 'Desactivar jugador' : 'Activar jugador'}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.status === 'active' ? (
                            <UserX className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5 text-green-500" />
                          )}
                        </Button>
                        {user.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={isPending}
                            title="Eliminar jugador"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive/70 hover:text-destructive" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Service role key notice */}
        <p className="text-[11px] text-muted-foreground text-center pt-1">
          Creating players and resetting passwords requires{' '}
          <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">
            SUPABASE_SERVICE_ROLE_KEY
          </code>{' '}
          in <code className="font-mono text-[10px]">.env.local</code>.
        </p>
      </div>

      {/* ── Create Player Dialog ── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) createForm.reset()
          setCreateOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Player</DialogTitle>
            <DialogDescription>
              Create a login for a new player. Share the credentials with them directly.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={createForm.handleSubmit(handleCreatePlayer)}
            className="space-y-3 py-1"
          >
            <div className="space-y-1.5">
              <Label htmlFor="new-username">Username</Label>
              <Input
                id="new-username"
                placeholder="AshKetchum"
                {...createForm.register('username')}
                aria-invalid={!!createForm.formState.errors.username}
              />
              {createForm.formState.errors.username && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="ash@pokemon.com"
                {...createForm.register('email')}
                aria-invalid={!!createForm.formState.errors.email}
              />
              {createForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password">Temporary Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Min. 6 characters"
                {...createForm.register('password')}
                aria-invalid={!!createForm.formState.errors.password}
              />
              {createForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Create player
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Player Dialog ── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar jugador</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la cuenta de{' '}
              <strong>{deleteTarget?.username}</strong>? Esta acción es{' '}
              <strong>permanente e irreversible</strong>. Se borrarán todos sus
              datos de perfil.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlayer}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Set Password Dialog ── */}
      <Dialog
        open={!!pwTarget}
        onOpenChange={(open) => {
          if (!open) {
            pwForm.reset()
            setPwTarget(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Password</DialogTitle>
            <DialogDescription>
              Set a new temporary password for{' '}
              <strong>{pwTarget?.username}</strong>. Share it with them out of band.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={pwForm.handleSubmit(handleSetPassword)}
            className="space-y-3 py-1"
          >
            <div className="space-y-1.5">
              <Label htmlFor="set-pw">New Password</Label>
              <Input
                id="set-pw"
                type="password"
                placeholder="Min. 6 characters"
                {...pwForm.register('password')}
                aria-invalid={!!pwForm.formState.errors.password}
              />
              {pwForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {pwForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPwTarget(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Update password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
