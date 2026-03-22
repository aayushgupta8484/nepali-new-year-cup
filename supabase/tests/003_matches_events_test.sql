-- Test: 003_matches_events
-- Tests for matches, match_events, and announcements tables

BEGIN;

SELECT plan(26);

-- =============================================================================
-- 1. Table existence
-- =============================================================================
SELECT has_table('public', 'matches', 'matches table exists');
SELECT has_table('public', 'match_events', 'match_events table exists');
SELECT has_table('public', 'announcements', 'announcements table exists');

-- =============================================================================
-- 2. matches columns
-- =============================================================================
SELECT has_column('public', 'matches', 'id', 'matches has id column');
SELECT has_column('public', 'matches', 'tournament_id', 'matches has tournament_id column');
SELECT has_column('public', 'matches', 'stage', 'matches has stage column');
SELECT has_column('public', 'matches', 'match_number', 'matches has match_number column');
SELECT has_column('public', 'matches', 'home_team_id', 'matches has home_team_id column');
SELECT has_column('public', 'matches', 'away_team_id', 'matches has away_team_id column');
SELECT has_column('public', 'matches', 'home_penalty_score', 'matches has home_penalty_score column');
SELECT has_column('public', 'matches', 'winner_team_id', 'matches has winner_team_id column');
SELECT has_column('public', 'matches', 'status', 'matches has status column');

-- =============================================================================
-- 3. Create test tournament for FK references
-- =============================================================================
INSERT INTO public.tournaments (id, name, year)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Test Cup', 2082);

-- =============================================================================
-- 4. Create match with nullable team FKs (knockout placeholder)
-- =============================================================================
INSERT INTO public.matches (tournament_id, stage, match_number)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'semifinal', 1);

SELECT results_eq(
  $$SELECT home_team_id IS NULL AND away_team_id IS NULL AND winner_team_id IS NULL
    FROM public.matches
    WHERE tournament_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid AND match_number = 1$$,
  $$VALUES (true)$$,
  'Match created with nullable team FKs (knockout placeholder)'
);

-- =============================================================================
-- 5. Match status defaults to scheduled
-- =============================================================================
SELECT results_eq(
  $$SELECT status FROM public.matches
    WHERE tournament_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid AND match_number = 1$$,
  $$VALUES ('scheduled'::text)$$,
  'Match status defaults to scheduled'
);

-- =============================================================================
-- 6. Stage CHECK constraint rejects invalid values
-- =============================================================================
SELECT throws_ok(
  $$INSERT INTO public.matches (tournament_id, stage, match_number)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'invalid_stage', 99)$$,
  23514,
  NULL,
  'Invalid stage value is rejected by CHECK constraint'
);

-- =============================================================================
-- 7. Status CHECK constraint rejects invalid values
-- =============================================================================
SELECT throws_ok(
  $$INSERT INTO public.matches (tournament_id, stage, match_number, status)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'group', 98, 'invalid_status')$$,
  23514,
  NULL,
  'Invalid match status value is rejected by CHECK constraint'
);

-- =============================================================================
-- 8. UNIQUE(tournament_id, match_number) constraint
-- =============================================================================
SELECT throws_ok(
  $$INSERT INTO public.matches (tournament_id, stage, match_number)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'group', 1)$$,
  23505,
  NULL,
  'Duplicate (tournament_id, match_number) is rejected'
);

-- =============================================================================
-- 9. Penalty scores are nullable
-- =============================================================================
SELECT results_eq(
  $$SELECT home_penalty_score IS NULL AND away_penalty_score IS NULL
    FROM public.matches
    WHERE tournament_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid AND match_number = 1$$,
  $$VALUES (true)$$,
  'Penalty scores are nullable by default'
);

-- =============================================================================
-- 10. match_events: create test data (team and player)
-- =============================================================================
INSERT INTO public.teams (id, tournament_id, name)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'Test Team'
);

INSERT INTO public.players (id, team_id, full_name, jersey_number)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'Test Player',
  10
);

INSERT INTO public.players (id, team_id, full_name, jersey_number)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'Sub Player',
  11
);

-- =============================================================================
-- 11. match_events: valid event types
-- =============================================================================
INSERT INTO public.match_events (match_id, team_id, player_id, event_type, minute)
SELECT m.id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'goal', 45
FROM public.matches m
WHERE m.match_number = 1
  AND m.tournament_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

SELECT results_eq(
  $$SELECT count(*)::integer FROM public.match_events WHERE event_type = 'goal'$$,
  $$VALUES (1)$$,
  'Goal event created successfully'
);

INSERT INTO public.match_events (match_id, team_id, player_id, event_type, minute, related_player_id)
SELECT m.id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'substitution', 60,
  'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid
FROM public.matches m
WHERE m.match_number = 1
  AND m.tournament_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

SELECT results_eq(
  $$SELECT count(*)::integer FROM public.match_events WHERE event_type = 'substitution'$$,
  $$VALUES (1)$$,
  'Substitution event created with related_player_id'
);

-- =============================================================================
-- 12. match_events: CHECK constraint rejects invalid event_type
-- =============================================================================
SELECT throws_ok(
  $$INSERT INTO public.match_events (match_id, team_id, player_id, event_type, minute)
    SELECT m.id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
      'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'invalid_event', 30
    FROM public.matches m WHERE m.match_number = 1
      AND m.tournament_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
  23514,
  NULL,
  'Invalid event_type is rejected by CHECK constraint'
);

-- =============================================================================
-- 13. announcements: create and verify defaults
-- =============================================================================
INSERT INTO public.announcements (tournament_id, title, body)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Test Title', 'Test body');

SELECT results_eq(
  $$SELECT is_pinned FROM public.announcements WHERE title = 'Test Title'$$,
  $$VALUES (false)$$,
  'Announcement is_pinned defaults to false'
);

SELECT results_eq(
  $$SELECT (created_at IS NOT NULL)::boolean FROM public.announcements WHERE title = 'Test Title'$$,
  $$VALUES (true)$$,
  'Announcement created_at defaults to now()'
);

-- =============================================================================
-- 14. Cascade delete: deleting tournament removes matches, match_events, announcements
-- =============================================================================
DELETE FROM public.tournaments WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

SELECT results_eq(
  $$SELECT count(*)::integer FROM public.matches
    WHERE tournament_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
  $$VALUES (0)$$,
  'Matches cascade deleted with tournament'
);

SELECT results_eq(
  $$SELECT count(*)::integer FROM public.announcements
    WHERE tournament_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
  $$VALUES (0)$$,
  'Announcements cascade deleted with tournament'
);

SELECT results_eq(
  $$SELECT count(*)::integer FROM public.match_events$$,
  $$VALUES (0)$$,
  'Match events cascade deleted when matches are deleted'
);

SELECT * FROM finish();
ROLLBACK;
