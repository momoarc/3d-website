'use client'

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Filter, X, RotateCcw, ChevronDown, SlidersHorizontal } from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import ProductCard from '@/components/public/ProductCard'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Default data empty - all content comes from Supabase admin panel
const DEFAULT_CATEGORIES: Array<Record<string, unknown>> = []
const DEFAULT_PRODUCTS: Array<Record<string, unknown>> = []

type SortOption = 'pertinence' | 'prix-asc' | 'prix-desc' | 'nouveautes' | 'bestsellers'
type GenderFilter = 'Tous' | 'Homme' | 'Femme' | 'Mixte'

const PRICE_MIN = 0
const PRICE_MAX = 600000

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'pertinence', label: 'Pertinence' },
  { value: 'prix-asc', label: 'Prix croissant ↑' },
  { value: 'prix-desc', label: 'Prix décroissant ↓' },
  { value: 'nouveautes', label: 'Nouveautés' },
  { value: 'bestsellers', label: 'Bestsellers' },
]

const GENDER_OPTIONS: GenderFilter[] = ['Tous', 'Homme', 'Femme', 'Mixte']

function formatPriceSpace(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

function CatalogueContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || ''

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [products, setProducts] = useState(DEFAULT_PRODUCTS)
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [loading, setLoading] = useState(true)
  const [filterTransition, setFilterTransition] = useState(false)

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX])
  const [sortBy, setSortBy] = useState<SortOption>('pertinence')
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('Tous')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.allSettled([
          fetch('/api/categories'),
          fetch('/api/products'),
        ])

        if (catRes.status === 'fulfilled') {
          const catData = await catRes.value.json()
          if (catData && catData.length > 0) setCategories(catData)
        }
        if (prodRes.status === 'fulfilled') {
          const prodData = await prodRes.value.json()
          if (prodData && prodData.length > 0) setProducts(prodData)
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Get gender from product (either direct field or from attributes JSONB)
  const getProductGender = useCallback((product: Record<string, unknown>): string => {
    // Direct gender field
    if (product.gender && typeof product.gender === 'string') {
      return product.gender
    }
    // Fallback: check attributes for Genre
    const attributes = product.attributes
    if (Array.isArray(attributes)) {
      for (const attr of attributes) {
        if (attr && attr.name === 'Genre' && Array.isArray(attr.values) && attr.values.length > 0) {
          return attr.values[0]
        }
      }
    }
    return 'Mixte'
  }, [])

  // Check if product matches gender filter
  const matchesGender = useCallback((product: Record<string, unknown>, gender: GenderFilter): boolean => {
    if (gender === 'Tous') return true
    const productGender = getProductGender(product)
    return productGender === gender
  }, [getProductGender])

  // Apply all filters and sorting
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Category filter
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory)
    }

    // Price range filter
    result = result.filter((p) => {
      const price = p.price as number
      return price >= priceRange[0] && price <= priceRange[1]
    })

    // Gender filter
    result = result.filter((p) => matchesGender(p, genderFilter))

    // Availability filter
    if (inStockOnly) {
      result = result.filter((p) => p.available !== false)
    }

    // Sorting
    switch (sortBy) {
      case 'prix-asc':
        result.sort((a, b) => (a.price as number) - (b.price as number))
        break
      case 'prix-desc':
        result.sort((a, b) => (b.price as number) - (a.price as number))
        break
      case 'nouveautes':
        result.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at as string).getTime() : 0
          const dateB = b.created_at ? new Date(b.created_at as string).getTime() : 0
          return dateB - dateA
        })
        break
      case 'bestsellers':
        result.sort((a, b) => {
          const aBest = a.badge === 'Bestseller' ? 1 : 0
          const bBest = b.badge === 'Bestseller' ? 1 : 0
          return bBest - aBest
        })
        break
      default:
        break
    }

    return result
  }, [products, activeCategory, priceRange, genderFilter, inStockOnly, sortBy, matchesGender])

  // Check if any filter is active (beyond defaults)
  const hasActiveFilters = useMemo(() => {
    return (
      priceRange[0] !== PRICE_MIN ||
      priceRange[1] !== PRICE_MAX ||
      genderFilter !== 'Tous' ||
      inStockOnly ||
      sortBy !== 'pertinence'
    )
  }, [priceRange, genderFilter, inStockOnly, sortBy])

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilterTransition(true)
    setTimeout(() => {
      setPriceRange([PRICE_MIN, PRICE_MAX])
      setSortBy('pertinence')
      setGenderFilter('Tous')
      setInStockOnly(false)
      setActiveCategory('')
      setFilterTransition(false)
    }, 150)
  }, [])

  // Handle filter changes with transition
  const handleFilterChange = useCallback((fn: () => void) => {
    setFilterTransition(true)
    setTimeout(() => {
      fn()
      setFilterTransition(false)
    }, 150)
  }, [])

  // Active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = []

    if (priceRange[0] !== PRICE_MIN || priceRange[1] !== PRICE_MAX) {
      chips.push({
        key: 'price',
        label: `${formatPriceSpace(priceRange[0])} DA - ${formatPriceSpace(priceRange[1])} DA`,
        onRemove: () => handleFilterChange(() => setPriceRange([PRICE_MIN, PRICE_MAX])),
      })
    }

    if (genderFilter !== 'Tous') {
      chips.push({
        key: 'gender',
        label: genderFilter,
        onRemove: () => handleFilterChange(() => setGenderFilter('Tous')),
      })
    }

    if (inStockOnly) {
      chips.push({
        key: 'stock',
        label: 'En stock',
        onRemove: () => handleFilterChange(() => setInStockOnly(false)),
      })
    }

    if (sortBy !== 'pertinence') {
      const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || sortBy
      chips.push({
        key: 'sort',
        label: sortLabel,
        onRemove: () => handleFilterChange(() => setSortBy('pertinence')),
      })
    }

    return chips
  }, [priceRange, genderFilter, inStockOnly, sortBy, handleFilterChange])

  return (
    <div className="min-h-screen flex flex-col bg-[#08080a]">
      <Navbar />

      <main className="pt-[72px] flex-1">
        {/* Header */}
        <section className="py-12 md:py-16 border-b border-white/[0.08]">
          <div className="max-w-[1200px] mx-auto px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[12px] tracking-[1.5px] uppercase text-[#a0a09a] hover:text-[#c9a84c] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l&apos;accueil
            </Link>
            <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
              Collection Complète
            </div>
            <h1 className="font-serif text-[clamp(32px,5vw,56px)] font-medium leading-[1.1] text-[#f5f5f0] mb-4">
              Notre Catalogue
            </h1>
            <p className="text-[16px] text-[#a0a09a] max-w-lg">
              Découvrez notre collection de montres de luxe. Livraison dans les 58 wilayas,
              paiement à la livraison.
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="sticky top-[72px] z-40 bg-[#08080a]/98 backdrop-blur-xl border-b border-white/[0.08]">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-none">
              <Filter className="w-4 h-4 text-[#606060] flex-shrink-0" />
              <button
                onClick={() => handleFilterChange(() => setActiveCategory(''))}
                className={`px-4 py-2 rounded text-[11px] font-semibold tracking-[1.5px] uppercase whitespace-nowrap transition-all duration-200 ${
                  !activeCategory
                    ? 'bg-[#c9a84c] text-[#0a0800]'
                    : 'bg-white/5 text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/10'
                }`}
              >
                Tout
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleFilterChange(() => setActiveCategory(cat.slug))}
                  className={`px-4 py-2 rounded text-[11px] font-semibold tracking-[1.5px] uppercase whitespace-nowrap transition-all duration-200 ${
                    activeCategory === cat.slug
                      ? 'bg-[#c9a84c] text-[#0a0800]'
                      : 'bg-white/5 text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/10'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Advanced Filter Bar */}
        <section className="sticky top-[120px] z-30 bg-[#111113] border-b border-white/[0.08]">
          <div className="max-w-[1200px] mx-auto px-6">
            {/* Toggle filters button (mobile) + Sort */}
            <div className="flex items-center justify-between py-3 gap-4">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-2 text-[11px] font-semibold tracking-[1.5px] uppercase text-[#a0a09a] hover:text-[#f5f5f0] transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtres
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[1px] uppercase text-[#606060] hidden sm:inline">Trier par</span>
                <Select value={sortBy} onValueChange={(v) => handleFilterChange(() => setSortBy(v as SortOption))}>
                  <SelectTrigger className="h-8 bg-white/5 border-white/[0.08] text-[#f5f5f0] text-[11px] tracking-[0.5px] w-auto min-w-[140px] hover:bg-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111113] border-white/[0.08]">
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-[#f5f5f0] text-[12px] focus:bg-white/10 focus:text-[#f5f5f0]">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Expanded filters — ONLY visible when user clicks the Filtres button */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                filtersOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="pb-4 space-y-5 border-t border-white/[0.06] pt-4">
                {/* Price Range + Gender + Availability row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Price Range */}
                  <div className="space-y-3">
                    <label className="text-[10px] tracking-[2px] uppercase text-[#606060] font-semibold">
                      Prix
                    </label>
                    <div className="pt-2">
                      <Slider
                        min={PRICE_MIN}
                        max={PRICE_MAX}
                        step={5000}
                        value={priceRange}
                        onValueChange={(val) => setPriceRange(val as [number, number])}
                        className="w-full [&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:bg-[#1a1a1e] [&_[data-slot=slider-range]]:bg-[#c9a84c] [&_[data-slot=slider-thumb]]:h-4 [&_[data-slot=slider-thumb]]:w-4 [&_[data-slot=slider-thumb]]:border-[#c9a84c] [&_[data-slot=slider-thumb]]:bg-[#08080a] [&_[data-slot=slider-thumb]]:hover:border-[#e4c06a]"
                      />
                    </div>
                    <div className="text-[12px] text-[#a0a09a] font-medium">
                      {formatPriceSpace(priceRange[0])} DA — {formatPriceSpace(priceRange[1])} DA
                    </div>
                  </div>

                  {/* Gender Filter */}
                  <div className="space-y-3">
                    <label className="text-[10px] tracking-[2px] uppercase text-[#606060] font-semibold">
                      Genre
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {GENDER_OPTIONS.map((g) => (
                        <button
                          key={g}
                          onClick={() => handleFilterChange(() => setGenderFilter(g))}
                          className={`px-3.5 py-1.5 rounded text-[11px] font-semibold tracking-[1px] uppercase transition-all duration-200 ${
                            genderFilter === g
                              ? 'bg-[#c9a84c] text-[#0a0800]'
                              : 'bg-white/5 text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/10'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="space-y-3">
                    <label className="text-[10px] tracking-[2px] uppercase text-[#606060] font-semibold">
                      Disponibilité
                    </label>
                    <button
                      onClick={() => handleFilterChange(() => setInStockOnly(!inStockOnly))}
                      className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded transition-all duration-200 ${
                        inStockOnly
                          ? 'bg-[#c9a84c]/15 border border-[#c9a84c]/30 text-[#c9a84c]'
                          : 'bg-white/5 border border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/10'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                        inStockOnly
                          ? 'bg-[#c9a84c] border-[#c9a84c]'
                          : 'border-white/20'
                      }`}>
                        {inStockOnly && (
                          <svg className="w-3 h-3 text-[#0a0800]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="text-[11px] font-semibold tracking-[1px] uppercase">
                        En stock uniquement
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="pb-3 flex items-center gap-2 flex-wrap">
                {activeFilterChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30 transition-all duration-200"
                  >
                    {chip.label}
                    <button
                      onClick={chip.onRemove}
                      className="hover:bg-[#c9a84c]/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium text-[#606060] hover:text-[#f87171] border border-white/[0.06] hover:border-[#f87171]/30 transition-all duration-200"
                >
                  <RotateCcw className="w-3 h-3" />
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-12 md:py-16">
          <div className="max-w-[1200px] mx-auto px-6">
            {/* Product count */}
            {!loading && (
              <div className="mb-6 text-[12px] text-[#a0a09a] tracking-[0.5px]">
                <span className="text-[#f5f5f0] font-semibold">{filteredProducts.length}</span>{' '}
                montre{filteredProducts.length !== 1 ? 's' : ''} trouvée{filteredProducts.length !== 1 ? 's' : ''}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-[#111113] border border-white/[0.08] rounded-[10px] overflow-hidden">
                    <div className="aspect-square bg-[#1a1a1e] animate-pulse" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 bg-[#1a1a1e] rounded w-1/3 animate-pulse" />
                      <div className="h-5 bg-[#1a1a1e] rounded w-2/3 animate-pulse" />
                      <div className="h-3 bg-[#1a1a1e] rounded w-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[#606060] text-lg mb-4">Aucun produit trouvé avec ces critères.</p>
                <button
                  onClick={resetFilters}
                  className="text-[#c9a84c] text-sm font-semibold tracking-[1.5px] uppercase hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity duration-300 ${filterTransition ? 'opacity-40' : 'opacity-100'}`}>
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${Math.min(index * 60, 400)}ms`, animationFillMode: 'both' }}
                  >
                    <ProductCard
                      product={product}
                      onOrder={(productId) => {
                        window.location.href = `/commander?product_id=${productId}`
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Results count */}
            {!loading && filteredProducts.length > 0 && (
              <div className="text-center mt-10 text-[12px] text-[#606060] tracking-[1px]">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}{' '}
                {activeCategory ? `dans cette catégorie` : 'au total'}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 md:py-16 border-t border-white/[0.08] bg-gradient-to-br from-[#c9a84c]/8 to-transparent">
          <div className="max-w-[800px] mx-auto px-6 text-center">
            <h2 className="font-serif text-[clamp(24px,4vw,36px)] font-medium text-[#f5f5f0] mb-4">
              Vous ne trouvez pas ce que vous cherchez ?
            </h2>
            <p className="text-[15px] text-[#a0a09a] mb-6">
              Contactez-nous et nous vous aiderons à trouver la montre idéale pour vous.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="https://wa.me/213XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#c9a84c] text-[#0a0800] px-8 py-3.5 rounded text-[12px] font-bold tracking-[2px] uppercase shadow-[0_4px_24px_rgba(201,168,76,0.3)] hover:bg-[#e4c06a] transition-all duration-200"
              >
                Commander via WhatsApp
              </a>
              <a
                href="tel:+213XXXXXXXXX"
                className="border border-white/[0.18] text-[#f5f5f0] px-8 py-3.5 rounded text-[12px] font-semibold tracking-[2px] uppercase hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all duration-200"
              >
                Appeler
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.08] bg-[#08080a]">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#c9a84c] flex items-center justify-center text-[11px] font-bold text-[#0a0800] rounded-sm">
                MD
              </div>
              <span className="text-sm font-semibold tracking-[3px] uppercase text-[#f5f5f0]">
                Maison Dorée
              </span>
            </div>
            <div className="text-[12px] text-[#606060]">
              © {new Date().getFullYear()} Maison Dorée. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function CataloguePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-[#08080a]">
        <Navbar />
        <main className="pt-[72px] flex-1 flex items-center justify-center">
          <div className="text-[#606060]">Chargement...</div>
        </main>
      </div>
    }>
      <CatalogueContent />
    </Suspense>
  )
}
