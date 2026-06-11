'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react'
import type { Product } from '@/lib/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const router = useRouter()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProducts(data as Product[])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    if (search) {
      const s = search.toLowerCase()
      setFiltered(products.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s) ||
        (p.badge && p.badge.toLowerCase().includes(s))
      ))
    } else {
      setFiltered(products)
    }
  }, [products, search])

  const handleDelete = async () => {
    if (deleteId === null) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from('products').delete().eq('id', deleteId)
      if (!error) {
        setProducts(prev => prev.filter(p => p.id !== deleteId))
      }
    } catch {
      // silently fail
    } finally {
      setDeleteId(null)
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR').format(price) + ' DA'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">Produits</h1>
          <p className="text-[#a0a09a] text-sm mt-1">{products.length} produit(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualiser
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/admin/products/new')}
            className="bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-[#111113] border-white/[0.06]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#606060]" />
            <Input
              placeholder="Rechercher par nom, catégorie, badge..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="bg-[#111113] border-white/[0.06]">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-[#606060]">Chargement des produits...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[#606060]">Aucun produit trouvé</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-[#606060] text-xs">Image</TableHead>
                    <TableHead className="text-[#606060] text-xs">Nom</TableHead>
                    <TableHead className="text-[#606060] text-xs">Catégorie</TableHead>
                    <TableHead className="text-[#606060] text-xs">Prix</TableHead>
                    <TableHead className="text-[#606060] text-xs">Badge</TableHead>
                    <TableHead className="text-[#606060] text-xs">Disponible</TableHead>
                    <TableHead className="text-[#606060] text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => (
                    <TableRow key={product.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                      <TableCell>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-[#1a1a1e] flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-[#606060]" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-[#f5f5f0] font-medium">{product.name}</TableCell>
                      <TableCell className="text-sm text-[#a0a09a]">{product.category}</TableCell>
                      <TableCell className="text-sm text-[#f5f5f0]">{formatPrice(product.price)}</TableCell>
                      <TableCell>
                        {product.badge ? (
                          <Badge className="bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/20 text-[10px]">
                            {product.badge}
                          </Badge>
                        ) : (
                          <span className="text-[#606060] text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            product.available
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]'
                              : 'bg-red-500/10 text-red-400 border-red-500/20 text-[10px]'
                          }
                        >
                          {product.available ? 'Oui' : 'Non'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#a0a09a] hover:text-[#c9a84c]"
                            onClick={() => window.open(`/produit/${product.slug || product.id}`, '_blank')}
                            title="Voir la page produit"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#a0a09a] hover:text-[#c9a84c]"
                            onClick={() => router.push(`/admin/products/new?edit=${product.id}`)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#a0a09a] hover:text-red-400"
                            onClick={() => setDeleteId(product.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-[#111113] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#f5f5f0]">Supprimer le produit ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#a0a09a]">
              Cette action est irréversible. Le produit sera définitivement supprimé.
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
  )
}
