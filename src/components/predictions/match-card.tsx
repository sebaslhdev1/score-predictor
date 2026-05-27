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
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  MapPin,
  Trash2,
  X,
} from "lucide-react"
import Image from "next/image"
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

  const hasWinner = match.winner != null
  const normalizedWinner = match.winner?.toLowerCase()
  const normalizedScore = match.score?.toLowerCase()
  // score like "tie-colombia" means the match went to extra time before a team won
  const isTieScore = normalizedScore?.startsWith("tie-") ?? false
  const winnerKey: PredictionValue =
    normalizedWinner === "tie"
      ? "tie"
      : normalizedWinner === match.local_team.toLowerCase()
        ? isTieScore ? "tie-local" : "local"
        : normalizedWinner === match.away_team.toLowerCase()
          ? isTieScore ? "tie-away" : "away"
          : null
  const hasPrediction = effectivePrediction != null
  const isCorrect =
    hasWinner && hasPrediction && effectivePrediction === winnerKey
  const isPartiallyCorrect =
    !isCorrect &&
    hasWinner &&
    hasPrediction &&
    isTieScore &&
    ((winnerKey === "tie-local" && effectivePrediction === "local") ||
      (winnerKey === "tie-away" && effectivePrediction === "away"))
  const winnerIconCode = hasWinner
    ? winnerKey === "local" || winnerKey === "tie-local"
      ? match.local_team_icon_code
      : winnerKey === "away" || winnerKey === "tie-away"
        ? match.away_team_icon_code
        : null
    : null
  const winnerDisplay =
    normalizedWinner === "tie"
      ? tieLabel
      : isTieScore
        ? `${tieLabel} – ${match.winner}`
        : (match.winner ?? "")

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
        "rounded-xl bg-card p-4 shadow-sm transition-[border-color,box-shadow,opacity] duration-200",
        hasWinner
          ? "border-2"
          : effectiveLocked
            ? "border border-border opacity-75"
            : isPredicted
              ? "border border-transparent shadow-md"
              : "border border-border hover:border-muted-foreground/30",
      )}
      style={
        hasWinner
          ? {
              borderColor: isCorrect
                ? "color-mix(in srgb, var(--brand-green) 55%, transparent)"
                : isPartiallyCorrect || !hasPrediction
                  ? "color-mix(in srgb, var(--brand-dark) 20%, transparent)"
                  : "color-mix(in srgb, var(--destructive) 45%, transparent)",
              boxShadow: isCorrect
                ? "0 2px 12px color-mix(in srgb, var(--brand-green) 12%, transparent)"
                : isPartiallyCorrect || !hasPrediction
                  ? undefined
                  : "0 2px 8px color-mix(in srgb, var(--destructive) 10%, transparent)",
            }
          : !effectiveLocked && isPredicted
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
            {hasWinner ? (
              <div
                className='flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold'
                style={{
                  backgroundColor: isCorrect
                    ? "color-mix(in srgb, var(--brand-green) 12%, transparent)"
                    : isPartiallyCorrect || !hasPrediction
                      ? "color-mix(in srgb, var(--brand-dark) 8%, transparent)"
                      : "color-mix(in srgb, var(--destructive) 10%, transparent)",
                  color: isCorrect
                    ? "var(--brand-green)"
                    : isPartiallyCorrect || !hasPrediction
                      ? "var(--muted-foreground)"
                      : "var(--destructive)",
                }}
              >
                {winnerIconCode && (
                  <Image
                    src={`https://flagcdn.com/w40/${winnerIconCode}.png`}
                    alt={winnerDisplay}
                    width={18}
                    height={13}
                    className='rounded-sm object-cover'
                    unoptimized
                  />
                )}
                <span>{winnerDisplay}</span>
                {hasPrediction && !isPartiallyCorrect &&
                  (isCorrect ? (
                    <Check className='h-3 w-3' />
                  ) : (
                    <X className='h-3 w-3' />
                  ))}
              </div>
            ) : null}
            {hasWinner && match.points_earned != null && match.points_earned > 0 && (
              <span
                className='text-xs font-bold'
                style={{ color: "var(--brand-green)" }}
              >
                +{match.points_earned}
              </span>
            )}
            {!hasWinner && (effectiveLocked ? (
              <Lock className='h-3.5 w-3.5 text-muted-foreground' />
            ) : isPredicted ? (
              <CheckCircle2
                className='h-4 w-4'
                style={{ color: "var(--brand-green)" }}
              />
            ) : null)}
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
