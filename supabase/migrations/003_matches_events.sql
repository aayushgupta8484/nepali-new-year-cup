-- Migration: 003_matches_events
-- Creates tables: matches, match_events, announcements
-- Depends on: 001_core_tables (tournaments), 002_teams_players (teams, players)

-- =============================================================================
-- matches
-- =============================================================================
CREATE TABLE public.matches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id       uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  stage               text NOT NULL
                      CHECK (stage IN ('group', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final')),
  group_letter        char(1),
  round_number        smallint,
  match_number        smallint NOT NULL,
  home_team_id        uuid REFERENCES public.teams(id),
  away_team_id        uuid REFERENCES public.teams(id),
  home_placeholder    text,
  away_placeholder    text,
  home_score          smallint,
  away_score          smallint,
  home_penalty_score  smallint,
  away_penalty_score  smallint,
  winner_team_id      uuid REFERENCES public.teams(id),
  status              text NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  field_name          text,
  scheduled_at        timestamptz,
  started_at          timestamptz,
  ended_at            timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, match_number)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- match_events
-- =============================================================================
CREATE TABLE public.match_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id           uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id         uuid REFERENCES public.players(id),
  event_type        text NOT NULL
                    CHECK (event_type IN ('goal', 'own_goal', 'penalty_goal', 'penalty_miss', 'yellow_card', 'red_card', 'substitution')),
  minute            smallint,
  related_player_id uuid REFERENCES public.players(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- announcements
-- =============================================================================
CREATE TABLE public.announcements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  title         text NOT NULL,
  body          text NOT NULL,
  is_pinned     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_matches_tournament_status ON public.matches (tournament_id, status);
CREATE INDEX idx_matches_tournament_stage_group ON public.matches (tournament_id, stage, group_letter)
  WHERE stage = 'group';
CREATE INDEX idx_matches_home_team ON public.matches (home_team_id);
CREATE INDEX idx_matches_away_team ON public.matches (away_team_id);
CREATE INDEX idx_match_events_match ON public.match_events (match_id);
CREATE INDEX idx_match_events_player ON public.match_events (player_id, event_type);
