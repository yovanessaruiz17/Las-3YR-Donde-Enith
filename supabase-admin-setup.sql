-- ==============================================================================
-- FIX & ACTIVATE ADMIN USER IN SUPABASE (LAS 3YR)
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- It syncs all existing users from auth.users into public.profiles
-- and assigns the 'admin' role to your account.

-- 1. Create or ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS and public access policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public all profiles" ON public.profiles;

CREATE POLICY "Public all profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- 3. Automatic Trigger: Whenever a new user signs up in auth.users, create their profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Sync all existing auth users into public.profiles right now
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
  'customer'
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email;

-- 5. Set 'admin' role for yorle170203@gmail.com
UPDATE public.profiles 
SET role = 'admin', full_name = 'Enith — Propietaria'
WHERE email = 'yorle170203@gmail.com';

-- 6. Verify result
SELECT id, email, full_name, role, created_at FROM public.profiles WHERE email = 'yorle170203@gmail.com';
