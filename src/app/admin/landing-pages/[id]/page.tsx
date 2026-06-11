'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Layout,
  Type,
  ShoppingBag,
  MousePointerClick,
  MessageSquareQuote,
  Grid3X3,
  HelpCircle,
  Video,
  Timer,
  Sparkles,
  X,
  FileText,
  Loader2,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { LandingPage, LandingPageSection } from '@/lib/types'

// ─── Section Type Config ──────────────────────────────────────────────────────

const SECTION_TYPES = [
  { type: 'hero', label: 'Hero', icon: Layout, description: 'Bannière principale avec image de fond' },
  { type: 'products', label: 'Produits', icon: ShoppingBag, description: 'Grille de produits' },
  { type: 'text', label: 'Texte', icon: Type, description: 'Bloc de texte avec titre' },
  { type: 'cta', label: 'Call to Action', icon: MousePointerClick, description: 'Bandeau d\'appel à l\'action' },
  { type: 'testimonial', label: 'Témoignages', icon: MessageSquareQuote, description: 'Témoignages clients' },
  { type: 'gallery', label: 'Galerie', icon: Grid3X3, description: 'Grille d\'images' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, description: 'Questions fréquentes' },
  { type: 'video', label: 'Vidéo', icon: Video, description: 'Vidéo embarquée' },
  { type: 'countdown', label: 'Compte à rebours', icon: Timer, description: 'Minuteur jusqu\'à un événement' },
  { type: 'features', label: 'Caractéristiques', icon: Sparkles, description: 'Grille de fonctionnalités' },
] as const

const SECTION_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  hero: Layout,
  products: ShoppingBag,
  text: Type,
  cta: MousePointerClick,
  testimonial: MessageSquareQuote,
  gallery: Grid3X3,
  faq: HelpCircle,
  video: Video,
  countdown: Timer,
  features: Sparkles,
}

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function getDefaultContent(type: string): Record<string, unknown> {
  switch (type) {
    case 'hero':
      return { title: '', subtitle: '', image: '/images/watches/brand-hero.jpg', cta_text: '', cta_link: '', alignment: 'center' }
    case 'products':
      return { title: '', subtitle: '', product_ids: [], max_products: 4 }
    case 'text':
      return { title: '', text: '', alignment: 'center' }
    case 'cta':
      return { title: '', button_text: '', button_link: '', style: 'gold' }
    case 'testimonial':
      return { title: '', items: [] }
    case 'gallery':
      return { title: '', images: [] }
    case 'faq':
      return { title: 'FAQ', items: [] }
    case 'video':
      return { title: '', description: '', video_url: '' }
    case 'countdown':
      return { title: '', subtitle: '', target_date: '' }
    case 'features':
      return { title: '', items: [], columns: 3 }
    default:
      return {}
  }
}

// ─── Section Editors ──────────────────────────────────────────────────────────

function HeroEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[#a0a09a] text-xs">Titre</Label>
        <Input
          value={(content.title as string) || ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
          placeholder="Titre principal"
        />
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">Sous-titre</Label>
        <Input
          value={(content.subtitle as string) || ''}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
          placeholder="Sous-titre"
        />
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">URL de l&apos;image</Label>
        <Input
          value={(content.image as string) || ''}
          onChange={(e) => onChange({ ...content, image: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
          placeholder="/images/watches/brand-hero.jpg"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[#a0a09a] text-xs">Texte du bouton</Label>
          <Input
            value={(content.cta_text as string) || ''}
            onChange={(e) => onChange({ ...content, cta_text: e.target.value })}
            className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
            placeholder="Découvrir"
          />
        </div>
        <div>
          <Label className="text-[#a0a09a] text-xs">Lien du bouton</Label>
          <Input
            value={(content.cta_link as string) || ''}
            onChange={(e) => onChange({ ...content, cta_link: e.target.value })}
            className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
            placeholder="/catalogue"
          />
        </div>
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">Alignement</Label>
        <Select
          value={(content.alignment as string) || 'center'}
          onValueChange={(v) => onChange({ ...content, alignment: v })}
        >
          <SelectTrigger className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#111113] border-white/[0.08]">
            <SelectItem value="left">Gauche</SelectItem>
            <SelectItem value="center">Centre</SelectItem>
            <SelectItem value="right">Droite</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function ProductsEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[#a0a09a] text-xs">Titre</Label>
        <Input
          value={(content.title as string) || ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">Sous-titre</Label>
        <Input
          value={(content.subtitle as string) || ''}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">Nombre max de produits</Label>
        <Input
          type="number"
          min={1}
          max={12}
          value={(content.max_products as number) || 4}
          onChange={(e) => onChange({ ...content, max_products: parseInt(e.target.value) || 4 })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">IDs produits (séparés par virgules, vide = aléatoire)</Label>
        <Input
          value={Array.isArray(content.product_ids) ? (content.product_ids as number[]).join(', ') : ''}
          onChange={(e) => {
            const ids = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
            onChange({ ...content, product_ids: ids })
          }}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
          placeholder="1, 2, 3"
        />
      </div>
    </div>
  )
}

function TextEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[#a0a09a] text-xs">Titre</Label>
        <Input
          value={(content.title as string) || ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">Texte</Label>
        <Textarea
          value={(content.text as string) || ''}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] min-h-[120px]"
        />
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">Alignement</Label>
        <Select
          value={(content.alignment as string) || 'center'}
          onValueChange={(v) => onChange({ ...content, alignment: v })}
        >
          <SelectTrigger className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#111113] border-white/[0.08]">
            <SelectItem value="left">Gauche</SelectItem>
            <SelectItem value="center">Centre</SelectItem>
            <SelectItem value="right">Droite</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function CTAEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[#a0a09a] text-xs">Titre</Label>
        <Input
          value={(content.title as string) || ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[#a0a09a] text-xs">Texte du bouton</Label>
          <Input
            value={(content.button_text as string) || ''}
            onChange={(e) => onChange({ ...content, button_text: e.target.value })}
            className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
          />
        </div>
        <div>
          <Label className="text-[#a0a09a] text-xs">Lien du bouton</Label>
          <Input
            value={(content.button_link as string) || ''}
            onChange={(e) => onChange({ ...content, button_link: e.target.value })}
            className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
          />
        </div>
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">Style</Label>
        <Select
          value={(content.style as string) || 'gold'}
          onValueChange={(v) => onChange({ ...content, style: v })}
        >
          <SelectTrigger className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#111113] border-white/[0.08]">
            <SelectItem value="gold">Or (Gold)</SelectItem>
            <SelectItem value="dark">Sombre (Dark)</SelectItem>
            <SelectItem value="gradient">Dégradé (Gradient)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function TestimonialEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const items = (content.items as Array<{ quote: string; author: string; role: string; avatar?: string }>) || []

  const updateItem = (idx: number, field: string, value: string) => {
    const updated = [...items]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange({ ...content, items: updated })
  }

  const addItem = () => {
    onChange({ ...content, items: [...items, { quote: '', author: '', role: '' }] })
  }

  const removeItem = (idx: number) => {
    onChange({ ...content, items: items.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[#a0a09a] text-xs">Titre</Label>
        <Input
          value={(content.title as string) || ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[#a0a09a] text-xs">Témoignages</Label>
          <Button variant="ghost" size="sm" onClick={addItem} className="text-[#c9a84c] hover:text-[#e4c06a] text-xs h-7">
            <Plus className="w-3 h-3 mr-1" />
            Ajouter
          </Button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="bg-[#08080a] border border-white/[0.06] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#606060] uppercase tracking-wider">#{i + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="h-6 w-6 text-red-400 hover:text-red-300">
                <X className="w-3 h-3" />
              </Button>
            </div>
            <Textarea
              value={item.quote}
              onChange={(e) => updateItem(i, 'quote', e.target.value)}
              className="bg-[#111113] border-white/[0.06] text-[#f5f5f0] text-xs min-h-[60px]"
              placeholder="Citation..."
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={item.author}
                onChange={(e) => updateItem(i, 'author', e.target.value)}
                className="bg-[#111113] border-white/[0.06] text-[#f5f5f0] text-xs"
                placeholder="Auteur"
              />
              <Input
                value={item.role}
                onChange={(e) => updateItem(i, 'role', e.target.value)}
                className="bg-[#111113] border-white/[0.06] text-[#f5f5f0] text-xs"
                placeholder="Rôle"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GalleryEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const images = (content.images as string[]) || []
  const [newImage, setNewImage] = useState('')

  const addImage = () => {
    if (newImage.trim()) {
      onChange({ ...content, images: [...images, newImage.trim()] })
      setNewImage('')
    }
  }

  const removeImage = (idx: number) => {
    onChange({ ...content, images: images.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[#a0a09a] text-xs">Titre</Label>
        <Input
          value={(content.title as string) || ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">Images</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] text-xs"
            placeholder="URL de l'image"
            onKeyDown={(e) => e.key === 'Enter' && addImage()}
          />
          <Button variant="ghost" size="sm" onClick={addImage} className="text-[#c9a84c] hover:text-[#e4c06a] text-xs">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-square rounded overflow-hidden border border-white/[0.06]">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FAQEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const items = (content.items as Array<{ question: string; answer: string }>) || []

  const updateItem = (idx: number, field: string, value: string) => {
    const updated = [...items]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange({ ...content, items: updated })
  }

  const addItem = () => {
    onChange({ ...content, items: [...items, { question: '', answer: '' }] })
  }

  const removeItem = (idx: number) => {
    onChange({ ...content, items: items.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[#a0a09a] text-xs">Titre</Label>
        <Input
          value={(content.title as string) || ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[#a0a09a] text-xs">Questions</Label>
          <Button variant="ghost" size="sm" onClick={addItem} className="text-[#c9a84c] hover:text-[#e4c06a] text-xs h-7">
            <Plus className="w-3 h-3 mr-1" />
            Ajouter
          </Button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="bg-[#08080a] border border-white/[0.06] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#606060] uppercase tracking-wider">#{i + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="h-6 w-6 text-red-400 hover:text-red-300">
                <X className="w-3 h-3" />
              </Button>
            </div>
            <Input
              value={item.question}
              onChange={(e) => updateItem(i, 'question', e.target.value)}
              className="bg-[#111113] border-white/[0.06] text-[#f5f5f0] text-xs"
              placeholder="Question"
            />
            <Textarea
              value={item.answer}
              onChange={(e) => updateItem(i, 'answer', e.target.value)}
              className="bg-[#111113] border-white/[0.06] text-[#f5f5f0] text-xs min-h-[60px]"
              placeholder="Réponse"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function VideoEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[#a0a09a] text-xs">Titre</Label>
        <Input
          value={(content.title as string) || ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">Description</Label>
        <Input
          value={(content.description as string) || ''}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">URL de la vidéo (YouTube / Vimeo)</Label>
        <Input
          value={(content.video_url as string) || ''}
          onChange={(e) => onChange({ ...content, video_url: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>
    </div>
  )
}

function CountdownEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[#a0a09a] text-xs">Titre</Label>
        <Input
          value={(content.title as string) || ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">Sous-titre</Label>
        <Input
          value={(content.subtitle as string) || ''}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">Date cible</Label>
        <Input
          type="datetime-local"
          value={(content.target_date as string) || ''}
          onChange={(e) => onChange({ ...content, target_date: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
    </div>
  )
}

function FeaturesEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const items = (content.items as Array<{ icon: string; title: string; description: string }>) || []

  const updateItem = (idx: number, field: string, value: string) => {
    const updated = [...items]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange({ ...content, items: updated })
  }

  const addItem = () => {
    onChange({ ...content, items: [...items, { icon: 'star', title: '', description: '' }] })
  }

  const removeItem = (idx: number) => {
    onChange({ ...content, items: items.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[#a0a09a] text-xs">Titre</Label>
        <Input
          value={(content.title as string) || ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
        />
      </div>
      <div>
        <Label className="text-[#a0a09a] text-xs">Colonnes</Label>
        <Select
          value={String((content.columns as number) || 3)}
          onValueChange={(v) => onChange({ ...content, columns: parseInt(v) })}
        >
          <SelectTrigger className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#111113] border-white/[0.08]">
            <SelectItem value="2">2 colonnes</SelectItem>
            <SelectItem value="3">3 colonnes</SelectItem>
            <SelectItem value="4">4 colonnes</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[#a0a09a] text-xs">Éléments</Label>
          <Button variant="ghost" size="sm" onClick={addItem} className="text-[#c9a84c] hover:text-[#e4c06a] text-xs h-7">
            <Plus className="w-3 h-3 mr-1" />
            Ajouter
          </Button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="bg-[#08080a] border border-white/[0.06] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#606060] uppercase tracking-wider">#{i + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="h-6 w-6 text-red-400 hover:text-red-300">
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[#606060] text-[9px]">Icône</Label>
                <Select value={item.icon || 'star'} onValueChange={(v) => updateItem(i, 'icon', v)}>
                  <SelectTrigger className="bg-[#111113] border-white/[0.06] text-[#f5f5f0] text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111113] border-white/[0.08]">
                    <SelectItem value="star">Star</SelectItem>
                    <SelectItem value="zap">Zap</SelectItem>
                    <SelectItem value="award">Award</SelectItem>
                    <SelectItem value="clock">Clock</SelectItem>
                    <SelectItem value="heart">Heart</SelectItem>
                    <SelectItem value="eye">Eye</SelectItem>
                    <SelectItem value="shield">Shield</SelectItem>
                    <SelectItem value="gem">Gem</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="sparkles">Sparkles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#606060] text-[9px]">Titre</Label>
                <Input
                  value={item.title}
                  onChange={(e) => updateItem(i, 'title', e.target.value)}
                  className="bg-[#111113] border-white/[0.06] text-[#f5f5f0] text-xs h-8"
                  placeholder="Titre"
                />
              </div>
              <div>
                <Label className="text-[#606060] text-[9px]">Description</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  className="bg-[#111113] border-white/[0.06] text-[#f5f5f0] text-xs h-8"
                  placeholder="Description"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionTypeEditor({ section, onChange }: { section: LandingPageSection; onChange: (content: Record<string, unknown>) => void }) {
  switch (section.type) {
    case 'hero': return <HeroEditor content={section.content} onChange={onChange} />
    case 'products': return <ProductsEditor content={section.content} onChange={onChange} />
    case 'text': return <TextEditor content={section.content} onChange={onChange} />
    case 'cta': return <CTAEditor content={section.content} onChange={onChange} />
    case 'testimonial': return <TestimonialEditor content={section.content} onChange={onChange} />
    case 'gallery': return <GalleryEditor content={section.content} onChange={onChange} />
    case 'faq': return <FAQEditor content={section.content} onChange={onChange} />
    case 'video': return <VideoEditor content={section.content} onChange={onChange} />
    case 'countdown': return <CountdownEditor content={section.content} onChange={onChange} />
    case 'features': return <FeaturesEditor content={section.content} onChange={onChange} />
    default: return <p className="text-[#606060] text-sm">Éditeur non disponible pour ce type.</p>
  }
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  index,
  total,
  onContentChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  section: LandingPageSection
  index: number
  total: number
  onContentChange: (content: Record<string, unknown>) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const IconComponent = SECTION_ICON_MAP[section.type] || FileText
  const typeLabel = SECTION_TYPES.find(t => t.type === section.type)?.label || section.type

  // Content preview
  const getPreview = () => {
    const c = section.content
    switch (section.type) {
      case 'hero': return (c.title as string) || 'Hero sans titre'
      case 'products': return (c.title as string) || 'Section produits'
      case 'text': return (c.title as string) || 'Section texte'
      case 'cta': return (c.title as string) || 'CTA sans titre'
      case 'testimonial': return `${((c.items as any[]) || []).length} témoignage(s)`
      case 'gallery': return `${((c.images as string[]) || []).length} image(s)`
      case 'faq': return `${((c.items as any[]) || []).length} question(s)`
      case 'video': return (c.video_url as string) ? 'Vidéo configurée' : 'Aucune vidéo'
      case 'countdown': return (c.target_date as string) ? `→ ${c.target_date}` : 'Aucune date'
      case 'features': return `${((c.items as any[]) || []).length} caractéristique(s)`
      default: return 'Section'
    }
  }

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2 px-4 py-3">
          {/* Move buttons */}
          <div className="flex flex-col gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="text-[#606060] hover:text-[#f5f5f0] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="text-[#606060] hover:text-[#f5f5f0] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Icon */}
          <div className="w-8 h-8 bg-[#c9a84c]/10 rounded flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-4 h-4 text-[#c9a84c]" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[#f5f5f0]">{typeLabel}</div>
            <div className="text-[11px] text-[#606060] truncate">{getPreview()}</div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-[#a0a09a] hover:text-[#f5f5f0] text-xs h-7">
                {open ? 'Fermer' : 'Modifier'}
                <ChevronRight className={`w-3 h-3 ml-1 transition-transform ${open ? 'rotate-90' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t border-white/[0.04]">
            <SectionTypeEditor section={section} onChange={onContentChange} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// ─── Main Editor Page ─────────────────────────────────────────────────────────

export default function LandingPageEditor() {
  const router = useRouter()
  const params = useParams()
  const pageId = params.id as string
  const isNew = pageId === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Page settings
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallySet, setSlugManuallySet] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [sections, setSections] = useState<LandingPageSection[]>([])
  const [pageDatabaseId, setPageDatabaseId] = useState<number | null>(null)

  // Load existing page
  useEffect(() => {
    if (isNew) {
      setLoading(false)
      return
    }

    const fetchPage = async () => {
      try {
        const res = await fetch('/api/landing-pages')
        const data = await res.json()
        if (Array.isArray(data)) {
          const page = data.find((p: LandingPage) => p.id === parseInt(pageId))
          if (page) {
            setTitle(page.title)
            setSlug(page.slug)
            setSlugManuallySet(true)
            setMetaTitle(page.meta_title || '')
            setMetaDescription(page.meta_description || '')
            setIsPublished(page.is_published)
            setSections(Array.isArray(page.sections) ? page.sections : [])
            setPageDatabaseId(page.id)
          }
        }
      } catch (err) {
        console.error('Error loading page:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [pageId, isNew])

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slugManuallySet) {
      setSlug(slugify(value))
    }
  }

  // Section operations
  const addSection = (type: string) => {
    const newSection: LandingPageSection = {
      id: generateId(),
      type: type as LandingPageSection['type'],
      content: getDefaultContent(type),
    }
    setSections([...sections, newSection])
    setShowAddDialog(false)
  }

  const updateSectionContent = (index: number, content: Record<string, unknown>) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], content }
    setSections(updated)
  }

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sections.length) return
    const updated = [...sections]
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    setSections(updated)
  }

  const deleteSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
  }

  // Save
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Le titre est requis.')
      return
    }
    if (!slug.trim()) {
      alert('Le slug est requis.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        slug: slugify(slug.trim()),
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        is_published: isPublished,
        sections: sections.map(s => ({
          id: s.id,
          type: s.type,
          content: s.content,
        })),
      }

      let res: Response
      if (isNew || !pageDatabaseId) {
        res = await fetch('/api/landing-pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/landing-pages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: pageDatabaseId, ...payload }),
        })
      }

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Erreur lors de la sauvegarde')
        return
      }

      if (isNew && data.id) {
        setPageDatabaseId(data.id)
        // Replace URL without navigation
        window.history.replaceState(null, '', `/admin/landing-pages/${data.id}`)
      }

      // Show brief success feedback
      setIsPublished(data.is_published ?? isPublished)
    } catch (err) {
      console.error('Save error:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
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
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/landing-pages')}
            className="text-[#a0a09a] hover:text-[#f5f5f0]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-serif font-medium text-[#f5f5f0]">
              {isNew ? 'Nouvelle Landing Page' : title || 'Éditer la page'}
            </h1>
            <p className="text-xs text-[#606060]">
              {isNew ? 'Créer une nouvelle page de destination' : `/p/${slug}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pageDatabaseId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/p/${slug}`, '_blank')}
              className="text-[#a0a09a] hover:text-[#c9a84c] text-xs"
            >
              <Eye className="w-4 h-4 mr-1.5" />
              Prévisualiser
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#c9a84c] text-[#0a0800] hover:bg-[#e4c06a] font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Page Settings */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-[#f5f5f0] mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#c9a84c]" />
          Paramètres de la page
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-[#a0a09a] text-xs">Titre *</Label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
              placeholder="Collection Printemps 2025"
            />
          </div>
          <div>
            <Label className="text-[#a0a09a] text-xs">Slug (URL) *</Label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugManuallySet(true)
              }}
              className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
              placeholder="collection-printemps-2025"
            />
            <p className="text-[10px] text-[#606060] mt-1">L&apos;URL sera : /p/{slug || '...'}</p>
          </div>
          <div>
            <Label className="text-[#a0a09a] text-xs">Meta titre</Label>
            <Input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
              placeholder="Titre SEO"
            />
          </div>
          <div>
            <Label className="text-[#a0a09a] text-xs">Meta description</Label>
            <Input
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
              placeholder="Description pour les moteurs de recherche"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
          <Switch
            checked={isPublished}
            onCheckedChange={setIsPublished}
          />
          <div>
            <span className="text-sm text-[#f5f5f0]">Publiée</span>
            <p className="text-[10px] text-[#606060]">
              {isPublished ? 'Visible publiquement' : 'Brouillon, non visible publiquement'}
            </p>
          </div>
        </div>
      </div>

      {/* Sections Builder */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#f5f5f0] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#c9a84c]" />
            Sections ({sections.length})
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="text-[#c9a84c] hover:text-[#e4c06a] text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ajouter une section
          </Button>
        </div>

        {sections.length === 0 ? (
          <div className="bg-[#111113] border border-dashed border-white/[0.12] rounded-xl p-12 text-center">
            <Layers className="w-10 h-10 text-[#606060] mx-auto mb-3" />
            <p className="text-sm text-[#606060] mb-4">Aucune section. Ajoutez des sections pour construire votre page.</p>
            <Button
              variant="ghost"
              onClick={() => setShowAddDialog(true)}
              className="text-[#c9a84c] hover:text-[#e4c06a] text-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Ajouter une section
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section, index) => (
              <SectionCard
                key={section.id || index}
                section={section}
                index={index}
                total={sections.length}
                onContentChange={(content) => updateSectionContent(index, content)}
                onMoveUp={() => moveSection(index, 'up')}
                onMoveDown={() => moveSection(index, 'down')}
                onDelete={() => deleteSection(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Section Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#111113] border-white/[0.08] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#f5f5f0]">Ajouter une section</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {SECTION_TYPES.map((st) => {
              const Icon = st.icon
              return (
                <button
                  key={st.type}
                  onClick={() => addSection(st.type)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-[#08080a] hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5 transition-all duration-200 text-left"
                >
                  <div className="w-9 h-9 bg-[#c9a84c]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#c9a84c]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#f5f5f0]">{st.label}</div>
                    <div className="text-[10px] text-[#606060]">{st.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowAddDialog(false)}
              className="text-[#a0a09a] hover:text-[#f5f5f0]"
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
