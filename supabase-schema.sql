-- ============================================
-- MAISON DORÉE - Horlogerie de Luxe
-- Complete Database Schema
-- ============================================

-- User roles table (for role-based access)
CREATE TABLE IF NOT EXISTS user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'editeur', 'lecteur')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Products table
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

-- Add gender column to existing products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Mixte' CHECK (gender IN ('Homme', 'Femme', 'Mixte'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_price INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER;

-- Create index on slug for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON products (slug) WHERE slug IS NOT NULL;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  wilaya TEXT,
  commune TEXT,
  product TEXT,
  product_id BIGINT REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Nouveau' CHECK (status IN ('Nouveau','Appelé','Confirmé','Expédié','En transit','Livré','Retourné','Annulé')),
  notes TEXT,
  source TEXT DEFAULT 'website',
  total INTEGER,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects (Réalisations) table
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

-- Showroom config table
CREATE TABLE IF NOT EXISTS showroom_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  walls_config JSONB DEFAULT '[]',
  room_config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees table  
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  login_id TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'confirmation' CHECK (role IN ('confirmation', 'livraison', 'superviseur')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
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

-- Marketing config table
CREATE TABLE IF NOT EXISTS marketing_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  meta_pixel_id TEXT,
  tiktok_pixel_id TEXT,
  snapchat_pixel_id TEXT,
  google_ads_id TEXT,
  conversions_api TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User cart table
CREATE TABLE IF NOT EXISTS user_cart (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Shipments table
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

-- Delivery services config
CREATE TABLE IF NOT EXISTS delivery_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  services JSONB DEFAULT '{}',
  global_settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook registrations
CREATE TABLE IF NOT EXISTS webhooks (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT,
  active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id BIGSERIAL PRIMARY KEY,
  webhook_id BIGINT REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEFAULT DATA — Horlogerie de Luxe
-- ============================================

-- Insert showroom config
INSERT INTO showroom_config (id, walls_config, room_config) VALUES (1, '[]', '{}')
ON CONFLICT (id) DO NOTHING;

-- Insert site settings
INSERT INTO site_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Insert marketing config
INSERT INTO marketing_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Insert delivery config
INSERT INTO delivery_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ─── Catégories de Montres ────────────────────────────

INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES
('Chronographes', 'chronographes', 'Montres chronographes de précision, alliant performance et élégance', '/images/watches/chronograph-or.jpg', 1),
('Automatiques', 'automatiques', 'Montres automatiques au mouvement visible, l''art de l''horlogerie traditionnelle', '/images/watches/automatique-acier.jpg', 2),
('Montres Diamant', 'montres-diamant', 'Montres sertis de diamants, l''éclat du luxe au poignet', '/images/watches/diamant-rose.jpg', 3),
('Classiques', 'classiques', 'Montres classiques en cuir, le raffinement intemporel', '/images/watches/classique-cuir.jpg', 4),
('Plongée', 'plongee', 'Montres de plongée robustes et étanches, l''aventure au poignet', '/images/watches/plongeur-noir.jpg', 5),
('Squelette', 'squelette', 'Montres squelette et tourbillon, la mécanique révélée', '/images/watches/squelette-tourbillon.jpg', 6)
ON CONFLICT (name) DO NOTHING;

-- ─── Produits Vedettes ────────────────────────────────

INSERT INTO products (name, category, price, image_url, badge, description, specs, attributes, available, gender) VALUES
('Royal Chronographe Or', 'Chronographes', 285000, '/images/watches/chronograph-or.jpg', 'Bestseller',
 'Un chronographe en or 18 carats, mouvement suisse certifié, boîtier 42mm avec lunette polie. Le summum du luxe horloger.',
 ARRAY['Mouvement Suisse Certifié','Or 18 Carats','Boîtier 42mm','Étanche 100m','Verre Saphir Anti-Reflet'],
 '[{"name":"Bracelet","values":["Or Massif","Cuir Alligator","Acier Doré"]},{"name":"Cadran","values":["Noir","Blanc","Champagne"]}]'::jsonb,
 true, 'Homme'),

('Suisse Automatique Acier', 'Automatiques', 195000, '/images/watches/automatique-acier.jpg', 'Nouveau',
 'Mouvement automatique visible à travers le fond saphir, acier inoxydable 316L, finition polie et brossée.',
 ARRAY['Mouvement Automatique','Acier 316L','Réserve 72h','Fond Saphir','Étanche 50m'],
 '[{"name":"Bracelet","values":["Acier","Cuir Cuir"]},{"name":"Cadran","values":["Argent","Bleu","Noir"]}]'::jsonb,
 true, 'Homme'),

('Éclat Diamant Rose', 'Montres Diamant', 345000, '/images/watches/diamant-rose.jpg', 'Premium',
 'Montre dame en or rose sertie de 48 diamants VS1, cadran nacre, bracelet cuir d''agneau. L''élégance absolue.',
 ARRAY['48 Diamants VS1','Or Rose 18K','Cadran Nacre','Bracelet Agneau','Verre Saphir'],
 '[{"name":"Taille","values":["32mm","36mm"]},{"name":"Cadran","values":["Nacre","Mère-de-Perl"]}]'::jsonb,
 true, 'Femme'),

('Héritage Classique Cuir', 'Classiques', 145000, '/images/watches/classique-cuir.jpg', NULL,
 'Montre habille avec mouvement mécanique, cadran crème, bracelet cuir d''alligator véritable. Le classicisme incarné.',
 ARRAY['Mouvement Mécanique','Bracelet Alligator','Cadran Crème','Boîtier 38mm','Étanche 30m'],
 '[{"name":"Bracelet","values":["Alligator Noir","Alligator Marron"]},{"name":"Boîtier","values":["Acier","Or Rose"]}]'::jsonb,
 true, 'Homme'),

('Abyss Plongeur Noir', 'Plongée', 175000, '/images/watches/plongeur-noir.jpg', 'Sport',
 'Montre de plongée professionnelle, lunette tournante unidirectionnelle, étanche 300m, luminescence SuperLuminova.',
 ARRAY['Étanche 300m','Lunette Unidirectionnelle','SuperLuminova','Boîtier 44mm','Acier 316L'],
 '[{"name":"Cadran","values":["Noir","Bleu","Vert"]},{"name":"Bracelet","values":["Acier","Caoutchouc","NATO"]}]'::jsonb,
 true, 'Homme'),

('Grand Squelette Tourbillon', 'Squelette', 520000, '/images/watches/squelette-tourbillon.jpg', 'Édition Limitée',
 'Chef-d''oeuvre horloger avec tourbillon visible, ponts gravés à la main, boîtier en titane 18K. Pièce de collection.',
 ARRAY['Tourbillon Visible','Titane Grade 5','Ponts Gravés Main','Réserve 96h','Série Limitée 50'],
 '[{"name":"Finition","values":["Titane Brossé","Titane Polé"]}]'::jsonb,
 true, 'Homme'),

('Smart Luxe Hybride', 'Automatiques', 125000, '/images/watches/smartwatch-hybride.jpg', 'Connecté',
 'Montre hybride connectée, mouvement automatique avec tracker d''activité, notifications discrètes. La modernité sans compromis.',
 ARRAY['Mouvement Automatique','Connecté Bluetooth','Autonomie 6 mois','Étanche 50m','Tracker Activité'],
 '[{"name":"Bracelet","values":["Acier","Cuir","Silicone"]}]'::jsonb,
 true, 'Mixte'),

('Chronographe Sport Or Rose', 'Chronographes', 235000, '/images/watches/chronograph-or.jpg', NULL,
 'Chronographe sportif en acier PVD or rose, tachymètre, sous-cadran 30 minutes. L''équilibre parfait entre sport et luxe.',
 ARRAY['PVD Or Rose','Tachymètre','Boîtier 40mm','Étanche 100m','Verre Saphir'],
 '[{"name":"Bracelet","values":["Acier PVD Or Rose","Cuir Carbonne"]},{"name":"Cadran","values":["Noir","Blanc","Bleu"]}]'::jsonb,
 true, 'Mixte')
ON CONFLICT DO NOTHING;

-- ─── Réalisations ─────────────────────────────────────

INSERT INTO projects (name, location, image_url, badge, description, specs, sort_order) VALUES
('Collection Royale 2025', 'Genève, Suisse', '/images/watches/showroom-interior.jpg', 'Lancé',
 'Présentation de la collection royale 2025 lors du salon horloger de Genève. Une collection qui redéfinit les standards du luxe.',
 ARRAY['8 Nouvelles Pièces','Présentation Salon Genève','Édition Limitée'], 1),

('Boutique Alger Centre', 'Alger, Algérie', '/images/watches/showroom-interior.jpg', 'Inauguré',
 'Inauguration de notre flagship store au cœur d''Alger, un espace dédié à l''art horloger avec service après-vente premium.',
 ARRAY['Flagship Store','Service Premium','Espace VIP'], 2),

('Partenariat Swiss Movement', 'La Chaux-de-Fonds', '/images/watches/automatique-acier.jpg', 'Partenariat',
 'Signature d''un partenariat exclusif avec un manufacture suisse pour des mouvements certifiés dans nos collections.',
 ARRAY['Mouvements Certifiés','Exclusivité','Qualité Suisse'], 3)
ON CONFLICT DO NOTHING;

-- ─── Showroom Config ──────────────────────────────────

INSERT INTO showroom_config (id, walls_config, room_config) VALUES (1,
'[{"image":"/images/watches/chronograph-or.jpg","label":"Chronographes","destination":"chronographes"},{"image":"/images/watches/automatique-acier.jpg","label":"Automatiques","destination":"automatiques"},{"image":"/images/watches/diamant-rose.jpg","label":"Diamant","destination":"montres-diamant"},{"image":"/images/watches/classique-cuir.jpg","label":"Classiques","destination":"classiques"},{"image":"/images/watches/plongeur-noir.jpg","label":"Plongée","destination":"plongee"},{"image":"/images/watches/squelette-tourbillon.jpg","label":"Squelette","destination":"squelette"}]'::jsonb,
'{"speed":0.004,"autoRotate":0.0003,"radius":5.2,"floorImage":"","ceilingImage":""}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  walls_config = EXCLUDED.walls_config,
  room_config = EXCLUDED.room_config;

-- Payment methods configuration
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

-- Default payment methods
INSERT INTO payment_methods (name, slug, description, icon, type, config, enabled, sort_order) VALUES
('Paiement à la livraison', 'cod', 'Payez en espèces à la réception de votre commande', 'banknote', 'offline', '{}', true, 1),
('Carte bancaire', 'card', 'Visa, Mastercard – Bientôt disponible', 'credit-card', 'stripe', '{"stripe_enabled":false}', false, 2),
('PayPal', 'paypal', 'Bientôt disponible', 'paypal', 'paypal', '{"paypal_enabled":false}', false, 3),
('CCP / BaridiMob', 'ccp', 'Virement via CCP ou BaridiMob', 'ccp', 'ccp', '{"ccp_number":"","ccp_key":"","baridimob_number":""}', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Landing pages
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

-- Default landing page
INSERT INTO landing_pages (title, slug, meta_description, is_published, sections) VALUES
('Collection Printemps 2025', 'collection-printemps', 'Découvrez la nouvelle collection de montres de luxe Maison Dorée', true,
'[{"type":"hero","content":{"title":"Nouvelle Collection Printemps 2025","subtitle":"L élégance au poignet","image":"/images/watches/brand-hero.jpg","cta_text":"Découvrir","cta_link":"/catalogue","alignment":"center"}},{"type":"products","content":{"title":"Sélection de la Saison","subtitle":"Nos pièces phares","product_ids":[],"max_products":4}},{"type":"text","content":{"title":"L Art Horloger","text":"Chaque montre Maison Dorée est le fruit d un savoir-faire artisanal transmis de génération en génération. Nos horlogers suisses sélectionnent les meilleurs matériaux pour créer des pièces uniques.","alignment":"center"}},{"type":"cta","content":{"title":"Prêt à découvrir votre montre ?","button_text":"Voir la Collection","button_link":"/catalogue","style":"gold"}}]'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Chatbot configuration
CREATE TABLE IF NOT EXISTS chatbot_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  greeting TEXT DEFAULT 'Bienvenue chez Maison Dorée ! 👋 Comment puis-je vous aider ?',
  quick_actions JSONB DEFAULT '[
    {"label":"Voir les collections","action":"catalogue","response":"Découvrez notre collection complète de montres de luxe. Redirection en cours..."},
    {"label":"Passer commande","action":"commander","response":"Commandez facilement en remplissant notre formulaire. Paiement à la livraison ! Redirection en cours..."},
    {"label":"Parler à un conseiller","action":"whatsapp","response":""}
  ]'::jsonb,
  faq_items JSONB DEFAULT '[
    {"key":"livraison","label":"Livraison","icon":"truck","response":"📦 Nous livrons dans les 58 wilayas d''Algérie. Délai de livraison : 48h dans les grandes villes, 3-5 jours pour les autres wilayas. Chaque montre est expédiée dans un écrin de luxe avec assurance transport."},
    {"key":"garantie","label":"Garantie","icon":"shield","response":"🛡️ Toutes nos montres bénéficient d''une garantie internationale de 3 ans couvrant le mouvement et les défauts de fabrication. Les montres avec tourbillon bénéficient d''une garantie étendue de 5 ans."},
    {"key":"paiement","label":"Paiement","icon":"shopping-bag","response":"💳 Nous proposons le paiement à la livraison (COD) sur toutes nos commandes. Aucun paiement en ligne requis. Vous pouvez inspecter votre montre avant de payer."},
    {"key":"authenticite","label":"Authenticité","icon":"clock","response":"✅ Toutes nos montres sont livrées avec un certificat d''authenticité et un numéro de série unique. Nous travaillons exclusivement avec des fournisseurs agréés et des manufactures certifiées."}
  ]'::jsonb,
  whatsapp_message TEXT DEFAULT 'Bonjour, je suis intéressé(e) par vos montres de luxe. Puis-je avoir plus d''informations ?',
  n8n_webhook_url TEXT,
  n8n_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO chatbot_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE showroom_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_config ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC READ POLICIES (site visitors can read)
-- ============================================

DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Public read categories" ON categories;
DROP POLICY IF EXISTS "Public read projects" ON projects;
DROP POLICY IF EXISTS "Public read showroom" ON showroom_config;
DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Public read settings" ON site_settings;

CREATE POLICY "Public read products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read projects" ON projects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read showroom" ON showroom_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert orders" ON orders FOR INSERT TO anon, authenticated WITH check (true);
CREATE POLICY "Public read settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);

-- Payment methods: public read, admin manage
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admin manage payment methods" ON payment_methods;

CREATE POLICY "Public read payment methods" ON payment_methods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage payment methods" ON payment_methods FOR ALL TO authenticated USING (has_admin_role());

-- Chatbot config: public read, admin update
DROP POLICY IF EXISTS "Public read chatbot" ON chatbot_config;
DROP POLICY IF EXISTS "Admin manage chatbot" ON chatbot_config;

CREATE POLICY "Public read chatbot" ON chatbot_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage chatbot" ON chatbot_config FOR UPDATE TO authenticated USING (has_admin_role());

-- ============================================
-- ADMIN WRITE POLICIES (super_admin + admin + editeur)
-- ============================================

-- Helper: check if user has write role
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

-- Products: write for editors+
DROP POLICY IF EXISTS "Editors write products" ON products;
DROP POLICY IF EXISTS "Editors update products" ON products;
DROP POLICY IF EXISTS "Editors delete products" ON products;

CREATE POLICY "Editors write products" ON products FOR INSERT TO authenticated WITH check (has_write_role());
CREATE POLICY "Editors update products" ON products FOR UPDATE TO authenticated USING (has_write_role());
CREATE POLICY "Editors delete products" ON products FOR DELETE TO authenticated USING (has_write_role());

-- Categories: write for editors+
DROP POLICY IF EXISTS "Editors write categories" ON categories;
DROP POLICY IF EXISTS "Editors update categories" ON categories;
DROP POLICY IF EXISTS "Editors delete categories" ON categories;

CREATE POLICY "Editors write categories" ON categories FOR INSERT TO authenticated WITH check (has_write_role());
CREATE POLICY "Editors update categories" ON categories FOR UPDATE TO authenticated USING (has_write_role());
CREATE POLICY "Editors delete categories" ON categories FOR DELETE TO authenticated USING (has_write_role());

-- Orders: read/update for admin+
DROP POLICY IF EXISTS "Auth read orders" ON orders;
DROP POLICY IF EXISTS "Admin update orders" ON orders;
DROP POLICY IF EXISTS "Admin delete orders" ON orders;

CREATE POLICY "Auth read orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin update orders" ON orders FOR UPDATE TO authenticated USING (has_admin_role());
CREATE POLICY "Admin delete orders" ON orders FOR DELETE TO authenticated USING (has_admin_role());

-- Projects: write for editors+
DROP POLICY IF EXISTS "Editors write projects" ON projects;
DROP POLICY IF EXISTS "Editors update projects" ON projects;
DROP POLICY IF EXISTS "Editors delete projects" ON projects;

CREATE POLICY "Editors write projects" ON projects FOR INSERT TO authenticated WITH check (has_write_role());
CREATE POLICY "Editors update projects" ON projects FOR UPDATE TO authenticated USING (has_write_role());
CREATE POLICY "Editors delete projects" ON projects FOR DELETE TO authenticated USING (has_write_role());

-- Showroom: write for editors+
DROP POLICY IF EXISTS "Editors write showroom" ON showroom_config;

CREATE POLICY "Editors write showroom" ON showroom_config FOR UPDATE TO authenticated USING (has_write_role());

-- Employees: admin only
DROP POLICY IF EXISTS "Auth read employees" ON employees;
DROP POLICY IF EXISTS "Admin write employees" ON employees;
DROP POLICY IF EXISTS "Admin update employees" ON employees;
DROP POLICY IF EXISTS "Admin delete employees" ON employees;

CREATE POLICY "Auth read employees" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write employees" ON employees FOR INSERT TO authenticated WITH check (has_admin_role());
CREATE POLICY "Admin update employees" ON employees FOR UPDATE TO authenticated USING (has_admin_role());
CREATE POLICY "Admin delete employees" ON employees FOR DELETE TO authenticated USING (has_admin_role());

-- Activity log
DROP POLICY IF EXISTS "Auth read activity" ON activity_log;
DROP POLICY IF EXISTS "Auth insert activity" ON activity_log;

CREATE POLICY "Auth read activity" ON activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert activity" ON activity_log FOR INSERT TO authenticated WITH check (true);

-- Settings: admin only
DROP POLICY IF EXISTS "Admin update settings" ON site_settings;

CREATE POLICY "Admin update settings" ON site_settings FOR UPDATE TO authenticated USING (has_admin_role());

-- Marketing: admin only
DROP POLICY IF EXISTS "Auth read marketing" ON marketing_config;
DROP POLICY IF EXISTS "Admin update marketing" ON marketing_config;

CREATE POLICY "Auth read marketing" ON marketing_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin update marketing" ON marketing_config FOR UPDATE TO authenticated USING (has_admin_role());

-- User roles: super_admin only manages roles
DROP POLICY IF EXISTS "Auth read roles" ON user_roles;
DROP POLICY IF EXISTS "Super admin insert roles" ON user_roles;
DROP POLICY IF EXISTS "Super admin update roles" ON user_roles;
DROP POLICY IF EXISTS "Super admin delete roles" ON user_roles;

CREATE POLICY "Auth read roles" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin insert roles" ON user_roles FOR INSERT TO authenticated WITH check (is_super_admin());
CREATE POLICY "Super admin update roles" ON user_roles FOR UPDATE TO authenticated USING (is_super_admin());
CREATE POLICY "Super admin delete roles" ON user_roles FOR DELETE TO authenticated USING (is_super_admin());

-- Shipments
DROP POLICY IF EXISTS "Auth read shipments" ON shipments;
DROP POLICY IF EXISTS "Admin write shipments" ON shipments;
DROP POLICY IF EXISTS "Admin update shipments" ON shipments;

CREATE POLICY "Auth read shipments" ON shipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write shipments" ON shipments FOR INSERT TO authenticated WITH check (has_admin_role());
CREATE POLICY "Admin update shipments" ON shipments FOR UPDATE TO authenticated USING (has_admin_role());

-- Delivery config
DROP POLICY IF EXISTS "Auth read delivery" ON delivery_config;
DROP POLICY IF EXISTS "Admin update delivery" ON delivery_config;

CREATE POLICY "Auth read delivery" ON delivery_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin update delivery" ON delivery_config FOR UPDATE TO authenticated USING (has_admin_role());

-- User cart: users can only read/write their own cart
DROP POLICY IF EXISTS "Users read own cart" ON user_cart;
DROP POLICY IF EXISTS "Users write own cart" ON user_cart;
DROP POLICY IF EXISTS "Users update own cart" ON user_cart;
DROP POLICY IF EXISTS "Users delete own cart" ON user_cart;

CREATE POLICY "Users read own cart" ON user_cart FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users write own cart" ON user_cart FOR INSERT TO authenticated WITH check (user_id = auth.uid());
CREATE POLICY "Users update own cart" ON user_cart FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own cart" ON user_cart FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Webhooks: admin only
DROP POLICY IF EXISTS "Auth read webhooks" ON webhooks;
DROP POLICY IF EXISTS "Admin write webhooks" ON webhooks;
DROP POLICY IF EXISTS "Admin update webhooks" ON webhooks;
DROP POLICY IF EXISTS "Admin delete webhooks" ON webhooks;

CREATE POLICY "Auth read webhooks" ON webhooks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write webhooks" ON webhooks FOR INSERT TO authenticated WITH check (has_admin_role());
CREATE POLICY "Admin update webhooks" ON webhooks FOR UPDATE TO authenticated USING (has_admin_role());
CREATE POLICY "Admin delete webhooks" ON webhooks FOR DELETE TO authenticated USING (has_admin_role());

-- Webhook deliveries: admin only
DROP POLICY IF EXISTS "Auth read webhook deliveries" ON webhook_deliveries;
DROP POLICY IF EXISTS "Admin write webhook deliveries" ON webhook_deliveries;

CREATE POLICY "Auth read webhook deliveries" ON webhook_deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write webhook deliveries" ON webhook_deliveries FOR INSERT TO authenticated WITH check (has_admin_role());

-- Landing pages: public read published, admin manage
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Admin manage landing pages" ON landing_pages;

CREATE POLICY "Public read landing pages" ON landing_pages FOR SELECT TO anon, authenticated USING (is_published = true OR auth.uid() IS NOT NULL);
CREATE POLICY "Admin manage landing pages" ON landing_pages FOR ALL TO authenticated USING (has_write_role());

-- FOMO / Social Proof configuration
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

ALTER TABLE fomo_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read fomo" ON fomo_config;
CREATE POLICY "Public read fomo" ON fomo_config FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin manage fomo" ON fomo_config;
CREATE POLICY "Admin manage fomo" ON fomo_config FOR UPDATE TO authenticated USING (has_admin_role());

-- ============================================
-- STORAGE POLICIES (bucket: "images")
-- ============================================
-- Run this in Supabase SQL Editor AFTER creating the "images" bucket manually:
-- CREATE POLICY "Public view images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'images');
-- CREATE POLICY "Editors upload images" ON storage.objects FOR INSERT TO authenticated WITH check (bucket_id = 'images' AND has_write_role());
-- CREATE POLICY "Editors delete images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'images' AND has_write_role());
-- CREATE POLICY "Editors update images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'images' AND has_write_role());

-- Add images column for multi-image gallery support
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Add real data support to FOMO config
ALTER TABLE fomo_config ADD COLUMN IF NOT EXISTS stock_urgency_use_real BOOLEAN DEFAULT true;
ALTER TABLE fomo_config ADD COLUMN IF NOT EXISTS order_count_use_real BOOLEAN DEFAULT true;

-- Add customizable trust badges to FOMO config
ALTER TABLE fomo_config ADD COLUMN IF NOT EXISTS trust_badges_items JSONB DEFAULT '[{"icon":"award","label":"Authenticité certifiée"},{"icon":"shield","label":"Garantie 3 ans"},{"icon":"truck","label":"Livraison assurée"},{"icon":"package","label":"Paiement à la livraison"}]';
