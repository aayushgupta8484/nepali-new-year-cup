-- Migration: 003_matches_events
-- Creates tables: matches, match_events, announcements
-- Depends on: 001_core_tables (tournaments), 002_teams_players (teams, players)

-- =============================================================================
-- matches
-- =============================================================================
CREATE TABLE public.matches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id       uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  match_number        integer NOT NULL,
  stage               text NOT NULL
                      CHECK (stage IN ('group', 'quarterfinal', 'semifinal', 'final')),
  group_name          text,
  status              text NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  home_team_id        uuid REFERENCES public.teams(id),
  away_team_id        uuid REFERENCES public.teams(id),
  home_score          integer,
  away_score          integer,
  home_penalty_score  integer,
  away_penalty_score  integer,
  winner_team_id      uuid REFERENCES public.teams(id),
  scheduled_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, match_number)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- match_events
-- =============================================================================
CREATE TABLE public.match_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id            uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  event_type          text NOT NULL
                      CHECK (event_type IN ('goal', 'yellow_card', 'red_card', 'substitution')),
  minute              integer NOT NULL,
  team_id             uuid NOT NULL REFERENCES public.teams(id),
  player_id           uuid NOT NULL REFERENCES public.players(id),
  related_player_id   uuid REFERENCES public.players(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- announcements
-- =============================================================================
CREATE TABLE public.announcements (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id       uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  title               text NOT NULL,
  body                text NOT NULL,
  is_pinned           boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- updated_at trigger for matches
-- =============================================================================
CREATE TRIGGER set_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
