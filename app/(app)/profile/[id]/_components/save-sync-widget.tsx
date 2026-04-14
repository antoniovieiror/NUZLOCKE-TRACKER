'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Link2, Link2Off, Upload, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { syncSaveFile } from '@/lib/actions/save-sync'
import { loadFileHandle, saveFileHandle, clearFileHandle } from '@/lib/idb-file-handle'
import type { SaveSyncStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ─── File System Access API types ────────────────────────────────────────────
// These are not in the default TS DOM lib for all targets.

interface FSAFileHandle {
  getFile(): Promise<File>
  queryPermission(desc?: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
  requestPermission(desc?: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
}

declare global {
  interface Window {
    showOpenFilePicker?: (options?: {
      types?: Array<{ description?: string; accept: Record<string, string[]> }>
      multiple?: boolean
    }) => Promise<FileSystemFileHandle[]>
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'ahora mismo'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hace 1 día'
  return `hace ${days} días`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SaveSyncWidget({
  profileId,
  saveSyncedAt,
  saveSyncStatus,
  saveParseError,
}: {
  profileId: string
  saveSyncedAt: string | null
  saveSyncStatus: SaveSyncStatus
  saveParseError: string | null
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fsaSupported, setFsaSupported] = useState(false)
  const [storedHandle, setStoredHandle] = useState<FSAFileHandle | null>(null)
  const [checking, setChecking] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // On mount: detect FSA API support + load stored handle from IndexedDB
  useEffect(() => {
    const supported = typeof window.showOpenFilePicker === 'function'
    setFsaSupported(supported)

    if (supported) {
      loadFileHandle(profileId)
        .then((h) => setStoredHandle(h as FSAFileHandle | null))
        .catch(() => setStoredHandle(null))
        .finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [profileId])

  // ── Core sync logic ──────────────────────────────────────────────────────────

  function doSync(file: File) {
    setLocalError(null)
    const formData = new FormData()
    formData.append('saveFile', file)

    startTransition(async () => {
      const result = await syncSaveFile(profileId, formData)
      if (!result.success) {
        setLocalError(result.error)
        toast.error('Error al sincronizar', { description: result.error })
      } else {
        toast.success(
          `Guardado sincronizado`,
          { description: `${result.party} en equipo · ${result.box1} en caja` }
        )
        router.refresh()
      }
    })
  }

  // ── FSA: link file (first time) and sync immediately ────────────────────────

  async function handleLinkAndSync() {
    if (!window.showOpenFilePicker) return
    try {
      const [rawHandle] = await window.showOpenFilePicker({
        types: [{ description: 'Archivo de guardado RPG Maker', accept: { 'application/octet-stream': ['.rxdata'] } }],
        multiple: false,
      })
      await saveFileHandle(profileId, rawHandle)
      const handle = rawHandle as unknown as FSAFileHandle
      setStoredHandle(handle)
      const file = await handle.getFile()
      doSync(file)
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return // user cancelled picker
      toast.error('No se pudo acceder al archivo')
    }
  }

  // ── FSA: re-sync using stored handle ────────────────────────────────────────

  async function handleResync() {
    if (!storedHandle) return
    try {
      let perm = await storedHandle.queryPermission({ mode: 'read' })
      if (perm !== 'granted') {
        perm = await storedHandle.requestPermission({ mode: 'read' })
      }
      if (perm !== 'granted') {
        toast.error('Permiso de lectura denegado')
        return
      }
      const file = await storedHandle.getFile()
      doSync(file)
    } catch {
      // Handle may be stale (file moved or deleted)
      setStoredHandle(null)
      await clearFileHandle(profileId)
      toast.error('No se encontró el archivo. Vincúlalo de nuevo.')
    }
  }

  // ── FSA: unlink stored handle ────────────────────────────────────────────────

  async function handleUnlink() {
    await clearFileHandle(profileId)
    setStoredHandle(null)
    setLocalError(null)
  }

  // ── Fallback: regular file input ────────────────────────────────────────────

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    doSync(file)
    e.target.value = ''
  }

  // ─── Derived display state ───────────────────────────────────────────────────

  const isSyncing = isPending
  const displayError = localError ?? (saveSyncStatus === 'failed' ? saveParseError : null)

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <Card className="border-border/50 overflow-hidden">
      {/* Top accent line — matches profile card style */}
      <div className="h-0.5 w-full bg-gradient-to-r from-blue-500/40 via-violet-500/30 to-transparent" />

      <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          Sincronización de guardado
        </CardTitle>

        <div className="flex items-center gap-2">
          {saveSyncStatus === 'synced' && (
            <Badge className="gap-1 text-xs bg-green-500/15 text-green-400 border-green-500/20">
              <CheckCircle className="h-3 w-3" />
              Sincronizado
            </Badge>
          )}
          {saveSyncStatus === 'failed' && (
            <Badge className="gap-1 text-xs bg-red-500/15 text-red-400 border-red-500/20">
              <AlertCircle className="h-3 w-3" />
              Error
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">

        {/* Last sync info */}
        {saveSyncedAt && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>Última sincronización: {formatRelativeTime(saveSyncedAt)}</span>
          </div>
        )}

        {/* Error message */}
        {displayError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
            <p className="text-xs text-red-400 break-words">{displayError}</p>
          </div>
        )}

        {/* Action area */}
        {checking ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Comprobando…</span>
          </div>
        ) : fsaSupported ? (
          /* ── FSA path ── */
          <div className="flex flex-wrap items-center gap-2">
            {storedHandle ? (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleResync}
                  disabled={isSyncing}
                  className="gap-1.5"
                >
                  {isSyncing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {isSyncing ? 'Sincronizando…' : 'Sincronizar'}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLinkAndSync}
                  disabled={isSyncing}
                  className="gap-1.5 text-muted-foreground"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Cambiar archivo
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUnlink}
                  disabled={isSyncing}
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Link2Off className="h-3.5 w-3.5" />
                  Desvincular
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLinkAndSync}
                  disabled={isSyncing}
                  className="gap-1.5"
                >
                  {isSyncing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" />
                  )}
                  {isSyncing ? 'Sincronizando…' : 'Vincular archivo de guardado'}
                </Button>
                <p className="text-xs text-muted-foreground/70 w-full">
                  Selecciona tu <span className="font-mono text-[11px]">.rxdata</span> una vez y
                  podrás sincronizar con un solo clic a partir de entonces.
                </p>
              </>
            )}
          </div>
        ) : (
          /* ── Fallback: regular file input ── */
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".rxdata"
              className="hidden"
              onChange={handleFileInputChange}
              disabled={isSyncing}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSyncing}
              className="gap-1.5"
            >
              {isSyncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {isSyncing ? 'Sincronizando…' : 'Subir archivo de guardado'}
            </Button>
            <p className={cn('text-xs text-muted-foreground/70')}>
              Tu navegador no soporta acceso persistente a archivos. Deberás seleccionar el archivo
              cada vez que quieras sincronizar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
