import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock @supabase/ssr
const mockGetUser = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

// Must import after mocks
import { proxy, config } from './proxy'

function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, 'http://localhost:3000'))
}

describe('proxy (auth middleware)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  describe('unauthenticated requests to protected routes', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
    })

    it('redirects /dashboard to /login with returnUrl', async () => {
      const response = await proxy(createRequest('/dashboard'))
      expect(response.status).toBe(307)
      const location = new URL(response.headers.get('location')!)
      expect(location.pathname).toBe('/login')
      expect(location.searchParams.get('returnUrl')).toBe('/dashboard')
    })

    it('redirects /dashboard/settings to /login with returnUrl', async () => {
      const response = await proxy(createRequest('/dashboard/settings'))
      expect(response.status).toBe(307)
      const location = new URL(response.headers.get('location')!)
      expect(location.pathname).toBe('/login')
      expect(location.searchParams.get('returnUrl')).toBe('/dashboard/settings')
    })

    it('redirects /admin to /login with returnUrl', async () => {
      const response = await proxy(createRequest('/admin'))
      expect(response.status).toBe(307)
      const location = new URL(response.headers.get('location')!)
      expect(location.pathname).toBe('/login')
      expect(location.searchParams.get('returnUrl')).toBe('/admin')
    })

    it('redirects /admin/users to /login with returnUrl', async () => {
      const response = await proxy(createRequest('/admin/users'))
      expect(response.status).toBe(307)
      const location = new URL(response.headers.get('location')!)
      expect(location.pathname).toBe('/login')
      expect(location.searchParams.get('returnUrl')).toBe('/admin/users')
    })
  })

  describe('authenticated requests to protected routes', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      })
    })

    it('allows access to /dashboard', async () => {
      const response = await proxy(createRequest('/dashboard'))
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('allows access to /admin', async () => {
      const response = await proxy(createRequest('/admin'))
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })
  })

  describe('public routes', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
    })

    it('allows access to / without auth', async () => {
      const response = await proxy(createRequest('/'))
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('allows access to /t/some-slug without auth', async () => {
      const response = await proxy(createRequest('/t/some-slug'))
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('allows access to /t/some-slug/schedule without auth', async () => {
      const response = await proxy(createRequest('/t/some-slug/schedule'))
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('allows access to /login without auth', async () => {
      const response = await proxy(createRequest('/login'))
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('allows access to /register without auth', async () => {
      const response = await proxy(createRequest('/register'))
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })
  })

  describe('session refresh', () => {
    it('calls supabase getUser to refresh session on every request', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      await proxy(createRequest('/'))
      expect(mockGetUser).toHaveBeenCalledOnce()
    })
  })

  describe('config matcher', () => {
    it('excludes api routes, static files, and favicon', () => {
      expect(config.matcher).toBeDefined()
      const matchers = config.matcher as string[]
      const pattern = matchers[0]
      // Should be a negative lookahead pattern excluding api, _next/static, _next/image, favicon
      expect(pattern).toContain('api')
      expect(pattern).toContain('_next/static')
      expect(pattern).toContain('_next/image')
      expect(pattern).toContain('favicon.ico')
    })
  })
})
