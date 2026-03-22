// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"

// redirect throws to simulate Next.js behavior
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const err = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: `NEXT_REDIRECT;replace;${url}`,
    })
    throw err
  }),
}))

const mockGetUser = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

import AdminLayout from "../layout"

afterEach(cleanup)

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects unauthenticated user to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(
      AdminLayout({ children: <div /> })
    ).rejects.toMatchObject({
      digest: expect.stringContaining("/login"),
    })
  })

  it("redirects non-admin authenticated user to /dashboard", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "spectator" } }),
    })

    await expect(
      AdminLayout({ children: <div /> })
    ).rejects.toMatchObject({
      digest: expect.stringContaining("/dashboard"),
    })
  })

  it("renders sidebar with Tournaments navigation link for admin user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
    })

    const result = await AdminLayout({ children: <div /> })
    render(result)

    expect(
      screen.getByRole("link", { name: /tournaments/i })
    ).toBeInTheDocument()
  })

  it("renders sidebar with Create New navigation link for admin user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
    })

    const result = await AdminLayout({ children: <div /> })
    render(result)

    expect(
      screen.getByRole("link", { name: /create new/i })
    ).toBeInTheDocument()
  })

  it("renders children for admin user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
    })

    const result = await AdminLayout({
      children: <p>admin child content</p>,
    })
    render(result)

    expect(screen.getByText("admin child content")).toBeInTheDocument()
  })
})
