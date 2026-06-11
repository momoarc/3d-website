'use client'

import PlaceholderPage from '@/components/admin/PlaceholderPage'
import { Truck } from 'lucide-react'

export default function DeliveryPage() {
  return (
    <PlaceholderPage
      title="Services Livraison"
      description="Configurez les services de livraison, les zones couvertes et les tarifs par wilaya."
      icon={<Truck className="h-8 w-8" />}
    />
  )
}
