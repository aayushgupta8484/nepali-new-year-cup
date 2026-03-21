import { describe, it, expect, vi, afterEach } from 'vitest'
import { getTournamentPhase } from './tournament-status'

function makeTournament(overrides: Partial<Parameters<typeof getTournamentPhase>[0]> = {}) {
  return {
    start_date: '2026-04-14',
    end_date: '2026-04-19',
    status: 'group_stage' as const,
    ...overrides,
  }
}

describe('getTournamentPhase', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns 'pre' when current date is before start_date", () => {
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'))
    const result = getTournamentPhase(makeTournament())
    expect(result).toBe('pre')
  })

  it("returns 'live' when date is between start and end and status is group_stage", () => {
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'))
    const result = getTournamentPhase(makeTournament({ status: 'group_stage' }))
    expect(result).toBe('live')
  })

  it("returns 'live' when date is on start_date with an active status", () => {
    vi.setSystemTime(new Date('2026-04-14T12:00:00Z'))
    const result = getTournamentPhase(makeTournament({ status: 'knockout' }))
    expect(result).toBe('live')
  })

  it("returns 'live' when date is on end_date (end date is inclusive)", () => {
    vi.setSystemTime(new Date('2026-04-19T23:59:59Z'))
    const result = getTournamentPhase(makeTournament({ status: 'knockout' }))
    expect(result).toBe('live')
  })

  it("returns 'post' when status is completed regardless of date", () => {
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'))
    const result = getTournamentPhase(makeTournament({ status: 'completed' }))
    expect(result).toBe('post')
  })

  it("returns 'post' when date is after end_date", () => {
    vi.setSystemTime(new Date('2026-04-25T12:00:00Z'))
    const result = getTournamentPhase(makeTournament({ status: 'group_stage' }))
    expect(result).toBe('post')
  })

  it("returns 'pre' when on start_date but status is still 'registration' (status-driven)", () => {
    vi.setSystemTime(new Date('2026-04-14T12:00:00Z'))
    const result = getTournamentPhase(makeTournament({ status: 'registration' }))
    expect(result).toBe('pre')
  })

  it("returns 'pre' when status is 'upcoming'", () => {
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'))
    const result = getTournamentPhase(makeTournament({ status: 'upcoming' }))
    expect(result).toBe('pre')
  })

  it('handles null/undefined tournament gracefully', () => {
    expect(getTournamentPhase(null as any)).toBe('pre')
    expect(getTournamentPhase(undefined as any)).toBe('pre')
  })

  it('handles missing dates gracefully', () => {
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'))
    const result = getTournamentPhase(makeTournament({ start_date: null as any, end_date: null as any }))
    expect(result).toBe('pre')
  })
})
