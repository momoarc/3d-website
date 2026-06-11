'use client'

import { usePathname } from 'next/navigation'
import WhatsAppButton from './WhatsAppButton'
import CartDrawer from './CartDrawer'

export default function PublicWidgets() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  if (isAdmin) return null

  return (
    <>
      <CartDrawer />
      <WhatsAppButton />
    </>
  )
}
