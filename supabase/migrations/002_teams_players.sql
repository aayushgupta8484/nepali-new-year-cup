-- Migration: 002_teams_players
-- Creates tables: teams, players
-- Foreign keys: teams → tournaments, players → teams
-- Cascading deletes: tournament → teams → players

-- =============================================================================
-- teams
-- =============================================================================
CREATE TABLE public.teams (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id    uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name             text NOT NULL,
  manager_user_id  uuid REFERENCES public.user_profiles(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, name)
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- players
-- =============================================================================
CREATE TABLE public.players (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id             uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  full_name           text NOT NULL,
  jersey_number       smallint NOT NULL
                      CHECK (jersey_number >= 0),
  is_out_of_state     boolean NOT NULL DEFAULT false,
  is_captain          boolean NOT NULL DEFAULT false,
  registration_status text NOT NULL DEFAULT 'pending'
                      CHECK (registration_status IN ('pending', 'approved', 'rejected')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, jersey_number)
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- updated_at auto-update triggers
-- =============================================================================
CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
