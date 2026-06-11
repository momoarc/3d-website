'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function checkAccess() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (cancelled) return

      if (!user) {
        router.push('/admin/login')
        return
      }

      // Check app_metadata role
      const metaRole = user.app_metadata?.role
      if (metaRole && allowedRoles.includes(metaRole)) {
        setHasAccess(true)
        setLoading(false)
        return
      }

      // Check user_roles table
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      if (cancelled) return

      const userRoles = roles?.map(r => r.role) || []
      if (allowedRoles.some(role => userRoles.includes(role))) {
        setHasAccess(true)
      } else {
        setHasAccess(false)
      }
      setLoading(false)
    }

    checkAccess()

    return () => { cancelled = true }
  }, [allowedRoles, router])

  if (loading) return <div className="p-8 text-center text-[#a0a09a]">Vérification des accès...</div>
  if (!hasAccess) return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-red-400">🚫 Accès non autorisé</h2>
      <p className="text-[#a0a09a] mt-2">Vous n&apos;avez pas les permissions nécessaires.</p>
    </div>
  )

  return <>{children}</>
}
