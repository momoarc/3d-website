'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Shield, UserPlus, Trash2, Loader2, RefreshCw, Crown, UserCog, Pen, Eye } from 'lucide-react'
import { RoleGuard } from '@/components/admin/RoleGuard'
import type { UserRole, UserRoleRow } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'

const roleIcons: Record<UserRole, React.ReactNode> = {
  super_admin: <Crown className="h-5 w-5 text-[#c9a84c]" />,
  admin: <Shield className="h-5 w-5 text-blue-400" />,
  editeur: <Pen className="h-5 w-5 text-purple-400" />,
  lecteur: <Eye className="h-5 w-5 text-green-400" />,
}

const roleCardColors: Record<UserRole, string> = {
  super_admin: 'border-[#c9a84c]/30 bg-[#c9a84c]/5',
  admin: 'border-blue-500/30 bg-blue-500/5',
  editeur: 'border-purple-500/30 bg-purple-500/5',
  lecteur: 'border-green-500/30 bg-green-500/5',
}

export default function UsersPage() {
  const [roles, setRoles] = useState<UserRoleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('lecteur')
  const [adding, setAdding] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserRoleRow | null>(null)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setRoles(data as UserRoleRow[])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleAddRole = async () => {
    if (!newEmail) return
    setAdding(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_roles')
        .insert({
          email: newEmail,
          role: newRole,
          user_id: user.id, // Will be updated when the user logs in
        })

      if (error) throw error
      setNewEmail('')
      fetchRoles()
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteRole = async () => {
    if (!deleteTarget) return
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', deleteTarget.id)

      if (!error) {
        setRoles(prev => prev.filter(r => r.id !== deleteTarget.id))
      }
    } catch {
      // silently fail
    } finally {
      setDeleteTarget(null)
    }
  }

  const roleTypes: UserRole[] = ['super_admin', 'admin', 'editeur', 'lecteur']

  return (
    <RoleGuard allowedRoles={['super_admin']}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">Gestion des Accès</h1>
            <p className="text-[#a0a09a] text-sm mt-1">Gérez les rôles et permissions des utilisateurs</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRoles}
            className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualiser
          </Button>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roleTypes.map((role) => {
            const info = ROLE_LABELS[role]
            const count = roles.filter(r => r.role === role).length
            return (
              <Card key={role} className={`${roleCardColors[role]} border`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-[#1a1a1e] flex items-center justify-center">
                      {roleIcons[role]}
                    </div>
                    <div>
                      <p className="text-[#f5f5f0] font-semibold text-sm">{info.label}</p>
                      <p className="text-[#606060] text-xs">{count} utilisateur(s)</p>
                    </div>
                  </div>
                  <p className="text-[#a0a09a] text-xs">{info.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Add Role Form */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#c9a84c]" />
              Assigner un rôle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-[#a0a09a] text-xs">Email de l&apos;utilisateur</Label>
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="utilisateur@exemple.com"
                  type="email"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
              <div className="w-full sm:w-48 space-y-1">
                <Label className="text-[#a0a09a] text-xs">Rôle</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                  <SelectTrigger className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111113] border-white/[0.08]">
                    {roleTypes.map((role) => (
                      <SelectItem key={role} value={role} className="text-[#f5f5f0] focus:bg-white/[0.04] focus:text-[#f5f5f0]">
                        {ROLE_LABELS[role].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddRole}
                  disabled={adding || !newEmail}
                  className="bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800]"
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}
                  Ajouter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
              <UserCog className="h-4 w-4 text-[#c9a84c]" />
              Utilisateurs avec accès
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-[#606060]">Chargement...</div>
            ) : roles.length === 0 ? (
              <div className="text-center py-12 text-[#606060]">Aucun utilisateur avec accès</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.06] hover:bg-transparent">
                      <TableHead className="text-[#606060] text-xs">Email</TableHead>
                      <TableHead className="text-[#606060] text-xs">Rôle</TableHead>
                      <TableHead className="text-[#606060] text-xs">Date</TableHead>
                      <TableHead className="text-[#606060] text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((roleRow) => (
                      <TableRow key={roleRow.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                        <TableCell className="text-sm text-[#f5f5f0]">{roleRow.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {roleIcons[roleRow.role as UserRole]}
                            <Badge
                              variant="outline"
                              className={`${roleCardColors[roleRow.role as UserRole]} text-xs`}
                            >
                              {ROLE_LABELS[roleRow.role as UserRole]?.label || roleRow.role}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-[#606060]">
                          {new Date(roleRow.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#606060] hover:text-red-400"
                            onClick={() => setDeleteTarget(roleRow)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="bg-[#111113] border-white/[0.08]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#f5f5f0]">Retirer l&apos;accès ?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#a0a09a]">
                Retirer le rôle de <strong>{deleteTarget?.email}</strong> ? L&apos;utilisateur perdra ses accès.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/[0.08] text-[#a0a09a] hover:bg-white/[0.04] hover:text-[#f5f5f0]">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRole} className="bg-red-600 hover:bg-red-700 text-white">
                Retirer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleGuard>
  )
}
