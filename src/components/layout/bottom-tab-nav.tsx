"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Trophy, GitBranch, Users } from "lucide-react"

const tabs = [
  { label: "Schedule", icon: Calendar, segment: "schedule" },
  { label: "Standings", icon: Trophy, segment: "standings" },
  { label: "Bracket", icon: GitBranch, segment: "bracket" },
  { label: "Teams", icon: Users, segment: "teams" },
] as const

interface BottomTabNavProps {
  slug: string
}

export function BottomTabNav({ slug }: BottomTabNavProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Tournament navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden"
    >
      <div className="flex">
        {tabs.map(({ label, icon: Icon, segment }) => {
          const href = `/t/${slug}/${segment}`
          const isActive = pathname.startsWith(href)

          return (
            <Link
              key={segment}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs ${
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
