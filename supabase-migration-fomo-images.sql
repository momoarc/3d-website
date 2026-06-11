-- ============================================
-- MIGRATION: FOMO Config + Multi-Images + Real Data + Editable Badges
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create fomo_config table (if not exists)
CREATE TABLE IF NOT EXISTS fomo_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  recent_purchases_enabled BOOLEAN DEFAULT true,
  recent_purchases_interval INTEGER DEFAULT 20,
  recent_purchases_names TEXT[] DEFAULT '{"Karim","Amina","Yacine","Sara","Mohamed","Leila","Omar","Nadia","Rami","Ines","Sofiane","Meriem"}',
  recent_purchases_wilayas TEXT[] DEFAULT '{"Alger","Oran","Constantine","Annaba","Sétif","Blida","Tlemcen","Batna","Béjaïa","Tizi Ouzou"}',
  viewers_counter_enabled BOOLEAN DEFAULT true,
  viewers_counter_min INTEGER DEFAULT 3,
  viewers_counter_max INTEGER DEFAULT 28,
  stock_urgency_enabled BOOLEAN DEFAULT true,
  stock_urgency_threshold INTEGER DEFAULT 5,
  order_count_enabled BOOLEAN DEFAULT true,
  order_count_min INTEGER DEFAULT 12,
  order_count_max INTEGER DEFAULT 87,
  delivery_estimate_enabled BOOLEAN DEFAULT true,
  delivery_estimate_days INTEGER DEFAULT 2,
  trust_badges_enabled BOOLEAN DEFAULT true,
  -- New columns for real data + editable badges
  stock_urgency_use_real BOOLEAN DEFAULT true,
  order_count_use_real BOOLEAN DEFAULT true,
  trust_badges_items JSONB DEFAULT '[{"icon":"award","label":"Authenticité certifiée"},{"icon":"shield","label":"Garantie 3 ans"},{"icon":"truck","label":"Livraison assurée"},{"icon":"package","label":"Paiement à la livraison"}]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row
INSERT INTO fomo_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Add new columns to existing fomo_config table (if table already existed without them)
ALTER TABLE fomo_config ADD COLUMN IF NOT EXISTS stock_urgency_use_real BOOLEAN DEFAULT true;
ALTER TABLE fomo_config ADD COLUMN IF NOT EXISTS order_count_use_real BOOLEAN DEFAULT true;
ALTER TABLE fomo_config ADD COLUMN IF NOT EXISTS trust_badges_items JSONB DEFAULT '[{"icon":"award","label":"Authenticité certifiée"},{"icon":"shield","label":"Garantie 3 ans"},{"icon":"truck","label":"Livraison assurée"},{"icon":"package","label":"Paiement à la livraison"}]';

-- 2. Add images column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- 3. RLS policies for fomo_config
ALTER TABLE fomo_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read fomo" ON fomo_config;
CREATE POLICY "Public read fomo" ON fomo_config FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin manage fomo" ON fomo_config;
CREATE POLICY "Admin manage fomo" ON fomo_config FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
  ) OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'admin')
);

-- 4. Update existing products to populate images array from image_url
UPDATE products
SET images = CASE
  WHEN image_url IS NOT NULL AND image_url != '' THEN jsonb_build_array(image_url)
  ELSE '[]'::jsonb
END
WHERE images = '[]'::jsonb AND image_url IS NOT NULL AND image_url != '';
