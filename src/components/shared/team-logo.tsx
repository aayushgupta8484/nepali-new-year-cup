import Image from "next/image"
import { cn } from "@/lib/utils"

interface TeamLogoProps {
  name: string
  logoUrl?: string | null
  size?: number
  className?: string
}

export function TeamLogo({
  name,
  logoUrl,
  size = 40,
  className,
}: TeamLogoProps) {
  const initial = name.charAt(0).toUpperCase()
  const label = name ? `${name} logo` : "Team logo"

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={label}
        width={size}
        height={size}
        unoptimized
        className={cn("rounded-full object-cover", className)}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: size, height: size }}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground",
        className,
      )}
    >
      {initial || null}
    </div>
  )
}
