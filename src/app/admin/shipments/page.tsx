'use client'

import PlaceholderPage from '@/components/admin/PlaceholderPage'
import { Box } from 'lucide-react'

export default function ShipmentsPage() {
  return (
    <PlaceholderPage
      title="Expéditions"
      description="Suivez les expéditions en cours, les numéros de suivi et les statuts de livraison."
      icon={<Box className="h-8 w-8" />}
    />
  )
}
