-- Test: 001_core_tables
-- Tests for user_profiles, tournaments tables, is_admin() function, and handle_new_user trigger

BEGIN;

SELECT plan(21);

-- =============================================================================
-- 1. Table existence
-- =============================================================================
SELECT has_table('public', 'user_profiles', 'user_profiles table exists');
SELECT has_table('public', 'tournaments', 'tournaments table exists');

-- =============================================================================
-- 2. user_profiles columns
-- =============================================================================
SELECT has_column('public', 'user_profiles', 'id', 'user_profiles has id column');
SELECT has_column('public', 'user_profiles', 'full_name', 'user_profiles has full_name column');
SELECT has_column('public', 'user_profiles', 'phone', 'user_profiles has phone column');
SELECT has_column('public', 'user_profiles', 'role', 'user_profiles has role column');
SELECT has_column('public', 'user_profiles', 'avatar_url', 'user_profiles has avatar_url column');
SELECT has_column('public', 'user_profiles', 'created_at', 'user_profiles has created_at column');
SELECT has_column('public', 'user_profiles', 'updated_at', 'user_profiles has updated_at column');

-- =============================================================================
-- 3. Tournament defaults: insert and verify
-- =============================================================================
INSERT INTO public.tournaments (name, year)
VALUES ('Test Cup', 2082);

SELECT results_eq(
  $$SELECT status FROM public.tournaments WHERE name = 'Test Cup' AND year = 2082$$,
  $$VALUES ('draft'::text)$$,
  'Tournament status defaults to draft'
);

SELECT results_eq(
  $$SELECT team_size FROM public.tournaments WHERE name = 'Test Cup' AND year = 2082$$,
  $$VALUES (7)$$,
  'Tournament team_size defaults to 7'
);

-- Verify slug was auto-generated
SELECT results_eq(
  $$SELECT slug FROM public.tournaments WHERE name = 'Test Cup' AND year = 2082$$,
  $$VALUES ('test-cup-2082'::text)$$,
  'Tournament slug is auto-generated from name and year'
);

-- =============================================================================
-- 4. Unique constraint on (name, year)
-- =============================================================================
SELECT throws_ok(
  $$INSERT INTO public.tournaments (name, year) VALUES ('Test Cup', 2082)$$,
  23505,  -- unique_violation
  NULL,
  'Duplicate (name, year) is rejected'
);

-- =============================================================================
-- 5. Status CHECK constraint rejects invalid values
-- =============================================================================
SELECT throws_ok(
  $$INSERT INTO public.tournaments (name, year, status) VALUES ('Bad Status', 2083, 'invalid_status')$$,
  23514,  -- check_violation
  NULL,
  'Invalid status value is rejected by CHECK constraint'
);

-- =============================================================================
-- 6. handle_new_user trigger: insert into auth.users, verify profile auto-created
-- =============================================================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'test@example.com',
  '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUV',
  now(),
  '{"full_name": "Test User"}'::jsonb,
  now(),
  now()
);

SELECT results_eq(
  $$SELECT count(*)::integer FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-000000000001'::uuid$$,
  $$VALUES (1)$$,
  'handle_new_user trigger auto-creates user_profiles row'
);

-- =============================================================================
-- 7. user_profiles.role defaults to spectator (set by trigger)
-- =============================================================================
SELECT results_eq(
  $$SELECT role FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-000000000001'::uuid$$,
  $$VALUES ('spectator'::text)$$,
  'user_profiles role defaults to spectator'
);

-- =============================================================================
-- 8. is_admin() function exists
-- =============================================================================
SELECT has_function('public', 'is_admin', 'is_admin() function exists');

-- =============================================================================
-- 9. is_admin() returns false for non-admin user
-- =============================================================================
SELECT results_eq(
  $$SELECT public.is_admin()$$,
  $$VALUES (false)$$,
  'is_admin() returns false when no auth context'
);

-- =============================================================================
-- 10. handle_new_user trigger function exists
-- =============================================================================
SELECT has_function('public', 'handle_new_user', 'handle_new_user() trigger function exists');

-- =============================================================================
-- 11. Timestamps default to now()
-- =============================================================================
SELECT results_eq(
  $$SELECT (created_at IS NOT NULL)::boolean FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-000000000001'::uuid$$,
  $$VALUES (true)$$,
  'user_profiles created_at defaults to now()'
);

SELECT results_eq(
  $$SELECT (created_at IS NOT NULL)::boolean FROM public.tournaments WHERE name = 'Test Cup' AND year = 2082$$,
  $$VALUES (true)$$,
  'tournaments created_at defaults to now()'
);

SELECT * FROM finish();
ROLLBACK;
