'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, Plus, Trash2, Save, Loader2, RefreshCw, Image as ImageIcon } from 'lucide-react'
import { RoleGuard } from '@/components/admin/RoleGuard'
import { ImageUpload } from '@/components/ui/image-upload'
import type { ShowroomWall, ShowroomRoom, ShowroomConfig, Category } from '@/lib/types'

const defaultRoom: ShowroomRoom = {
  speed: 0.5,
  autoRotate: -0.3,
  radius: 5,
  floorImage: '/images/showroom/Poliigon_SlateFloorTile_7657_Roughness.jpg',
  ceilingImage: '',
}

export default function ShowroomPage() {
  const [config, setConfig] = useState<ShowroomConfig | null>(null)
  const [walls, setWalls] = useState<ShowroomWall[]>([])
  const [room, setRoom] = useState<ShowroomRoom>(defaultRoom)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatSlug, setNewCatSlug] = useState('')

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('showroom_config')
        .select('*')
        .eq('id', 1)
        .single()

      if (!error && data) {
        setConfig(data as ShowroomConfig)
        setWalls((data.walls_config as ShowroomWall[]) || [])
        setRoom((data.room_config as ShowroomRoom) || defaultRoom)
      }

      const { data: cats } = await supabase.from('categories').select('*').order('sort_order')
      if (cats) setCategories(cats as Category[])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const addWall = () => {
    setWalls([...walls, { image: '', label: '', destination: '' }])
  }

  const removeWall = (index: number) => {
    setWalls(walls.filter((_, i) => i !== index))
  }

  const updateWall = (index: number, field: keyof ShowroomWall, value: string) => {
    const updated = [...walls]
    updated[index] = { ...updated[index], [field]: value }
    setWalls(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('showroom_config')
        .update({
          walls_config: walls,
          room_config: room,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)

      if (error) throw error
      alert('Configuration showroom sauvegardée !')
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const addCategory = async () => {
    if (!newCatName || !newCatSlug) return
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: newCatName, slug: newCatSlug })
        .select()
        .single()

      if (error) throw error
      if (data) setCategories([...categories, data as Category])
      setNewCatName('')
      setNewCatSlug('')
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    }
  }

  const deleteCategory = async (id: number) => {
    try {
      const supabase = createClient()
      await supabase.from('categories').delete().eq('id', id)
      setCategories(categories.filter(c => c.id !== id))
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-[#606060]">Chargement de la configuration...</div>
    )
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'editeur']}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">Showroom 360°</h1>
            <p className="text-[#a0a09a] text-sm mt-1">Configuration du showroom virtuel</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchConfig}
              className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Sauvegarder
            </Button>
          </div>
        </div>

        {/* Wall Editor */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#c9a84c]" />
                Murs du showroom ({walls.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={addWall}
                className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
              >
                <Plus className="h-3 w-3 mr-1" />
                Ajouter un mur
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {walls.length === 0 ? (
              <p className="text-[#606060] text-sm text-center py-6">Aucun mur configuré</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {walls.map((wall, index) => (
                  <div key={index} className="p-4 rounded-lg bg-[#08080a] border border-white/[0.04]">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[#a0a09a] text-xs font-medium">Mur {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-[#606060] hover:text-red-400"
                        onClick={() => removeWall(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[#606060] text-[10px]">Image</Label>
                        <ImageUpload
                          onUploadComplete={(url) => updateWall(index, 'image', url)}
                          currentImage={wall.image}
                          path="showroom"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[#606060] text-[10px]">Label</Label>
                          <Input
                            value={wall.label}
                            onChange={(e) => updateWall(index, 'label', e.target.value)}
                            placeholder="Ex: Chronographes"
                            className="bg-[#111113] border-white/[0.06] text-[#f5f5f0] placeholder:text-[#606060] text-sm h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[#606060] text-[10px]">Destination (slug catégorie)</Label>
                          <Select
                            value={wall.destination}
                            onValueChange={(v) => updateWall(index, 'destination', v)}
                          >
                            <SelectTrigger className="bg-[#111113] border-white/[0.06] text-[#f5f5f0] text-sm h-8">
                              <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111113] border-white/[0.08]">
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.slug} className="text-[#f5f5f0] focus:bg-white/[0.04]">
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Room Config */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#c9a84c]" />
              Apparence de la salle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#a0a09a] text-xs">Vitesse de rotation ({room.speed})</Label>
                <Slider
                  value={[room.speed]}
                  onValueChange={([v]) => setRoom({ ...room, speed: v })}
                  min={0}
                  max={2}
                  step={0.1}
                  className="[&_[role=slider]]:bg-[#c9a84c]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#a0a09a] text-xs">Auto-rotation ({room.autoRotate})</Label>
                <Slider
                  value={[room.autoRotate]}
                  onValueChange={([v]) => setRoom({ ...room, autoRotate: v })}
                  min={-1}
                  max={1}
                  step={0.1}
                  className="[&_[role=slider]]:bg-[#c9a84c]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#a0a09a] text-xs">Rayon ({room.radius})</Label>
                <Slider
                  value={[room.radius]}
                  onValueChange={([v]) => setRoom({ ...room, radius: v })}
                  min={2}
                  max={15}
                  step={0.5}
                  className="[&_[role=slider]]:bg-[#c9a84c]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Texture du sol (URL)</Label>
                <Input
                  value={room.floorImage}
                  onChange={(e) => setRoom({ ...room, floorImage: e.target.value })}
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Texture du plafond (URL)</Label>
                <Input
                  value={room.ceilingImage}
                  onChange={(e) => setRoom({ ...room, ceilingImage: e.target.value })}
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Manager */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#c9a84c]" />
              Catégories ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 space-y-1">
                <Input
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value)
                    setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                  }}
                  placeholder="Nom de la catégorie"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
              <div className="w-full sm:w-48 space-y-1">
                <Input
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  placeholder="slug"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
              <Button
                onClick={addCategory}
                disabled={!newCatName || !newCatSlug}
                className="bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-[#08080a] border border-white/[0.04]">
                  <div>
                    <p className="text-sm text-[#f5f5f0]">{cat.name}</p>
                    <p className="text-xs text-[#606060]">/{cat.slug}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[#606060] hover:text-red-400"
                    onClick={() => deleteCategory(cat.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-[#606060] text-sm text-center py-4">Aucune catégorie</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
