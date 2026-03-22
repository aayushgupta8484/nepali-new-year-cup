// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest"
import { render, screen, cleanup, act } from "@testing-library/react"
import { describe, it, expect, afterEach, beforeEach, vi, afterAll } from "vitest"
import { CountdownTimer } from "./countdown-timer"

afterEach(cleanup)

describe("CountdownTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it("renders correct days, hours, minutes, seconds for a known future date", () => {
    // Fix "now" to a known point in time
    const now = new Date("2026-04-10T00:00:00Z").getTime()
    vi.setSystemTime(now)

    // Target is exactly 1 day, 2 hours, 3 minutes, 4 seconds away
    const target = new Date(now + (1 * 86400 + 2 * 3600 + 3 * 60 + 4) * 1000)

    render(<CountdownTimer targetDate={target} />)

    expect(screen.getByTestId("countdown-days")).toHaveTextContent("1")
    expect(screen.getByTestId("countdown-hours")).toHaveTextContent("2")
    expect(screen.getByTestId("countdown-minutes")).toHaveTextContent("3")
    expect(screen.getByTestId("countdown-seconds")).toHaveTextContent("4")
  })

  it("displays completion message when target date is in the past", () => {
    const now = new Date("2026-04-10T00:00:00Z").getTime()
    vi.setSystemTime(now)

    const past = new Date(now - 1000)
    render(<CountdownTimer targetDate={past} />)

    expect(screen.getByTestId("countdown-complete")).toBeInTheDocument()
    expect(screen.queryByTestId("countdown-days")).not.toBeInTheDocument()
  })

  it("ticks every second and updates the displayed time", () => {
    const now = new Date("2026-04-10T00:00:00Z").getTime()
    vi.setSystemTime(now)

    // 65 seconds in the future: 0d 0h 1m 5s
    const target = new Date(now + 65 * 1000)
    render(<CountdownTimer targetDate={target} />)

    expect(screen.getByTestId("countdown-seconds")).toHaveTextContent("5")

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByTestId("countdown-seconds")).toHaveTextContent("4")
  })

  it("shows completion message when countdown reaches zero", () => {
    const now = new Date("2026-04-10T00:00:00Z").getTime()
    vi.setSystemTime(now)

    // 1 second in the future
    const target = new Date(now + 1000)
    render(<CountdownTimer targetDate={target} />)

    expect(screen.queryByTestId("countdown-complete")).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByTestId("countdown-complete")).toBeInTheDocument()
  })

  it("cleans up interval on unmount", () => {
    const now = new Date("2026-04-10T00:00:00Z").getTime()
    vi.setSystemTime(now)

    const target = new Date(now + 60 * 1000)
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval")

    const { unmount } = render(<CountdownTimer targetDate={target} />)
    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
