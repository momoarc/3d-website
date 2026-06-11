'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/ui/image-upload'
import { ArrowLeft, Plus, X, Save, Loader2, Eye, ArrowUp, ArrowDown, ImageIcon } from 'lucide-react'
import type { Product, ProductAttribute } from '@/lib/types'

// ─── Attribute Values Input ─────────────────────────────────────────────────
// A tag-based input where you type values and press Enter/comma to add them.
// Each value becomes a selectable option on the product page.
function AttributeValuesInput({
  values,
  onChange,
}: {
  values: string[]
  onChange: (values: string[]) => void
}) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Add a value to the list
  const addValue = (val: string) => {
    const trimmed = val.trim()
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed])
    }
    setInputValue('')
  }

  // Remove a value from the list
  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  // Handle keyboard input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (inputValue.trim()) {
        addValue(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
      removeValue(values.length - 1)
    }
  }

  // On blur, add any remaining text as a value
  const handleBlur = () => {
    if (inputValue.trim()) {
      addValue(inputValue)
    }
  }

  // On paste, split by commas/semicolons/newlines and add all
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    const newVals = pasted
      .split(/[,;\n]/)
      .map(v => v.trim())
      .filter(Boolean)

    if (newVals.length > 0) {
      const combined = [...values]
      newVals.forEach(v => {
        if (!combined.includes(v)) {
          combined.push(v)
        }
      })
      onChange(combined)
      setInputValue('')
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[42px] px-3 py-2 bg-[#08080a] border border-white/[0.08] rounded-md focus-within:border-[#c9a84c]/40 transition-colors cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {values.map((val, i) => (
          <span
            key={`${val}-${i}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30 animate-in fade-in duration-150"
          >
            {val}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeValue(i)
              }}
              className="ml-0.5 hover:bg-[#c9a84c]/25 rounded-full p-0.5 transition-colors"
              aria-label={`Supprimer ${val}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={values.length === 0 ? 'Tapez une valeur puis Entrée ou virgule. Ex: 38mm, 42mm, 46mm' : 'Ajouter...'}
          className="flex-1 min-w-[100px] bg-transparent text-[#f5f5f0] text-[12px] outline-none placeholder:text-[#606060]"
        />
      </div>
      {values.length > 0 && (
        <p className="text-[10px] text-[#606060]">
          <span className="text-[#c9a84c] font-semibold">{values.length}</span> valeur{values.length > 1 ? 's' : ''} — ces options seront sélectionnables sur la page produit
        </p>
      )}
    </div>
  )
}

// ─── Multi-Image Upload ─────────────────────────────────────────────────────
function MultiImageUpload({
  images,
  onImagesChange,
}: {
  images: string[]
  onImagesChange: (images: string[]) => void
}) {
  const [showUpload, setShowUpload] = useState(false)

  const handleUploadComplete = (url: string) => {
    onImagesChange([...images, url])
    setShowUpload(false)
  }

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newImages.length) return
    ;[newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]]
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-3">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          {images.map((img, index) => (
            <div
              key={`${img}-${index}`}
              className="relative flex items-center gap-3 p-2 bg-[#08080a] border border-white/[0.06] rounded-lg group hover:border-[#c9a84c]/20 transition-colors"
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-[#111113]">
                <img
                  src={img}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute top-0.5 left-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-[1px] uppercase bg-[#c9a84c] text-[#0a0800]">
                    Principale
                  </span>
                )}
              </div>

              {/* URL preview */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#a0a09a] truncate">{img.split('/').pop()}</p>
                <p className="text-[9px] text-[#606060] mt-0.5">Image {index + 1}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => moveImage(index, 'up')}
                  disabled={index === 0}
                  className="w-7 h-7 rounded flex items-center justify-center text-[#606060] hover:text-[#f5f5f0] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Monter"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 'down')}
                  disabled={index === images.length - 1}
                  className="w-7 h-7 rounded flex items-center justify-center text-[#606060] hover:text-[#f5f5f0] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Descendre"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="w-7 h-7 rounded flex items-center justify-center text-[#606060] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  aria-label="Supprimer l'image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add image button / upload area */}
      {showUpload ? (
        <div className="space-y-2">
          <ImageUpload
            onUploadComplete={handleUploadComplete}
            path="products"
          />
          <button
            type="button"
            onClick={() => setShowUpload(false)}
            className="text-[11px] text-[#606060] hover:text-[#a0a09a] transition-colors"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="w-full py-3 border border-dashed border-white/[0.12] rounded-lg text-[#606060] hover:text-[#c9a84c] hover:border-[#c9a84c]/30 transition-colors flex items-center justify-center gap-2 text-[12px]"
        >
          <Plus className="w-4 h-4" />
          Ajouter une image
        </button>
      )}

      {/* Help text */}
      <p className="text-[10px] text-[#606060]">
        La première image sera l&apos;image principale affichée sur la page produit.
        Utilisez les flèches pour réorganiser.
      </p>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function NewProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  // Form fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallySet, setSlugManuallySet] = useState(false)
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [comparePrice, setComparePrice] = useState('')
  const [badge, setBadge] = useState('')
  const [description, setDescription] = useState('')
  const [specs, setSpecs] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [available, setAvailable] = useState(true)
  const [gender, setGender] = useState('Mixte')
  const [stock, setStock] = useState('')
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])

  useEffect(() => {
    fetchCategories()
    if (editId) {
      fetchProduct(parseInt(editId))
    }
  }, [editId])

  async function fetchCategories() {
    try {
      const supabase = createClient()
      const { data } = await supabase.from('categories').select('name')
      if (data) {
        setCategories(data.map(c => c.name))
      }
    } catch {
      // silently fail
    }
  }

  async function fetchProduct(id: number) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
      if (!error && data) {
        const p = data as Product
        setName(p.name)
        setCategory(p.category)
        setPrice(p.price.toString())
        setComparePrice(p.compare_price?.toString() || '')
        setBadge(p.badge || '')
        setDescription(p.description || '')
        setSpecs(p.specs?.join('\n') || '')
        setImageUrl(p.image_url || '')
        setImages(p.images || [])
        setAvailable(p.available)
        setGender(p.gender || 'Mixte')
        setStock(p.stock?.toString() || '')
        setAttributes(p.attributes || [])
        setSlug(p.slug || '')
        setSlugManuallySet(true)
      }
    } catch {
      // silently fail
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugManuallySet) {
      setSlug(
        value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      )
    }
  }

  const addAttribute = () => {
    setAttributes([...attributes, { name: '', values: [] }])
  }

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const updateAttributeName = (index: number, name: string) => {
    const updated = [...attributes]
    updated[index] = { ...updated[index], name }
    setAttributes(updated)
  }

  const updateAttributeValues = (index: number, values: string[]) => {
    const updated = [...attributes]
    updated[index] = { ...updated[index], values }
    setAttributes(updated)
  }

  const handleSave = async () => {
    if (!name || !category || !price) {
      alert('Nom, catégorie et prix sont obligatoires')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      // Filter out attributes with no name, and ensure values are properly structured
      const cleanAttributes = attributes
        .filter(a => a.name.trim())
        .map(a => ({
          name: a.name.trim(),
          values: a.values.filter(v => v.trim()).map(v => v.trim()),
        }))
        .filter(a => a.values.length > 0) // Only keep attributes that have at least one value

      const productData: Record<string, unknown> = {
        name,
        category,
        price: parseInt(price),
        compare_price: comparePrice ? parseInt(comparePrice) : null,
        badge: badge || null,
        description: description || null,
        specs: specs.split('\n').filter(s => s.trim()),
        image_url: images[0] || imageUrl || null,
        images: images,
        available,
        gender,
        stock: stock ? parseInt(stock) : null,
        attributes: cleanAttributes,
        updated_at: new Date().toISOString(),
      }

      // Add slug if provided
      if (slug.trim()) {
        productData.slug = slug
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      }

      if (editId) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', parseInt(editId))
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData)
        if (error) throw error
      }

      router.push('/admin/products')
    } catch (err) {
      alert('Erreur lors de la sauvegarde: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/products')}
          className="text-[#a0a09a] hover:text-[#f5f5f0]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">
            {editId ? 'Modifier le produit' : 'Ajouter un produit'}
          </h1>
          <p className="text-[#a0a09a] text-sm mt-1">
            {editId ? 'Modifiez les informations du produit' : 'Remplissez les informations du nouveau produit'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-[#111113] border-white/[0.06]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#a0a09a]">Informations principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#a0a09a] text-sm">Nom du produit *</Label>
                <Input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Chronographe Or Royal"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#a0a09a] text-sm">Slug (URL)</Label>
                  <Input
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value)
                      setSlugManuallySet(true)
                    }}
                    placeholder="chronographe-or-royal"
                    className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] text-sm"
                  />
                  <p className="text-[10px] text-[#606060]">
                    URL : /produit/{slug || '...'} (si vide, l&apos;ID sera utilisé)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#a0a09a] text-sm">Catégorie *</Label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Chronographes"
                    list="category-list"
                    className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                  />
                  <datalist id="category-list">
                    {categories.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#a0a09a] text-sm">Prix (DA) *</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="185000"
                    className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#a0a09a] text-sm">Prix barré (DA)</Label>
                  <Input
                    type="number"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    placeholder="220000"
                    className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#a0a09a] text-sm">Badge</Label>
                  <Input
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Bestseller, Nouveau..."
                    className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#a0a09a] text-sm">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description du produit..."
                  rows={3}
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#a0a09a] text-sm">Spécifications (une par ligne)</Label>
                <Textarea
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  placeholder={"Mouvement Suisse\nOr 18 Carats\nVerre Saphir"}
                  rows={4}
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Attributes */}
          <Card className="bg-[#111113] border-white/[0.06]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm text-[#a0a09a]">Attributs dynamiques (Variantes)</CardTitle>
                  <p className="text-[10px] text-[#606060] mt-1">
                    Les attributs deviennent des options sélectionnables sur la page produit
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addAttribute}
                  className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {attributes.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[#606060] text-sm mb-2">Aucun attribut ajouté</p>
                  <p className="text-[10px] text-[#606060]">
                    Ajoutez des attributs comme &quot;Bracelet&quot;, &quot;Taille&quot;, &quot;Cadran&quot; pour créer des variantes
                  </p>
                </div>
              ) : (
                attributes.map((attr, index) => (
                  <div key={index} className="space-y-2 p-4 bg-[#08080a] rounded-lg border border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          value={attr.name}
                          onChange={(e) => updateAttributeName(index, e.target.value)}
                          placeholder="Nom de l'attribut (ex: Bracelet, Taille, Cadran)"
                          className="bg-[#111113] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] text-sm h-9"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-[#606060] hover:text-red-400 shrink-0"
                        onClick={() => removeAttribute(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-[#606060] text-[10px] uppercase tracking-wider">
                        Valeurs (séparées par des virgules)
                      </Label>
                      <div className="mt-1">
                        <AttributeValuesInput
                          values={attr.values}
                          onChange={(values) => updateAttributeValues(index, values)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Help text */}
              {attributes.length > 0 && (
                <div className="bg-[#c9a84c]/5 border border-[#c9a84c]/15 rounded-lg p-3">
                  <p className="text-[11px] text-[#a0a09a]">
                    <span className="text-[#c9a84c] font-semibold">Astuce :</span> Tapez les valeurs séparées par des virgules dans le champ texte.
                    Par exemple : <span className="text-[#c9a84c]">&quot;38mm, 42mm, 46mm&quot;</span> créera 3 options sélectionnables
                    sur la page produit. Les valeurs apparaissent aussi sous forme de badges ci-dessous pour vérification.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Image & Status */}
        <div className="space-y-4">
          <Card className="bg-[#111113] border-white/[0.06]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-[#a0a09a]">Images du produit</CardTitle>
                {images.length > 0 && (
                  <Badge className="bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/20 text-[10px]">
                    {images.length} image{images.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <MultiImageUpload
                images={images}
                onImagesChange={setImages}
              />
            </CardContent>
          </Card>

          <Card className="bg-[#111113] border-white/[0.06]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#a0a09a]">Statut & Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[#f5f5f0] text-sm">Disponible</Label>
                <Switch
                  checked={available}
                  onCheckedChange={setAvailable}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#a0a09a] text-sm">Stock (quantité)</Label>
                <Input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Laissez vide pour stock illimité"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                  min={0}
                />
                <p className="text-[10px] text-[#606060]">Utilisé pour l&apos;affichage FOMO &quot;Plus que X en stock&quot;</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[#a0a09a] text-sm">Genre</Label>
                <div className="flex gap-2">
                  {['Homme', 'Femme', 'Mixte'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 px-3 py-2 rounded text-[11px] font-semibold tracking-[1px] uppercase transition-all ${
                        gender === g
                          ? 'bg-[#c9a84c] text-[#0a0800] border border-[#c9a84c]'
                          : 'bg-[#08080a] text-[#a0a09a] border border-white/[0.08] hover:border-[#c9a84c]/40'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              {badge && (
                <div className="mt-3">
                  <p className="text-[#606060] text-xs mb-1">Aperçu du badge</p>
                  <Badge className="bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/20">
                    {badge}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product preview link */}
          {editId && (
            <Card className="bg-[#111113] border-white/[0.06]">
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/produit/${slug || editId}`, '_blank')}
                  className="w-full border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c]/10 hover:text-[#e4c06a]"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir la page produit
                </Button>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800] font-semibold h-11"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {editId ? 'Mettre à jour' : 'Créer le produit'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
