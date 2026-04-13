'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Swords } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginValues) {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      toast.error('Error al iniciar sesión', {
        description:
          error.message === 'Invalid login credentials'
            ? 'Email o contraseña incorrectos. Inténtalo de nuevo.'
            : error.message,
      })
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">

      {/* Background: topographic pattern (dark) + gradient (light) */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden dark:block topo-lines opacity-100" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-blue-50/30 via-transparent to-indigo-50/20 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-blue-400/0 dark:bg-blue-500/4 blur-3xl" />
      </div>

      {/* Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25 mb-4">
          <Swords className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-300 bg-clip-text text-transparent">
            NUZLOCKE
          </span>
          {' '}
          <span className="font-light text-foreground/70 tracking-widest uppercase text-xl">Tracker</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">Torneo Pokémon Nuzlocke</p>
      </div>

      {/* Login card */}
      <Card className="w-full max-w-sm shadow-lg border-border/60">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg font-bold">Iniciar sesión</CardTitle>
          <CardDescription className="text-sm">
            Introduce tus credenciales para acceder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                autoFocus
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground/60 mt-6">
        Sin cuenta? Contacta al admin.
      </p>
    </div>
  )
}
