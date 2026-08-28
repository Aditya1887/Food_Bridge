-- =============================================================================
-- FoodBridge — Storage Policies for Supabase Storage Buckets
-- Buckets required: 'avatars' (public), 'food-images' (public)
-- =============================================================================

-- Ensure storage schema permissions
GRANT ALL ON SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres, anon, authenticated, service_role;

-- 1. AVATARS BUCKET POLICIES
-- Allow public viewing of avatar images
DROP POLICY IF EXISTS "Public Avatars Access" ON storage.objects;
CREATE POLICY "Public Avatars Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars
DROP POLICY IF EXISTS "Authenticated Users Can Upload Avatars" ON storage.objects;
CREATE POLICY "Authenticated Users Can Upload Avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow users to update their avatars
DROP POLICY IF EXISTS "Users Can Update Their Avatars" ON storage.objects;
CREATE POLICY "Users Can Update Their Avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Allow users to delete their avatars
DROP POLICY IF EXISTS "Users Can Delete Their Avatars" ON storage.objects;
CREATE POLICY "Users Can Delete Their Avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');


-- 2. FOOD-IMAGES BUCKET POLICIES
-- Allow public viewing of food listing images
DROP POLICY IF EXISTS "Public Food Images Access" ON storage.objects;
CREATE POLICY "Public Food Images Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'food-images');

-- Allow authenticated donors/users to upload food images
DROP POLICY IF EXISTS "Authenticated Donors Can Upload Food Images" ON storage.objects;
CREATE POLICY "Authenticated Donors Can Upload Food Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'food-images');

-- Allow users to update their food images
DROP POLICY IF EXISTS "Users Can Update Food Images" ON storage.objects;
CREATE POLICY "Users Can Update Food Images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'food-images')
WITH CHECK (bucket_id = 'food-images');

-- Allow users to delete food images
DROP POLICY IF EXISTS "Users Can Delete Food Images" ON storage.objects;
CREATE POLICY "Users Can Delete Food Images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'food-images');
