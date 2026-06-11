'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Package,
  Phone,
  Truck,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
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

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
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
  }

  const today = new Date().toISOString().split('T')[0]
  const todayOrders = orders.filter(o => o.created_at?.startsWith(today))
  const newOrders = orders.filter(o => o.status === 'Nouveau')
  const deliveredOrders = orders.filter(o => o.status === 'Livré')
  const returnedOrders = orders.filter(o => o.status === 'Retourné')
  const recentOrders = orders.slice(0, 6)

  // Status summary for the bar
  const statusCounts = STATUS_LIST.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length
    return acc
  }, {})

  // Urgent: orders that are "Nouveau" and older than 2 hours
  const urgentOrders = newOrders.filter(o => {
    const created = new Date(o.created_at)
    const hoursDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff > 2
  })

  const kpis = [
    {
      label: "Commandes Aujourd'hui",
      value: todayOrders.length,
      icon: <Package className="h-5 w-5" />,
      color: 'text-[#c9a84c]',
      bg: 'bg-[#c9a84c]/10',
    },
    {
      label: 'Nouvelles (à appeler)',
      value: newOrders.length,
      icon: <Phone className="h-5 w-5" />,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Livrées',
      value: deliveredOrders.length,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: 'Retournées',
      value: returnedOrders.length,
      icon: <RotateCcw className="h-5 w-5" />,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
  ]

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
      <div>
        <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">Tableau de Bord</h1>
        <p className="text-[#a0a09a] text-sm mt-1">Vue d&apos;ensemble de votre activité</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-[#111113] border-white/[0.06]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#a0a09a] text-xs font-medium uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-3xl font-bold text-[#f5f5f0] mt-1">{loading ? '...' : kpi.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Summary Bar */}
      <Card className="bg-[#111113] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-[#a0a09a] flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#c9a84c]" />
            Résumé des statuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STATUS_LIST.map((status) => (
              <Badge
                key={status}
                variant="outline"
                className={`${statusColors[status]} text-xs px-3 py-1`}
              >
                {status}: {statusCounts[status] || 0}
              </Badge>
            ))}
          </div>
          {orders.length > 0 && (
            <div className="mt-3 h-2 rounded-full bg-[#1a1a1e] overflow-hidden flex">
              {STATUS_LIST.map((status) => {
                const count = statusCounts[status] || 0
                if (count === 0) return null
                const pct = (count / orders.length) * 100
                const barColors: Record<OrderStatus, string> = {
                  'Nouveau': 'bg-blue-500',
                  'Appelé': 'bg-cyan-500',
                  'Confirmé': 'bg-green-500',
                  'Expédié': 'bg-purple-500',
                  'En transit': 'bg-indigo-500',
                  'Livré': 'bg-emerald-500',
                  'Retourné': 'bg-red-500',
                  'Annulé': 'bg-gray-500',
                }
                return (
                  <div
                    key={status}
                    className={`${barColors[status]} h-full transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${status}: ${count}`}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders Table */}
        <Card className="lg:col-span-2 bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#a0a09a] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#c9a84c]" />
              Commandes récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-[#606060]">Chargement...</div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-[#606060]">Aucune commande</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.06] hover:bg-transparent">
                      <TableHead className="text-[#606060] text-xs">ID</TableHead>
                      <TableHead className="text-[#606060] text-xs">Client</TableHead>
                      <TableHead className="text-[#606060] text-xs">Produit</TableHead>
                      <TableHead className="text-[#606060] text-xs">Statut</TableHead>
                      <TableHead className="text-[#606060] text-xs">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                        <TableCell className="text-xs text-[#a0a09a] font-mono">{order.id.slice(0, 12)}</TableCell>
                        <TableCell className="text-sm text-[#f5f5f0]">{order.name}</TableCell>
                        <TableCell className="text-sm text-[#a0a09a]">{order.product || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusColors[order.status]} text-[10px] px-2 py-0`}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-[#606060]">{formatDate(order.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Urgent Actions */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Actions urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urgentOrders.length === 0 ? (
              <div className="text-center py-6 text-[#606060] text-sm">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500/30" />
                Aucune action urgente
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {urgentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-lg bg-red-500/5 border border-red-500/10"
                  >
                    <p className="text-sm text-[#f5f5f0] font-medium">{order.name}</p>
                    <p className="text-xs text-[#a0a09a] mt-0.5">{order.product || 'Pas de produit'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-red-400">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {formatDate(order.created_at)}
                      </span>
                      <a
                        href={`tel:${order.phone}`}
                        className="text-[10px] text-[#c9a84c] hover:text-[#e4c06a]"
                      >
                        Appeler
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
