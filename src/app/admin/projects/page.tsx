'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Trophy, Plus, Pencil, Trash2, RefreshCw, Loader2, Save, MapPin } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import { RoleGuard } from '@/components/admin/RoleGuard'
import type { Project } from '@/lib/types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Project | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Form
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [badge, setBadge] = useState('')
  const [description, setDescription] = useState('')
  const [specs, setSpecs] = useState('')

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order')

      if (!error && data) {
        setProjects(data as Project[])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const openNew = () => {
    setIsNew(true)
    setName('')
    setLocation('')
    setImageUrl('')
    setBadge('')
    setDescription('')
    setSpecs('')
    setEditing(null)
  }

  const openEdit = (project: Project) => {
    setIsNew(false)
    setEditing(project)
    setName(project.name)
    setLocation(project.location || '')
    setImageUrl(project.image_url || '')
    setBadge(project.badge || '')
    setDescription(project.description || '')
    setSpecs(project.specs?.join('\n') || '')
  }

  const closeDialog = () => {
    setEditing(null)
    setIsNew(false)
  }

  const handleSave = async () => {
    if (!name) return
    setSaving(true)
    try {
      const supabase = createClient()
      const projectData = {
        name,
        location: location || null,
        image_url: imageUrl || null,
        badge: badge || null,
        description: description || null,
        specs: specs.split('\n').filter(s => s.trim()),
      }

      if (isNew) {
        const { data, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single()

        if (error) throw error
        if (data) setProjects([data as Project, ...projects])
      } else if (editing) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editing.id)

        if (error) throw error
        setProjects(projects.map(p => p.id === editing.id ? { ...p, ...projectData } as Project : p))
      }

      closeDialog()
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteId === null) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from('projects').delete().eq('id', deleteId)
      if (!error) {
        setProjects(projects.filter(p => p.id !== deleteId))
      }
    } catch {
      // silently fail
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'editeur']}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">Réalisations</h1>
            <p className="text-[#a0a09a] text-sm mt-1">{projects.length} projet(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProjects}
              className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
            <Button
              size="sm"
              onClick={openNew}
              className="bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12 text-[#606060]">Chargement...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-[#606060]">Aucune réalisation</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="bg-[#111113] border-white/[0.06] overflow-hidden group">
                {project.image_url && (
                  <div className="aspect-video bg-[#1a1a1e] overflow-hidden">
                    <img
                      src={project.image_url}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[#f5f5f0] font-semibold text-sm">{project.name}</h3>
                      {project.location && (
                        <p className="text-[#606060] text-xs mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {project.location}
                        </p>
                      )}
                      {project.badge && (
                        <span className="inline-block mt-1.5 text-[10px] bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20 rounded px-2 py-0.5">
                          {project.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#606060] hover:text-[#c9a84c]"
                        onClick={() => openEdit(project)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#606060] hover:text-red-400"
                        onClick={() => setDeleteId(project.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-[#a0a09a] text-xs mt-2 line-clamp-2">{project.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={!!editing || isNew} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="bg-[#111113] border-white/[0.08] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[#f5f5f0] font-serif">
                {isNew ? 'Ajouter une réalisation' : 'Modifier la réalisation'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-sm">Nom *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Villa Bordj El Kiffan"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-sm">Localisation</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Alger, Algérie"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-sm">Image</Label>
                <ImageUpload onUploadComplete={setImageUrl} currentImage={imageUrl} path="projects" />
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-sm">Badge</Label>
                <Input
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Ex: Récent, Premium"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-sm">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description du projet..."
                  rows={3}
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] resize-none"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-sm">Spécifications (une par ligne)</Label>
                <Textarea
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  placeholder={"Tourbillon visible\nOr Rose 18K\nSérie Limitée"}
                  rows={3}
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] resize-none"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || !name}
                className="w-full bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                {isNew ? 'Créer' : 'Mettre à jour'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent className="bg-[#111113] border-white/[0.08]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#f5f5f0]">Supprimer cette réalisation ?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#a0a09a]">
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/[0.08] text-[#a0a09a] hover:bg-white/[0.04] hover:text-[#f5f5f0]">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleGuard>
  )
}
