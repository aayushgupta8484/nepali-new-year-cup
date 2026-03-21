import { render, screen, cleanup } from "@testing-library/react"
import { describe, it, expect, afterEach } from "vitest"
import { StatusBadge } from "./status-badge"

afterEach(cleanup)

describe("StatusBadge", () => {
  it("renders the status text", () => {
    render(<StatusBadge status="live" />)
    expect(screen.getByText("live")).toBeInTheDocument()
  })

  it("applies red styling for live status", () => {
    render(<StatusBadge status="live" />)
    expect(screen.getByText("live").className).toContain("bg-red")
  })

  it("applies gray styling for completed status", () => {
    render(<StatusBadge status="completed" />)
    expect(screen.getByText("completed").className).toContain("bg-gray")
  })

  it("applies green styling for upcoming status", () => {
    render(<StatusBadge status="upcoming" />)
    expect(screen.getByText("upcoming").className).toContain("bg-green")
  })

  it("applies yellow styling for registration_open status", () => {
    render(<StatusBadge status="registration_open" />)
    expect(screen.getByText("registration_open").className).toContain("bg-yellow")
  })

  it("applies blue styling for in_progress status", () => {
    render(<StatusBadge status="in_progress" />)
    expect(screen.getByText("in_progress").className).toContain("bg-blue")
  })

  it("handles unknown status values with fallback style", () => {
    render(<StatusBadge status={"something_else" as any} />)
    expect(screen.getByText("something_else").className).toContain("bg-gray")
  })
})
