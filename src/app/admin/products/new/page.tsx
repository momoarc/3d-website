'use client'

import { useEffect, useState } from 'react'
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
import { ArrowLeft, Plus, X, Save, Loader2, Eye } from 'lucide-react'
import type { Product, ProductAttribute } from '@/lib/types'

// ─── Attribute Values Input ─────────────────────────────────────────────────
// Replaces TagInput — a simple textarea where you type comma-separated values
// and they get parsed into individual options on the product page.
function AttributeValuesInput({
  values,
  onChange,
}: {
  values: string[]
  onChange: (values: string[]) => void
}) {
  // Display current values as comma-separated text in the textarea
  const [text, setText] = useState(values.join(', '))

  // Sync from external changes (e.g. loading a product)
  useEffect(() => {
    setText(values.join(', '))
  }, [values])

  // Parse the textarea content into values array
  const parseValues = (input: string) => {
    const parsed = input
      .split(/[,;\n]/)
      .map(v => v.trim())
      .filter(Boolean)
    onChange(parsed)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setText(val)
    parseValues(val)
  }

  // Also parse on blur to catch any remaining text
  const handleBlur = () => {
    parseValues(text)
    // Re-format the text to be clean
    const parsed = text
      .split(/[,;\n]/)
      .map(v => v.trim())
      .filter(Boolean)
    setText(parsed.join(', '))
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Séparez les valeurs par des virgules. Ex: 38mm, 42mm, 46mm"
        rows={2}
        className="bg-[#111113] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] text-sm resize-none"
      />
      {/* Preview of parsed values as tags */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] text-[#606060] uppercase tracking-wider mr-1 self-center">
            Aperçu :
          </span>
          {values.map((val, i) => (
            <span
              key={`${val}-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30"
            >
              {val}
            </span>
          ))}
        </div>
      )}
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
        setBadge(p.badge || '')
        setDescription(p.description || '')
        setSpecs(p.specs?.join('\n') || '')
        setImageUrl(p.image_url || '')
        setAvailable(p.available)
        setGender(p.gender || 'Mixte')
        setAttributes(p.attributes || [])
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
        badge: badge || null,
        description: description || null,
        specs: specs.split('\n').filter(s => s.trim()),
        image_url: imageUrl || null,
        available,
        gender,
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
              <CardTitle className="text-sm text-[#a0a09a]">Image du produit</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                onUploadComplete={setImageUrl}
                currentImage={imageUrl}
                path="products"
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
                  onClick={() => window.open(`/produit/${editId}`, '_blank')}
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
