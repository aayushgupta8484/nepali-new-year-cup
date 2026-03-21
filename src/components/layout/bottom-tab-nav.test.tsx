import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { BottomTabNav } from './bottom-tab-nav'

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ href, children, className, 'aria-current': ariaCurrent }: { href: string; children: React.ReactNode; className?: string; 'aria-current'?: string }) => (
    <a href={href} className={className} aria-current={ariaCurrent}>{children}</a>
  ),
}))

// Mock next/navigation
const mockPathname = vi.fn(() => '/t/kathmandu-cup/schedule')
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

describe('BottomTabNav', () => {
  const slug = 'kathmandu-cup'

  afterEach(() => {
    cleanup()
  })

  it('renders all 4 tab items with correct labels', () => {
    render(<BottomTabNav slug={slug} />)

    expect(screen.getByText('Schedule')).toBeInTheDocument()
    expect(screen.getByText('Standings')).toBeInTheDocument()
    expect(screen.getByText('Bracket')).toBeInTheDocument()
    expect(screen.getByText('Teams')).toBeInTheDocument()
  })

  it('links point to correct /t/[slug]/* paths', () => {
    render(<BottomTabNav slug={slug} />)

    const links = screen.getAllByRole('link')
    const hrefs = links.map((link) => link.getAttribute('href'))

    expect(hrefs).toContain(`/t/${slug}/schedule`)
    expect(hrefs).toContain(`/t/${slug}/standings`)
    expect(hrefs).toContain(`/t/${slug}/bracket`)
    expect(hrefs).toContain(`/t/${slug}/teams`)
  })

  it('highlights active tab for exact route match', () => {
    mockPathname.mockReturnValue(`/t/${slug}/schedule`)
    render(<BottomTabNav slug={slug} />)

    const scheduleLink = screen.getByText('Schedule').closest('a')
    expect(scheduleLink).toHaveAttribute('aria-current', 'page')

    const standingsLink = screen.getByText('Standings').closest('a')
    expect(standingsLink).not.toHaveAttribute('aria-current', 'page')
  })

  it('highlights active tab for nested route match', () => {
    mockPathname.mockReturnValue(`/t/${slug}/teams/some-team`)
    render(<BottomTabNav slug={slug} />)

    const teamsLink = screen.getByText('Teams').closest('a')
    expect(teamsLink).toHaveAttribute('aria-current', 'page')
  })

  it('highlights standings tab when on standings route', () => {
    mockPathname.mockReturnValue(`/t/${slug}/standings`)
    render(<BottomTabNav slug={slug} />)

    const standingsLink = screen.getByText('Standings').closest('a')
    expect(standingsLink).toHaveAttribute('aria-current', 'page')
  })

  it('highlights bracket tab when on bracket route', () => {
    mockPathname.mockReturnValue(`/t/${slug}/bracket`)
    render(<BottomTabNav slug={slug} />)

    const bracketLink = screen.getByText('Bracket').closest('a')
    expect(bracketLink).toHaveAttribute('aria-current', 'page')
  })
})
