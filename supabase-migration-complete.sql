-- ============================================
-- MIGRATION COMPLETE — Maison Dorée
-- A exécuter dans Supabase SQL Editor
-- ============================================
-- Ce script crée toutes les tables manquantes,
-- ajoute les colonnes manquantes aux tables existantes,
-- configure les politiques RLS, et insère les données par défaut.
-- Il est sûr de l'exécuter plusieurs fois (idempotent).
-- ============================================

-- ============================================
-- 1. FONCTIONS HELPER (vérification des rôles)
-- ============================================

CREATE OR REPLACE FUNCTION has_write_role() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'editeur')
  ) OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'admin', 'editeur')
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_admin_role() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
  ) OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'admin')
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- 2. TABLE: user_roles
-- ============================================

CREATE TABLE IF NOT EXISTS user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'editeur', 'lecteur')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read roles" ON user_roles;
DROP POLICY IF EXISTS "Super admin insert roles" ON user_roles;
DROP POLICY IF EXISTS "Super admin update roles" ON user_roles;
DROP POLICY IF EXISTS "Super admin delete roles" ON user_roles;
CREATE POLICY "Auth read roles" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin insert roles" ON user_roles FOR INSERT TO authenticated WITH check (is_super_admin());
CREATE POLICY "Super admin update roles" ON user_roles FOR UPDATE TO authenticated USING (is_super_admin());
CREATE POLICY "Super admin delete roles" ON user_roles FOR DELETE TO authenticated USING (is_super_admin());

-- ============================================
-- 3. TABLE: products (avec toutes les colonnes)
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  compare_price INTEGER,
  image_url TEXT,
  images JSONB DEFAULT '[]',
  badge TEXT,
  description TEXT,
  specs TEXT[],
  attributes JSONB DEFAULT '[]',
  available BOOLEAN DEFAULT true,
  gender TEXT DEFAULT 'Mixte' CHECK (gender IN ('Homme', 'Femme', 'Mixte')),
  stock INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajout des colonnes si la table existait déjà sans elles
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_price INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Mixte' CHECK (gender IN ('Homme', 'Femme', 'Mixte'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON products (slug) WHERE slug IS NOT NULL;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Editors write products" ON products;
DROP POLICY IF EXISTS "Editors update products" ON products;
DROP POLICY IF EXISTS "Editors delete products" ON products;
CREATE POLICY "Public read products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors write products" ON products FOR INSERT TO authenticated WITH check (has_write_role());
CREATE POLICY "Editors update products" ON products FOR UPDATE TO authenticated USING (has_write_role());
CREATE POLICY "Editors delete products" ON products FOR DELETE TO authenticated USING (has_write_role());

-- Mettre à jour les images depuis image_url si le tableau est vide
UPDATE products
SET images = CASE
  WHEN image_url IS NOT NULL AND image_url != '' THEN jsonb_build_array(image_url)
  ELSE '[]'::jsonb
END
WHERE images = '[]'::jsonb AND image_url IS NOT NULL AND image_url != '';

-- ============================================
-- 4. TABLE: categories
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read categories" ON categories;
DROP POLICY IF EXISTS "Editors write categories" ON categories;
DROP POLICY IF EXISTS "Editors update categories" ON categories;
DROP POLICY IF EXISTS "Editors delete categories" ON categories;
CREATE POLICY "Public read categories" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors write categories" ON categories FOR INSERT TO authenticated WITH check (has_write_role());
CREATE POLICY "Editors update categories" ON categories FOR UPDATE TO authenticated USING (has_write_role());
CREATE POLICY "Editors delete categories" ON categories FOR DELETE TO authenticated USING (has_write_role());

