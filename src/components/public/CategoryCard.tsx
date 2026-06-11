'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface CategoryCardProps {
  category: {
    id: number
    name: string
    slug: string
    description: string | null
    image_url: string | null
  }
  wide?: boolean
  badge?: string
}

export default function CategoryCard({ category, wide = false, badge }: CategoryCardProps) {
  return (
    <Link
      href={`/catalogue?category=${encodeURIComponent(category.slug)}`}
      className={`relative rounded-[10px] overflow-hidden cursor-pointer group border border-white/[0.08] hover:border-[#c9a84c]/15 transition-all duration-300 ${
        wide
          ? 'md:col-span-2 min-h-[340px] aspect-auto'
          : 'aspect-[3/4]'
      }`}
    >
      {/* Image */}
      <img
        src={category.image_url || '/images/watches/automatique-acier.jpg'}
        alt={category.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-[0.7] group-hover:brightness-[0.85]"
        loading="lazy"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        {badge && (
          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-[1.5px] uppercase bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30 mb-3">
            {badge}
          </span>
        )}
        <h3 className="font-serif text-[22px] font-medium text-[#f5f5f0] mb-1.5">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-xs text-[#a0a09a] mb-3.5">{category.description}</p>
        )}
        <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[2px] uppercase text-[#c9a84c] group-hover:gap-2.5 transition-all duration-300">
          Voir la collection
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  )
}
