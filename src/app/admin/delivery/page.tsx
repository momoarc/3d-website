'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RoleGuard } from '@/components/admin/RoleGuard'
import { Save, Loader2, Plus, Trash2, Truck, RotateCcw, Settings, X, AlertTriangle, Database } from 'lucide-react'
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

// Default config with pre-configured Algeria zone pricing
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
        home: {
          label: 'Domicile',
          wilayas: {
            '16': 400, '9': 400, '35': 400, '42': 400, '44': 400,
            '2': 600, '6': 600, '15': 600, '18': 600, '21': 600, '23': 600, '24': 600, '25': 600, '27': 600, '31': 600, '34': 600, '36': 600, '43': 600, '46': 600, '48': 600,
            '3': 700, '4': 700, '5': 700, '7': 700, '10': 700, '12': 700, '14': 700, '17': 700, '19': 700, '20': 700, '22': 700, '26': 700, '28': 700, '29': 700, '38': 700, '40': 700, '41': 700, '45': 700,
            '1': 900, '8': 900, '11': 900, '13': 900, '30': 900, '32': 900, '33': 900, '37': 900, '39': 900, '47': 900, '49': 900, '50': 900, '51': 900, '52': 900, '53': 900, '54': 900, '55': 900, '56': 900, '57': 900, '58': 900,
          },
        },
        stopdesk: {
          label: 'Stop Desk',
          wilayas: {
            '16': 200, '9': 200, '35': 200, '42': 200, '44': 200,
            '2': 300, '6': 300, '15': 300, '18': 300, '21': 300, '23': 300, '24': 300, '25': 300, '27': 300, '31': 300, '34': 300, '36': 300, '43': 300, '46': 300, '48': 300,
            '3': 350, '4': 350, '5': 350, '7': 350, '10': 350, '12': 350, '14': 350, '17': 350, '19': 350, '20': 350, '22': 350, '26': 350, '28': 350, '29': 350, '38': 350, '40': 350, '41': 350, '45': 350,
            '1': 450, '8': 450, '11': 450, '13': 450, '30': 450, '32': 450, '33': 450, '37': 450, '39': 450, '47': 450, '49': 450, '50': 450, '51': 450, '52': 450, '53': 450, '54': 450, '55': 450, '56': 450, '57': 450, '58': 450,
          },
        },
      },
    },
    maybox: {
      name: 'Maybox',
      enabled: false,
      logo: '',
      pricing_type: 'zone',
      flat_price: 0,
      zones: {
        home: {
          label: 'Domicile',
          wilayas: {
            '16': 350, '9': 350, '35': 350, '42': 350, '44': 350,
            '2': 550, '6': 550, '15': 550, '18': 550, '21': 550, '23': 550, '24': 550, '25': 550, '27': 550, '31': 550, '34': 550, '36': 550, '43': 550, '46': 550, '48': 550,
            '3': 650, '4': 650, '5': 650, '7': 650, '10': 650, '12': 650, '14': 650, '17': 650, '19': 650, '20': 650, '22': 650, '26': 650, '28': 650, '29': 650, '38': 650, '40': 650, '41': 650, '45': 650,
            '1': 850, '8': 850, '11': 850, '13': 850, '30': 850, '32': 850, '33': 850, '37': 850, '39': 850, '47': 850, '49': 850, '50': 850, '51': 850, '52': 850, '53': 850, '54': 850, '55': 850, '56': 850, '57': 850, '58': 850,
          },
        },
        stopdesk: {
          label: 'Stop Desk',
          wilayas: {
            '16': 180, '9': 180, '35': 180, '42': 180, '44': 180,
            '2': 280, '6': 280, '15': 280, '18': 280, '21': 280, '23': 280, '24': 280, '25': 280, '27': 280, '31': 280, '34': 280, '36': 280, '43': 280, '46': 280, '48': 280,
            '3': 330, '4': 330, '5': 330, '7': 330, '10': 330, '12': 330, '14': 330, '17': 330, '19': 330, '20': 330, '22': 330, '26': 330, '28': 330, '29': 330, '38': 330, '40': 330, '41': 330, '45': 330,
            '1': 430, '8': 430, '11': 430, '13': 430, '30': 430, '32': 430, '33': 430, '37': 430, '39': 430, '47': 430, '49': 430, '50': 430, '51': 430, '52': 430, '53': 430, '54': 430, '55': 430, '56': 430, '57': 430, '58': 430,
          },
        },
      },
    },
    ecolog: {
      name: 'ECO LOG',
      enabled: false,
      logo: '',
      pricing_type: 'zone',
      flat_price: 0,
      zones: {
        home: {
          label: 'Domicile',
          wilayas: {
            '16': 380, '9': 380, '35': 380, '42': 380, '44': 380,
            '2': 580, '6': 580, '15': 580, '18': 580, '21': 580, '23': 580, '24': 580, '25': 580, '27': 580, '31': 580, '34': 580, '36': 580, '43': 580, '46': 580, '48': 580,
            '3': 680, '4': 680, '5': 680, '7': 680, '10': 680, '12': 680, '14': 680, '17': 680, '19': 680, '20': 680, '22': 680, '26': 680, '28': 680, '29': 680, '38': 680, '40': 680, '41': 680, '45': 680,
            '1': 880, '8': 880, '11': 880, '13': 880, '30': 880, '32': 880, '33': 880, '37': 880, '39': 880, '47': 880, '49': 880, '50': 880, '51': 880, '52': 880, '53': 880, '54': 880, '55': 880, '56': 880, '57': 880, '58': 880,
          },
        },
        stopdesk: {
          label: 'Stop Desk',
          wilayas: {
            '16': 190, '9': 190, '35': 190, '42': 190, '44': 190,
            '2': 290, '6': 290, '15': 290, '18': 290, '21': 290, '23': 290, '24': 290, '25': 290, '27': 290, '31': 290, '34': 290, '36': 290, '43': 290, '46': 290, '48': 290,
            '3': 340, '4': 340, '5': 340, '7': 340, '10': 340, '12': 340, '14': 340, '17': 340, '19': 340, '20': 340, '22': 340, '26': 340, '28': 340, '29': 340, '38': 340, '40': 340, '41': 340, '45': 340,
            '1': 440, '8': 440, '11': 440, '13': 440, '30': 440, '32': 440, '33': 440, '37': 440, '39': 440, '47': 440, '49': 440, '50': 440, '51': 440, '52': 440, '53': 440, '54': 440, '55': 440, '56': 440, '57': 440, '58': 440,
          },
        },
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
  zone1: { label: 'Zone 1 — Alger & environs', wilayaCodes: [16, 9, 35, 42, 44] },
  zone2: { label: 'Zone 2 — Nord', wilayaCodes: [2, 6, 15, 18, 21, 23, 24, 25, 27, 31, 34, 36, 43, 46, 48] },
  zone3: { label: 'Zone 3 — Hauts Plateaux', wilayaCodes: [3, 4, 5, 7, 10, 12, 14, 17, 19, 20, 22, 26, 28, 29, 38, 40, 41, 45] },
  zone4: { label: 'Zone 4 — Sud', wilayaCodes: [1, 8, 11, 13, 30, 32, 33, 37, 39, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58] },
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
  const [dbReady, setDbReady] = useState(true)
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupError, setSetupError] = useState('')

  useEffect(() => {
    fetch('/api/delivery')
      .then(r => r.json())
      .then(data => {
        if (data && data.services) {
          // Check if any service has pricing configured
          const hasPricing = Object.values(data.services as Record<string, DeliveryService>).some(
            s => Object.values(s.zones).some(z => Object.keys(z.wilayas).length > 0)
          )
          if (hasPricing) {
            setConfig(data as DeliveryConfig)
          } else {
            // DB returned empty config, use our pre-configured defaults
            setConfig(DEFAULT_CONFIG)
            setDbReady(false)
          }
        } else {
          setDbReady(false)
        }
      })
      .catch(() => {
        setDbReady(false)
      })
  }, [])

  const handleSetup = async () => {
    setSetupLoading(true)
    setSetupError('')
    try {
      const res = await fetch('/api/delivery', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setDbReady(true)
        // Reload config
        const configRes = await fetch('/api/delivery')
        const configData = await configRes.json()
        if (configData?.services) {
          const hasPricing = Object.values(configData.services as Record<string, DeliveryService>).some(
            (s: DeliveryService) => Object.values(s.zones).some(z => Object.keys(z.wilayas).length > 0)
          )
          setConfig(hasPricing ? configData : DEFAULT_CONFIG)
        }
      } else {
        setSetupError(data.error || 'Impossible de créer la configuration. Exécutez le script SQL de migration.')
      }
    } catch {
      setSetupError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setSetupLoading(false)
    }
  }

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
        setDbReady(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const data = await res.json()
        if (data.error?.includes('does not exist') || data.error?.includes('42P01')) {
          setDbReady(false)
          setSetupError('La table delivery_config n\'existe pas. Exécutez le script SQL de migration.')
        } else {
          alert('Erreur: ' + (data.error || 'Sauvegarde échouée'))
        }
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

  // Count configured wilayas for current service
  const getConfiguredWilayasCount = (serviceKey: string) => {
    const service = config.services[serviceKey]
    if (!service) return 0
    const allWilayas = new Set<string>()
    Object.values(service.zones).forEach(zone => {
      Object.keys(zone.wilayas).forEach(code => allWilayas.add(code))
    })
    return allWilayas.size
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="space-y-6 animate-fade-in">
        {/* Setup banner if DB not ready */}
        {!dbReady && (
          <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-[#f5f5f0] text-sm mb-1">Configuration requise</div>
                <p className="text-[13px] text-[#a0a09a] mb-3">
                  La table <code className="text-[#c9a84c] bg-[#c9a84c]/10 px-1.5 py-0.5 rounded text-[11px]">delivery_config</code> n&apos;existe pas encore dans la base de données.
                  Vous pouvez tenter une configuration automatique ou exécuter le script SQL manuellement.
                </p>
                {setupError && (
                  <p className="text-[12px] text-[#f87171] mb-2">{setupError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSetup}
                    disabled={setupLoading}
                    size="sm"
                    className="bg-[#f59e0b] text-[#0a0800] hover:bg-[#fbbf24] font-semibold h-8"
                  >
                    {setupLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Configuration...
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5 mr-1.5" />
                        Configurer automatiquement
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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
              {config.services[key].enabled && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#4ade80]/10 text-[#4ade80]">
                  {getConfiguredWilayasCount(key)}/58
                </span>
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
                    <div>
                      <Label className="text-[#a0a09a] text-xs font-semibold uppercase tracking-wider">Zones de livraison</Label>
                      <p className="text-[11px] text-[#606060] mt-0.5">
                        {getConfiguredWilayasCount(expandedService)} wilaya(s) configurée(s) sur 58
                      </p>
                    </div>
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
                      <div className="bg-[#111113] rounded-md p-3 space-y-2">
                        <p className="text-[10px] tracking-[1px] uppercase text-[#c9a84c] font-semibold">Appliquer un tarif par zone géographique</p>
                        <div className="flex items-center gap-2">
                          <select
                            value={bulkZone}
                            onChange={(e) => setBulkZone(e.target.value)}
                            className="flex-1 h-8 rounded border border-white/[0.08] bg-[#08080a] px-2 text-[11px] text-[#f5f5f0]"
                          >
                            {Object.entries(ZONE_GROUPS).map(([k, g]) => (
                              <option key={k} value={k} className="bg-[#111113]">{g.label}</option>
                            ))}
                          </select>
                          <Input
                            type="number"
                            value={bulkPrice}
                            onChange={(e) => setBulkPrice(e.target.value)}
                            className="w-24 h-8 bg-[#08080a] border-white/[0.08] text-[#f5f5f0] text-[11px]"
                            placeholder="Prix"
                          />
                          <span className="text-[11px] text-[#606060]">DA</span>
                          <Button
                            size="sm"
                            onClick={() => applyBulkPricing(expandedService, zoneKey)}
                            className="bg-[#c9a84c] text-[#0a0800] h-8 text-[10px] px-3"
                          >
                            Appliquer
                          </Button>
                        </div>
                      </div>

                      {/* Current wilaya pricing */}
                      {Object.keys(zone.wilayas).length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] tracking-[1px] uppercase text-[#606060] font-semibold">
                            Wilayas configurées ({Object.keys(zone.wilayas).length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(zone.wilayas)
                              .sort(([a], [b]) => parseInt(a) - parseInt(b))
                              .map(([wilayaCode, price]) => {
                                const wilaya = WILAYAS.find(w => w.code.toString() === wilayaCode)
                                return (
                                  <span
                                    key={wilayaCode}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20"
                                  >
                                    {wilaya ? `${wilaya.code}` : wilayaCode}: {price} DA
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
                        </div>
                      )}

                      {/* Add individual wilaya */}
                      <div className="flex items-center gap-2">
                        <select
                          value={addingWilaya[`${expandedService}-${zoneKey}`] || ''}
                          onChange={(e) => setAddingWilaya(prev => ({ ...prev, [`${expandedService}-${zoneKey}`]: e.target.value }))}
                          className="flex-1 h-8 rounded border border-white/[0.08] bg-[#08080a] px-2 text-[11px] text-[#f5f5f0]"
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
                          className="w-24 h-8 bg-[#08080a] border-white/[0.08] text-[#f5f5f0] text-[11px]"
                          placeholder="Prix DA"
                        />
                        <Button
                          size="sm"
                          onClick={() => addWilayaPricing(expandedService, zoneKey)}
                          className="bg-white/5 text-[#a0a09a] hover:text-[#f5f5f0] h-8 text-[10px] px-3 border border-white/[0.08]"
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
