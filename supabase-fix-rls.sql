-- ==============================================================================
-- FIX ROW LEVEL SECURITY (RLS) FOR LAS 3YR STORE
-- Ejecuta este script en el "SQL Editor" de Supabase para desbloquear permisos
-- ==============================================================================

-- 1. Eliminar políticas restrictivas previas (si existen)
DROP POLICY IF EXISTS "Public read active categories" ON categories;
DROP POLICY IF EXISTS "Admin manage categories" ON categories;
DROP POLICY IF EXISTS "Allow all categories" ON categories;

DROP POLICY IF EXISTS "Public read active brands" ON brands;
DROP POLICY IF EXISTS "Admin manage brands" ON brands;
DROP POLICY IF EXISTS "Allow all brands" ON brands;

DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Admin manage products" ON products;
DROP POLICY IF EXISTS "Allow all products" ON products;

DROP POLICY IF EXISTS "Allow all product_images" ON product_images;

DROP POLICY IF EXISTS "Public read announcements" ON announcements;
DROP POLICY IF EXISTS "Admin manage announcements" ON announcements;
DROP POLICY IF EXISTS "Allow all announcements" ON announcements;

DROP POLICY IF EXISTS "Public read banners" ON banners;
DROP POLICY IF EXISTS "Admin manage banners" ON banners;
DROP POLICY IF EXISTS "Allow all banners" ON banners;

DROP POLICY IF EXISTS "Public read settings" ON store_settings;
DROP POLICY IF EXISTS "Admin manage settings" ON store_settings;
DROP POLICY IF EXISTS "Allow all store_settings" ON store_settings;

DROP POLICY IF EXISTS "Allow all offers" ON offers;

DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Users read own orders" ON orders;
DROP POLICY IF EXISTS "Admin manage orders" ON orders;
DROP POLICY IF EXISTS "Allow all orders" ON orders;

DROP POLICY IF EXISTS "Public insert order_items" ON order_items;
DROP POLICY IF EXISTS "Public read order_items" ON order_items;
DROP POLICY IF EXISTS "Allow all order_items" ON order_items;

DROP POLICY IF EXISTS "Allow all order_history" ON order_status_history;

DROP POLICY IF EXISTS "Public subscribe newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admin read subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Allow all newsletter" ON newsletter_subscribers;

DROP POLICY IF EXISTS "Public send contact message" ON contact_messages;
DROP POLICY IF EXISTS "Admin read contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow all contact" ON contact_messages;

-- 2. Crear políticas permisivas completas para el catálogo y la tienda
CREATE POLICY "Allow all categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all brands" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all product_images" ON product_images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all banners" ON banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all store_settings" ON store_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all offers" ON offers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all order_history" ON order_status_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all newsletter" ON newsletter_subscribers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all contact" ON contact_messages FOR ALL USING (true) WITH CHECK (true);

-- 3. Asegurar Storage de imágenes
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('products', 'products', true),
  ('categories', 'categories', true),
  ('brands', 'brands', true),
  ('banners', 'banners', true),
  ('store', 'store', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Storage" ON storage.objects;

CREATE POLICY "Public Access Storage" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Public Upload Storage" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Storage" ON storage.objects FOR DELETE USING (true);
