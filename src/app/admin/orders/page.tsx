'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Download,
  Phone,
  MessageCircle,
  Eye,
  RefreshCw,
  Filter,
} from 'lucide-react'
import type { Order, OrderStatus } from '@/lib/types'
import { STATUS_LIST } from '@/lib/types'

const statusColors: Record<OrderStatus, string> = {
  'Nouveau': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Appelé': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Confirmé': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Expédié': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'En transit': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Livré': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Retourné': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Annulé': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const filterButtons: { label: string; status: string }[] = [
  { label: 'Tous', status: 'all' },
  { label: 'Nouveaux', status: 'Nouveau' },
  { label: 'Confirmés', status: 'Confirmé' },
  { label: 'Expédiés', status: 'Expédié' },
  { label: 'Livrés', status: 'Livré' },
  { label: 'Retournés', status: 'Retourné' },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filtered, setFiltered] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [updating, setUpdating] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setOrders(data as Order[])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    let result = orders
    if (activeFilter !== 'all') {
      result = result.filter(o => o.status === activeFilter)
    }
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(o =>
        o.name.toLowerCase().includes(s) ||
        o.phone.includes(s) ||
        o.id.toLowerCase().includes(s) ||
        (o.product && o.product.toLowerCase().includes(s)) ||
        (o.wilaya && o.wilaya.toLowerCase().includes(s))
      )
    }
    setFiltered(result)
  }, [orders, activeFilter, search])

  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus) return
    setUpdating(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedOrder.id)

      if (!error) {
        setOrders(prev =>
          prev.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus as OrderStatus } : o)
        )
        setSelectedOrder({ ...selectedOrder, status: newStatus as OrderStatus })
      }
    } catch {
      // silently fail
    } finally {
      setUpdating(false)
    }
  }

  const exportCSV = () => {
    const headers = ['ID', 'Nom', 'Téléphone', 'Wilaya', 'Commune', 'Produit', 'Quantité', 'Statut', 'Notes', 'Source', 'Date']
    const rows = filtered.map(o => [
      o.id,
      o.name,
      o.phone,
      o.wilaya || '',
      o.commune || '',
      o.product || '',
      o.quantity,
      o.status,
      (o.notes || '').replace(/"/g, '""'),
      o.source,
      o.created_at,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `commandes-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">Commandes</h1>
          <p className="text-[#a0a09a] text-sm mt-1">{filtered.length} commande(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-[#111113] border-white/[0.06]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#606060]" />
              <Input
                placeholder="Rechercher par nom, téléphone, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Filter className="h-4 w-4 text-[#606060] mt-1.5" />
            {filterButtons.map((f) => (
              <Button
                key={f.status}
                variant={activeFilter === f.status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(f.status)}
                className={
                  activeFilter === f.status
                    ? 'bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800] text-xs'
                    : 'border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04] text-xs'
                }
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-[#111113] border-white/[0.06]">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-[#606060]">Chargement des commandes...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[#606060]">Aucune commande trouvée</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-[#606060] text-xs">ID</TableHead>
                    <TableHead className="text-[#606060] text-xs">Client</TableHead>
                    <TableHead className="text-[#606060] text-xs">Téléphone</TableHead>
                    <TableHead className="text-[#606060] text-xs">Produit</TableHead>
                    <TableHead className="text-[#606060] text-xs">Wilaya</TableHead>
                    <TableHead className="text-[#606060] text-xs">Statut</TableHead>
                    <TableHead className="text-[#606060] text-xs">Date</TableHead>
                    <TableHead className="text-[#606060] text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => (
                    <TableRow key={order.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                      <TableCell className="text-xs text-[#a0a09a] font-mono">{order.id.slice(0, 12)}</TableCell>
                      <TableCell className="text-sm text-[#f5f5f0]">{order.name}</TableCell>
                      <TableCell className="text-sm text-[#a0a09a]">{order.phone}</TableCell>
                      <TableCell className="text-sm text-[#a0a09a] max-w-[150px] truncate">{order.product || '-'}</TableCell>
                      <TableCell className="text-sm text-[#a0a09a]">{order.wilaya || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusColors[order.status]} text-[10px] px-2 py-0`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-[#606060] whitespace-nowrap">{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#a0a09a] hover:text-[#f5f5f0]"
                            onClick={() => {
                              setSelectedOrder(order)
                              setNewStatus(order.status)
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <a href={`tel:${order.phone}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#a0a09a] hover:text-green-400">
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                          <a href={`https://wa.me/213${order.phone.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#a0a09a] hover:text-emerald-400">
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                          </a>
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

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="bg-[#111113] border-white/[0.08] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#f5f5f0] font-serif">
              Détail de la commande
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[#606060] text-xs">ID</span>
                  <p className="text-[#f5f5f0] font-mono text-xs">{selectedOrder.id}</p>
                </div>
                <div>
                  <span className="text-[#606060] text-xs">Client</span>
                  <p className="text-[#f5f5f0]">{selectedOrder.name}</p>
                </div>
                <div>
                  <span className="text-[#606060] text-xs">Téléphone</span>
                  <p className="text-[#f5f5f0]">{selectedOrder.phone}</p>
                </div>
                <div>
                  <span className="text-[#606060] text-xs">Wilaya</span>
                  <p className="text-[#f5f5f0]">{selectedOrder.wilaya || '-'}</p>
                </div>
                <div>
                  <span className="text-[#606060] text-xs">Commune</span>
                  <p className="text-[#f5f5f0]">{selectedOrder.commune || '-'}</p>
                </div>
                <div>
                  <span className="text-[#606060] text-xs">Produit</span>
                  <p className="text-[#f5f5f0]">{selectedOrder.product || '-'}</p>
                </div>
                <div>
                  <span className="text-[#606060] text-xs">Quantité</span>
                  <p className="text-[#f5f5f0]">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <span className="text-[#606060] text-xs">Source</span>
                  <p className="text-[#f5f5f0]">{selectedOrder.source}</p>
                </div>
                <div>
                  <span className="text-[#606060] text-xs">Total</span>
                  <p className="text-[#f5f5f0]">{selectedOrder.total ? `${selectedOrder.total} DA` : '-'}</p>
                </div>
                <div>
                  <span className="text-[#606060] text-xs">Date</span>
                  <p className="text-[#f5f5f0] text-xs">{formatDate(selectedOrder.created_at)}</p>
                </div>
              </div>
              {selectedOrder.notes && (
                <div>
                  <span className="text-[#606060] text-xs">Notes</span>
                  <p className="text-[#f5f5f0] text-sm mt-1 bg-[#08080a] rounded-lg p-3">{selectedOrder.notes}</p>
                </div>
              )}
              <div className="border-t border-white/[0.06] pt-4">
                <p className="text-[#606060] text-xs mb-2">Changer le statut</p>
                <div className="flex items-center gap-2">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111113] border-white/[0.08]">
                      {STATUS_LIST.map((s) => (
                        <SelectItem key={s} value={s} className="text-[#f5f5f0] focus:bg-white/[0.04] focus:text-[#f5f5f0]">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleStatusChange}
                    disabled={updating || newStatus === selectedOrder.status}
                    className="bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800]"
                  >
                    {updating ? '...' : 'Sauvegarder'}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${selectedOrder.phone}`} className="flex-1">
                  <Button variant="outline" className="w-full border-white/[0.08] text-green-400 hover:bg-green-500/10">
                    <Phone className="h-4 w-4 mr-2" />
                    Appeler
                  </Button>
                </a>
                <a href={`https://wa.me/213${selectedOrder.phone.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full border-white/[0.08] text-emerald-400 hover:bg-emerald-500/10">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
