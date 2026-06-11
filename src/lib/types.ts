export type UserRole = 'super_admin' | 'admin' | 'editeur' | 'lecteur'

export type EmployeeRole = 'confirmation' | 'livraison' | 'superviseur'

export type OrderStatus = 'Nouveau' | 'Appelé' | 'Confirmé' | 'Expédié' | 'En transit' | 'Livré' | 'Retourné' | 'Annulé'

export interface Product {
  id: number
  name: string
  slug?: string
  category: string
  price: number
  compare_price?: number
  image_url: string | null
  images?: string[]
  badge: string | null
  description: string | null
  specs: string[]
  attributes: ProductAttribute[]
  available: boolean
  gender?: string
  stock?: number
  created_at: string
  updated_at: string
}

export interface ProductAttribute {
  name: string
  values: string[]
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  created_at: string
}

export interface Order {
  id: string
  name: string
  phone: string
  email?: string | null
  wilaya: string | null
  commune: string | null
  product: string | null
  product_id: number | null
  quantity: number
  status: OrderStatus
  notes: string | null
  source: string
  total: number | null
  delivery_service?: string | null
  delivery_price?: number | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: number
  name: string
  location: string | null
  image_url: string | null
  badge: string | null
  description: string | null
  specs: string[]
  sort_order: number
  created_at: string
}

export interface ShowroomWall {
  image: string
  label: string
  destination: string
}

export interface ShowroomRoom {
  speed: number
  autoRotate: number
  radius: number
  floorImage: string
  ceilingImage: string
}

export interface ShowroomConfig {
  id: number
  walls_config: ShowroomWall[]
  room_config: ShowroomRoom
  updated_at: string
}

export interface Employee {
  id: string
  name: string
  login_id: string
  role: EmployeeRole
  active: boolean
  created_at: string
}

export interface SiteSettings {
  id: number
  business_name: string
  phone: string | null
  email: string | null
  address: string | null
  meta_pixel_id: string | null
  tiktok_pixel_id: string | null
  ga4_id: string | null
  snapchat_pixel_id: string | null
  whatsapp_number: string | null
  whatsapp_greeting: string | null
  whatsapp_enabled: boolean | null
  webhook_secret: string | null
  webhook_enabled: boolean | null
  notification_email: string | null
  n8n_webhook_url: string | null
  slack_webhook_url: string | null
  updated_at: string
}

export interface PaymentMethod {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string
  type: 'offline' | 'stripe' | 'paypal' | 'ccp' | 'baridimob' | 'custom'
  config: Record<string, unknown>
  enabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CartItem {
  product_id: number
  name: string
  price: number
  image_url: string | null
  quantity: number
  category: string
  attributes: Record<string, string>
}

export interface UserRoleRow {
  id: number
  user_id: string
  email: string
  role: UserRole
  expires_at: string | null
  created_at: string
}

export interface LandingPageSection {
  id: string
  type: 'hero' | 'products' | 'text' | 'cta' | 'testimonial' | 'gallery' | 'faq' | 'video' | 'countdown' | 'features'
  content: Record<string, unknown>
}

export interface LandingPage {
  id: number
  title: string
  slug: string
  meta_description: string | null
  meta_title: string | null
  is_published: boolean
  is_home: boolean
  sections: LandingPageSection[]
  created_at: string
  updated_at: string
}

export const STATUS_LIST: OrderStatus[] = ['Nouveau','Appelé','Confirmé','Expédié','En transit','Livré','Retourné','Annulé']

export const ROLE_LABELS: Record<UserRole, { label: string; description: string }> = {
  super_admin: { label: 'Super Admin', description: 'Accès total + gestion des utilisateurs' },
  admin: { label: 'Admin', description: 'Accès total + gestion des utilisateurs' },
  editeur: { label: 'Éditeur', description: 'Produits, Réalisations, Téléchargements, Catégories' },
  lecteur: { label: 'Lecteur', description: 'Lecture seule sur Commandes & Devis' },
}

// Webhook types
export type WebhookEvent = 'order.created' | 'order.status_changed' | 'cart.abandoned' | 'stock.low' | 'user.registered'

export interface Webhook {
  id: number
  url: string
  events: string[]
  secret: string | null
  active: boolean
  last_triggered_at: string | null
  created_at: string
}

export interface WebhookDelivery {
  id: number
  webhook_id: number
  event: string
  payload: Record<string, unknown>
  response_status: number | null
  response_body: string | null
  delivered_at: string
}

export const WEBHOOK_EVENTS: { value: WebhookEvent; label: string; description: string }[] = [
  { value: 'order.created', label: 'Commande créée', description: 'Déclenché quand une nouvelle commande est passée' },
  { value: 'order.status_changed', label: 'Statut modifié', description: 'Déclenché quand le statut d\'une commande change' },
  { value: 'cart.abandoned', label: 'Panier abandonné', description: 'Déclenché quand un panier est détecté comme abandonné' },
  { value: 'stock.low', label: 'Stock bas', description: 'Déclenché quand un produit est marqué indisponible' },
  { value: 'user.registered', label: 'Utilisateur inscrit', description: 'Déclenché quand un nouvel utilisateur s\'inscrit' },
]

// Chatbot types
export interface ChatbotQuickAction {
  label: string
  action: string
  response: string
}

export interface ChatbotFaqItem {
  key: string
  label: string
  icon: string
  response: string
}

export interface ChatbotConfig {
  id: number
  greeting: string
  quick_actions: ChatbotQuickAction[]
  faq_items: ChatbotFaqItem[]
  whatsapp_message: string
  n8n_webhook_url: string | null
  n8n_enabled: boolean
  updated_at: string
}
