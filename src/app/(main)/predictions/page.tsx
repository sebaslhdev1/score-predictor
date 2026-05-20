"use client"

import { MatchCard } from "@/components/predictions/match-card"
import { useT } from "@/i18n/use-t"
import { useLocale } from "@/i18n/provider"
import {
  buildSubmitPayload,
  formatMatchDate,
  getAvailablePredictions,
  groupMatchesByDate,
  recordPredictions,
} from "@/services/predictions"
import type { Match, PredictionValue } from "@/types/predictions"
import { CheckCircle2, Trophy } from "lucide-react"
import { useEffect, useState } from "react"

function MatchSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-3 w-36 rounded bg-muted" />
        <div className="h-3 w-4 rounded-full bg-muted" />
      </div>
      <div className="h-4 w-52 rounded bg-muted" />
      <div className="flex gap-2">
        <div className="h-10 flex-1 rounded-lg bg-muted" />
        <div className="h-10 w-20 rounded-lg bg-muted" />
        <div className="h-10 flex-1 rounded-lg bg-muted" />
      </div>
    </div>
  )
}

export default function PredictionsPage() {
  const t = useT()
  const { locale } = useLocale()

  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<string, PredictionValue>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    getAvailablePredictions()
      .then((data) => {
        setMatches(data)
        const initial: Record<string, PredictionValue> = {}
        data.forEach((m) => { initial[m.match_id] = m.prediction })
        setPredictions(initial)
        // If they already have predictions, start in submitted state
        if (data.some((m) => m.prediction !== null)) setSubmitted(true)
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }, [])

  function handleClearAll() {
    const cleared: Record<string, PredictionValue> = {}
    matches.forEach((m) => { cleared[m.match_id] = null })
    setPredictions(cleared)
    setSubmitted(false)
    setSubmitError(null)
  }

  function handlePredict(matchId: string, value: PredictionValue) {
    setPredictions((prev) => ({ ...prev, [matchId]: value }))
    setSubmitted(false)
    setSubmitError(null)
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await recordPredictions(buildSubmitPayload(matches, predictions))
      setSubmitted(true)
    } catch {
      setSubmitError(t.predictions.submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalMatches = matches.length
  const predictedCount = Object.values(predictions).filter(Boolean).length
  const progressPct = totalMatches > 0 ? (predictedCount / totalMatches) * 100 : 0
  const matchesByDate = groupMatchesByDate(matches)
  const sortedDates = Object.keys(matchesByDate).sort()

  return (
    <>
      <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-52 md:pb-36">

        {/* Hero header */}
        <div
          className="mb-8 rounded-2xl p-6 text-white"
          style={{
            background: `linear-gradient(135deg, #2b2b2d 0%, var(--brand-dark) 60%, #2b2b2d 100%)`,
          }}
        >
          <div className="mb-1 flex items-center gap-2">
            <Trophy className="h-5 w-5" style={{ color: "var(--brand-orange)" }} />
            <h1 className="text-xl font-bold">{t.predictions.title}</h1>
          </div>
          <p className="mb-4 text-sm" style={{ color: "var(--brand-muted)" }}>
            {t.predictions.subtitle}
          </p>

          {/* Progress bar */}
          {!isLoading && !loadError && totalMatches > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span style={{ color: "var(--brand-muted)" }}>
                  {predictedCount} / {totalMatches} {t.predictions.progressLabel}
                </span>
                <span
                  className="font-semibold"
                  style={{ color: predictedCount === totalMatches ? "var(--brand-green)" : "var(--brand-orange)" }}
                >
                  {Math.round(progressPct)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: predictedCount === totalMatches
                      ? "var(--brand-green)"
                      : "var(--brand-orange)",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Success banner */}
        {submitted && (
          <div
            className="mb-6 flex items-start gap-3 rounded-xl border px-4 py-3"
            style={{
              borderColor: "color-mix(in srgb, var(--brand-green) 35%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--brand-green) 8%, transparent)",
            }}
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand-green)" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--brand-dark)" }}>
                {t.predictions.submitSuccess}
              </p>
              <p className="text-xs text-muted-foreground">{t.predictions.submitSuccessDesc}</p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {submitError && (
          <div
            className="mb-6 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--brand-orange) 40%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--brand-orange) 8%, transparent)",
              color: "var(--brand-dark)",
            }}
          >
            {submitError}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <MatchSkeleton key={i} />)}
          </div>
        )}

        {/* Load error */}
        {!isLoading && loadError && (
          <p className="text-center text-sm text-muted-foreground py-12">
            {t.predictions.loadError}
          </p>
        )}

        {/* Empty */}
        {!isLoading && !loadError && matches.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">
            {t.predictions.noMatches}
          </p>
        )}

        {/* Match list grouped by date */}
        {!isLoading && !loadError && sortedDates.map((date) => (
          <section key={date} className="mb-8">
            <h2
              className="mb-3 text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--brand-orange)" }}
            >
              {formatMatchDate(date, locale)}
            </h2>
            <div className="space-y-3">
              {matchesByDate[date].map((match) => (
                <MatchCard
                  key={match.match_id}
                  match={match}
                  prediction={predictions[match.match_id] ?? null}
                  tieLabel={t.predictions.tie}
                  onPredict={handlePredict}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Sticky submit bar */}
      {!isLoading && !loadError && matches.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 border-t bg-background/95 backdrop-blur-sm md:bottom-0">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm font-medium">
              {predictedCount}{" "}
              <span className="text-muted-foreground font-normal">
                / {totalMatches} {t.predictions.progressLabel}
              </span>
            </p>
            <div className="flex items-center gap-2">
              {predictedCount > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={isSubmitting}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.predictions.clearAll}
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={predictedCount === 0 || isSubmitting || submitted}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--brand-orange)" }}
              >
                {isSubmitting ? t.predictions.submitting : t.predictions.submit}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
