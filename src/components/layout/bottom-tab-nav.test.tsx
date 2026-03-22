import { render, screen, cleanup } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { BottomTabNav } from "./bottom-tab-nav"

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock next/navigation
const mockPathname = vi.fn(() => "/t/spring-2026/schedule")
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}))

describe("BottomTabNav", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders all 4 tab items with correct labels", () => {
    render(<BottomTabNav slug="spring-2026" />)

    expect(screen.getByText("Schedule")).toBeInTheDocument()
    expect(screen.getByText("Standings")).toBeInTheDocument()
    expect(screen.getByText("Bracket")).toBeInTheDocument()
    expect(screen.getByText("Teams")).toBeInTheDocument()
  })

  it("links point to correct /t/[slug]/* paths", () => {
    render(<BottomTabNav slug="spring-2026" />)

    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(4)

    expect(links[0]).toHaveAttribute("href", "/t/spring-2026/schedule")
    expect(links[1]).toHaveAttribute("href", "/t/spring-2026/standings")
    expect(links[2]).toHaveAttribute("href", "/t/spring-2026/bracket")
    expect(links[3]).toHaveAttribute("href", "/t/spring-2026/teams")
  })

  it("highlights active tab for schedule route", () => {
    mockPathname.mockReturnValue("/t/spring-2026/schedule")
    render(<BottomTabNav slug="spring-2026" />)

    const scheduleLink = screen.getByText("Schedule").closest("a")
    const standingsLink = screen.getByText("Standings").closest("a")

    expect(scheduleLink).toHaveAttribute("aria-current", "page")
    expect(standingsLink).not.toHaveAttribute("aria-current", "page")
  })

  it("highlights active tab for standings route", () => {
    mockPathname.mockReturnValue("/t/spring-2026/standings")
    render(<BottomTabNav slug="spring-2026" />)

    const standingsLink = screen.getByText("Standings").closest("a")
    expect(standingsLink).toHaveAttribute("aria-current", "page")
  })

  it("highlights active tab for nested routes", () => {
    mockPathname.mockReturnValue("/t/spring-2026/teams/team-a")
    render(<BottomTabNav slug="spring-2026" />)

    const teamsLink = screen.getByText("Teams").closest("a")
    expect(teamsLink).toHaveAttribute("aria-current", "page")
  })

  it("has nav landmark with proper label", () => {
    render(<BottomTabNav slug="spring-2026" />)

    expect(
      screen.getByRole("navigation", { name: /tournament/i })
    ).toBeInTheDocument()
  })
})
