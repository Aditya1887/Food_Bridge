-- =============================================================================
-- Migration: Add missing columns to public.food_items & Reload Schema Cache
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- =============================================================================

ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS allergens TEXT;
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS storage_condition TEXT DEFAULT 'Room Temperature';
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS food_type TEXT DEFAULT 'Vegetarian';
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS food_weight_kg NUMERIC(6, 2) DEFAULT 2.5;
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS servings INTEGER DEFAULT 10;
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS quantity_unit TEXT DEFAULT 'servings';
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS pickup_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS pickup_time TEXT DEFAULT 'Today (Flexible)';
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS expiry_time TEXT;
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'receiver_pickup';

-- Add fulfillment and delivery fields to food_requests and pickup_records
ALTER TABLE public.food_requests ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'receiver_pickup';
ALTER TABLE public.food_requests ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.food_requests ADD COLUMN IF NOT EXISTS delivery_phone TEXT;

ALTER TABLE public.pickup_records ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'receiver_pickup';
ALTER TABLE public.pickup_records ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Reload Supabase PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
