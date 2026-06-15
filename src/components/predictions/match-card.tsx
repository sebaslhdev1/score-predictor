"use client"

import { useT } from "@/i18n/use-t"
import { cn } from "@/lib/utils"
import {
  formatMatchTime,
  isMatchLocked,
  isMatchToday,
  recordMatchResult,
} from "@/services/predictions"
import type { Match, PredictionValue } from "@/types/predictions"
import {
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  Trash2,
  X,
} from "lucide-react"
import Image from "next/image"
import { memo, useCallback, useState } from "react"
import { toast } from "sonner"
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
  isOwner?: boolean
  onPredict: (matchId: string, value: PredictionValue) => void
  onClear: (matchId: string) => void
  onResultRecorded?: (
    matchId: string,
    localScore: number,
    awayScore: number,
    knockoutWinner?: string,
  ) => void
}

export const MatchCard = memo(function MatchCard({
  match,
  prediction,
  serverPrediction,
  tieLabel,
  locked = false,
  isPersisted = false,
  isClearing = false,
  isOwner = false,
  onPredict,
  onClear,
  onResultRecorded,
}: MatchCardProps) {
  const t = useT()
  const [autoLocked, setAutoLocked] = useState(() =>
    isMatchLocked(match.due_date),
  )
  const handleExpire = useCallback(() => setAutoLocked(true), [])

  const [editingResult, setEditingResult] = useState(false)
  const [localScoreInput, setLocalScoreInput] = useState("")
  const [awayScoreInput, setAwayScoreInput] = useState("")
  const [knockoutWinner, setKnockoutWinner] = useState<string | null>(null)
  const [isSavingResult, setIsSavingResult] = useState(false)

  const parsedLocal = parseInt(localScoreInput, 10)
  const parsedAway = parseInt(awayScoreInput, 10)
  const isKnockoutTie =
    match.match_type === "Knockout" &&
    localScoreInput !== "" &&
    awayScoreInput !== "" &&
    !isNaN(parsedLocal) &&
    !isNaN(parsedAway) &&
    parsedLocal >= 0 &&
    parsedAway >= 0 &&
    parsedLocal === parsedAway

  async function handleSaveResult() {
    const ls = parsedLocal
    const as = parsedAway
    if (isNaN(ls) || isNaN(as) || ls < 0 || as < 0) return
    if (isKnockoutTie && !knockoutWinner) return
    setIsSavingResult(true)
    try {
      await recordMatchResult(
        match.match_id,
        ls,
        as,
        isKnockoutTie ? (knockoutWinner ?? undefined) : undefined,
      )
      onResultRecorded?.(
        match.match_id,
        ls,
        as,
        isKnockoutTie ? (knockoutWinner ?? undefined) : undefined,
      )
      toast.success(t.predictions.resultSaved)
      setEditingResult(false)
      setLocalScoreInput("")
      setAwayScoreInput("")
      setKnockoutWinner(null)
    } finally {
      setIsSavingResult(false)
    }
  }

  function cancelEdit() {
    setEditingResult(false)
    setLocalScoreInput("")
    setAwayScoreInput("")
    setKnockoutWinner(null)
  }

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
        ? isTieScore
          ? "tie-local"
          : "local"
        : normalizedWinner === match.away_team.toLowerCase()
          ? isTieScore
            ? "tie-away"
            : "away"
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
                : isPartiallyCorrect
                  ? "color-mix(in srgb, var(--brand-dark) 20%, transparent)"
                  : "color-mix(in srgb, var(--destructive) 45%, transparent)",
              boxShadow: isCorrect
                ? "0 2px 12px color-mix(in srgb, var(--brand-green) 12%, transparent)"
                : isPartiallyCorrect
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
                {hasPrediction &&
                  !isPartiallyCorrect &&
                  (isCorrect ? (
                    <Check className='h-3 w-3' />
                  ) : (
                    <X className='h-3 w-3' />
                  ))}
              </div>
            ) : null}
            {hasWinner &&
              match.points_earned != null &&
              match.points_earned > 0 && (
                <span
                  className='text-xs font-bold'
                  style={{ color: "var(--brand-green)" }}
                >
                  +{match.points_earned}
                </span>
              )}
            {!hasWinner && effectiveLocked && isOwner && !editingResult && (
              <button
                onClick={() => setEditingResult(true)}
                className='rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground'
              >
                <Pencil className='h-3.5 w-3.5' />
              </button>
            )}
            {!hasWinner &&
              (effectiveLocked ? (
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
      {hasWinner && match.local_score != null && match.away_score != null ? (
        <p className='flex justify-center items-center mb-3 font-semibold text-base leading-snug'>
          {match.local_team}
          <span
            className='mx-1.5 text-xl font-bold tabular-nums'
            style={{ color: "var(--brand-dark)" }}
          >
            {match.local_score}
          </span>
          <span className='text-sm font-normal text-muted-foreground'>vs</span>
          <span
            className='mx-1.5 text-xl font-bold tabular-nums'
            style={{ color: "var(--brand-dark)" }}
          >
            {match.away_score}
          </span>
          {match.away_team}
        </p>
      ) : (
        <p className='mb-3 font-semibold text-base leading-snug'>
          {match.local_team}
          <span className='mx-2 text-sm font-normal text-muted-foreground'>
            vs
          </span>
          {match.away_team}
        </p>
      )}

      {/* Owner result entry */}
      {editingResult ? (
        <div className='space-y-2.5'>
          {/* Mobile: vertical stack. Desktop (sm+): horizontal row */}
          <div className='flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2'>
            {/* Local */}
            <div className='flex w-full flex-col items-center gap-1 sm:flex-1 sm:flex-row sm:justify-end sm:gap-2 sm:min-w-0'>
              <span className='text-sm font-semibold sm:truncate sm:text-right'>
                {match.local_team}
              </span>
              <input
                type='number'
                min={0}
                value={localScoreInput}
                onChange={(e) => {
                  setLocalScoreInput(e.target.value)
                  setKnockoutWinner(null)
                }}
                placeholder='0'
                autoFocus
                className='w-20 rounded-lg border px-1 py-2 text-center text-xl font-bold outline-none transition-colors sm:w-14 sm:py-1.5 sm:text-lg'
                style={{ borderColor: "var(--border)" }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--brand-orange)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              />
            </div>
            <span className='shrink-0 text-sm font-semibold text-muted-foreground'>
              vs
            </span>
            {/* Away */}
            <div className='flex w-full flex-col items-center gap-1 sm:flex-1 sm:flex-row sm:gap-2 sm:min-w-0'>
              <input
                type='number'
                min={0}
                value={awayScoreInput}
                onChange={(e) => {
                  setAwayScoreInput(e.target.value)
                  setKnockoutWinner(null)
                }}
                placeholder='0'
                className='w-20 rounded-lg border px-1 py-2 text-center text-xl font-bold outline-none transition-colors sm:w-14 sm:py-1.5 sm:text-lg'
                style={{ borderColor: "var(--border)" }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--brand-orange)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              />
              <span className='text-sm font-semibold sm:truncate'>
                {match.away_team}
              </span>
            </div>
          </div>
          {/* Knockout tie-breaker: who won after extra time? */}
          {isKnockoutTie && (
            <div className='space-y-1.5'>
              <p
                className={cn(
                  "text-center text-sm font-semibold",
                  !knockoutWinner ? "animate-pulse" : "text-muted-foreground",
                )}
                style={
                  !knockoutWinner ? { color: "var(--brand-orange)" } : undefined
                }
              >
                {t.predictions.whoWins}
              </p>
              <div className='flex gap-2'>
                <PredictButton
                  label={match.local_team}
                  flag={match.local_team_icon_code}
                  value='local'
                  selected={knockoutWinner === match.local_team}
                  locked={false}
                  onClick={() =>
                    setKnockoutWinner((prev) =>
                      prev === match.local_team ? null : match.local_team,
                    )
                  }
                />
                <PredictButton
                  label={match.away_team}
                  flag={match.away_team_icon_code}
                  value='away'
                  selected={knockoutWinner === match.away_team}
                  locked={false}
                  onClick={() =>
                    setKnockoutWinner((prev) =>
                      prev === match.away_team ? null : match.away_team,
                    )
                  }
                />
              </div>
            </div>
          )}
          {/* Buttons: stacked on mobile, side by side on desktop */}
          <div className='flex flex-col gap-2 sm:flex-row'>
            <button
              onClick={handleSaveResult}
              disabled={
                isSavingResult ||
                localScoreInput === "" ||
                awayScoreInput === "" ||
                (isKnockoutTie && !knockoutWinner)
              }
              className='flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 sm:flex-1 sm:py-2'
              style={{ backgroundColor: "var(--brand-orange)" }}
            >
              {isSavingResult ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Check className='h-4 w-4' />
              )}
              {isSavingResult
                ? t.predictions.savingResult
                : t.predictions.saveResult}
            </button>
            <button
              onClick={cancelEdit}
              disabled={isSavingResult}
              className='w-full rounded-lg border py-2.5 text-sm font-semibold text-foreground transition-colors hover:text-muted-foreground disabled:opacity-50 sm:w-auto sm:px-4 sm:py-2'
              style={{ borderColor: "var(--border)" }}
            >
              {t.predictions.cancelResult}
            </button>
          </div>
        </div>
      ) : (
        /* Prediction buttons */
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
      )}

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
