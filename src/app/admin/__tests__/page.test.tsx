// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn().mockResolvedValue({
    from: mockFrom,
  }),
}))

import AdminPage from "../page"

afterEach(cleanup)

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists all tournaments", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: "1", name: "Nepali Cup 2025", year: 2025, slug: "nepali-cup-2025", status: "active" },
          { id: "2", name: "Nepali Cup 2024", year: 2024, slug: "nepali-cup-2024", status: "completed" },
        ],
      }),
    })

    const result = await AdminPage()
    render(result)

    expect(screen.getByText("Nepali Cup 2025")).toBeInTheDocument()
    expect(screen.getByText("Nepali Cup 2024")).toBeInTheDocument()
  })

  it("shows draft tournaments in admin view", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: "1", name: "Draft Cup 2026", year: 2026, slug: "draft-cup-2026", status: "draft" },
        ],
      }),
    })

    const result = await AdminPage()
    render(result)

    expect(screen.getByText("Draft Cup 2026")).toBeInTheDocument()
    expect(screen.getByText("draft")).toBeInTheDocument()
  })

  it("displays tournament status for each tournament", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: "1", name: "Active Cup", year: 2025, slug: "active-cup-2025", status: "active" },
        ],
      }),
    })

    const result = await AdminPage()
    render(result)

    expect(screen.getByText("active")).toBeInTheDocument()
  })

  it("shows Create New tournament link", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
    })

    const result = await AdminPage()
    render(result)

    expect(
      screen.getByRole("link", { name: /create new/i })
    ).toBeInTheDocument()
  })

  it("links each tournament to its admin detail page", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: "1", name: "Nepali Cup 2025", year: 2025, slug: "nepali-cup-2025", status: "active" },
        ],
      }),
    })

    const result = await AdminPage()
    render(result)

    const link = screen.getByRole("link", { name: /nepali cup 2025/i })
    expect(link).toHaveAttribute("href", "/admin/tournaments/nepali-cup-2025")
  })
})
