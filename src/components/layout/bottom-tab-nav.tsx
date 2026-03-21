'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Trophy, GitBranch, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Schedule', segment: 'schedule', icon: Calendar },
  { label: 'Standings', segment: 'standings', icon: Trophy },
  { label: 'Bracket', segment: 'bracket', icon: GitBranch },
  { label: 'Teams', segment: 'teams', icon: Users },
] as const

export function BottomTabNav({ slug }: { slug: string }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
      <div className="flex items-center justify-around">
        {tabs.map(({ label, segment, icon: Icon }) => {
          const href = `/t/${slug}/${segment}`
          const isActive = pathname.startsWith(href)

          return (
            <Link
              key={segment}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
