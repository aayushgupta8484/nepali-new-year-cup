import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock next/navigation
const mockRedirect = vi.fn()
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}))

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}))

// Mock supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}))

describe("loginAction", () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...ORIGINAL_ENV }
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it("calls supabase.auth.signInWithPassword with email and password", async () => {
    const mockSignIn = vi.fn().mockResolvedValue({ error: null })
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: "123" } } })
    const mockSupabase = {
      auth: {
        signInWithPassword: mockSignIn,
        getUser: mockGetUser,
      },
    }

    const { createServerClient } = await import("@/lib/supabase/server")
    vi.mocked(createServerClient).mockResolvedValue(mockSupabase as any)

    const { loginAction } = await import("@/lib/actions/auth-actions")

    const formData = new FormData()
    formData.set("email", "user@example.com")
    formData.set("password", "correctpassword")

    await loginAction({ returnUrl: undefined }, formData)

    expect(mockSignIn).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "correctpassword",
    })
  })

  it("redirects to /dashboard on successful login with no return URL", async () => {
    const mockSignIn = vi.fn().mockResolvedValue({ error: null })
    const mockSupabase = {
      auth: { signInWithPassword: mockSignIn },
    }

    const { createServerClient } = await import("@/lib/supabase/server")
    vi.mocked(createServerClient).mockResolvedValue(mockSupabase as any)

    const { loginAction } = await import("@/lib/actions/auth-actions")

    const formData = new FormData()
    formData.set("email", "user@example.com")
    formData.set("password", "correctpassword")

    await loginAction({ returnUrl: undefined }, formData)

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard")
  })

  it("redirects to return URL on successful login", async () => {
    const mockSignIn = vi.fn().mockResolvedValue({ error: null })
    const mockSupabase = {
      auth: { signInWithPassword: mockSignIn },
    }

    const { createServerClient } = await import("@/lib/supabase/server")
    vi.mocked(createServerClient).mockResolvedValue(mockSupabase as any)

    const { loginAction } = await import("@/lib/actions/auth-actions")

    const formData = new FormData()
    formData.set("email", "user@example.com")
    formData.set("password", "correctpassword")

    await loginAction({ returnUrl: "/admin" }, formData)

    expect(mockRedirect).toHaveBeenCalledWith("/admin")
  })

  it("returns error message on invalid credentials", async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      error: { message: "Invalid login credentials" },
    })
    const mockSupabase = {
      auth: { signInWithPassword: mockSignIn },
    }

    const { createServerClient } = await import("@/lib/supabase/server")
    vi.mocked(createServerClient).mockResolvedValue(mockSupabase as any)

    const { loginAction } = await import("@/lib/actions/auth-actions")

    const formData = new FormData()
    formData.set("email", "user@example.com")
    formData.set("password", "wrongpassword")

    const result = await loginAction({ returnUrl: undefined }, formData)

    expect(result).toEqual({ error: "Invalid email or password" })
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
