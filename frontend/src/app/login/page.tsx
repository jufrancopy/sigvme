'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import Image from 'next/image'

const loginSchema = z.object({
  username: z.string().min(1, 'Requerido'),
  password: z.string().min(1, 'Requerido'),
})

type LoginForm = z.infer<typeof loginSchema>

const TECHS = [
  { name: 'Django', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg' },
  { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
  { name: 'TypeScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
  { name: 'PostgreSQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
]

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [error, setError] = useState('')

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('')
      await login(data.username, data.password)
      router.push('/dashboard')
    } catch {
      setError('Usuario o contraseña incorrectos')
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-teal-600 flex-col items-center justify-between p-12">
        <div className="flex flex-col items-center gap-6 flex-1 justify-center">
          {/* Logo */}
          <div className="w-36 h-36 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e8f0ee' }}>
            <Image
              src="/logo_white.png"
              alt="Logo SIGVME"
              width={220}
              height={220}
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">SIGVME</h1>
            <p className="text-teal-200 mt-2 text-lg">Sistema de Gestión de Visitas Médicas</p>
          </div>
          <p className="text-teal-100/70 text-sm text-center max-w-xs mt-4">
            Gestión integral de jornadas clínicas, evaluaciones y reportes de salud laboral.
          </p>
        </div>

        {/* Stack tecnológico */}
        <div className="w-full">
          <p className="text-teal-300 text-xs text-center mb-3 uppercase tracking-widest">Desarrollado con</p>
          <div className="flex justify-center gap-4 flex-wrap">
            {TECHS.map(t => (
              <div key={t.name} title={t.name} className="w-8 h-8 bg-white/10 rounded-lg p-1.5 hover:bg-white/20 transition-colors">
                <img src={t.icon} alt={t.name} className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
          <p className="text-teal-300/60 text-xs text-center mt-4">
            Desarrollado por{' '}
            <a href="https://thepydeveloper.dev" target="_blank" rel="noopener noreferrer" className="text-teal-200 hover:text-white underline underline-offset-2 transition-colors">
              Julio Franco
            </a>
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo mobile */}
        <div className="lg:hidden flex flex-col items-center mb-8 gap-3">
          <Image src="/logo_white.png" alt="Logo" width={72} height={72} className="object-contain" />
          <h1 className="text-xl font-bold text-slate-800">SIGVME</h1>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Bienvenido</h2>
          <p className="text-sm text-slate-500 mb-8">Ingresá tus credenciales para continuar</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Usuario</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario" className="h-11 border-slate-200 focus-visible:ring-teal-500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" className="h-11 border-slate-200 focus-visible:ring-teal-500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
          </Form>

          <p className="text-xs text-slate-400 text-center mt-8">
            Desarrollado por{' '}
            <a href="https://thepydeveloper.dev" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
              Julio Franco
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
