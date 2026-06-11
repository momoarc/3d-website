'use client'

import PlaceholderPage from '@/components/admin/PlaceholderPage'
import { UserCog } from 'lucide-react'

export default function EmployeesPage() {
  return (
    <PlaceholderPage
      title="Employés"
      description="Gérez les employés, leurs rôles et leurs accès au système de confirmation et livraison."
      icon={<UserCog className="h-8 w-8" />}
    />
  )
}
