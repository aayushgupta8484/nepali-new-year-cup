"use client"

import { useEffect, useState } from "react"

interface CountdownTimerProps {
  targetDate: string
}

function getTimeRemaining(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return null

  const seconds = Math.floor((diff / 1000) % 60)
  const minutes = Math.floor((diff / 1000 / 60) % 60)
  const hours = Math.floor((diff / 1000 / 60 / 60) % 24)
  const days = Math.floor(diff / 1000 / 60 / 60 / 24)

  return { days, hours, minutes, seconds }
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [mounted, setMounted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<ReturnType<
    typeof getTimeRemaining
  > | null>(null)

  useEffect(() => {
    setMounted(true)
    setTimeRemaining(getTimeRemaining(targetDate))

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(targetDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  if (!mounted) {
    return <div data-slot="countdown-timer" aria-label="Countdown timer" />
  }

  if (!timeRemaining) {
    return (
      <div data-slot="countdown-timer">
        <p>Tournament started!</p>
      </div>
    )
  }

  const { days, hours, minutes, seconds } = timeRemaining

  return (
    <div data-slot="countdown-timer" aria-label="Countdown timer">
      <div>
        <span>{days}</span>
        <span>Days</span>
      </div>
      <div>
        <span>{pad(hours)}</span>
        <span>Hours</span>
      </div>
      <div>
        <span>{pad(minutes)}</span>
        <span>Minutes</span>
      </div>
      <div>
        <span>{pad(seconds)}</span>
        <span>Seconds</span>
      </div>
    </div>
  )
}
