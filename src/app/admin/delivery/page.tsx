'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RoleGuard } from '@/components/admin/RoleGuard'
import { Save, Loader2, Plus, Trash2, Truck, RotateCcw, Settings, X } from 'lucide-react'
import { WILAYAS } from '@/lib/algeria-data'

interface DeliveryZone {
  label: string
  wilayas: Record<string, number>
}

interface DeliveryService {
  name: string
  enabled: boolean
  logo: string
  pricing_type: 'zone' | 'flat'
  flat_price: number
  zones: Record<string, DeliveryZone>
}

interface DeliveryConfig {
  id: number
  services: Record<string, DeliveryService>
  global_settings: {
    free_shipping_enabled: boolean
    free_shipping_min_amount: number
    delivery_estimate_days: number
    default_service: string
  }
}

const DEFAULT_CONFIG: DeliveryConfig = {
  id: 1,
  services: {
    yalidine: {
      name: 'Yalidine',
      enabled: true,
      logo: '',
      pricing_type: 'zone',
      flat_price: 0,
      zones: {
        home: { label: 'Domicile', wilayas: {} },
        stopdesk: { label: 'Stop Desk', wilayas: {} },
      },
    },
    maybox: {
      name: 'Maybox',
      enabled: false,
      logo: '',
      pricing_type: 'zone',
      flat_price: 0,
      zones: {
        home: { label: 'Domicile', wilayas: {} },
        stopdesk: { label: 'Stop Desk', wilayas: {} },
      },
    },
    ecolog: {
      name: 'ECO LOG',
      enabled: false,
      logo: '',
      pricing_type: 'zone',
      flat_price: 0,
      zones: {
        home: { label: 'Domicile', wilayas: {} },
        stopdesk: { label: 'Stop Desk', wilayas: {} },
      },
    },
  },
  global_settings: {
    free_shipping_enabled: false,
    free_shipping_min_amount: 0,
    delivery_estimate_days: 3,
    default_service: 'yalidine',
  },
}

// Algeria zone grouping for bulk pricing
const ZONE_GROUPS: Record<string, { label: string; wilayaCodes: number[] }> = {
  zone1: { label: 'Zone 1 (Alger & environs)', wilayaCodes: [16, 9, 35, 42, 44] },
  zone2: { label: 'Zone 2 (Nord)', wilayaCodes: [2, 6, 15, 18, 21, 23, 24, 25, 27, 34, 36, 43, 46, 48] },
  zone3: { label: 'Zone 3 (Hauts Plateaux)', wilayaCodes: [3, 4, 5, 7, 10, 12, 14, 17, 19, 20, 22, 26, 28, 29, 38, 40, 41, 45] },
  zone4: { label: 'Zone 4 (Sud)', wilayaCodes: [1, 8, 11, 13, 30, 32, 33, 37, 39, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58] },
}

