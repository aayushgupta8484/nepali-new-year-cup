import { render, screen, cleanup } from "@testing-library/react"
import { describe, it, expect, afterEach } from "vitest"
import { TeamLogo } from "./team-logo"

afterEach(cleanup)

describe("TeamLogo", () => {
  it("renders img tag when logo_url is provided", () => {
    render(<TeamLogo name="Nepal FC" logoUrl="https://example.com/logo.png" />)
    const img = screen.getByRole("img", { name: "Nepal FC logo" })
    expect(img).toBeInTheDocument()
    expect(img.tagName).toBe("IMG")
    expect(img).toHaveAttribute("src", "https://example.com/logo.png")
  })

  it("renders initials fallback when logo_url is null", () => {
    render(<TeamLogo name="Nepal FC" logoUrl={null} />)
    expect(screen.queryByTagName?.("img") ?? screen.queryByRole("img", { name: "Nepal FC logo" })).toBeInTheDocument()
    expect(screen.getByText("N")).toBeInTheDocument()
  })

  it("renders initials fallback when logo_url is undefined", () => {
    render(<TeamLogo name="Kathmandu Warriors" />)
    const el = screen.getByLabelText("Kathmandu Warriors logo")
    expect(el.tagName).not.toBe("IMG")
    expect(screen.getByText("K")).toBeInTheDocument()
  })

  it("handles empty team name gracefully", () => {
    render(<TeamLogo name="" logoUrl={null} />)
    const fallback = screen.getByLabelText("Team logo")
    expect(fallback).toBeInTheDocument()
  })

  it("has accessible aria label", () => {
    render(<TeamLogo name="Nepal FC" logoUrl={null} />)
    expect(screen.getByLabelText("Nepal FC logo")).toBeInTheDocument()
  })
})
