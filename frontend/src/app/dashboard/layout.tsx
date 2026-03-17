'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Building2, Users, ClipboardList, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/dashboard',           label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/dashboard/empresas',  label: 'Empresas',   icon: Building2 },
  { href: '/dashboard/pacientes', label: 'Pacientes',  icon: Users },
  { href: '/dashboard/visitas',   label: 'Visitas',    icon: ClipboardList },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex flex-col`} style={{ backgroundColor: '#2b3940' }}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 bg-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2.5">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0">
                <Image src="/logo_white.png" alt="Logo" width={56} height={56} className="object-contain" unoptimized />
              </div>
              <span className="font-semibold text-white text-sm leading-tight">SIGVME</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-teal-100 hover:bg-teal-500 hover:text-white shrink-0">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                  ${active
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-teal-100 hover:bg-white/10 hover:text-white'
                  }`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {sidebarOpen && <span>{label}</span>}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-teal-500">
          {sidebarOpen && (
            <p className="px-3 py-1 text-xs text-teal-200 truncate">{user?.username}</p>
          )}
          <Button variant="ghost" size={sidebarOpen ? 'sm' : 'icon'}
            className="w-full text-teal-100 hover:bg-teal-500 hover:text-white"
            onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Salir</span>}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
        <footer className="border-t bg-white px-6 py-2.5 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-slate-500">SIGVME</span> · Sistema de Gestión de Visitas Médicas
          </p>
          <p className="text-xs text-slate-400">
            Desarrollado por{' '}
            <a href="https://thepydeveloper.dev" target="_blank" rel="noopener noreferrer"
              className="text-teal-600 hover:underline font-medium">
              Julio Franco
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
