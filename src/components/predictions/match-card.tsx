"use client"

import { useT } from "@/i18n/use-t"
import { cn } from "@/lib/utils"
import {
  formatMatchTime,
  isMatchLocked,
  isMatchToday,
} from "@/services/predictions"
import type { Match, PredictionValue } from "@/types/predictions"
import {
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  MapPin,
  Timer,
  Trash2,
} from "lucide-react"
import Image from "next/image"
import { memo, useCallback, useEffect, useState } from "react"

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000

interface MatchCardProps {
  match: Match
  prediction: PredictionValue
  tieLabel: string
  locked?: boolean
  isPersisted?: boolean
  isClearing?: boolean
  onPredict: (matchId: string, value: PredictionValue) => void
  onClear: (matchId: string) => void
}

interface PredictButtonProps {
  label: string
  flag?: string | null
  value: NonNullable<PredictionValue>
  selected: boolean
  locked: boolean
  onClick: () => void
}

function PredictButton({
  label,
  flag,
  value,
  selected,
  locked,
  onClick,
}: PredictButtonProps) {
  const isTie = value === "tie"
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={cn(
        "flex-1 rounded-lg px-2 py-2.5 text-sm font-medium",
        "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        locked
          ? "cursor-not-allowed opacity-60"
          : selected
            ? "border-transparent text-white shadow-sm"
            : "border-border bg-white text-foreground hover:bg-muted/60",
        !locked && selected
          ? "border-transparent text-white shadow-sm"
          : !locked
            ? "border-border bg-white text-foreground"
            : "",
      )}
      style={
        selected
          ? {
              backgroundColor: isTie
                ? "var(--brand-dark)"
                : "var(--brand-orange)",
            }
          : undefined
      }
    >
      <span className='flex items-center justify-center gap-1.5'>
        {flag && (
          <Image
            src={`https://flagcdn.com/${flag}.svg`}
            alt=''
            width={20}
            height={14}
            unoptimized
            className='rounded-sm'
          />
        )}
        {label}
      </span>
    </button>
  )
}

function Countdown({
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

export const MatchCard = memo(function MatchCard({
  match,
  prediction,
  tieLabel,
  locked = false,
  isPersisted = false,
  isClearing = false,
  onPredict,
  onClear,
}: MatchCardProps) {
  const t = useT()
  const [autoLocked, setAutoLocked] = useState(() =>
    isMatchLocked(match.due_date),
  )
  const handleExpire = useCallback(() => setAutoLocked(true), [])

  const effectiveLocked = locked || autoLocked

  function handlePredict(value: NonNullable<PredictionValue>) {
    if (effectiveLocked) return
    onPredict(match.match_id, effectivePrediction === value ? null : value)
  }

  const effectivePrediction =
    effectiveLocked && !isPersisted ? null : prediction
  const isPredicted = effectivePrediction !== null
  const today = isMatchToday(match.due_date)

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm transition-[border-color,box-shadow,opacity] duration-200",
        effectiveLocked
          ? "border-border opacity-75"
          : isPredicted
            ? "border-transparent shadow-md"
            : "border-border hover:border-muted-foreground/30",
      )}
      style={
        !effectiveLocked && isPredicted
          ? {
              borderColor:
                "color-mix(in srgb, var(--brand-orange) 35%, transparent)",
              boxShadow:
                "0 2px 12px color-mix(in srgb, var(--brand-orange) 12%, transparent)",
            }
          : undefined
      }
    >
      {/* Header row: location + time + today badge | countdown + status icons */}
      <div className='mb-2 flex items-start justify-between gap-2'>
        <div className='flex items-center gap-2 min-w-0 text-xs text-muted-foreground'>
          <div className='flex items-center gap-1 min-w-0'>
            <MapPin className='h-3 w-3 shrink-0' />
            <span className='truncate'>{match.location}</span>
          </div>
          <div className='flex items-center gap-1 shrink-0'>
            <Clock className='h-3 w-3' />
            <span>{formatMatchTime(match.due_date)}</span>
          </div>
          {today && (
            <span
              className='shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white'
              style={{ backgroundColor: "var(--brand-orange)" }}
            >
              {t.predictions.today}
            </span>
          )}
        </div>

        <div className='flex flex-col items-end gap-1 shrink-0'>
          {!effectiveLocked && (
            <Countdown dueDateStr={match.due_date} onExpire={handleExpire} />
          )}
          <div className='flex items-center gap-1.5'>
            {isPersisted && !effectiveLocked && (
              <button
                onClick={() => onClear(match.match_id)}
                disabled={isClearing}
                className='rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isClearing ? (
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Trash2 className='h-3.5 w-3.5' />
                )}
              </button>
            )}
            {effectiveLocked ? (
              <Lock className='h-3.5 w-3.5 text-muted-foreground' />
            ) : isPredicted ? (
              <CheckCircle2
                className='h-4 w-4'
                style={{ color: "var(--brand-green)" }}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Teams */}
      <p className='mb-3 font-semibold text-base leading-snug'>
        {match.local_team}
        <span className='mx-2 text-sm font-normal text-muted-foreground'>
          vs
        </span>
        {match.away_team}
      </p>

      {/* Prediction buttons */}
      <div className='flex flex-col gap-1.5 sm:flex-row sm:gap-2'>
        <PredictButton
          label={match.local_team}
          flag={match.local_team_icon_code}
          value='local'
          selected={effectivePrediction === "local"}
          locked={effectiveLocked}
          onClick={() => handlePredict("local")}
        />
        <PredictButton
          label={tieLabel}
          value='tie'
          selected={effectivePrediction === "tie"}
          locked={effectiveLocked}
          onClick={() => handlePredict("tie")}
        />
        <PredictButton
          label={match.away_team}
          flag={match.away_team_icon_code}
          value='away'
          selected={effectivePrediction === "away"}
          locked={effectiveLocked}
          onClick={() => handlePredict("away")}
        />
      </div>
    </div>
  )
})
