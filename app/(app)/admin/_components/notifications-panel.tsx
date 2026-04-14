'use client'

import { useState, useTransition, useRef } from 'react'
import { Mail, Send, Trash2, Loader2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

import { createNotification, deleteNotification } from '@/lib/actions/notifications'
import type { GlobalNotification } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ─── Compose form ─────────────────────────────────────────────────────────────

function ComposeForm({ onSent }: { onSent: (n: GlobalNotification) => void }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createNotification(formData)
      if (!result.success) {
        toast.error('Error al enviar', { description: result.error })
        return
      }
      toast.success('Notificación enviada a todos los jugadores')
      formRef.current?.reset()
      // Re-fetch is handled by revalidatePath server-side; optimistic update below
      onSent({
        id: result.id,
        title: (formData.get('title') as string).trim(),
        subtitle: (formData.get('subtitle') as string | null)?.trim() || null,
        body: (formData.get('body') as string).trim(),
        sent_by_id: '',
        sent_by_username: '…',
        created_at: new Date().toISOString(),
      })
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <Mail className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold">Redactar notificación global</p>
          <p className="text-xs text-muted-foreground">Se enviará a todos los jugadores activos e inactivos</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="notif-title" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Título <span className="text-destructive">*</span>
          </Label>
          <Input
            id="notif-title"
            name="title"
            placeholder="¡Empieza la Liga 3!"
            maxLength={80}
            required
            disabled={isPending}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notif-subtitle" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Subtítulo <span className="text-muted-foreground/40 font-normal normal-case tracking-normal">(opcional)</span>
          </Label>
          <Input
            id="notif-subtitle"
            name="subtitle"
            placeholder="Información adicional breve"
            maxLength={120}
            disabled={isPending}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notif-body" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Mensaje <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="notif-body"
            name="body"
            placeholder="Escribe aquí el contenido completo de la notificación..."
            rows={5}
            maxLength={1000}
            required
            disabled={isPending}
            className="bg-background/50 resize-none"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="gap-2 w-full sm:w-auto">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isPending ? 'Enviando…' : 'Enviar a todos'}
      </Button>
    </form>
  )
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotificationRow({
  n,
  onDelete,
}: {
  n: GlobalNotification
  onDelete: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const date = new Date(n.created_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteNotification(n.id)
      if (!result.success) {
        toast.error('Error al borrar', { description: result.error })
        return
      }
      toast.success('Notificación eliminada')
      onDelete(n.id)
    })
  }

  return (
    <div className="flex items-start gap-3 py-3 group">
      <div className="shrink-0 mt-0.5 w-7 h-7 rounded-md bg-amber-400/8 border border-amber-400/15 flex items-center justify-center">
        <MessageSquare className="h-3.5 w-3.5 text-amber-400/70" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{n.title}</p>
        {n.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{n.subtitle}</p>
        )}
        <p className="text-[11px] text-muted-foreground/50 mt-0.5">{date}</p>
      </div>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className={cn(
          'shrink-0 p-1.5 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors',
          'opacity-0 group-hover:opacity-100 focus:opacity-100',
          isPending && 'opacity-50 cursor-not-allowed'
        )}
        title="Eliminar notificación"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function NotificationsPanel({
  initialNotifications,
}: {
  initialNotifications: GlobalNotification[]
}) {
  const [notifications, setNotifications] = useState(initialNotifications)

  function handleSent(n: GlobalNotification) {
    setNotifications((prev) => [n, ...prev])
  }

  function handleDelete(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

      {/* Compose */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <ComposeForm onSent={handleSent} />
      </div>

      {/* Sent history */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold">Enviadas</p>
          {notifications.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notifications.length}
            </Badge>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Mail className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground/50">Sin notificaciones enviadas</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {notifications.map((n) => (
              <NotificationRow key={n.id} n={n} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
