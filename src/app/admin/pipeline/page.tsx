'use client'

import PlaceholderPage from '@/components/admin/PlaceholderPage'
import { GitBranch } from 'lucide-react'

export default function PipelinePage() {
  return (
    <PlaceholderPage
      title="Pipeline Livraison"
      description="Visualisez et gérez le pipeline de livraison avec les étapes de confirmation, expédition et livraison."
      icon={<GitBranch className="h-8 w-8" />}
    />
  )
}
