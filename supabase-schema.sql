-- ==============================================================================
-- LAS 3YR - DONDE ENITH — DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLE: PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLE: CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT ('cat-' || uuid_generate_v4()::text),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLE: BRANDS
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY DEFAULT ('brand-' || uuid_generate_v4()::text),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLE: PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT ('prod-' || uuid_generate_v4()::text),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sku TEXT,
  brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
  brand_name TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT,
  category_slug TEXT,
  description TEXT NOT NULL DEFAULT '',
  short_description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  compare_price NUMERIC(12, 2),
  discount_percentage INT DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  main_image TEXT NOT NULL,
  gallery TEXT[] DEFAULT '{}',
  content_spec TEXT,
  rating NUMERIC(3, 1) DEFAULT 5.0,
  reviews_count INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABLE: PRODUCT_IMAGES
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABLE: ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT ('ord-' || uuid_generate_v4()::text),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  department TEXT,
  notes TEXT,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  shipping NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  origin TEXT NOT NULL DEFAULT 'Web',
  payment_method TEXT NOT NULL DEFAULT 'Contraentrega',
  delivery_method TEXT NOT NULL DEFAULT 'Envío a domicilio',
  status TEXT NOT NULL DEFAULT 'Pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABLE: ORDER_ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- 10. TABLE: ORDER_STATUS_HISTORY
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. TABLE: OFFERS
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  old_price NUMERIC(12, 2) NOT NULL,
  offer_price NUMERIC(12, 2) NOT NULL,
  discount_percentage INT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true
);

-- 12. TABLE: ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY DEFAULT ('ann-' || uuid_generate_v4()::text),
  message TEXT NOT NULL,
  icon TEXT DEFAULT 'Truck',
  active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. TABLE: BANNERS
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY DEFAULT ('ban-' || uuid_generate_v4()::text),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tag TEXT,
  image_url TEXT NOT NULL,
  button_text TEXT DEFAULT 'EXPLORAR PRODUCTOS',
  button_url TEXT DEFAULT '/productos',
  active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
);

-- 14. TABLE: NEWSLETTER_SUBSCRIBERS
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. TABLE: STORE_SETTINGS
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name TEXT NOT NULL DEFAULT 'Las 3YR - Donde Enith',
  whatsapp TEXT NOT NULL DEFAULT '+573244456597',
  phone TEXT NOT NULL DEFAULT '+57 324 445 6597',
  email TEXT NOT NULL DEFAULT 'info@las3yr.com',
  address TEXT NOT NULL DEFAULT 'Calle Principal #45-12',
  city TEXT NOT NULL DEFAULT 'Medellín',
  department TEXT NOT NULL DEFAULT 'Antioquia',
  schedule TEXT NOT NULL DEFAULT 'Lunes a Sábado: 8:00 AM - 7:00 PM',
  instagram TEXT DEFAULT 'https://instagram.com/las3yr_dondeenith',
  facebook TEXT DEFAULT 'https://facebook.com/las3yrdondeenith',
  shipping_cost NUMERIC(12, 2) DEFAULT 12000,
  free_shipping_from NUMERIC(12, 2) DEFAULT 150000,
  whatsapp_custom_message TEXT DEFAULT '¡Hola! Deseo más información sobre Las 3YR.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. TABLE: CONTACT_MESSAGES
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY DEFAULT ('msg-' || uuid_generate_v4()::text),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: User can read own profile; Admin can read and update all
CREATE POLICY "Public read own profile" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public insert own profile" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update own profile" ON profiles FOR UPDATE USING (true);

-- Categories, Brands, Products, Announcements, Banners, Store Settings: Full access for client store & admin management
CREATE POLICY "Allow all categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all brands" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all product_images" ON product_images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all banners" ON banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all store_settings" ON store_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all offers" ON offers FOR ALL USING (true) WITH CHECK (true);

-- Orders & Items: Full access
CREATE POLICY "Allow all orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all order_history" ON order_status_history FOR ALL USING (true) WITH CHECK (true);

-- Newsletter & Contact
CREATE POLICY "Allow all newsletter" ON newsletter_subscribers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all contact" ON contact_messages FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- STORAGE BUCKETS SETUP
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('products', 'products', true),
  ('categories', 'categories', true),
  ('brands', 'brands', true),
  ('banners', 'banners', true),
  ('store', 'store', true)
