"use client"

import { useT } from "@/i18n/use-t"
import { Timer } from "lucide-react"
import { useEffect, useState } from "react"

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000

export function Countdown({
  dueDateStr,
  onExpire,
}: {
  dueDateStr: string
  onExpire: () => void
}) {
  const t = useT()
  const dueMs = new Date(dueDateStr + "-05:00").getTime()
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, dueMs - Date.now()),
  )

  useEffect(() => {
    if (dueMs <= Date.now()) return
    const id = setInterval(() => {
      const r = Math.max(0, dueMs - Date.now())
      setRemaining(r)
      if (r === 0) onExpire()
    }, 1000)
    return () => clearInterval(id)
  }, [dueMs, onExpire])

  if (remaining <= 0 || remaining > FIVE_HOURS_MS) return null

  const totalSeconds = Math.floor(remaining / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const timeStr =
    hours > 0
      ? `${hours}h ${minutes}m`
      : minutes > 0
        ? `${minutes}m ${seconds}s`
        : `${seconds}s`

  return (
    <div
      className='flex items-center gap-1 text-xs font-semibold'
      style={{ color: "var(--brand-orange)" }}
    >
      <Timer className='h-3 w-3 shrink-0' />
      <span>
        {t.predictions.closesIn} {timeStr}
      </span>
    </div>
  )
}
