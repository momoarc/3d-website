'use client'

import PlaceholderPage from '@/components/admin/PlaceholderPage'
import { Target } from 'lucide-react'

export default function LeadsPage() {
  return (
    <PlaceholderPage
      title="Leads & Tracking"
      description="Suivez les prospects, les sources de leads et les conversions. Analysez le funnel de vente."
      icon={<Target className="h-8 w-8" />}
    />
  )
}
