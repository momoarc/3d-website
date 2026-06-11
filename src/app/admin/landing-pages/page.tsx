'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  FileText,
  ExternalLink,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  Layout,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { LandingPage } from '@/lib/types'

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: 'Hero',
  products: 'Produits',
  text: 'Texte',
  cta: 'Call to Action',
  testimonial: 'Témoignages',
  gallery: 'Galerie',
  faq: 'FAQ',
  video: 'Vidéo',
  countdown: 'Compte à rebours',
  features: 'Caractéristiques',
}

export default function LandingPagesList() {
  const router = useRouter()
  const [pages, setPages] = useState<LandingPage[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/landing-pages')
      const data = await res.json()
      if (Array.isArray(data)) {
        setPages(data)
      }
    } catch (err) {
      console.error('Error fetching landing pages:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/landing-pages?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setPages(pages.filter(p => p.id !== deleteId))
      }
    } catch (err) {
      console.error('Error deleting:', err)
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const handleTogglePublish = async (page: LandingPage) => {
    try {
      const res = await fetch('/api/landing-pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: page.id,
          is_published: !page.is_published,
        }),
      })
      if (res.ok) {
        setPages(pages.map(p =>
          p.id === page.id ? { ...p, is_published: !p.is_published } : p
        ))
      }
    } catch (err) {
      console.error('Error toggling publish:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-medium text-[#f5f5f0] flex items-center gap-3">
            <Layout className="w-6 h-6 text-[#c9a84c]" />
            Landing Pages
          </h1>
          <p className="text-sm text-[#a0a09a] mt-1">
            Créez et gérez vos pages de destination marketing
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/landing-pages/new')}
          className="bg-[#c9a84c] text-[#0a0800] hover:bg-[#e4c06a] font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer une page
        </Button>
      </div>

      {/* Empty state */}
      {pages.length === 0 && (
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-12 text-center">
          <Layout className="w-12 h-12 text-[#606060] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#f5f5f0] mb-2">Aucune landing page</h3>
          <p className="text-sm text-[#a0a09a] mb-6">
            Créez votre première landing page pour commencer à construire vos campagnes marketing.
          </p>
          <Button
            onClick={() => router.push('/admin/landing-pages/new')}
            className="bg-[#c9a84c] text-[#0a0800] hover:bg-[#e4c06a] font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer une page
          </Button>
        </div>
      )}

      {/* Pages grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pages.map((page) => {
          const sections = Array.isArray(page.sections) ? page.sections : []
          return (
            <div
              key={page.id}
              className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden hover:border-[#c9a84c]/20 transition-all duration-200 group"
            >
              {/* Card header with color accent */}
              <div className="h-2 bg-gradient-to-r from-[#c9a84c] to-[#c9a84c]/40" />
              
              <div className="p-5">
                {/* Title + status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#f5f5f0] text-base truncate">
                      {page.title}
                    </h3>
                    <p className="text-xs text-[#606060] mt-0.5">
                      /p/{page.slug}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-[1px] uppercase ${
                      page.is_published
                        ? 'bg-[#4ade80]/15 text-[#4ade80]'
                        : 'bg-[#606060]/15 text-[#606060]'
                    }`}
                  >
                    {page.is_published ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                    {page.is_published ? 'Publiée' : 'Brouillon'}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-[11px] text-[#606060] mb-4">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {sections.length} section{sections.length !== 1 ? 's' : ''}
                  </span>
                  <span>
                    {new Date(page.updated_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Section type tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {sections.slice(0, 4).map((section, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[9px] tracking-[1px] uppercase bg-white/[0.04] text-[#a0a09a] border border-white/[0.06]"
                    >
                      {SECTION_TYPE_LABELS[section.type] || section.type}
                    </span>
                  ))}
                  {sections.length > 4 && (
                    <span className="px-2 py-0.5 rounded text-[9px] tracking-[1px] uppercase bg-white/[0.04] text-[#606060]">
                      +{sections.length - 4}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/landing-pages/${page.id}`)}
                    className="text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04] text-xs"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Modifier
                  </Button>
                  {page.is_published && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/p/${page.slug}`, '_blank')}
                      className="text-[#a0a09a] hover:text-[#c9a84c] hover:bg-white/[0.04] text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Voir
                    </Button>
                  )}
                  <div className="ml-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#606060] hover:text-[#f5f5f0]">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-[#111113] border-white/[0.08]">
                        <DropdownMenuItem
                          onClick={() => handleTogglePublish(page)}
                          className="text-[#a0a09a] focus:text-[#f5f5f0]"
                        >
                          {page.is_published ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Dépublier
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Publier
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`/p/${page.slug}`, '_blank')}
                          className="text-[#a0a09a] focus:text-[#f5f5f0]"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Prévisualiser
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/[0.06]" />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(page.id)}
                          className="text-red-400 focus:text-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-[#111113] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#f5f5f0]">Supprimer cette page ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#a0a09a]">
              Cette action est irréversible. La landing page sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1a1a1e] border-white/[0.08] text-[#a0a09a] hover:bg-white/[0.06]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