export default function DeliveryAdminPage() {
  const [config, setConfig] = useState<DeliveryConfig>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedService, setExpandedService] = useState<string>('yalidine')
  const [newServiceKey, setNewServiceKey] = useState('')
  const [newServiceName, setNewServiceName] = useState('')
  const [bulkZone, setBulkZone] = useState<string>('zone1')
  const [bulkPrice, setBulkPrice] = useState<string>('400')

  useEffect(() => {
    fetch('/api/delivery')
      .then(r => r.json())
      .then(data => {
        if (data && data.services) setConfig(data as DeliveryConfig)
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const data = await res.json()
        alert('Erreur: ' + (data.error || 'Sauvegarde échouée'))
      }
    } catch {
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => setConfig(DEFAULT_CONFIG)

  const updateConfig = useCallback((key: keyof DeliveryConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateService = useCallback((serviceKey: string, updates: Partial<DeliveryService>) => {
    setConfig(prev => {
      const services = { ...prev.services }
      services[serviceKey] = { ...services[serviceKey], ...updates }
      return { ...prev, services }
    })
  }, [])

  const updateZoneWilayaPrice = useCallback((serviceKey: string, zoneKey: string, wilayaCode: string, price: number) => {
    setConfig(prev => {
      const services = { ...prev.services }
      const service = { ...services[serviceKey] }
      const zones = { ...service.zones }
      const zone = { ...zones[zoneKey] }
      zone.wilayas = { ...zone.wilayas, [wilayaCode]: price }
      zones[zoneKey] = zone
      service.zones = zones
      services[serviceKey] = service
      return { ...prev, services }
    })
  }, [])

  const removeZoneWilaya = useCallback((serviceKey: string, zoneKey: string, wilayaCode: string) => {
    setConfig(prev => {
      const services = { ...prev.services }
      const service = { ...services[serviceKey] }
      const zones = { ...service.zones }
      const zone = { ...zones[zoneKey] }
      const wilayas = { ...zone.wilayas }
      delete wilayas[wilayaCode]
      zone.wilayas = wilayas
      zones[zoneKey] = zone
      service.zones = zones
      services[serviceKey] = service
      return { ...prev, services }
    })
  }, [])

  const addService = () => {
    if (!newServiceKey.trim() || !newServiceName.trim()) return
    const key = newServiceKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')
    if (config.services[key]) {
      alert('Un service avec cette clé existe déjà')
      return
    }
    updateConfig('services', {
      ...config.services,
      [key]: {
        name: newServiceName.trim(),
        enabled: false,
        logo: '',
        pricing_type: 'zone',
        flat_price: 0,
        zones: {
          home: { label: 'Domicile', wilayas: {} },
          stopdesk: { label: 'Stop Desk', wilayas: {} },
        },
      },
    })
    setNewServiceKey('')
    setNewServiceName('')
    setExpandedService(key)
  }

  const removeService = (key: string) => {
    const services = { ...config.services }
    delete services[key]
    updateConfig('services', services)
    if (expandedService === key) {
      const remaining = Object.keys(services)
      setExpandedService(remaining[0] || '')
    }
  }

  const addZone = (serviceKey: string) => {
    const zoneKey = `zone_${Date.now()}`
    const service = config.services[serviceKey]
    updateService(serviceKey, {
      zones: {
        ...service.zones,
        [zoneKey]: { label: 'Nouvelle Zone', wilayas: {} },
      },
    })
  }

  const removeZone = (serviceKey: string, zoneKey: string) => {
    const service = config.services[serviceKey]
    const zones = { ...service.zones }
    delete zones[zoneKey]
    updateService(serviceKey, { zones })
  }

  const updateZoneLabel = (serviceKey: string, zoneKey: string, label: string) => {
    const service = config.services[serviceKey]
    const zones = { ...service.zones }
    zones[zoneKey] = { ...zones[zoneKey], label }
    updateService(serviceKey, { zones })
  }

  // Apply bulk pricing to a zone
  const applyBulkPricing = (serviceKey: string, zoneKey: string) => {
    const price = parseInt(bulkPrice)
    if (!price || price <= 0) return
    const group = ZONE_GROUPS[bulkZone]
    if (!group) return

    const newWilayas: Record<string, number> = {
      ...config.services[serviceKey].zones[zoneKey].wilayas,
    }
    group.wilayaCodes.forEach(code => {
      newWilayas[code.toString()] = price
    })

    const service = config.services[serviceKey]
    const zones = { ...service.zones }
    zones[zoneKey] = { ...zones[zoneKey], wilayas: newWilayas }
    updateService(serviceKey, { zones })
  }

  // Add individual wilaya pricing
  const [addingWilaya, setAddingWilaya] = useState<Record<string, string>>({})
  const [addingWilayaPrice, setAddingWilayaPrice] = useState<Record<string, string>>({})

  const addWilayaPricing = (serviceKey: string, zoneKey: string) => {
    const code = addingWilaya[`${serviceKey}-${zoneKey}`]
    const price = parseInt(addingWilayaPrice[`${serviceKey}-${zoneKey}`] || '0')
    if (!code || !price) return

    updateZoneWilayaPrice(serviceKey, zoneKey, code, price)
    setAddingWilaya(prev => ({ ...prev, [`${serviceKey}-${zoneKey}`]: '' }))
    setAddingWilayaPrice(prev => ({ ...prev, [`${serviceKey}-${zoneKey}`]: '' }))
  }

  const serviceKeys = Object.keys(config.services)

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">Services de Livraison</h1>
            <p className="text-[#a0a09a] text-sm mt-1">
              Configurez les services, zones et tarifs de livraison par wilaya
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Réinitialiser
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800] font-semibold h-9"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : saved ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegardé ✓
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Global Settings */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#c9a84c]" />
              <CardTitle className="text-sm text-[#f5f5f0]">Paramètres généraux</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-[#a0a09a] text-xs">Livraison gratuite</Label>
                <p className="text-[11px] text-[#606060]">Activer la livraison gratuite à partir d&apos;un montant minimum</p>
              </div>
              <Switch
                checked={config.global_settings.free_shipping_enabled}
                onCheckedChange={(v) => updateConfig('global_settings', { ...config.global_settings, free_shipping_enabled: v })}
              />
            </div>
            {config.global_settings.free_shipping_enabled && (
              <div className="space-y-2">
                <Label className="text-[#a0a09a] text-xs">Montant minimum pour livraison gratuite (DA)</Label>
                <Input
                  type="number"
                  value={config.global_settings.free_shipping_min_amount}
                  onChange={(e) => updateConfig('global_settings', { ...config.global_settings, free_shipping_min_amount: parseInt(e.target.value) || 0 })}
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9 w-48"
                  min={0}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#a0a09a] text-xs">Délai de livraison estimé (jours)</Label>
                <Input
                  type="number"
                  value={config.global_settings.delivery_estimate_days}
                  onChange={(e) => updateConfig('global_settings', { ...config.global_settings, delivery_estimate_days: parseInt(e.target.value) || 3 })}
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9"
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#a0a09a] text-xs">Service par défaut</Label>
                <select
                  value={config.global_settings.default_service}
                  onChange={(e) => updateConfig('global_settings', { ...config.global_settings, default_service: e.target.value })}
                  className="w-full h-9 rounded-md border border-white/[0.08] bg-[#08080a] px-3 py-1 text-sm text-[#f5f5f0]"
                >
                  {serviceKeys.map(key => (
                    <option key={key} value={key} className="bg-[#111113]">
                      {config.services[key].name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {serviceKeys.map(key => (
            <button
              key={key}
              onClick={() => setExpandedService(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold tracking-[0.5px] whitespace-nowrap transition-all ${
                expandedService === key
                  ? 'bg-[#c9a84c] text-[#0a0800]'
                  : 'bg-[#111113] text-[#a0a09a] border border-white/[0.06] hover:border-[#c9a84c]/30'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              {config.services[key].name}
              {!config.services[key].enabled && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-[#606060]">Désactivé</span>
              )}
            </button>
          ))}
        </div>

        {/* Expanded Service Config */}
        {expandedService && config.services[expandedService] && (
          <Card className="bg-[#111113] border-white/[0.06]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-sm text-[#f5f5f0]">{config.services[expandedService].name}</CardTitle>
                  <Switch
                    checked={config.services[expandedService].enabled}
                    onCheckedChange={(v) => updateService(expandedService, { enabled: v })}
                  />
                </div>
                {serviceKeys.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeService(expandedService)}
                    className="text-[#606060] hover:text-red-400 h-8"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Supprimer
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#a0a09a] text-xs">Nom du service</Label>
                  <Input
                    value={config.services[expandedService].name}
                    onChange={(e) => updateService(expandedService, { name: e.target.value })}
                    className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#a0a09a] text-xs">Type de tarification</Label>
                  <select
                    value={config.services[expandedService].pricing_type}
                    onChange={(e) => updateService(expandedService, { pricing_type: e.target.value as 'zone' | 'flat' })}
                    className="w-full h-9 rounded-md border border-white/[0.08] bg-[#08080a] px-3 py-1 text-sm text-[#f5f5f0]"
                  >
                    <option value="zone" className="bg-[#111113]">Par zone / wilaya</option>
                    <option value="flat" className="bg-[#111113]">Prix fixe</option>
                  </select>
                </div>
                {config.services[expandedService].pricing_type === 'flat' && (
                  <div className="space-y-2">
                    <Label className="text-[#a0a09a] text-xs">Prix fixe (DA)</Label>
                    <Input
                      type="number"
                      value={config.services[expandedService].flat_price}
                      onChange={(e) => updateService(expandedService, { flat_price: parseInt(e.target.value) || 0 })}
                      className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9"
                      min={0}
                    />
                  </div>
                )}
              </div>

              {/* Zones (only for zone pricing) */}
              {config.services[expandedService].pricing_type === 'zone' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#a0a09a] text-xs font-semibold uppercase tracking-wider">Zones de livraison</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addZone(expandedService)}
                      className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] h-8"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Ajouter zone
                    </Button>
                  </div>

                  {Object.entries(config.services[expandedService].zones).map(([zoneKey, zone]) => (
                    <div key={zoneKey} className="bg-[#08080a] border border-white/[0.06] rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Input
                          value={zone.label}
                          onChange={(e) => updateZoneLabel(expandedService, zoneKey, e.target.value)}
                          className="bg-[#111113] border-white/[0.08] text-[#f5f5f0] h-8 text-sm flex-1"
                          placeholder="Nom de la zone"
                        />
                        {Object.keys(config.services[expandedService].zones).length > 1 && (
                          <button
                            onClick={() => removeZone(expandedService, zoneKey)}
                            className="w-7 h-7 flex items-center justify-center rounded text-[#606060] hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Bulk pricing tool */}
                      <div className="flex items-center gap-2 bg-[#111113] rounded-md p-2">
                        <select
                          value={bulkZone}
                          onChange={(e) => setBulkZone(e.target.value)}
                          className="h-7 rounded border border-white/[0.08] bg-[#08080a] px-2 text-[11px] text-[#f5f5f0] flex-1"
                        >
                          {Object.entries(ZONE_GROUPS).map(([k, g]) => (
                            <option key={k} value={k} className="bg-[#111113]">{g.label}</option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          value={bulkPrice}
                          onChange={(e) => setBulkPrice(e.target.value)}
                          className="w-20 h-7 bg-[#08080a] border-white/[0.08] text-[#f5f5f0] text-[11px]"
                          placeholder="Prix"
                        />
                        <Button
                          size="sm"
                          onClick={() => applyBulkPricing(expandedService, zoneKey)}
                          className="bg-[#c9a84c] text-[#0a0800] h-7 text-[10px] px-2"
                        >
                          Appliquer
                        </Button>
                      </div>

                      {/* Current wilaya pricing */}
                      {Object.keys(zone.wilayas).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(zone.wilayas).map(([wilayaCode, price]) => {
                            const wilaya = WILAYAS.find(w => w.code.toString() === wilayaCode)
                            return (
                              <span
                                key={wilayaCode}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20"
                              >
                                {wilaya?.name || `Wilaya ${wilayaCode}`}: {price} DA
                                <button
                                  onClick={() => removeZoneWilaya(expandedService, zoneKey, wilayaCode)}
                                  className="ml-0.5 hover:bg-[#c9a84c]/25 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      )}

                      {/* Add individual wilaya */}
                      <div className="flex items-center gap-2">
                        <select
                          value={addingWilaya[`${expandedService}-${zoneKey}`] || ''}
                          onChange={(e) => setAddingWilaya(prev => ({ ...prev, [`${expandedService}-${zoneKey}`]: e.target.value }))}
                          className="flex-1 h-7 rounded border border-white/[0.08] bg-[#08080a] px-2 text-[11px] text-[#f5f5f0]"
                        >
                          <option value="">Ajouter wilaya...</option>
                          {WILAYAS.map(w => (
                            <option key={w.code} value={w.code.toString()} className="bg-[#111113]">
                              {w.code} - {w.name}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          value={addingWilayaPrice[`${expandedService}-${zoneKey}`] || ''}
                          onChange={(e) => setAddingWilayaPrice(prev => ({ ...prev, [`${expandedService}-${zoneKey}`]: e.target.value }))}
                          className="w-20 h-7 bg-[#08080a] border-white/[0.08] text-[#f5f5f0] text-[11px]"
                          placeholder="Prix DA"
                        />
                        <Button
                          size="sm"
                          onClick={() => addWilayaPricing(expandedService, zoneKey)}
                          className="bg-white/5 text-[#a0a09a] hover:text-[#f5f5f0] h-7 text-[10px] px-2 border border-white/[0.08]"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add new service */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#a0a09a]">Ajouter un service de livraison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="space-y-2 flex-1">
                <Label className="text-[#a0a09a] text-xs">Clé (identifiant unique)</Label>
                <Input
                  value={newServiceKey}
                  onChange={(e) => setNewServiceKey(e.target.value)}
                  placeholder="ex: yalidine, dzex, ems"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9 text-sm"
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label className="text-[#a0a09a] text-xs">Nom affiché</Label>
                <Input
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="ex: Yalidine Express"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9 text-sm"
                />
              </div>
              <Button
                onClick={addService}
                disabled={!newServiceKey.trim() || !newServiceName.trim()}
                className="bg-[#c9a84c] text-[#0a0800] font-semibold h-9"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
