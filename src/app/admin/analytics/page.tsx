'use client'

import PlaceholderPage from '@/components/admin/PlaceholderPage'
import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <PlaceholderPage
      title="Statistiques"
      description="Visualisez les statistiques de vente, les tendances et les rapports d'activité détaillés."
      icon={<BarChart3 className="h-8 w-8" />}
    />
  )
}
