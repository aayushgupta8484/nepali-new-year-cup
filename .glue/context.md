# Project Context
Last updated: 2026-03-21 (PR #55)

## Active Interfaces (current milestone only)

### PR #46 — Supabase client setup (browser + server)
- `createBrowserClient()` from `src/lib/supabase/client.ts` — singleton Supabase client for browser, uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `createServerClient()` from `src/lib/supabase/server.ts` — async, per-request Supabase client integrating with Next.js 16 `cookies()` API (Promise-based), uses `getAll`/`setAll` cookie methods
- `.env.local.example` — documents required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `vitest.config.ts` — test runner config with `@` path alias

### PR #55 — CountdownTimer component (issue #10)
- `CountdownTimer` from `src/components/shared/countdown-timer.tsx` — `"use client"` component; props: `{ targetDate: Date }`. Renders `null` on server (mounts via `useEffect`), then displays days/hours/minutes/seconds. Shows `<div data-testid="countdown-complete">Tournament started!</div>` when target is in the past or countdown hits zero. Cleans up `setInterval` on unmount.

## Architectural Decisions (last 20)

1. **Browser client is a singleton** — avoids multiple GoTrue instances; module-level variable reused across calls
2. **Server client is per-request** — each request has its own cookie context, so no caching
3. **Next.js 16 async cookies API** — `cookies()` returns a Promise, awaited before passing to Supabase
4. **`setAll` wrapped in try/catch** — Server Components have read-only cookies; middleware handles token refresh
5. **CountdownTimer renders `null` on server** — avoids hydration mismatch without `suppressHydrationWarning`; simpler than a loading skeleton and correct for this use case

## Known Deviations from Design Doc

(none)

## Gotchas (last 10)

1. `cookies()` in Next.js 16 is async (returns Promise) — must be awaited before use
2. `setAll` silently fails in Server Components (read-only context) — this is intentional; middleware handles cookie writes for token refresh
3. `CountdownTimer` returns `null` until mounted — callers should not expect any DOM output during SSR/pre-hydration; wrap in a container with min-height if layout shift matters
