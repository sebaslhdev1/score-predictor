"use client"

import { useT } from "@/i18n/use-t"
import { cn } from "@/lib/utils"
import {
  formatMatchTime,
  isMatchLocked,
  isMatchToday,
} from "@/services/predictions"
import type { Match, PredictionValue } from "@/types/predictions"
import { CheckCircle2, Clock, Loader2, Lock, MapPin, Trash2 } from "lucide-react"
import { memo, useCallback, useState } from "react"
import { Countdown } from "./countdown"
import { PredictButton } from "./predict-button"

interface MatchCardProps {
  match: Match
  prediction: PredictionValue
  serverPrediction: PredictionValue
  tieLabel: string
  locked?: boolean
  isPersisted?: boolean
  isClearing?: boolean
  onPredict: (matchId: string, value: PredictionValue) => void
  onClear: (matchId: string) => void
}

export const MatchCard = memo(function MatchCard({
  match,
  prediction,
  serverPrediction,
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

  const effectivePrediction = effectiveLocked
    ? isPersisted
      ? serverPrediction
      : null
    : prediction
  const isPredicted =
    effectivePrediction !== null &&
    !(match.match_type === "Knockout" && effectivePrediction === "tie")
  const today = isMatchToday(match.due_date)

  const isTieFamily =
    effectivePrediction === "tie" ||
    effectivePrediction === "tie-local" ||
    effectivePrediction === "tie-away"

  function handlePredict(value: NonNullable<PredictionValue>) {
    if (effectiveLocked) return
    if (value === "tie") {
      onPredict(match.match_id, isTieFamily ? null : "tie")
    } else {
      onPredict(match.match_id, effectivePrediction === value ? null : value)
    }
  }

  function handleKnockoutWinner(value: "tie-local" | "tie-away") {
    if (effectiveLocked) return
    onPredict(match.match_id, effectivePrediction === value ? "tie" : value)
  }

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
      {/* Countdown — mobile only, first row */}
      {!effectiveLocked && (
        <div className='mb-1 sm:hidden'>
          <Countdown dueDateStr={match.due_date} onExpire={handleExpire} />
        </div>
      )}

      {/* Header row: location + time + today badge | status icons */}
      <div className='mb-1 flex items-start justify-between gap-2'>
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
            <div className='hidden sm:flex'>
              <Countdown dueDateStr={match.due_date} onExpire={handleExpire} />
            </div>
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
          selected={isTieFamily}
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

      {/* Knockout tiebreaker — who wins after extra time? */}
      {match.match_type === "Knockout" && isTieFamily && (
        <div className='mt-2 space-y-1.5'>
          <p
            className={cn(
              "text-center text-lg font-semibold",
              effectivePrediction === "tie"
                ? "animate-pulse"
                : "text-muted-foreground font-normal",
            )}
            style={
              effectivePrediction === "tie"
                ? { color: "var(--brand-orange)" }
                : undefined
            }
          >
            {t.predictions.whoWins}
          </p>
          <div className='flex gap-2'>
            <PredictButton
              label={match.local_team}
              flag={match.local_team_icon_code}
              value='local'
              selected={effectivePrediction === "tie-local"}
              locked={effectiveLocked}
              onClick={() => handleKnockoutWinner("tie-local")}
            />
            <PredictButton
              label={match.away_team}
              flag={match.away_team_icon_code}
              value='away'
              selected={effectivePrediction === "tie-away"}
              locked={effectiveLocked}
              onClick={() => handleKnockoutWinner("tie-away")}
            />
          </div>
        </div>
      )}
    </div>
  )
})
