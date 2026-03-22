-- Migration: 001_core_tables
-- Creates core tables: user_profiles, tournaments
-- Creates helper: is_admin() function
-- Creates trigger: handle_new_user (auto-create profile on auth.users INSERT)

-- =============================================================================
-- user_profiles
-- =============================================================================
CREATE TABLE public.user_profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text,
  phone      text,
  role       text NOT NULL DEFAULT 'spectator',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- tournaments
-- =============================================================================
CREATE TABLE public.tournaments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  year       integer NOT NULL,
  slug       text NOT NULL,
  status     text NOT NULL DEFAULT 'draft'
             CHECK (status IN ('draft', 'registration', 'active', 'completed', 'cancelled')),
  team_size  integer NOT NULL DEFAULT 7
             CHECK (team_size > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, year)
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Slug generation trigger for tournaments
-- =============================================================================
CREATE OR REPLACE FUNCTION public.generate_tournament_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate slug: lowercase, replace non-alphanumeric with hyphens, collapse multiple hyphens
  NEW.slug := regexp_replace(
    regexp_replace(
      lower(NEW.name || '-' || NEW.year::text),
      '[^a-z0-9]+', '-', 'g'
    ),
    '-+', '-', 'g'
  );
  -- Trim leading/trailing hyphens
  NEW.slug := trim(BOTH '-' FROM NEW.slug);
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_tournament_slug
  BEFORE INSERT OR UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_tournament_slug();

-- =============================================================================
-- is_admin() helper - SECURITY DEFINER
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

-- =============================================================================
-- handle_new_user trigger: auto-create user_profiles row on auth.users INSERT
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- updated_at auto-update trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
