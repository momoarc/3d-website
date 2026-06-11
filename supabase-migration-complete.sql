-- ============================================================
-- Maison Dorée — Migration Supabase Complète
-- Exécutez ce script dans le Supabase SQL Editor
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Table : delivery_config
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  services JSONB DEFAULT '{}',
  global_settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer la configuration par défaut avec tarifs Algérie
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

-- RLS pour delivery_config
ALTER TABLE delivery_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read delivery config" ON delivery_config;
CREATE POLICY "Public read delivery config" ON delivery_config FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin update delivery" ON delivery_config;
DROP POLICY IF EXISTS "Admin insert delivery" ON delivery_config;
CREATE POLICY "Admin update delivery" ON delivery_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin insert delivery" ON delivery_config FOR INSERT TO authenticated WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────
-- 2. Table : orders
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  wilaya TEXT,
  commune TEXT,
  product TEXT,
  product_id INTEGER,
  quantity INTEGER DEFAULT 1,
  total INTEGER,
  status TEXT DEFAULT 'pending',
  notes TEXT DEFAULT '',
  source TEXT DEFAULT 'direct_order',
  delivery_service TEXT DEFAULT '',
  delivery_price INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Admin read orders" ON orders;
DROP POLICY IF EXISTS "Admin update orders" ON orders;
CREATE POLICY "Public insert orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin read orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin update orders" ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────
-- 3. Table : fomo_config
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fomo_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  recent_purchases_enabled BOOLEAN DEFAULT true,
  recent_purchases_interval INTEGER DEFAULT 20,
  recent_purchases_names JSONB DEFAULT '["Karim","Amina","Yacine","Sara","Mohamed","Leila","Omar","Nadia","Rami","Ines","Sofiane","Meriem"]',
  recent_purchases_wilayas JSONB DEFAULT '["Alger","Oran","Constantine","Annaba","Setif","Blida","Tlemcen","Batna","Bejaia","Tizi Ouzou"]',
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
  trust_badges_items JSONB DEFAULT '[{"icon":"award","label":"Authenticite certifiee"},{"icon":"shield","label":"Garantie 3 ans"},{"icon":"truck","label":"Livraison assuree"},{"icon":"package","label":"Paiement a la livraison"}]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer la config FOMO par défaut
INSERT INTO fomo_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS pour fomo_config
ALTER TABLE fomo_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read fomo config" ON fomo_config;
DROP POLICY IF EXISTS "Admin update fomo" ON fomo_config;
CREATE POLICY "Public read fomo config" ON fomo_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin update fomo" ON fomo_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin insert fomo" ON fomo_config FOR INSERT TO authenticated WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────
-- 4. Table : user_roles
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'lecteur',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par user_id
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- S'assurer qu'un utilisateur n'a qu'un seul rôle
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique_user ON user_roles(user_id);

-- RLS pour user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own role" ON user_roles;
DROP POLICY IF EXISTS "Admin read roles" ON user_roles;
DROP POLICY IF EXISTS "Admin manage roles" ON user_roles;
CREATE POLICY "Users read own role" ON user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin read roles" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage roles" ON user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────
-- 5. Table : categories
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON categories;
DROP POLICY IF EXISTS "Admin manage categories" ON categories;
CREATE POLICY "Public read categories" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────
-- 6. Table : products
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  compare_price INTEGER,
  image_url TEXT,
  images JSONB DEFAULT '[]',
  category TEXT,
  badge TEXT,
  gender TEXT DEFAULT 'Mixte',
  available BOOLEAN DEFAULT true,
  stock INTEGER,
  attributes JSONB DEFAULT '[]',
  specs JSONB DEFAULT '[]',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Admin manage products" ON products;
CREATE POLICY "Public read products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────
-- 7. Table : settings
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  site_name TEXT DEFAULT 'Maison Dorée',
  site_description TEXT DEFAULT '',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#c9a84c',
  whatsapp_number TEXT,
  phone_number TEXT,
  email TEXT,
  address TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read settings" ON settings;
DROP POLICY IF EXISTS "Admin manage settings" ON settings;
CREATE POLICY "Public read settings" ON settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage settings" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────
-- 8. Table : landing_pages
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS landing_pages (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  headline TEXT,
  subheadline TEXT,
  hero_image_url TEXT,
  cta_text TEXT DEFAULT 'Commander',
  cta_link TEXT DEFAULT '/catalogue',
  products JSONB DEFAULT '[]',
  fomo_config JSONB DEFAULT '{}',
  theme JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Admin manage landing pages" ON landing_pages;
CREATE POLICY "Public read landing pages" ON landing_pages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage landing pages" ON landing_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────
-- 9. Table : webhook_deliveries (logs)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read webhook deliveries" ON webhook_deliveries;
CREATE POLICY "Admin read webhook deliveries" ON webhook_deliveries FOR SELECT TO authenticated USING (true);


-- ──────────────────────────────────────────────────────────────
-- 10. Table : payment_methods
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admin manage payment methods" ON payment_methods;
CREATE POLICY "Public read payment methods" ON payment_methods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage payment methods" ON payment_methods FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────
-- 11. Configuration du rôle admin
-- ──────────────────────────────────────────────────────────────
-- IMPORTANT : Remplacez VOTRE_USER_ID par l'ID de votre utilisateur Supabase
-- Vous pouvez trouver votre user_id dans Authentication > Users dans le dashboard Supabase
-- Ou exécutez d'abord : SELECT auth.uid(); quand vous êtes connecté

-- Exemple (décommentez et remplacez VOTRE_USER_ID) :
-- INSERT INTO user_roles (user_id, role) VALUES ('VOTRE_USER_ID', 'super_admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Alternative : définir le rôle dans app_metadata (plus fiable)
-- UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}' WHERE id = 'VOTRE_USER_ID';


-- ──────────────────────────────────────────────────────────────
-- FIN DE LA MIGRATION
-- ──────────────────────────────────────────────────────────────
