'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'

export default function CatalogueProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const resolveProduct = async () => {
      try {
        // Try fetching by slug - the API supports ?slug= parameter
        const res = await fetch(`/api/products?slug=${encodeURIComponent(slug)}`)
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const data = await res.json()
        // API returns an array when using query params
        const product = Array.isArray(data) ? data[0] : data
        if (product && product.id) {
          router.replace(`/produit/${product.id}`)
        } else {
          setNotFound(true)
        }
      } catch {
        // If slug resolution fails, try as ID (maybe it's a numeric slug)
        if (/^\d+$/.test(slug)) {
          router.replace(`/produit/${slug}`)
        } else {
          setNotFound(true)
        }
      }
    }
    resolveProduct()
  }, [slug, router])

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#08080a]">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="font-serif text-3xl text-[#f5f5f0] mb-2">Produit introuvable</h1>
        <p className="text-[#a0a09a]">Ce produit n&apos;existe pas ou a été retiré.</p>
        <a href="/catalogue" className="mt-6 bg-[#c9a84c] text-[#0a0800] px-6 py-3 rounded text-[11px] font-bold tracking-[2px] uppercase">
          Retour au catalogue
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#08080a]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
      <p className="text-[#a0a09a] text-sm mt-4">Chargement...</p>
    </div>
  )
}
