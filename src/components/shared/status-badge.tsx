import { cn } from "@/lib/utils"

const statusColors: Record<string, string> = {
  live: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  upcoming: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  registration_open:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
}

const fallbackColor =
  "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusColors[status] ?? fallbackColor,
        className,
      )}
    >
      {status}
    </span>
  )
}
