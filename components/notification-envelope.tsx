'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { markNotificationRead } from '@/lib/actions/notifications'
import type { GlobalNotification } from '@/lib/types'

// ─── Pokéball wax-seal SVG ───────────────────────────────────────────────────

function PokeballStamp({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Outer glow ring */}
      <circle cx="32" cy="32" r="30" fill="url(#stampGlow)" opacity="0.25" />
      {/* Main ball body - top half (red) */}
      <path
        d="M32 4 A28 28 0 0 1 60 32 L36 32 A4 4 0 0 0 28 32 L4 32 A28 28 0 0 1 32 4Z"
        fill="#DC2626"
      />
      {/* Main ball body - bottom half (white/dark) */}
      <path
        d="M32 60 A28 28 0 0 1 4 32 L28 32 A4 4 0 0 0 36 32 L60 32 A28 28 0 0 1 32 60Z"
        fill="#1E1E2E"
      />
      {/* Dividing line highlight */}
      <rect x="4" y="30" width="56" height="4" fill="#0F0F1A" />
      {/* Center button */}
      <circle cx="32" cy="32" r="8" fill="#1E1E2E" stroke="#374151" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="4.5" fill="#F9FAFB" opacity="0.9" />
      <circle cx="32" cy="32" r="2" fill="#D1D5DB" />
      {/* Outer ring */}
      <circle cx="32" cy="32" r="28" fill="none" stroke="#374151" strokeWidth="1.5" />
      {/* Shine */}
      <ellipse cx="22" cy="18" rx="5" ry="3" fill="white" opacity="0.15" transform="rotate(-20 22 18)" />
      <defs>
        <radialGradient id="stampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#DC2626" />
        </radialGradient>
      </defs>
    </svg>
  )
}

// ─── Single notification letter ───────────────────────────────────────────────

function EnvelopeLetter({
  notification,
  index,
  total,
  onDismiss,
}: {
  notification: GlobalNotification
  index: number
  total: number
  onDismiss: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const date = new Date(notification.created_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  function handleDismiss() {
    startTransition(async () => {
      await markNotificationRead(notification.id)
      onDismiss()
    })
  }

  return (
    <div
      className="relative w-full max-w-lg mx-auto"
      style={{ animation: 'envelopeSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}
    >
      {/* Envelope back / shadow layers */}
      {total > 1 && (
        <>
          <div className="absolute -bottom-2 left-3 right-3 h-full rounded-2xl bg-[#0D1117] border border-white/5 -z-10" />
          {total > 2 && (
            <div className="absolute -bottom-4 left-5 right-5 h-full rounded-2xl bg-[#0A0E17] border border-white/3 -z-20" />
          )}
        </>
      )}

      {/* Main card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0D1117] shadow-2xl shadow-black/60">

        {/* Envelope flap SVG at top */}
        <div className="relative overflow-hidden">
          <svg
            className="w-full block"
            viewBox="0 0 480 80"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="flapGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1C2333" />
                <stop offset="100%" stopColor="#141929" />
              </linearGradient>
              <linearGradient id="flapLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
                <stop offset="30%" stopColor="#F59E0B" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#FBBF24" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Flap body */}
            <polygon points="0,0 480,0 240,72" fill="url(#flapGrad)" />
            {/* Flap crease lines */}
            <line x1="0" y1="0" x2="240" y2="72" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <line x1="480" y1="0" x2="240" y2="72" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            {/* Amber accent line along flap fold */}
            <line x1="0" y1="0" x2="240" y2="72" stroke="url(#flapLine)" strokeWidth="0.8" />
          </svg>

          {/* Amber top accent bar (matches profile page style) */}
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-400/70 to-amber-500/0" />
        </div>

        {/* Letter content */}
        <div className="px-7 pt-2 pb-7">

          {/* Counter if multiple */}
          {total > 1 && (
            <p className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-[0.15em] mb-4">
              Notificación {index + 1} de {total}
            </p>
          )}

          {/* Date stamp */}
          <p className="text-[11px] text-amber-400/50 font-mono mb-5 tracking-wider">{date}</p>

          {/* Title */}
          <h2
            className="text-2xl font-black tracking-tight mb-1"
            style={{
              background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 40%, #EF4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {notification.title}
          </h2>

          {/* Subtitle */}
          {notification.subtitle && (
            <p className="text-sm font-semibold text-white/60 mb-5">{notification.subtitle}</p>
          )}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-amber-400/20 via-amber-400/10 to-transparent mb-5 mt-3" />

          {/* Body */}
          <p className="text-sm leading-relaxed text-white/75 whitespace-pre-wrap break-words">
            {notification.body}
          </p>

          {/* Footer: signature + dismiss */}
          <div className="mt-8 flex items-end justify-between gap-4">

            {/* Signature block */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-xs font-black text-white/50 tracking-widest uppercase">
                {notification.sent_by_username}
              </p>
              <div className="relative">
                <PokeballStamp size={52} />
                {/* Amber stamp ring glow */}
                <div className="absolute inset-0 rounded-full ring-1 ring-amber-400/20 blur-[1px]" />
              </div>
              <p className="text-[10px] text-white/20 tracking-[0.2em] uppercase font-bold">
                ADMIN
              </p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              disabled={isPending}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 hover:border-amber-400/40 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all duration-200 disabled:opacity-50"
            >
              {isPending ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-amber-300/40 border-t-amber-300 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Leído
            </button>
          </div>
        </div>

        {/* Decorative corner dots */}
        <div className="absolute bottom-4 left-4 flex gap-1 opacity-15">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-amber-400" />
          ))}
        </div>

        {/* Right edge perforation dots */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 flex flex-col gap-1.5 opacity-10 pr-0.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationEnvelope({ notifications }: { notifications: GlobalNotification[] }) {
  const [queue, setQueue] = useState(notifications)

  if (queue.length === 0) return null

  const current = queue[0]

  function handleDismiss() {
    setQueue((prev) => prev.slice(1))
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.3s ease both' }}
      />

      {/* Centered container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <EnvelopeLetter
          key={current.id}
          notification={current}
          index={notifications.length - queue.length}
          total={notifications.length}
          onDismiss={handleDismiss}
        />
      </div>

      <style>{`
        @keyframes envelopeSlideIn {
          from { opacity: 0; transform: translateY(-24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  )
}
