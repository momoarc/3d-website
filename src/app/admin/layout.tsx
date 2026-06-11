'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Package,
  GitBranch,
  Watch,
  Plus,
  Users,
  BarChart3,
  Sparkles,
  Trophy,
  UserCog,
  Award,
  Truck,
  Box,
  Megaphone,
  Target,
  Shield,
  Settings,
  LogOut,
  Menu,
  Bell,
  ChevronDown,
  MessageCircle,
  CreditCard,
  Eye,
  FileText,
} from 'lucide-react'
import type { UserRole } from '@/lib/types'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Tableau de Bord', href: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: 'Commandes', href: '/admin/orders', icon: <Package className="h-4 w-4" /> },
      { label: 'Pipeline Livraison', href: '/admin/pipeline', icon: <GitBranch className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { label: 'Produits', href: '/admin/products', icon: <Watch className="h-4 w-4" /> },
      { label: 'Ajouter un Produit', href: '/admin/products/new', icon: <Plus className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Clients & Analytics',
    items: [
      { label: 'Clients', href: '/admin/clients', icon: <Users className="h-4 w-4" /> },
      { label: 'Statistiques', href: '/admin/analytics', icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Showroom',
    items: [
      { label: 'Showroom 360°', href: '/admin/showroom', icon: <Sparkles className="h-4 w-4" /> },
      { label: 'Réalisations', href: '/admin/projects', icon: <Trophy className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Équipe',
    items: [
      { label: 'Employés', href: '/admin/employees', icon: <UserCog className="h-4 w-4" /> },
      { label: 'Performances', href: '/admin/performance', icon: <Award className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Livraison',
    items: [
      { label: 'Services Livraison', href: '/admin/delivery', icon: <Truck className="h-4 w-4" /> },
      { label: 'Expéditions', href: '/admin/shipments', icon: <Box className="h-4 w-4" /> },
      { label: 'Paiement', href: '/admin/payment-methods', icon: <CreditCard className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Réseaux Sociaux', href: '/admin/marketing', icon: <Megaphone className="h-4 w-4" /> },
      { label: 'Leads & Tracking', href: '/admin/leads', icon: <Target className="h-4 w-4" /> },
      { label: 'Chatbot', href: '/admin/chatbot', icon: <MessageCircle className="h-4 w-4" /> },
      { label: 'Landing Pages', href: '/admin/landing-pages', icon: <FileText className="h-4 w-4" /> },
      { label: 'FOMO', href: '/admin/fomo', icon: <Eye className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Système',
    items: [
      { label: 'Gestion des Accès', href: '/admin/users', icon: <Shield className="h-4 w-4" /> },
      { label: 'Paramètres', href: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
    ],
  },
]

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)] px-3 py-4">
      <div className="space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#606060]">
              {group.title}
            </p>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                      isActive
                        ? 'bg-[#c9a84c]/10 text-[#c9a84c] font-medium'
                        : 'text-[#a0a09a] hover:bg-white/[0.04] hover:text-[#f5f5f0]'
                    }`}
                  >
                    <span className={isActive ? 'text-[#c9a84c]' : 'text-[#606060]'}>{item.icon}</span>
                    {item.label}
                  </a>
                )
              })}
            </nav>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email?: string; id: string } | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    // Skip auth check on the login page itself
    if (isLoginPage) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function checkAuth() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (cancelled) return

      if (!authUser) {
        router.push('/admin/login')
        return
      }

      setUser({ email: authUser.email, id: authUser.id })

      // Get role
      const metaRole = authUser.app_metadata?.role as UserRole | undefined
      if (metaRole) {
        setUserRole(metaRole)
      } else {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
        if (!cancelled && roles && roles.length > 0) {
          setUserRole(roles[0].role as UserRole)
        }
      }
      if (!cancelled) setLoading(false)
    }

    checkAuth()

    return () => { cancelled = true }
  }, [router, isLoginPage])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
          <p className="text-[#a0a09a] text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  // Login page renders without sidebar/header chrome
  if (isLoginPage) {
    return <>{children}</>
  }

  const initials = user?.email?.substring(0, 2).toUpperCase() || 'AD'

  return (
    <div className="min-h-screen bg-[#08080a] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 bg-[#08080a] border-r border-white/[0.06]">
        <div className="flex h-16 items-center gap-2 px-5 border-b border-white/[0.06]">
          <div className="h-8 w-8 rounded-lg bg-[#c9a84c] flex items-center justify-center">
            <span className="text-[#0a0800] font-bold text-sm">MD</span>
          </div>
          <span className="font-serif font-bold text-[#f5f5f0]">Maison Dorée</span>
        </div>
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Main content area */}
      <div className="flex-1 lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-white/[0.06] bg-[#08080a]/80 backdrop-blur-xl px-4 lg:px-6">
          {/* Mobile menu */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-[#a0a09a]">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-[#08080a] border-white/[0.06] p-0">
              <div className="flex h-16 items-center gap-2 px-5 border-b border-white/[0.06]">
                <div className="h-8 w-8 rounded-lg bg-[#c9a84c] flex items-center justify-center">
                  <span className="text-[#0a0800] font-bold text-sm">MD</span>
                </div>
                <span className="font-serif font-bold text-[#f5f5f0]">Maison Dorée</span>
              </div>
              <SidebarContent pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-7 w-7 rounded-md bg-[#c9a84c] flex items-center justify-center">
              <span className="text-[#0a0800] font-bold text-xs">MD</span>
            </div>
          </div>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-[#a0a09a] hover:text-[#f5f5f0] relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#c9a84c] rounded-full" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-white/[0.04]">
                  <Avatar className="h-8 w-8 bg-[#1a1a1e] border border-white/[0.08]">
                    <AvatarFallback className="bg-[#c9a84c]/10 text-[#c9a84c] text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-xs text-[#f5f5f0]">{user?.email}</span>
                    <span className="text-[10px] text-[#c9a84c] uppercase font-medium">{userRole}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-[#606060] hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#111113] border-white/[0.08]">
                <DropdownMenuItem className="text-[#a0a09a] cursor-default">
                  <span className="text-xs">{user?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem onClick={() => router.push('/admin/settings')} className="text-[#a0a09a] focus:text-[#f5f5f0]">
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-300">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