ON CONFLICT (id) DO NOTHING;

-- Public access to storage buckets
CREATE POLICY "Public Access Storage" ON storage.objects FOR SELECT USING (bucket_id IN ('products', 'categories', 'brands', 'banners', 'store'));
CREATE POLICY "Admin Upload Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('products', 'categories', 'brands', 'banners', 'store'));
CREATE POLICY "Admin Delete Storage" ON storage.objects FOR DELETE USING (bucket_id IN ('products', 'categories', 'brands', 'banners', 'store'));

-- ==============================================================================
-- DEFAULT SEED DATA (CARTAGENA DE INDIAS)
-- ==============================================================================
INSERT INTO store_settings (store_name, whatsapp, phone, email, address, city, department, schedule, shipping_cost, free_shipping_from)
VALUES ('Las 3YR - Donde Enith', '+573244456597', '+57 324 445 6597', 'info@las3yr.com', 'Cartagena de Indias', 'Cartagena', 'Bolívar', 'Lunes a Sábado: 8:00 AM - 7:00 PM', 0, 0)
ON CONFLICT DO NOTHING;

-- Initial Brands
INSERT INTO brands (id, name, slug, description, active, sort_order)
VALUES
  ('brand-1', 'Natura', 'natura', 'Cosmética y perfumería sustentable con activos de la biodiversidad brasileña.', true, 1),
  ('brand-2', 'Avon', 'avon', 'Líder en belleza accesible, cuidado facial Anew, maquillaje y fragancias.', true, 2),
  ('brand-3', 'Yanbal', 'yanbal', 'Alta perfumería, bijouterie fina con baño en oro de 24k y tratamiento facial.', true, 3),
  ('brand-4', 'Leonisa', 'leonisa', 'Prendas íntimas femeninas y masculinas, fajas moldeadoras y tecnología en confort.', true, 4),
  ('brand-5', 'Ésika', 'esika', 'Maquillaje de alta fijación, labiales Colorfix y perfumería de prestigio latino.', true, 5),
  ('brand-6', 'Azzorti', 'azzorti', 'Hogar, moda, organizadores de cocina y accesorios prácticos para la familia.', true, 6)
ON CONFLICT (id) DO NOTHING;

-- Initial Categories
INSERT INTO categories (id, name, slug, description, image_url, active, sort_order)
VALUES
  ('cat-1', 'Perfumería', 'perfumeria', 'Fragancias exclusivas, colonias y perfumes para dama y caballero.', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80', true, 1),
  ('cat-2', 'Cuidado Facial', 'cuidado-facial', 'Cremas hidratantes, serums antiedad, protectores solares y limpiadores.', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80', true, 2),
  ('cat-3', 'Cuidado Corporal', 'cuidado-corporal', 'Hidratantes corporales, pulpas para manos, exfoliantes y aceites de baño.', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80', true, 3),
  ('cat-4', 'Maquillaje', 'maquillaje', 'Labiales de larga duración, bases, pestañinas y sombras profesionales.', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', true, 4),
  ('cat-5', 'Moda Íntima & Fajas', 'moda-intima', 'Brasieres, pantys, fajas reductoras y prendas moldeadoras de alta calidad.', 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80', true, 5),
  ('cat-6', 'Hogar & Accesorios', 'hogar-accesorios', 'Organizadores de cocina, lencería de cama, vajillas y detalles para el hogar.', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', true, 6)
ON CONFLICT (id) DO NOTHING;

-- Initial Announcements
INSERT INTO announcements (id, message, icon, active, sort_order)
VALUES
  ('ann-1', '📍 Venta y despachos exclusivos en la ciudad de Cartagena', 'MapPin', true, 1),
  ('ann-2', '🛵 Envíos locales por DiDi o inDrive (pago según tarifa de la app)', 'Truck', true, 2),
  ('ann-3', '✨ Productos 100% originales de catálogo (Natura, Avon, Yanbal y más)', 'Sparkles', true, 3),
  ('ann-4', '💬 Compra segura y asesoría directa por WhatsApp', 'ShieldCheck', true, 4)
ON CONFLICT (id) DO NOTHING;
