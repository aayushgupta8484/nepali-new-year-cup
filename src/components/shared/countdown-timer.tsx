"use client"

import { useEffect, useState } from "react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(targetDate: Date): TimeLeft | null {
  const diff = targetDate.getTime() - Date.now()
  if (diff <= 0) return null

  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

interface CountdownTimerProps {
  targetDate: Date
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTimeLeft(getTimeLeft(targetDate))

    const id = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(id)
  }, [targetDate])

  if (!mounted) {
    // Suppress SSR/hydration mismatch — render nothing until client-side
    return null
  }

  if (timeLeft === null) {
    return (
      <div data-testid="countdown-complete">Tournament started!</div>
    )
  }

  return (
    <div className="flex gap-4 text-center">
      <div>
        <span data-testid="countdown-days">{timeLeft.days}</span>
        <span>d</span>
      </div>
      <div>
        <span data-testid="countdown-hours">{timeLeft.hours}</span>
        <span>h</span>
      </div>
      <div>
        <span data-testid="countdown-minutes">{timeLeft.minutes}</span>
        <span>m</span>
      </div>
      <div>
        <span data-testid="countdown-seconds">{timeLeft.seconds}</span>
        <span>s</span>
      </div>
    </div>
  )
}
