import { describe, it, expect } from 'vitest'
import { formatDate, formatTime, formatScore, formatMatchTitle } from './format'

describe('formatScore', () => {
  it('formats a normal score', () => {
    expect(formatScore(2, 1)).toBe('2 - 1')
  })

  it('formats a tie score', () => {
    expect(formatScore(0, 0)).toBe('0 - 0')
  })

  it('returns "vs" when both scores are null', () => {
    expect(formatScore(null, null)).toBe('vs')
  })

  it('returns "vs" when both scores are undefined', () => {
    expect(formatScore(undefined, undefined)).toBe('vs')
  })

  it('returns "vs" when one score is null', () => {
    expect(formatScore(2, null)).toBe('vs')
    expect(formatScore(null, 1)).toBe('vs')
  })
})

describe('formatDate', () => {
  it('formats a date string into a readable format', () => {
    const result = formatDate('2026-04-14')
    expect(result).toContain('Apr')
    expect(result).toContain('14')
    expect(result).toContain('2026')
  })

  it('handles timezone correctly for Seattle (PST/PDT)', () => {
    // April 14 is in PDT (UTC-7)
    // The date should not shift when formatted in America/Los_Angeles
    const result = formatDate('2026-04-14', 'America/Los_Angeles')
    expect(result).toContain('14')
    expect(result).toContain('Apr')
  })

  it('returns empty string for null/undefined input', () => {
    expect(formatDate(null as any)).toBe('')
    expect(formatDate(undefined as any)).toBe('')
  })
})

describe('formatTime', () => {
  it('formats an ISO datetime to a time string', () => {
    const result = formatTime('2026-04-14T14:30:00Z', 'America/Los_Angeles')
    // 14:30 UTC = 7:30 AM PDT
    expect(result).toContain('7')
    expect(result).toContain('30')
  })

  it('returns empty string for null/undefined input', () => {
    expect(formatTime(null as any)).toBe('')
    expect(formatTime(undefined as any)).toBe('')
  })
})

describe('formatMatchTitle', () => {
  it('formats a match title with two team names', () => {
    expect(formatMatchTitle('Team A', 'Team B')).toBe('Team A vs Team B')
  })

  it('handles null/undefined team names with TBD', () => {
    expect(formatMatchTitle(null as any, 'Team B')).toBe('TBD vs Team B')
    expect(formatMatchTitle('Team A', undefined as any)).toBe('Team A vs TBD')
    expect(formatMatchTitle(null as any, null as any)).toBe('TBD vs TBD')
  })
})
