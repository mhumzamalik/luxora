-- LUXORA Supabase Row Level Security (RLS) Policies
-- Designed alongside schema for zero-trust database security

-- Enable RLS on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "carts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wishlists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wishlist_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "coupons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_audit_logs" ENABLE ROW LEVEL SECURITY;

-- Catalog Policies (Public Read)
CREATE POLICY "Public Read Categories" ON "categories" FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON "products" FOR SELECT USING (true);
CREATE POLICY "Public Read Product Images" ON "product_images" FOR SELECT USING (true);
CREATE POLICY "Public Read Product Variants" ON "product_variants" FOR SELECT USING (true);
CREATE POLICY "Public Read Reviews" ON "reviews" FOR SELECT USING (true);

-- User Policies
CREATE POLICY "Users read self" ON "users" FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users update self" ON "users" FOR UPDATE USING (auth.uid()::text = id);

-- Addresses Policies
CREATE POLICY "Users manage own addresses" ON "addresses" FOR ALL USING (auth.uid()::text = user_id);

-- Cart & Wishlist Policies
CREATE POLICY "Users manage own cart" ON "carts" FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users manage own wishlist" ON "wishlists" FOR ALL USING (auth.uid()::text = user_id);

-- Orders Policies
CREATE POLICY "Users view own orders" ON "orders" FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users insert orders" ON "orders" FOR INSERT WITH CHECK (true);

-- Admin & Manager Override Policies
CREATE POLICY "Admin Full Control Categories" ON "categories" FOR ALL USING (
  EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER'))
);
CREATE POLICY "Admin Full Control Products" ON "products" FOR ALL USING (
  EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER'))
);
CREATE POLICY "Admin Full Control Orders" ON "orders" FOR ALL USING (
  EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER'))
);
CREATE POLICY "Admin Full Control Audit Logs" ON "admin_audit_logs" FOR ALL USING (
  EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid()::text AND role = 'ADMIN')
);
