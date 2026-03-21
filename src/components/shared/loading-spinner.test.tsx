import { render, screen, cleanup } from "@testing-library/react"
import { describe, it, expect, afterEach } from "vitest"
import { LoadingSpinner } from "./loading-spinner"

afterEach(cleanup)

describe("LoadingSpinner", () => {
  it("renders with default size", () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole("status")
    expect(spinner).toBeInTheDocument()
    expect(spinner.getAttribute("class")).toContain("size-6")
  })

  it("renders with large size", () => {
    render(<LoadingSpinner size="lg" />)
    const spinner = screen.getByRole("status")
    expect(spinner.getAttribute("class")).toContain("size-8")
  })

  it("renders with small size", () => {
    render(<LoadingSpinner size="sm" />)
    const spinner = screen.getByRole("status")
    expect(spinner.getAttribute("class")).toContain("size-4")
  })

  it("has accessible label", () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading")
  })

  it("contains an animated element", () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole("status")
    expect(spinner.getAttribute("class")).toContain("animate-spin")
  })
})
