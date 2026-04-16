'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  RefreshCw,
  Link2,
  Link2Off,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

import { syncSaveFile } from '@/lib/actions/save-sync'
import { loadFileHandle, saveFileHandle, clearFileHandle } from '@/lib/idb-file-handle'
import type { SaveSyncStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

function StatusLight({ color }: { color: 'green' | 'red' | 'amber' }) {
  const map = {
    green: { bg: '#4ade80', glow: 'rgba(74, 222, 128, 0.55)' },
    red: { bg: '#f87171', glow: 'rgba(248, 113, 113, 0.55)' },
    amber: { bg: '#fbbf24', glow: 'rgba(251, 191, 36, 0.55)' },
  }[color]

  return (
    <span
      className="inline-block h-3 w-3 rounded-full"
      style={{
        background: map.bg,
        boxShadow: `0 0 12px ${map.glow}`,
      }}
    />
  )
}

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
        toast.success('Guardado sincronizado', {
          description: `${result.party} en equipo · ${result.box1} en caja`,
        })
        router.refresh()
      }
    })
  }

  async function handleLinkAndSync() {
    if (!window.showOpenFilePicker) return

    try {
      const [rawHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Archivo de guardado RPG Maker',
            accept: { 'application/octet-stream': ['.rxdata'] },
          },
        ],
        multiple: false,
      })

      await saveFileHandle(profileId, rawHandle)
      const handle = rawHandle as unknown as FSAFileHandle
      setStoredHandle(handle)
      const file = await handle.getFile()
      doSync(file)
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return
      toast.error('No se pudo acceder al archivo')
    }
  }

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
      setStoredHandle(null)
      await clearFileHandle(profileId)
      toast.error('No se encontró el archivo. Vincúlalo de nuevo.')
    }
  }

  async function handleUnlink() {
    await clearFileHandle(profileId)
    setStoredHandle(null)
    setLocalError(null)
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    doSync(file)
    e.target.value = ''
  }

  const isSyncing = isPending
  const displayError = localError ?? (saveSyncStatus === 'failed' ? saveParseError : null)

  const statusColor =
    saveSyncStatus === 'synced'
      ? 'green'
      : saveSyncStatus === 'failed'
      ? 'red'
      : 'amber'

  const statusLabel =
    saveSyncStatus === 'synced'
      ? 'SINCRONIZADO'
      : saveSyncStatus === 'failed'
      ? 'ERROR'
      : 'SIN ENLACE'

  return (
    <div
      className="relative overflow-hidden rounded-[22px]"
      style={{
        background: 'linear-gradient(180deg, rgba(11,15,26,0.97), rgba(7,10,18,0.98))',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: [
          'inset 0 1px 0 rgba(255,255,255,0.07)',
          'inset 0 -1px 0 rgba(0,0,0,0.6)',
          '0 12px 26px rgba(0,0,0,0.36)',
          '0 0 0 1px rgba(0,200,232,0.04)',
        ].join(', '),
      }}
    >
      <div className="border-b border-white/8 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: '#00c8e8',
                  boxShadow: '0 0 10px rgba(0,200,232,0.65)',
                }}
              />
              <span className="font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200/90">
                Save Sync
              </span>
            </div>
            <p className="mt-1 font-heading text-[11px] text-white/42">
              Sincronización de guardado
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5">
            <StatusLight color={statusColor} />
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white/82">
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div
          className="rounded-2xl border px-4 py-3"
          style={{
            background:
              saveSyncStatus === 'synced'
                ? 'linear-gradient(180deg, rgba(34,197,94,0.10), rgba(34,197,94,0.04))'
                : saveSyncStatus === 'failed'
                ? 'linear-gradient(180deg, rgba(239,68,68,0.10), rgba(239,68,68,0.04))'
                : 'linear-gradient(180deg, rgba(0,200,232,0.08), rgba(0,200,232,0.03))',
            borderColor:
              saveSyncStatus === 'synced'
                ? 'rgba(34,197,94,0.18)'
                : saveSyncStatus === 'failed'
                ? 'rgba(239,68,68,0.18)'
                : 'rgba(0,200,232,0.15)',
          }}
        >
          <div className="mb-1 flex items-center gap-2">
            {saveSyncStatus === 'synced' ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : saveSyncStatus === 'failed' ? (
              <AlertCircle className="h-4 w-4 text-red-400" />
            ) : (
              <Clock className="h-4 w-4 text-cyan-300" />
            )}

            <span
              className={cn(
                'font-heading text-lg font-bold',
                saveSyncStatus === 'synced'
                  ? 'text-green-400'
                  : saveSyncStatus === 'failed'
                  ? 'text-red-400'
                  : 'text-cyan-200',
              )}
            >
              {statusLabel}
            </span>
          </div>

          <div className="text-sm text-white/55">
            {saveSyncedAt ? (
              <>
                Última sincronización:{' '}
                <span className="font-semibold text-cyan-100">
                  {formatRelativeTime(saveSyncedAt)}
                </span>
              </>
            ) : (
              'Todavía no se ha sincronizado ningún archivo.'
            )}
          </div>
        </div>

        {displayError && (
          <div className="rounded-2xl border border-red-400/16 bg-red-500/6 px-4 py-3">
            <p className="text-sm break-words text-red-300">{displayError}</p>
          </div>
        )}

        {checking ? (
          <div className="flex items-center gap-2 text-sm text-white/45">
            <Loader2 className="h-4 w-4 animate-spin" />
            Comprobando acceso al archivo…
          </div>
        ) : fsaSupported ? (
          <div className="flex flex-wrap gap-2">
            {storedHandle ? (
              <>
                <Button
                  size="sm"
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
                  variant="outline"
                  onClick={handleLinkAndSync}
                  disabled={isSyncing}
                  className="gap-1.5 border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Cambiar archivo
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUnlink}
                  disabled={isSyncing}
                  className="gap-1.5 border-white/10 bg-white/5 text-white/70 hover:bg-red-500/10 hover:text-red-300"
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
                  className="gap-1.5 border-white/10 bg-white/5 text-white/84 hover:bg-white/10"
                >
                  {isSyncing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" />
                  )}
                  {isSyncing ? 'Sincronizando…' : 'Vincular archivo .rxdata'}
                </Button>
                <p className="w-full text-sm text-white/45">
                  El navegador recordará el archivo para futuras sincronizaciones.
                </p>
              </>
            )}
          </div>
        ) : (
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
              className="gap-1.5 border-white/10 bg-white/5 text-white/84 hover:bg-white/10"
            >
              {isSyncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {isSyncing ? 'Sincronizando…' : 'Subir archivo de guardado'}
            </Button>
            <p className={cn('text-sm text-white/45')}>
              Tu navegador no soporta acceso persistente. Tendrás que seleccionar el archivo cada vez.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}