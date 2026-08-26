-- =============================================================================
-- FoodBridge — Complete Supabase Database Schema, Permissions & RLS Setup
-- =============================================================================

-- Enable UUID generation extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 0. SCHEMA PERMISSIONS
-- Ensure PostgREST roles (anon, authenticated, service_role) have table access
-- =============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- =============================================================================
-- 1. TABLE: public.profiles
-- Linked 1-to-1 with auth.users via id
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'donor' CHECK (role IN ('donor', 'receiver', 'admin')),
    avatar_url TEXT,
    organization_name TEXT,
    address TEXT,
    city TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Index for faster queries on role and email
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to delete their own profile" ON public.profiles;

-- Profiles Policies:
-- 1. Anyone (anon/authenticated) can read profiles to see donor and receiver info
CREATE POLICY "profiles_select_policy"
    ON public.profiles FOR SELECT
    USING (true);

-- 2. Users can insert their own profile (or trigger)
CREATE POLICY "profiles_insert_policy"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- 3. Users can update their own profile
CREATE POLICY "profiles_update_policy"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Users can delete their own profile
CREATE POLICY "profiles_delete_policy"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);


-- =============================================================================
-- 2. TABLE: public.food_items
-- Food listings posted by donors
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Cooked Meals',
    quantity TEXT NOT NULL,
    quantity_unit TEXT DEFAULT 'servings',
    servings INTEGER DEFAULT 10,
    food_weight_kg NUMERIC(6, 2) DEFAULT 2.5,
    pickup_location TEXT NOT NULL,
    pickup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pickup_time TEXT NOT NULL,
    expiry_date DATE,
    expiry_time TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'requested', 'reserved', 'collected', 'expired', 'cancelled')),
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for food_items
CREATE INDEX IF NOT EXISTS idx_food_items_donor_id ON public.food_items(donor_id);
CREATE INDEX IF NOT EXISTS idx_food_items_status ON public.food_items(status);
CREATE INDEX IF NOT EXISTS idx_food_items_category ON public.food_items(category);

-- Enable RLS on food_items
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_items_select_policy" ON public.food_items;
DROP POLICY IF EXISTS "food_items_insert_policy" ON public.food_items;
DROP POLICY IF EXISTS "food_items_update_policy" ON public.food_items;
DROP POLICY IF EXISTS "food_items_delete_policy" ON public.food_items;
DROP POLICY IF EXISTS "Allow users to view food items" ON public.food_items;
DROP POLICY IF EXISTS "Allow donors to create food items" ON public.food_items;
DROP POLICY IF EXISTS "Allow donors to update their food items" ON public.food_items;
DROP POLICY IF EXISTS "Allow donors to delete their food items" ON public.food_items;

-- Food Items Policies:
-- 1. Anyone authenticated can browse all food items
CREATE POLICY "food_items_select_policy"
    ON public.food_items FOR SELECT
    USING (true);

-- 2. Donors can create food items
CREATE POLICY "food_items_insert_policy"
    ON public.food_items FOR INSERT
    WITH CHECK (auth.uid() = donor_id);

