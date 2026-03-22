-- Migration: 002_teams_players (stub for issue #2)
-- Minimal teams and players tables needed by 003_matches_events
-- This will be replaced by the full implementation from issue #2

-- =============================================================================
-- teams (minimal for FK references)
-- =============================================================================
CREATE TABLE public.teams (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name          text NOT NULL,
  manager_user_id uuid REFERENCES public.user_profiles(id),
  registration_status text NOT NULL DEFAULT 'pending'
               CHECK (registration_status IN ('pending', 'approved', 'rejected')),
  logo_url      text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, name)
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- players (minimal for FK references)
-- =============================================================================
CREATE TABLE public.players (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name            text NOT NULL,
  jersey_number   smallint NOT NULL,
  position        text,
  is_out_of_state boolean NOT NULL DEFAULT false,
  is_captain      boolean NOT NULL DEFAULT false,
  photo_url       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, jersey_number)
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
