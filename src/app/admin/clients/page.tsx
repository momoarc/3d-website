'use client'

import PlaceholderPage from '@/components/admin/PlaceholderPage'
import { Users } from 'lucide-react'

export default function ClientsPage() {
  return (
    <PlaceholderPage
      title="Clients"
      description="Gérez la base de clients, l'historique des commandes et les informations de contact."
      icon={<Users className="h-8 w-8" />}
    />
  )
}
