'use client'

import PlaceholderPage from '@/components/admin/PlaceholderPage'
import { Award } from 'lucide-react'

export default function PerformancePage() {
  return (
    <PlaceholderPage
      title="Performances"
      description="Suivez les performances de l'équipe : taux de confirmation, délais de livraison, et KPIs individuels."
      icon={<Award className="h-8 w-8" />}
    />
  )
}
