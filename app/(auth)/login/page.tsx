'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Swords } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const loginSchema = z.object({
  email: z.string().email('Introduce un email válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})
type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginValues) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password })
    if (error) {
      toast.error('Error al iniciar sesión', {
        description: error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos.'
          : error.message,
      })
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex bg-[#07090F]">

      {/* ── Left: Arena Art ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <radialGradient id="loginArena" cx="50%" cy="65%" r="55%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.18"/>
              <stop offset="40%" stopColor="#3B82F6" stopOpacity="0.08"/>
              <stop offset="100%" stopColor="#07090F" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="loginPlatform" cx="50%" cy="70%" r="35%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.50"/>
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="loginMtn1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0E1528"/>
              <stop offset="100%" stopColor="#080B16"/>
            </linearGradient>
            <linearGradient id="loginMtn2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0A0E1E"/>
              <stop offset="100%" stopColor="#060810"/>
            </linearGradient>
            <filter id="lgBlur">
              <feGaussianBlur stdDeviation="6"/>
            </filter>
          </defs>

          <rect width="800" height="900" fill="#07090F"/>
          <rect width="800" height="900" fill="url(#loginArena)"/>

          {/* Stars */}
          {[
            [80,60],[180,35],[290,80],[420,25],[540,55],[660,30],[740,75],
            [50,130],[200,110],[370,140],[520,100],[680,125],[760,90],
            [120,200],[320,180],[460,210],[620,190],[90,280],[410,260],[700,240],
          ].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r={i%3===0?0.9:0.6} fill="white" opacity={0.2+((i*7)%5)*0.08}/>
          ))}

          {/* Topographic contours */}
          <g stroke="rgba(255,255,255,0.025)" strokeWidth="0.7" fill="none">
            <ellipse cx="400" cy="580" rx="360" ry="260"/>
            <ellipse cx="400" cy="580" rx="290" ry="208"/>
            <ellipse cx="400" cy="580" rx="220" ry="158"/>
            <ellipse cx="400" cy="580" rx="150" ry="108"/>
            <ellipse cx="400" cy="580" rx="88" ry="62"/>
            <ellipse cx="400" cy="580" rx="42" ry="30"/>
          </g>
          <g stroke="rgba(96,165,250,0.014)" strokeWidth="1" fill="none">
            <ellipse cx="400" cy="580" rx="256" ry="180"/>
            <ellipse cx="400" cy="580" rx="172" ry="120"/>
          </g>

          {/* Far mountains */}
          <path d="M0,900 L50,720 L130,760 L220,690 L320,720 L420,660 L510,700 L600,640 L680,670 L760,620 L800,640 L800,900Z" fill="url(#loginMtn1)"/>
          {/* Mid mountains */}
          <path d="M0,900 L80,780 L180,820 L280,760 L380,800 L480,740 L580,780 L680,730 L780,760 L800,750 L800,900Z" fill="url(#loginMtn2)"/>

          {/* Light beams */}
          <g opacity="0.05" filter="url(#lgBlur)">
            <line x1="400" y1="860" x2="150" y2="0" stroke="#F59E0B" strokeWidth="70"/>
            <line x1="400" y1="860" x2="400" y2="0" stroke="#F59E0B" strokeWidth="90"/>
            <line x1="400" y1="860" x2="650" y2="0" stroke="#F59E0B" strokeWidth="70"/>
          </g>

          {/* Platform glow */}
          <ellipse cx="400" cy="858" rx="180" ry="16" fill="url(#loginPlatform)" filter="url(#lgBlur)"/>

          {/* Platform rings */}
          <ellipse cx="400" cy="858" rx="110" ry="9" fill="none" stroke="#F59E0B" strokeWidth="0.7" opacity="0.30"/>
          <ellipse cx="400" cy="858" rx="75" ry="6" fill="none" stroke="#F59E0B" strokeWidth="0.5" opacity="0.20"/>

          {/* Pokeball watermark */}
          <circle cx="400" cy="560" r="72" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1"/>
          <circle cx="400" cy="560" r="56" fill="none" stroke="rgba(255,255,255,0.028)" strokeWidth="1"/>
          <line x1="328" y1="560" x2="472" y2="560" stroke="rgba(255,255,255,0.032)" strokeWidth="0.8"/>
          <circle cx="400" cy="560" r="16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          <circle cx="400" cy="560" r="8" fill="rgba(255,255,255,0.035)"/>
        </svg>

        {/* Text overlay on left panel */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-amber-400/70 mb-4">
            Campeonato Nuzlocke
          </p>
          <h1 className="text-5xl xl:text-6xl font-black tracking-tighter leading-none mb-4 text-white/95">
            THE ARENA
            <br/>
            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(245,158,11,0.35)]">
              AWAITS
            </span>
          </h1>
          <p className="text-sm text-white/30 max-w-xs leading-relaxed font-medium">
            Solo los más fuertes sobreviven el Nuzlocke. ¿Tienes lo que hace falta?
          </p>
        </div>

        {/* Right-side fade */}
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#07090F] to-transparent"/>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#07090F] to-transparent"/>
      </div>

      {/* ── Right: Login form ── */}
      <div className="flex flex-1 lg:flex-none lg:w-[420px] flex-col items-center justify-center p-8 bg-[#07090F] border-l border-white/5 relative">
        {/* Mobile background */}
        <div className="absolute inset-0 lg:hidden" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 to-transparent"/>
        </div>

        <div className="relative w-full max-w-sm space-y-8">
          {/* Brand */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl shadow-amber-500/30 mb-5">
              <Swords className="h-6 w-6 text-white" strokeWidth={2.5}/>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">NUZLOCKE</span>
              {' '}<span className="font-light text-white/50 tracking-[0.2em] text-xl">TRACKER</span>
            </h2>
            <p className="text-sm text-white/35 mt-1.5">Torneo Pokémon entre amigos</p>
          </div>

          {/* Form card */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-white">Iniciar sesión</h3>
              <p className="text-sm text-white/40 mt-0.5">Introduce tus credenciales para entrar.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.15em] text-white/45">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!errors.email}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-amber-400/50 focus:ring-amber-400/20"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.15em] text-white/45">
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-amber-400/50 focus:ring-amber-400/20"
                  {...register('password')}
                />
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 border-0 shadow-lg shadow-amber-500/25 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Entrando...</>
                ) : (
                  'Entrar al torneo'
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-white/20">
            Sin cuenta? Contacta al admin.
          </p>
        </div>
      </div>
    </div>
  )
}
