import { render, screen, act, cleanup } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { CountdownTimer } from "./countdown-timer"

describe("CountdownTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it("renders correct countdown for a known future date", () => {
    // Set current time to 2026-04-01T00:00:00Z
    vi.setSystemTime(new Date("2026-04-01T00:00:00Z"))

    // Target: 2026-04-03T12:30:00Z => 2 days, 12 hours, 30 minutes, 0 seconds away
    render(<CountdownTimer targetDate="2026-04-03T12:30:00Z" />)

    expect(screen.getByText("2")).toBeInTheDocument() // days
    expect(screen.getByText("12")).toBeInTheDocument() // hours
    expect(screen.getByText("30")).toBeInTheDocument() // minutes
    expect(screen.getByText("00")).toBeInTheDocument() // seconds
  })

  it("updates the countdown every second", () => {
    vi.setSystemTime(new Date("2026-04-01T00:00:00Z"))

    render(<CountdownTimer targetDate="2026-04-01T00:00:05Z" />)

    // Initially 5 seconds remaining
    expect(screen.getByText("05")).toBeInTheDocument()

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText("04")).toBeInTheDocument()
  })

  it("displays completion message when target date is in the past", () => {
    vi.setSystemTime(new Date("2026-04-05T00:00:00Z"))

    render(<CountdownTimer targetDate="2026-04-01T00:00:00Z" />)

    expect(screen.getByText(/tournament started/i)).toBeInTheDocument()
  })

  it("displays completion message when countdown reaches zero", () => {
    vi.setSystemTime(new Date("2026-04-01T00:00:00Z"))

    render(<CountdownTimer targetDate="2026-04-01T00:00:02Z" />)

    // Advance past the target
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText(/tournament started/i)).toBeInTheDocument()
  })

  it("cleans up interval on unmount", () => {
    vi.setSystemTime(new Date("2026-04-01T00:00:00Z"))
    const clearIntervalSpy = vi.spyOn(global, "clearInterval")

    const { unmount } = render(
      <CountdownTimer targetDate="2026-04-03T00:00:00Z" />
    )

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
