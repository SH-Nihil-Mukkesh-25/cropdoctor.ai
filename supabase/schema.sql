-- ========================================================
-- CropGuard Database Schema
-- Run this SQL in Supabase SQL Editor (Dashboard → SQL Editor)
-- ========================================================

-- 1. PROFILES TABLE
-- Extends Supabase Auth users with app-specific metadata.
-- Auto-created when a user signs up via a trigger.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow insert during signup trigger (service role)
CREATE POLICY "Enable insert for service role"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- 2. SCAN_HISTORY TABLE
-- Stores every disease detection result per user.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scan_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_uri       TEXT NOT NULL,
  disease         TEXT NOT NULL,
  confidence      REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  recommendation  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast per-user queries ordered by date
CREATE INDEX IF NOT EXISTS idx_scan_history_user_date
  ON public.scan_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own scans
CREATE POLICY "Users can view own scans"
  ON public.scan_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own scans
CREATE POLICY "Users can insert own scans"
  ON public.scan_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own scans
CREATE POLICY "Users can delete own scans"
  ON public.scan_history FOR DELETE
  USING (auth.uid() = user_id);


-- 3. AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- When a new user signs up via Supabase Auth, automatically
-- create a row in the profiles table.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4. UPDATED_AT AUTO-REFRESH (Trigger for profiles)
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
