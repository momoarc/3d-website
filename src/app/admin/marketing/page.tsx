'use client'

import PlaceholderPage from '@/components/admin/PlaceholderPage'
import { Megaphone } from 'lucide-react'

export default function MarketingPage() {
  return (
    <PlaceholderPage
      title="Réseaux Sociaux"
      description="Gérez les publications, planifiez le contenu et suivez l'engagement sur les réseaux sociaux."
      icon={<Megaphone className="h-8 w-8" />}
    />
  )
}