-- 3. Donors can update their own food items
CREATE POLICY "food_items_update_policy"
    ON public.food_items FOR UPDATE
    USING (
        auth.uid() = donor_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        auth.uid() = donor_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. Donors can delete their own food items
CREATE POLICY "food_items_delete_policy"
    ON public.food_items FOR DELETE
    USING (
        auth.uid() = donor_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );


-- =============================================================================
-- 3. TABLE: public.food_requests
-- Requests placed by receivers (NGOs, Shelters, individuals)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.food_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_id UUID NOT NULL REFERENCES public.food_items(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
    requested_servings INTEGER,
    notes TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for food_requests
CREATE INDEX IF NOT EXISTS idx_food_requests_food_id ON public.food_requests(food_id);
CREATE INDEX IF NOT EXISTS idx_food_requests_receiver_id ON public.food_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_food_requests_donor_id ON public.food_requests(donor_id);
CREATE INDEX IF NOT EXISTS idx_food_requests_status ON public.food_requests(status);

-- Enable RLS on food_requests
ALTER TABLE public.food_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_requests_select_policy" ON public.food_requests;
DROP POLICY IF EXISTS "food_requests_insert_policy" ON public.food_requests;
DROP POLICY IF EXISTS "food_requests_update_policy" ON public.food_requests;
DROP POLICY IF EXISTS "food_requests_delete_policy" ON public.food_requests;
DROP POLICY IF EXISTS "Allow participants to view food requests" ON public.food_requests;
DROP POLICY IF EXISTS "Allow receivers to create food requests" ON public.food_requests;
DROP POLICY IF EXISTS "Allow participants to update food requests" ON public.food_requests;
DROP POLICY IF EXISTS "Allow receivers to delete food requests" ON public.food_requests;

-- Food Requests Policies:
-- 1. Participants (donor or receiver) or admin can view requests
CREATE POLICY "food_requests_select_policy"
    ON public.food_requests FOR SELECT
    USING (
        auth.uid() = receiver_id
        OR auth.uid() = donor_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 2. Receivers can create food requests
CREATE POLICY "food_requests_insert_policy"
    ON public.food_requests FOR INSERT
    WITH CHECK (auth.uid() = receiver_id);

-- 3. Donors can accept/reject, receivers can cancel
CREATE POLICY "food_requests_update_policy"
    ON public.food_requests FOR UPDATE
    USING (
        auth.uid() = donor_id
        OR auth.uid() = receiver_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        auth.uid() = donor_id
        OR auth.uid() = receiver_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. Receivers can delete their pending requests
CREATE POLICY "food_requests_delete_policy"
    ON public.food_requests FOR DELETE
    USING (
        auth.uid() = receiver_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );


-- =============================================================================
-- 4. BACKWARD-COMPATIBLE TABLES: donations & pickups
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    quantity TEXT NOT NULL,
    servings INTEGER DEFAULT 10,
    food_weight_kg NUMERIC(6, 2) DEFAULT 2.5,
    status TEXT NOT NULL DEFAULT 'Pending Pickup',
    pickup_location TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "donations_select_policy" ON public.donations;
DROP POLICY IF EXISTS "donations_insert_policy" ON public.donations;
DROP POLICY IF EXISTS "Allow users to view own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow users to insert own donations" ON public.donations;

CREATE POLICY "donations_select_policy"
    ON public.donations FOR SELECT
    USING (true);

CREATE POLICY "donations_insert_policy"
    ON public.donations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.pickups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pickup_date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    ngo_name TEXT NOT NULL,
    reference_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pickups_select_policy" ON public.pickups;
DROP POLICY IF EXISTS "pickups_insert_policy" ON public.pickups;
DROP POLICY IF EXISTS "Allow users to view own pickups" ON public.pickups;
DROP POLICY IF EXISTS "Allow users to insert own pickups" ON public.pickups;

CREATE POLICY "pickups_select_policy"
    ON public.pickups FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "pickups_insert_policy"
    ON public.pickups FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- =============================================================================
-- 5. GRANT PERMISSIONS ON ALL TABLES TO PostgREST ROLES
-- Fixes "permission denied for table profiles"
-- =============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;


-- =============================================================================
-- 6. AUTOMATED TRIGGER FOR NEW USER SIGNUP
-- Automatically creates a row in public.profiles when an auth.user is created
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    user_name TEXT;
    user_phone TEXT;
BEGIN
    -- Sanitize role to lowercase and ensure valid enum value
    user_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'donor')));
    IF user_role NOT IN ('donor', 'receiver', 'admin') THEN
        user_role := 'donor';
    END IF;

    -- Sanitize full name
    user_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        split_part(NEW.email, '@', 1),
        'User'
    );
    
    -- Sanitize phone
    user_phone := COALESCE(TRIM(NEW.raw_user_meta_data->>'phone'), '');

    INSERT INTO public.profiles (id, full_name, email, phone, role)
    VALUES (
        NEW.id,
        user_name,
        NEW.email,
        user_phone,
        user_role
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
        role = EXCLUDED.role,
        updated_at = timezone('utc', now());

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Prevent trigger failure from ever blocking signup in auth.users
    RAISE WARNING 'handle_new_user notice: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- Trigger to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_food_items_timestamp ON public.food_items;
CREATE TRIGGER update_food_items_timestamp
    BEFORE UPDATE ON public.food_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_food_requests_timestamp ON public.food_requests;
CREATE TRIGGER update_food_requests_timestamp
    BEFORE UPDATE ON public.food_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();
