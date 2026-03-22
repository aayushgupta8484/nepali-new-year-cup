# Project Context
Last updated: 2026-03-22 (PR #56)

## Active Interfaces (current milestone only)

### PR #46 — Supabase client setup (browser + server)
- `createBrowserClient()` from `src/lib/supabase/client.ts` — singleton Supabase client for browser, uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `createServerClient()` from `src/lib/supabase/server.ts` — async, per-request Supabase client integrating with Next.js 16 `cookies()` API (Promise-based), uses `getAll`/`setAll` cookie methods
- `.env.local.example` — documents required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `vitest.config.ts` — test runner config with `@` path alias

### PR #56 — teams & players tables migration (issue #2)
- `supabase/migrations/002_teams_players.sql` — migration creating `teams` and `players` tables
- `teams`: `id`, `tournament_id` (FK → tournaments ON DELETE CASCADE), `name`, `manager_user_id` (nullable FK → user_profiles), `created_at`, `updated_at`; `UNIQUE(tournament_id, name)`
- `players`: `id`, `team_id` (FK → teams ON DELETE CASCADE), `full_name`, `jersey_number` (SMALLINT, CHECK ≥ 0), `is_out_of_state` (DEFAULT false), `is_captain` (DEFAULT false), `registration_status` (CHECK IN 'pending'|'approved'|'rejected', DEFAULT 'pending'), `created_at`, `updated_at`; `UNIQUE(team_id, jersey_number)`
- `supabase/tests/002_teams_players_test.sql` — 26 pgTAP tests covering all constraints, cascades, and defaults; total test suite: 47 tests across 2 files

## Architectural Decisions (last 20)

1. **Browser client is a singleton** — avoids multiple GoTrue instances; module-level variable reused across calls
2. **Server client is per-request** — each request has its own cookie context, so no caching
3. **Next.js 16 async cookies API** — `cookies()` returns a Promise, awaited before passing to Supabase
4. **`setAll` wrapped in try/catch** — Server Components have read-only cookies; middleware handles token refresh
5. **`registration_status` values are `('pending', 'approved', 'rejected')`** — standard approval-workflow enum; issue specified a CHECK constraint but not values; these map naturally to registration lifecycle
6. **`players` table omits `photo_url` and `position` columns** — not in acceptance criteria; kept to minimal spec even though other branches include them

## Known Deviations from Design Doc

(none)

## Gotchas (last 10)

1. `cookies()` in Next.js 16 is async (returns Promise) — must be awaited before use
2. `setAll` silently fails in Server Components (read-only context) — this is intentional; middleware handles cookie writes for token refresh
3. `UNIQUE(tournament_id, name)` on `teams` — team name uniqueness is per-tournament, not global; same name can exist in different tournaments
4. `jersey_number` is `SMALLINT` with `CHECK >= 0` — rejects negatives; stored as small int not text, so no leading-zero support (jersey "07" = 7)
