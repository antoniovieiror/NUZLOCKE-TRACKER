'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { updateAvatar } from '@/lib/actions/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  profileId: string
  avatarUrl: string | null
  username: string
  canEdit: boolean
}

export function AvatarUpload({ profileId, avatarUrl, username, canEdit }: AvatarUploadProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so same file can be selected again
    e.target.value = ''

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede superar 2 MB')
      return
    }

    // Optimistic local preview while uploading
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setUploading(true)

    try {
      const ext = file.name.includes('.') ? file.name.split('.').pop()! : 'jpg'
      // Use timestamp to bust CDN cache on re-upload
      const path = `${profileId}/${Date.now()}.${ext}`

      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      const result = await updateAvatar(profileId, publicUrl)
      if (result.error) throw new Error(result.error)

      toast.success('Avatar actualizado')
      // Refresh server data (updates navbar + profile page avatar_url)
      router.refresh()
    } catch (err) {
      setPreviewUrl(null) // revert optimistic preview on error
      toast.error('Error al subir el avatar', { description: String(err) })
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = previewUrl ?? avatarUrl ?? undefined

  return (
    <div className="relative shrink-0 group/avatar">
      <Avatar className="h-20 w-20 ring-4 ring-white/80 dark:ring-white/10 shadow-lg">
        <AvatarImage src={displayUrl} alt={username} />
        <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-violet-100 to-sky-100 dark:from-indigo-900 dark:to-blue-900 text-violet-700 dark:text-violet-300">
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {canEdit && (
        <>
          {/* Pencil overlay — visible on hover or while uploading */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Cambiar foto de perfil"
            className={cn(
              'absolute inset-0 rounded-full flex items-center justify-center',
              'bg-black/0 hover:bg-black/40 transition-all duration-200',
              'opacity-0 group-hover/avatar:opacity-100',
              uploading && 'opacity-100 bg-black/40 cursor-not-allowed'
            )}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Pencil className="h-5 w-5 text-white drop-shadow" />
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  )
}
