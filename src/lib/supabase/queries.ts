import { createClient } from './client'
import type { Product, Category, Order, Project, ShowroomConfig, SiteSettings, UserRoleRow } from '@/lib/types'

// Products
export async function getProducts() {
  const supabase = createClient()
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Product[]
}

export async function getProductsByCategory(category: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from('products').select('*').eq('category', category).order('created_at', { ascending: false })
  if (error) throw error
  return data as Product[]
}

export async function getProduct(id: number) {
  const supabase = createClient()
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error) throw error
  return data as Product
}

// Categories
export async function getCategories() {
  const supabase = createClient()
  const { data, error } = await supabase.from('categories').select('*').order('sort_order')
  if (error) throw error
  return data as Category[]
}

// Orders
export async function getOrders() {
  const supabase = createClient()
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Order[]
}

export async function createOrder(order: Omit<Order, 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('orders').insert(order).select().single()
  if (error) throw error
  return data as Order
}

export async function updateOrderStatus(id: string, status: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data as Order
}

// Projects
export async function getProjects() {
  const supabase = createClient()
  const { data, error } = await supabase.from('projects').select('*').order('sort_order')
  if (error) throw error
  return data as Project[]
}

// Showroom
export async function getShowroomConfig() {
  const supabase = createClient()
  const { data, error } = await supabase.from('showroom_config').select('*').eq('id', 1).single()
  if (error) throw error
  return data as ShowroomConfig
}

// Settings
export async function getSiteSettings() {
  const supabase = createClient()
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single()
  if (error) throw error
  return data as SiteSettings
}

// User roles
export async function getUserRoles() {
  const supabase = createClient()
  const { data, error } = await supabase.from('user_roles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as UserRoleRow[]
}

// Image upload
export async function uploadImage(file: File, path: string) {
  const supabase = createClient()
  const { data, error } = await supabase.storage.from('images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(data.path)
  return publicUrl
}

export async function deleteImage(path: string) {
  const supabase = createClient()
  const { error } = await supabase.storage.from('images').remove([path])
  if (error) throw error
}

// Get current user role
export async function getCurrentUserRole(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check app_metadata first
  const metaRole = user.app_metadata?.role
  if (metaRole) return metaRole

  // Check user_roles table
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  return data?.role || null
}