-- ============================================
-- 5. TABLE: orders (FORMULAIRE DE COMMANDE)
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  wilaya TEXT,
  commune TEXT,
  product TEXT,
  product_id BIGINT REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Nouveau' CHECK (status IN ('Nouveau','Appelé','Confirmé','Expédié','En transit','Livré','Retourné','Annulé')),
  notes TEXT,
  source TEXT DEFAULT 'website',
  total INTEGER,
  delivery_service TEXT,
  delivery_price INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajout des colonnes si la table existait déjà sans elles
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_service TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_price INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wilaya TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commune TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_id BIGINT REFERENCES products(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Auth read orders" ON orders;
DROP POLICY IF EXISTS "Admin update orders" ON orders;
DROP POLICY IF EXISTS "Admin delete orders" ON orders;
CREATE POLICY "Public insert orders" ON orders FOR INSERT TO anon, authenticated WITH check (true);
CREATE POLICY "Auth read orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin update orders" ON orders FOR UPDATE TO authenticated USING (has_admin_role());
CREATE POLICY "Admin delete orders" ON orders FOR DELETE TO authenticated USING (has_admin_role());

-- ============================================
-- 6. TABLE: projects (Réalisations)
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  image_url TEXT,
  badge TEXT,
  description TEXT,
  specs TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read projects" ON projects;
DROP POLICY IF EXISTS "Editors write projects" ON projects;
DROP POLICY IF EXISTS "Editors update projects" ON projects;
DROP POLICY IF EXISTS "Editors delete projects" ON projects;
CREATE POLICY "Public read projects" ON projects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors write projects" ON projects FOR INSERT TO authenticated WITH check (has_write_role());
CREATE POLICY "Editors update projects" ON projects FOR UPDATE TO authenticated USING (has_write_role());
CREATE POLICY "Editors delete projects" ON projects FOR DELETE TO authenticated USING (has_write_role());

-- ============================================
-- 7. TABLE: showroom_config
-- ============================================

CREATE TABLE IF NOT EXISTS showroom_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  walls_config JSONB DEFAULT '[]',
  room_config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO showroom_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE showroom_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read showroom" ON showroom_config;
DROP POLICY IF EXISTS "Editors write showroom" ON showroom_config;
CREATE POLICY "Public read showroom" ON showroom_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors write showroom" ON showroom_config FOR UPDATE TO authenticated USING (has_write_role());

-- ============================================
-- 8. TABLE: employees
-- ============================================

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  login_id TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'confirmation' CHECK (role IN ('confirmation', 'livraison', 'superviseur')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read employees" ON employees;
DROP POLICY IF EXISTS "Admin write employees" ON employees;
DROP POLICY IF EXISTS "Admin update employees" ON employees;
DROP POLICY IF EXISTS "Admin delete employees" ON employees;
CREATE POLICY "Auth read employees" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write employees" ON employees FOR INSERT TO authenticated WITH check (has_admin_role());
CREATE POLICY "Admin update employees" ON employees FOR UPDATE TO authenticated USING (has_admin_role());
CREATE POLICY "Admin delete employees" ON employees FOR DELETE TO authenticated USING (has_admin_role());

-- ============================================
-- 9. TABLE: activity_log
-- ============================================

CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read activity" ON activity_log;
DROP POLICY IF EXISTS "Auth insert activity" ON activity_log;
CREATE POLICY "Auth read activity" ON activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert activity" ON activity_log FOR INSERT TO authenticated WITH check (true);

-- ============================================
-- 10. TABLE: site_settings
-- ============================================

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  business_name TEXT DEFAULT 'Maison Dorée',
  phone TEXT,
  email TEXT,
  address TEXT,
  meta_pixel_id TEXT,
  tiktok_pixel_id TEXT,
  ga4_id TEXT,
  snapchat_pixel_id TEXT,
  whatsapp_number TEXT,
  whatsapp_greeting TEXT,
  whatsapp_enabled BOOLEAN DEFAULT true,
  webhook_secret TEXT,
  webhook_enabled BOOLEAN DEFAULT false,
  notification_email TEXT,
  n8n_webhook_url TEXT,
  slack_webhook_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read settings" ON site_settings;
DROP POLICY IF EXISTS "Admin update settings" ON site_settings;
CREATE POLICY "Public read settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin update settings" ON site_settings FOR UPDATE TO authenticated USING (has_admin_role());

-- ============================================
-- 11. TABLE: marketing_config
-- ============================================

CREATE TABLE IF NOT EXISTS marketing_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  meta_pixel_id TEXT,
  tiktok_pixel_id TEXT,
  snapchat_pixel_id TEXT,
  google_ads_id TEXT,
  conversions_api TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO marketing_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE marketing_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read marketing" ON marketing_config;
DROP POLICY IF EXISTS "Admin update marketing" ON marketing_config;
CREATE POLICY "Auth read marketing" ON marketing_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin update marketing" ON marketing_config FOR UPDATE TO authenticated USING (has_admin_role());

-- ============================================
-- 12. TABLE: user_cart
-- ============================================

CREATE TABLE IF NOT EXISTS user_cart (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_cart ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own cart" ON user_cart;
DROP POLICY IF EXISTS "Users write own cart" ON user_cart;
DROP POLICY IF EXISTS "Users update own cart" ON user_cart;
DROP POLICY IF EXISTS "Users delete own cart" ON user_cart;
CREATE POLICY "Users read own cart" ON user_cart FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users write own cart" ON user_cart FOR INSERT TO authenticated WITH check (user_id = auth.uid());
CREATE POLICY "Users update own cart" ON user_cart FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own cart" ON user_cart FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================
-- 13. TABLE: shipments
-- ============================================

CREATE TABLE IF NOT EXISTS shipments (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  service TEXT NOT NULL,
  tracking_number TEXT,
  status TEXT DEFAULT 'pending',
  label_url TEXT,
  cost INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read shipments" ON shipments;
DROP POLICY IF EXISTS "Admin write shipments" ON shipments;
DROP POLICY IF EXISTS "Admin update shipments" ON shipments;
CREATE POLICY "Auth read shipments" ON shipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write shipments" ON shipments FOR INSERT TO authenticated WITH check (has_admin_role());
CREATE POLICY "Admin update shipments" ON shipments FOR UPDATE TO authenticated USING (has_admin_role());

-- ============================================
-- 14. TABLE: delivery_config (LIVRAISON)
-- ============================================

CREATE TABLE IF NOT EXISTS delivery_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  services JSONB DEFAULT '{}',
  global_settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer la configuration par défaut avec les tarifs pré-configurés pour l'Algérie
INSERT INTO delivery_config (id, services, global_settings)
VALUES (1,
  '{
    "yalidine": {
      "name": "Yalidine",
      "enabled": true,
      "logo": "",
      "pricing_type": "zone",
      "flat_price": 0,
      "zones": {
        "home": {
          "label": "Domicile",
          "wilayas": {
            "16": 400, "9": 400, "35": 400, "42": 400, "44": 400,
            "2": 600, "6": 600, "15": 600, "18": 600, "21": 600, "23": 600, "24": 600, "25": 600, "27": 600, "31": 600, "34": 600, "36": 600, "43": 600, "46": 600, "48": 600,
            "3": 700, "4": 700, "5": 700, "7": 700, "10": 700, "12": 700, "14": 700, "17": 700, "19": 700, "20": 700, "22": 700, "26": 700, "28": 700, "29": 700, "38": 700, "40": 700, "41": 700, "45": 700,
            "1": 900, "8": 900, "11": 900, "13": 900, "30": 900, "32": 900, "33": 900, "37": 900, "39": 900, "47": 900, "49": 900, "50": 900, "51": 900, "52": 900, "53": 900, "54": 900, "55": 900, "56": 900, "57": 900, "58": 900
          }
        },
        "stopdesk": {
          "label": "Stop Desk",
          "wilayas": {
            "16": 200, "9": 200, "35": 200, "42": 200, "44": 200,
            "2": 300, "6": 300, "15": 300, "18": 300, "21": 300, "23": 300, "24": 300, "25": 300, "27": 300, "31": 300, "34": 300, "36": 300, "43": 300, "46": 300, "48": 300,
            "3": 350, "4": 350, "5": 350, "7": 350, "10": 350, "12": 350, "14": 350, "17": 350, "19": 350, "20": 350, "22": 350, "26": 350, "28": 350, "29": 350, "38": 350, "40": 350, "41": 350, "45": 350,
            "1": 450, "8": 450, "11": 450, "13": 450, "30": 450, "32": 450, "33": 450, "37": 450, "39": 450, "47": 450, "49": 450, "50": 450, "51": 450, "52": 450, "53": 450, "54": 450, "55": 450, "56": 450, "57": 450, "58": 450
          }
        }
      }
    },
    "maybox": {
      "name": "Maybox",
      "enabled": false,
      "logo": "",
      "pricing_type": "zone",
      "flat_price": 0,
      "zones": {
        "home": {
          "label": "Domicile",
          "wilayas": {
            "16": 350, "9": 350, "35": 350, "42": 350, "44": 350,
            "2": 550, "6": 550, "15": 550, "18": 550, "21": 550, "23": 550, "24": 550, "25": 550, "27": 550, "31": 550, "34": 550, "36": 550, "43": 550, "46": 550, "48": 550,
            "3": 650, "4": 650, "5": 650, "7": 650, "10": 650, "12": 650, "14": 650, "17": 650, "19": 650, "20": 650, "22": 650, "26": 650, "28": 650, "29": 650, "38": 650, "40": 650, "41": 650, "45": 650,
            "1": 850, "8": 850, "11": 850, "13": 850, "30": 850, "32": 850, "33": 850, "37": 850, "39": 850, "47": 850, "49": 850, "50": 850, "51": 850, "52": 850, "53": 850, "54": 850, "55": 850, "56": 850, "57": 850, "58": 850
          }
        },
        "stopdesk": {
          "label": "Stop Desk",
          "wilayas": {
            "16": 180, "9": 180, "35": 180, "42": 180, "44": 180,
            "2": 280, "6": 280, "15": 280, "18": 280, "21": 280, "23": 280, "24": 280, "25": 280, "27": 280, "31": 280, "34": 280, "36": 280, "43": 280, "46": 280, "48": 280,
            "3": 330, "4": 330, "5": 330, "7": 330, "10": 330, "12": 330, "14": 330, "17": 330, "19": 330, "20": 330, "22": 330, "26": 330, "28": 330, "29": 330, "38": 330, "40": 330, "41": 330, "45": 330,
            "1": 430, "8": 430, "11": 430, "13": 430, "30": 430, "32": 430, "33": 430, "37": 430, "39": 430, "47": 430, "49": 430, "50": 430, "51": 430, "52": 430, "53": 430, "54": 430, "55": 430, "56": 430, "57": 430, "58": 430
          }
        }
      }
    },
    "ecolog": {
      "name": "ECO LOG",
      "enabled": false,
      "logo": "",
      "pricing_type": "zone",
      "flat_price": 0,
      "zones": {
        "home": {
          "label": "Domicile",
          "wilayas": {
            "16": 380, "9": 380, "35": 380, "42": 380, "44": 380,
            "2": 580, "6": 580, "15": 580, "18": 580, "21": 580, "23": 580, "24": 580, "25": 580, "27": 580, "31": 580, "34": 580, "36": 580, "43": 580, "46": 580, "48": 580,
            "3": 680, "4": 680, "5": 680, "7": 680, "10": 680, "12": 680, "14": 680, "17": 680, "19": 680, "20": 680, "22": 680, "26": 680, "28": 680, "29": 680, "38": 680, "40": 680, "41": 680, "45": 680,
            "1": 880, "8": 880, "11": 880, "13": 880, "30": 880, "32": 880, "33": 880, "37": 880, "39": 880, "47": 880, "49": 880, "50": 880, "51": 880, "52": 880, "53": 880, "54": 880, "55": 880, "56": 880, "57": 880, "58": 880
          }
        },
        "stopdesk": {
          "label": "Stop Desk",
          "wilayas": {
            "16": 190, "9": 190, "35": 190, "42": 190, "44": 190,
            "2": 290, "6": 290, "15": 290, "18": 290, "21": 290, "23": 290, "24": 290, "25": 290, "27": 290, "31": 290, "34": 290, "36": 290, "43": 290, "46": 290, "48": 290,
            "3": 340, "4": 340, "5": 340, "7": 340, "10": 340, "12": 340, "14": 340, "17": 340, "19": 340, "20": 340, "22": 340, "26": 340, "28": 340, "29": 340, "38": 340, "40": 340, "41": 340, "45": 340,
            "1": 440, "8": 440, "11": 440, "13": 440, "30": 440, "32": 440, "33": 440, "37": 440, "39": 440, "47": 440, "49": 440, "50": 440, "51": 440, "52": 440, "53": 440, "54": 440, "55": 440, "56": 440, "57": 440, "58": 440
          }
        }
      }
    }
  }'::jsonb,
  '{
    "free_shipping_enabled": false,
    "free_shipping_min_amount": 0,
    "delivery_estimate_days": 3,
    "default_service": "yalidine"
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE delivery_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read delivery config" ON delivery_config;
DROP POLICY IF EXISTS "Admin update delivery" ON delivery_config;
DROP POLICY IF EXISTS "Admin insert delivery" ON delivery_config;
CREATE POLICY "Public read delivery config" ON delivery_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin update delivery" ON delivery_config FOR UPDATE TO authenticated USING (has_admin_role());
CREATE POLICY "Admin insert delivery" ON delivery_config FOR INSERT TO authenticated WITH check (has_admin_role());

-- ============================================
-- 15. TABLE: webhooks
-- ============================================

CREATE TABLE IF NOT EXISTS webhooks (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT,
  active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 16. TABLE: webhook_deliveries
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id BIGSERIAL PRIMARY KEY,
  webhook_id BIGINT REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read webhooks" ON webhooks;
DROP POLICY IF EXISTS "Admin write webhooks" ON webhooks;
DROP POLICY IF EXISTS "Admin update webhooks" ON webhooks;
DROP POLICY IF EXISTS "Admin delete webhooks" ON webhooks;
CREATE POLICY "Auth read webhooks" ON webhooks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write webhooks" ON webhooks FOR INSERT TO authenticated WITH check (has_admin_role());
CREATE POLICY "Admin update webhooks" ON webhooks FOR UPDATE TO authenticated USING (has_admin_role());
CREATE POLICY "Admin delete webhooks" ON webhooks FOR DELETE TO authenticated USING (has_admin_role());

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read webhook deliveries" ON webhook_deliveries;
DROP POLICY IF EXISTS "Admin write webhook deliveries" ON webhook_deliveries;
CREATE POLICY "Auth read webhook deliveries" ON webhook_deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write webhook deliveries" ON webhook_deliveries FOR INSERT TO authenticated WITH check (has_admin_role());

-- ============================================
-- 17. TABLE: payment_methods
-- ============================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'banknote',
  type TEXT DEFAULT 'offline' CHECK (type IN ('offline', 'stripe', 'paypal', 'ccp', 'baridimob', 'custom')),
  config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO payment_methods (name, slug, description, icon, type, config, enabled, sort_order) VALUES
('Paiement à la livraison', 'cod', 'Payez en espèces à la réception de votre commande', 'banknote', 'offline', '{}', true, 1),
('Carte bancaire', 'card', 'Visa, Mastercard – Bientôt disponible', 'credit-card', 'stripe', '{"stripe_enabled":false}', false, 2),
('PayPal', 'paypal', 'Bientôt disponible', 'paypal', 'paypal', '{"paypal_enabled":false}', false, 3),
('CCP / BaridiMob', 'ccp', 'Virement via CCP ou BaridiMob', 'ccp', 'ccp', '{"ccp_number":"","ccp_key":"","baridimob_number":""}', true, 4)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admin manage payment methods" ON payment_methods;
CREATE POLICY "Public read payment methods" ON payment_methods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage payment methods" ON payment_methods FOR ALL TO authenticated USING (has_admin_role());

-- ============================================
-- 18. TABLE: landing_pages
-- ============================================

CREATE TABLE IF NOT EXISTS landing_pages (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  meta_description TEXT,
  meta_title TEXT,
  is_published BOOLEAN DEFAULT false,
  is_home BOOLEAN DEFAULT false,
  sections JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Admin manage landing pages" ON landing_pages;
CREATE POLICY "Public read landing pages" ON landing_pages FOR SELECT TO anon, authenticated USING (is_published = true OR auth.uid() IS NOT NULL);
CREATE POLICY "Admin manage landing pages" ON landing_pages FOR ALL TO authenticated USING (has_write_role());

-- ============================================
-- 19. TABLE: chatbot_config
-- ============================================

CREATE TABLE IF NOT EXISTS chatbot_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  greeting TEXT DEFAULT 'Bienvenue chez Maison Dorée ! Comment puis-je vous aider ?',
  quick_actions JSONB DEFAULT '[
    {"label":"Voir les collections","action":"catalogue","response":"Découvrez notre collection complète de montres de luxe. Redirection en cours..."},
    {"label":"Passer commande","action":"commander","response":"Commandez facilement en remplissant notre formulaire. Paiement à la livraison ! Redirection en cours..."},
    {"label":"Parler à un conseiller","action":"whatsapp","response":""}
  ]'::jsonb,
  faq_items JSONB DEFAULT '[
    {"key":"livraison","label":"Livraison","icon":"truck","response":"Nous livrons dans les 58 wilayas dAlgérie. Délai de livraison : 48h dans les grandes villes, 3-5 jours pour les autres wilayas."},
    {"key":"garantie","label":"Garantie","icon":"shield","response":"Toutes nos montres bénéficient dune garantie internationale de 3 ans couvrant le mouvement et les défauts de fabrication."},
    {"key":"paiement","label":"Paiement","icon":"shopping-bag","response":"Nous proposons le paiement à la livraison (COD) sur toutes nos commandes. Aucun paiement en ligne requis."},
    {"key":"authenticite","label":"Authenticité","icon":"clock","response":"Toutes nos montres sont livrées avec un certificat dauthenticité et un numéro de série unique."}
  ]'::jsonb,
  whatsapp_message TEXT DEFAULT 'Bonjour, je suis intéressé(e) par vos montres de luxe. Puis-je avoir plus d''informations ?',
  n8n_webhook_url TEXT,
  n8n_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO chatbot_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE chatbot_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read chatbot" ON chatbot_config;
DROP POLICY IF EXISTS "Admin manage chatbot" ON chatbot_config;
CREATE POLICY "Public read chatbot" ON chatbot_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage chatbot" ON chatbot_config FOR UPDATE TO authenticated USING (has_admin_role());

-- ============================================
-- 20. TABLE: fomo_config (SOCIAL PROOF / FOMO)
-- ============================================

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
  stock_urgency_use_real BOOLEAN DEFAULT true,
  order_count_enabled BOOLEAN DEFAULT true,
  order_count_min INTEGER DEFAULT 12,
  order_count_max INTEGER DEFAULT 87,
  order_count_use_real BOOLEAN DEFAULT true,
  delivery_estimate_enabled BOOLEAN DEFAULT true,
  delivery_estimate_days INTEGER DEFAULT 2,
  trust_badges_enabled BOOLEAN DEFAULT true,
  trust_badges_items JSONB DEFAULT '[{"icon":"award","label":"Authenticité certifiée"},{"icon":"shield","label":"Garantie 3 ans"},{"icon":"truck","label":"Livraison assurée"},{"icon":"package","label":"Paiement à la livraison"}]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO fomo_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Ajout des colonnes si la table existait déjà sans elles
ALTER TABLE fomo_config ADD COLUMN IF NOT EXISTS stock_urgency_use_real BOOLEAN DEFAULT true;
ALTER TABLE fomo_config ADD COLUMN IF NOT EXISTS order_count_use_real BOOLEAN DEFAULT true;
ALTER TABLE fomo_config ADD COLUMN IF NOT EXISTS trust_badges_items JSONB DEFAULT '[{"icon":"award","label":"Authenticité certifiée"},{"icon":"shield","label":"Garantie 3 ans"},{"icon":"truck","label":"Livraison assurée"},{"icon":"package","label":"Paiement à la livraison"}]';

ALTER TABLE fomo_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read fomo" ON fomo_config;
DROP POLICY IF EXISTS "Admin manage fomo" ON fomo_config;
CREATE POLICY "Public read fomo" ON fomo_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage fomo" ON fomo_config FOR UPDATE TO authenticated USING (has_admin_role());

-- ============================================
-- 21. DONNÉES PAR DÉFAUT — Catégories
-- ============================================

INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES
('Chronographes', 'chronographes', 'Montres chronographes de précision, alliant performance et élégance', '/images/watches/chronograph-or.jpg', 1),
('Automatiques', 'automatiques', 'Montres automatiques au mouvement visible, l''art de l''horlogerie traditionnelle', '/images/watches/automatique-acier.jpg', 2),
('Montres Diamant', 'montres-diamant', 'Montres sertis de diamants, l''éclat du luxe au poignet', '/images/watches/diamant-rose.jpg', 3),
('Classiques', 'classiques', 'Montres classiques en cuir, le raffinement intemporel', '/images/watches/classique-cuir.jpg', 4),
('Plongée', 'plongee', 'Montres de plongée robustes et étanches, l''aventure au poignet', '/images/watches/plongeur-noir.jpg', 5),
('Squelette', 'squelette', 'Montres squelette et tourbillon, la mécanique révélée', '/images/watches/squelette-tourbillon.jpg', 6)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 22. DONNÉES PAR DÉFAUT — Produits
-- ============================================

INSERT INTO products (name, category, price, image_url, badge, description, specs, attributes, available, gender) VALUES
('Royal Chronographe Or', 'Chronographes', 285000, '/images/watches/chronograph-or.jpg', 'Bestseller',
 'Un chronographe en or 18 carats, mouvement suisse certifié, boîtier 42mm avec lunette polie.',
 ARRAY['Mouvement Suisse Certifié','Or 18 Carats','Boîtier 42mm','Étanche 100m','Verre Saphir Anti-Reflet'],
 '[{"name":"Bracelet","values":["Or Massif","Cuir Alligator","Acier Doré"]},{"name":"Cadran","values":["Noir","Blanc","Champagne"]}]'::jsonb,
 true, 'Homme'),
('Suisse Automatique Acier', 'Automatiques', 195000, '/images/watches/automatique-acier.jpg', 'Nouveau',
 'Mouvement automatique visible à travers le fond saphir, acier inoxydable 316L.',
 ARRAY['Mouvement Automatique','Acier 316L','Réserve 72h','Fond Saphir','Étanche 50m'],
 '[{"name":"Bracelet","values":["Acier","Cuir Cuir"]},{"name":"Cadran","values":["Argent","Bleu","Noir"]}]'::jsonb,
 true, 'Homme'),
('Éclat Diamant Rose', 'Montres Diamant', 345000, '/images/watches/diamant-rose.jpg', 'Premium',
 'Montre dame en or rose sertie de 48 diamants VS1, cadran nacre, bracelet cuir d''agneau.',
 ARRAY['48 Diamants VS1','Or Rose 18K','Cadran Nacre','Bracelet Agneau','Verre Saphir'],
 '[{"name":"Taille","values":["32mm","36mm"]},{"name":"Cadran","values":["Nacre","Mère-de-Perl"]}]'::jsonb,
 true, 'Femme'),
('Héritage Classique Cuir', 'Classiques', 145000, '/images/watches/classique-cuir.jpg', NULL,
 'Montre habille avec mouvement mécanique, cadran crème, bracelet cuir d''alligator véritable.',
 ARRAY['Mouvement Mécanique','Bracelet Alligator','Cadran Crème','Boîtier 38mm','Étanche 30m'],
 '[{"name":"Bracelet","values":["Alligator Noir","Alligator Marron"]},{"name":"Boîtier","values":["Acier","Or Rose"]}]'::jsonb,
 true, 'Homme'),
('Abyss Plongeur Noir', 'Plongée', 175000, '/images/watches/plongeur-noir.jpg', 'Sport',
 'Montre de plongée professionnelle, lunette tournante unidirectionnelle, étanche 300m.',
 ARRAY['Étanche 300m','Lunette Unidirectionnelle','SuperLuminova','Boîtier 44mm','Acier 316L'],
 '[{"name":"Cadran","values":["Noir","Bleu","Vert"]},{"name":"Bracelet","values":["Acier","Caoutchouc","NATO"]}]'::jsonb,
 true, 'Homme'),
('Grand Squelette Tourbillon', 'Squelette', 520000, '/images/watches/squelette-tourbillon.jpg', 'Édition Limitée',
 'Chef-d''oeuvre horloger avec tourbillon visible, ponts gravés à la main, boîtier en titane 18K.',
 ARRAY['Tourbillon Visible','Titane Grade 5','Ponts Gravés Main','Réserve 96h','Série Limitée 50'],
 '[{"name":"Finition","values":["Titane Brossé","Titane Polé"]}]'::jsonb,
 true, 'Homme'),
('Smart Luxe Hybride', 'Automatiques', 125000, '/images/watches/smartwatch-hybride.jpg', 'Connecté',
 'Montre hybride connectée, mouvement automatique avec tracker d''activité, notifications discrètes.',
 ARRAY['Mouvement Automatique','Connecté Bluetooth','Autonomie 6 mois','Étanche 50m','Tracker Activité'],
 '[{"name":"Bracelet","values":["Acier","Cuir","Silicone"]}]'::jsonb,
 true, 'Mixte'),
('Chronographe Sport Or Rose', 'Chronographes', 235000, '/images/watches/chronograph-or.jpg', NULL,
 'Chronographe sportif en acier PVD or rose, tachymètre, sous-cadran 30 minutes.',
 ARRAY['PVD Or Rose','Tachymètre','Boîtier 40mm','Étanche 100m','Verre Saphir'],
 '[{"name":"Bracelet","values":["Acier PVD Or Rose","Cuir Carbonne"]},{"name":"Cadran","values":["Noir","Blanc","Bleu"]}]'::jsonb,
 true, 'Mixte')
ON CONFLICT DO NOTHING;

-- ============================================
-- 23. DONNÉES PAR DÉFAUT — Réalisations
-- ============================================

INSERT INTO projects (name, location, image_url, badge, description, specs, sort_order) VALUES
('Collection Royale 2025', 'Genève, Suisse', '/images/watches/showroom-interior.jpg', 'Lancé',
 'Présentation de la collection royale 2025 lors du salon horloger de Genève.',
 ARRAY['8 Nouvelles Pièces','Présentation Salon Genève','Édition Limitée'], 1),
('Boutique Alger Centre', 'Alger, Algérie', '/images/watches/showroom-interior.jpg', 'Inauguré',
 'Inauguration de notre flagship store au cœur d''Alger, un espace dédié à l''art horloger.',
 ARRAY['Flagship Store','Service Premium','Espace VIP'], 2),
('Partenariat Swiss Movement', 'La Chaux-de-Fonds', '/images/watches/automatique-acier.jpg', 'Partenariat',
 'Signature d''un partenariat exclusif avec un manufacture suisse pour des mouvements certifiés.',
 ARRAY['Mouvements Certifiés','Exclusivité','Qualité Suisse'], 3)
ON CONFLICT DO NOTHING;

-- ============================================
-- 24. DONNÉES PAR DÉFAUT — Landing Page
-- ============================================

INSERT INTO landing_pages (title, slug, meta_description, is_published, sections) VALUES
('Collection Printemps 2025', 'collection-printemps', 'Découvrez la nouvelle collection de montres de luxe Maison Dorée', true,
'[{"type":"hero","content":{"title":"Nouvelle Collection Printemps 2025","subtitle":"L élégance au poignet","image":"/images/watches/brand-hero.jpg","cta_text":"Découvrir","cta_link":"/catalogue","alignment":"center"}},{"type":"products","content":{"title":"Sélection de la Saison","subtitle":"Nos pièces phares","product_ids":[],"max_products":4}},{"type":"text","content":{"title":"L Art Horloger","text":"Chaque montre Maison Dorée est le fruit d un savoir-faire artisanal transmis de génération en génération.","alignment":"center"}},{"type":"cta","content":{"title":"Prêt à découvrir votre montre ?","button_text":"Voir la Collection","button_link":"/catalogue","style":"gold"}}]'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- FIN — Toutes les tables sont créées !
-- ============================================
