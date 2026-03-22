-- Test: 002_teams_players
-- Tests for teams and players tables, constraints, cascading deletes, and defaults

BEGIN;

SELECT plan(26);

-- =============================================================================
-- 1. Table existence
-- =============================================================================
SELECT has_table('public', 'teams', 'teams table exists');
SELECT has_table('public', 'players', 'players table exists');

-- =============================================================================
-- 2. teams columns
-- =============================================================================
SELECT has_column('public', 'teams', 'id', 'teams has id column');
SELECT has_column('public', 'teams', 'tournament_id', 'teams has tournament_id column');
SELECT has_column('public', 'teams', 'name', 'teams has name column');
SELECT has_column('public', 'teams', 'manager_user_id', 'teams has manager_user_id column');
SELECT has_column('public', 'teams', 'created_at', 'teams has created_at column');
SELECT has_column('public', 'teams', 'updated_at', 'teams has updated_at column');

-- =============================================================================
-- 3. players columns
-- =============================================================================
SELECT has_column('public', 'players', 'id', 'players has id column');
SELECT has_column('public', 'players', 'team_id', 'players has team_id column');
SELECT has_column('public', 'players', 'full_name', 'players has full_name column');
SELECT has_column('public', 'players', 'jersey_number', 'players has jersey_number column');
SELECT has_column('public', 'players', 'is_out_of_state', 'players has is_out_of_state column');
SELECT has_column('public', 'players', 'is_captain', 'players has is_captain column');
SELECT has_column('public', 'players', 'registration_status', 'players has registration_status column');

-- =============================================================================
-- 4. Setup: create tournament and team for downstream tests
-- =============================================================================
INSERT INTO public.tournaments (id, name, year)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'Baisakh Cup', 2082);

INSERT INTO public.teams (id, tournament_id, name)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000001'::uuid,
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  'Red Stars'
);

-- =============================================================================
-- 5. UNIQUE(tournament_id, name): duplicate team name in same tournament rejected
-- =============================================================================
SELECT throws_ok(
  $$INSERT INTO public.teams (tournament_id, name)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'Red Stars')$$,
  23505,
  NULL,
  'Duplicate team name within same tournament is rejected'
);

-- Same name in a different tournament should succeed
INSERT INTO public.tournaments (id, name, year)
VALUES ('aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'Jestha Cup', 2082);

SELECT lives_ok(
  $$INSERT INTO public.teams (tournament_id, name)
    VALUES ('aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'Red Stars')$$,
  'Same team name in a different tournament is allowed'
);

-- =============================================================================
-- 6. manager_user_id is nullable
-- =============================================================================
SELECT results_eq(
  $$SELECT count(*)::integer FROM public.teams
    WHERE name = 'Red Stars'
      AND tournament_id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid
      AND manager_user_id IS NULL$$,
  $$VALUES (1)$$,
  'manager_user_id is nullable (no manager required)'
);

-- =============================================================================
-- 7. UNIQUE(team_id, jersey_number): duplicate jersey number in same team rejected
-- =============================================================================
INSERT INTO public.players (team_id, full_name, jersey_number)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000001'::uuid,
  'Aarav Sharma',
  10
);

SELECT throws_ok(
  $$INSERT INTO public.players (team_id, full_name, jersey_number)
    VALUES ('bbbbbbbb-0000-0000-0000-000000000001'::uuid, 'Bikash Rai', 10)$$,
  23505,
  NULL,
  'Duplicate jersey number in same team is rejected'
);

-- =============================================================================
-- 8. players.is_out_of_state defaults to false
-- =============================================================================
SELECT results_eq(
  $$SELECT is_out_of_state FROM public.players
    WHERE team_id = 'bbbbbbbb-0000-0000-0000-000000000001'::uuid
      AND full_name = 'Aarav Sharma'$$,
  $$VALUES (false)$$,
  'players.is_out_of_state defaults to false'
);

-- =============================================================================
-- 9. players.is_captain defaults to false
-- =============================================================================
SELECT results_eq(
  $$SELECT is_captain FROM public.players
    WHERE team_id = 'bbbbbbbb-0000-0000-0000-000000000001'::uuid
      AND full_name = 'Aarav Sharma'$$,
  $$VALUES (false)$$,
  'players.is_captain defaults to false'
);

-- =============================================================================
-- 10. registration_status CHECK constraint rejects invalid values
-- =============================================================================
SELECT throws_ok(
  $$INSERT INTO public.players (team_id, full_name, jersey_number, registration_status)
    VALUES ('bbbbbbbb-0000-0000-0000-000000000001'::uuid, 'Bad Status', 99, 'invalid')$$,
  23514,
  NULL,
  'Invalid registration_status is rejected by CHECK constraint'
);

-- =============================================================================
-- 11. jersey_number: negative values rejected
-- =============================================================================
SELECT throws_ok(
  $$INSERT INTO public.players (team_id, full_name, jersey_number)
    VALUES ('bbbbbbbb-0000-0000-0000-000000000001'::uuid, 'Negative Jersey', -1)$$,
  23514,
  NULL,
  'Negative jersey_number is rejected'
);

-- =============================================================================
-- 12. Cascading deletes: deleting a tournament removes its teams and players
-- =============================================================================
-- Set up a full chain: tournament → team → player
INSERT INTO public.tournaments (id, name, year)
VALUES ('aaaaaaaa-0000-0000-0000-000000000099'::uuid, 'Cascade Cup', 2099);

INSERT INTO public.teams (id, tournament_id, name)
VALUES ('bbbbbbbb-0000-0000-0000-000000000099'::uuid, 'aaaaaaaa-0000-0000-0000-000000000099'::uuid, 'Cascade FC');

INSERT INTO public.players (team_id, full_name, jersey_number)
VALUES ('bbbbbbbb-0000-0000-0000-000000000099'::uuid, 'Cascade Player', 1);

DELETE FROM public.tournaments WHERE id = 'aaaaaaaa-0000-0000-0000-000000000099'::uuid;

SELECT results_eq(
  $$SELECT count(*)::integer FROM public.teams WHERE id = 'bbbbbbbb-0000-0000-0000-000000000099'::uuid$$,
  $$VALUES (0)$$,
  'Deleting tournament cascades to teams'
);

SELECT results_eq(
  $$SELECT count(*)::integer FROM public.players WHERE team_id = 'bbbbbbbb-0000-0000-0000-000000000099'::uuid$$,
  $$VALUES (0)$$,
  'Deleting tournament cascades to players via teams'
);

-- =============================================================================
-- 13. Cascading deletes: deleting a team removes its players
-- =============================================================================
DELETE FROM public.teams WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001'::uuid;

SELECT results_eq(
  $$SELECT count(*)::integer FROM public.players WHERE team_id = 'bbbbbbbb-0000-0000-0000-000000000001'::uuid$$,
  $$VALUES (0)$$,
  'Deleting a team cascades to players'
);

SELECT * FROM finish();
ROLLBACK;
