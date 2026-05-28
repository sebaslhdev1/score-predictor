"use client"

import { ChampionPicker } from "@/components/predictions/champion-picker"
import { MatchCard } from "@/components/predictions/match-card"
import { useLocale } from "@/i18n/provider"
import { useT } from "@/i18n/use-t"
import {
  buildSubmitPayload,
  formatMatchDate,
  getClosedMatches,
  getQuestions,
  getTournamentById,
  groupMatchesByDate,
  isMatchLocked,
  recordPredictions,
  scoreToPrediction,
} from "@/services/predictions"
import type { Match, PredictionValue } from "@/types/predictions"
import type { Question, QuestionOption, QuestionPrediction } from "@/types/questions"
import { ChevronDown, ChevronLeft, Loader2, Lock, Trophy } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

function MatchSkeleton() {
  return (
    <div className='rounded-xl border bg-card p-4 animate-pulse space-y-3'>
      <div className='flex justify-between'>
        <div className='h-3 w-36 rounded bg-muted' />
        <div className='h-3 w-4 rounded-full bg-muted' />
      </div>
      <div className='h-4 w-52 rounded bg-muted' />
      <div className='flex gap-2'>
        <div className='h-10 flex-1 rounded-lg bg-muted' />
        <div className='h-10 w-20 rounded-lg bg-muted' />
        <div className='h-10 flex-1 rounded-lg bg-muted' />
      </div>
    </div>
  )
}

export default function PredictionsPage() {
  const t = useT()
  const { locale } = useLocale()
  const { id: tournamentId } = useParams() as { id: string }

  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<
    Record<string, PredictionValue>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [clearingMatchId, setClearingMatchId] = useState<string | null>(null)
  const [isDiscarding, setIsDiscarding] = useState(false)
  const [serverPredictions, setServerPredictions] = useState<
    Record<string, PredictionValue>
  >({})
  const [persistedMatchIds, setPersistedMatchIds] = useState<Set<string>>(
    new Set(),
  )
  const [tournamentName, setTournamentName] = useState<string | null>(null)
  const [closedOpen, setClosedOpen] = useState(false)
  const [closedMatches, setClosedMatches] = useState<Match[]>([])
  const [closedLoading, setClosedLoading] = useState(false)
  const [closedLoaded, setClosedLoaded] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionPicks, setQuestionPicks] = useState<Record<string, QuestionOption | null>>({})
  const [serverQuestionPicks, setServerQuestionPicks] = useState<Record<string, QuestionOption | null>>({})

  function handleToggleClosed() {
    setClosedOpen((prev) => !prev)
    if (!closedLoaded) {
      setClosedLoading(true)
      getClosedMatches(tournamentId)
        .then(setClosedMatches)
        .catch(() => {})
        .finally(() => {
          setClosedLoading(false)
          setClosedLoaded(true)
        })
    }
  }

  useEffect(() => {
    Promise.all([getTournamentById(tournamentId), getQuestions(tournamentId).catch(() => [])])
      .then(([{ name, matches: data }, qs]) => {
        setTournamentName(name)
        setMatches(data)
        setQuestions(qs)
        const initialQuestionPicks: Record<string, QuestionOption | null> = {}
        qs.forEach((q) => { initialQuestionPicks[q.id] = q.answer ?? null })
        setQuestionPicks(initialQuestionPicks)
        setServerQuestionPicks(initialQuestionPicks)
        const initial: Record<string, PredictionValue> = {}
        data.forEach((m) => {
          initial[m.match_id] = scoreToPrediction(m)
        })
        setPredictions(initial)
        setServerPredictions(initial)
        if (data.some((m) => m.score !== null)) setSubmitted(true)
        setPersistedMatchIds(
          new Set(data.filter((m) => m.score !== null).map((m) => m.match_id)),
        )
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }, [tournamentId])

  function handleDiscard() {
    setPredictions((prev) => {
      const next = { ...prev }
      matches.forEach((m) => {
        next[m.match_id] = serverPredictions[m.match_id] ?? null
      })
      return next
    })
    setQuestionPicks((prev) => {
      const next = { ...prev }
      questions.forEach((q) => {
        next[q.id] = serverQuestionPicks[q.id] ?? null
      })
      return next
    })
    setSubmitError(null)
  }

  async function handleResetAll() {
    setIsDiscarding(true)
    try {
      await recordPredictions(
        matches.map((m) => ({ match_id: m.match_id, score: null })),
      )
      const cleared: Record<string, PredictionValue> = {}
      matches.forEach((m) => {
        cleared[m.match_id] = null
      })
      setPredictions(cleared)
      setServerPredictions(cleared)
      setPersistedMatchIds(new Set())
      setSubmitted(false)
      setSubmitError(null)
      toast.info(t.predictions.predictionRemoved)
    } catch {
      toast.error(t.predictions.submitError)
    } finally {
      setIsDiscarding(false)
    }
  }

  const handlePredict = useCallback(
    (matchId: string, value: PredictionValue) => {
      setPredictions((prev) => ({ ...prev, [matchId]: value }))
      setSubmitted(false)
      setSubmitError(null)
    },
    [],
  )

  const notifyBlocked = useCallback(
    (blockedIds: string[]) => {
      blockedIds.forEach((id) => {
        const match = matches.find((m) => m.match_id === id)
        const label = match ? `${match.local_team} vs ${match.away_team}` : id
        toast.error(`${label} — ${t.predictions.predictionBlocked}`)
      })
    },
    [matches, t.predictions.predictionBlocked],
  )

  const handleClearMatch = useCallback(
    async (matchId: string) => {
      setClearingMatchId(matchId)
      setPredictions((prev) => ({ ...prev, [matchId]: null }))
      try {
        const { blocked } = await recordPredictions([
          { match_id: matchId, score: null },
        ])
        if (blocked.length === 0) {
          toast.success(t.predictions.predictionRemoved)
          setServerPredictions((prev) => ({ ...prev, [matchId]: null }))
          setPersistedMatchIds((prev) => {
            const next = new Set(prev)
            next.delete(matchId)
            return next
          })
        } else {
          notifyBlocked(blocked)
        }
      } finally {
        setClearingMatchId(null)
      }
    },
    [t, notifyBlocked],
  )

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const questionPredictions: QuestionPrediction[] = questions
        .filter((q) => questionPicks[q.id] != null)
        .map((q) => ({ question_id: q.id, option_id: questionPicks[q.id]!.id }))
      const { blocked } = await recordPredictions(
        buildSubmitPayload(matches, predictions),
        questionPredictions,
      )
      setSubmitted(true)
      const savedIds = matches
        .filter((m) => {
          const v = predictions[m.match_id] ?? null
          if (v === null) return false
          if (m.match_type === "Knockout" && v === "tie") return false
          return !blocked.includes(m.match_id)
        })
        .map((m) => m.match_id)
      setServerPredictions((prev) => {
        const next = { ...prev }
        savedIds.forEach((id) => {
          next[id] = predictions[id]
        })
        return next
      })
      setPersistedMatchIds((prev) => new Set([...prev, ...savedIds]))
      setServerQuestionPicks((prev) => {
        const next = { ...prev }
        questions.forEach((q) => { next[q.id] = questionPicks[q.id] ?? null })
        return next
      })
      // Revert incomplete KO ties back to their server-saved state
      setPredictions((prev) => {
        const next = { ...prev }
        matches.forEach((m) => {
          if (m.match_type === "Knockout" && (next[m.match_id] ?? null) === "tie") {
            next[m.match_id] = serverPredictions[m.match_id] ?? null
          }
        })
        return next
      })
      toast.success(t.predictions.submitSuccess)
      if (blocked.length > 0) notifyBlocked(blocked)
    } catch {
      setSubmitError(t.predictions.submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalMatches = matches.length
  const predictedCount = matches.filter((m) => {
    const p = predictions[m.match_id] ?? null
    if (p === null) return false
    if (m.match_type === "Knockout" && p === "tie") return false
    return true
  }).length
  const submittable = (m: Match, p: PredictionValue) =>
    m.match_type === "Knockout" && p === "tie" ? null : p

  const unsubmittedCount =
    matches.filter((m) => {
      const rawLocal = predictions[m.match_id] ?? null
      if (m.match_type === "Knockout" && rawLocal === "tie") return false
      const local = submittable(m, rawLocal)
      const server = submittable(m, serverPredictions[m.match_id] ?? null)
      return local !== server
    }).length +
    questions.filter((q) => {
      const local = questionPicks[q.id] ?? null
      const server = serverQuestionPicks[q.id] ?? null
      return local?.id !== server?.id
    }).length
  const progressPct =
    totalMatches > 0 ? (predictedCount / totalMatches) * 100 : 0
  const matchesByDate = groupMatchesByDate(matches)
  const sortedDates = Object.keys(matchesByDate).sort()

  return (
    <>
      <main className='mx-auto w-full max-w-3xl px-4 py-8 pb-32 md:pb-20'>
        {/* Back button */}
        <Link
          href='/tournaments'
          className='mb-4 flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
        >
          <ChevronLeft className='h-4 w-4' />
          {t.tournaments.title}
        </Link>

        {/* Hero header */}
        <div
          className='mb-8 rounded-2xl p-5 text-white'
          style={{
            background: `linear-gradient(135deg, #2b2b2d 0%, var(--brand-dark) 60%, #2b2b2d 100%)`,
          }}
        >
          {/* Title row */}
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Trophy
                className='h-5 w-5'
                style={{ color: "var(--brand-orange)" }}
              />
              <div>
                <h1 className='text-lg font-bold'>{t.predictions.title}</h1>
                {tournamentName && (
                  <p
                    className='text-xs font-medium'
                    style={{ color: "var(--brand-muted)" }}
                  >
                    {tournamentName}
                  </p>
                )}
              </div>
            </div>
            {persistedMatchIds.size > 0 && (
              <button
                onClick={handleResetAll}
                disabled={isDiscarding || isSubmitting}
                className='flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40'
                style={{
                  backgroundColor: "var(--brand-orange)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {isDiscarding ? (
                  <Loader2 className='h-3 w-3 animate-spin' />
                ) : (
                  t.predictions.resetAll
                )}
              </button>
            )}
          </div>

          {/* Progress */}
          {!isLoading && !loadError && totalMatches > 0 && (
            <div>
              <div className='mb-2 flex items-baseline gap-1'>
                <span className='text-3xl font-bold tabular-nums'>
                  {predictedCount}
                </span>
                <span
                  className='text-lg font-light'
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  /
                </span>
                <span
                  className='text-lg font-semibold'
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {totalMatches}
                </span>
                <span
                  className='ml-1 text-sm'
                  style={{ color: "var(--brand-muted)" }}
                >
                  {t.predictions.progressLabel}
                </span>
              </div>
              <div className='h-1.5 w-full overflow-hidden rounded-full bg-white/10'>
                <div
                  className='h-full rounded-full transition-all duration-500'
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor:
                      predictedCount === totalMatches
                        ? "var(--brand-green)"
                        : "var(--brand-orange)",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Question predictions */}
        {questions.map((q) => (
          <ChampionPicker
            key={q.id}
            question={q}
            value={questionPicks[q.id] ?? null}
            onChange={(opt) => {
              setQuestionPicks((prev) => ({ ...prev, [q.id]: opt }))
              setSubmitted(false)
              setSubmitError(null)
            }}
          />
        ))}

        {/* Closed matches */}
        {!isLoading && !loadError && (
          <div className='mb-6'>
            <button
              onClick={handleToggleClosed}
              className='flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:opacity-80'
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--brand-dark) 8%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--brand-dark) 12%, transparent)",
                color: "var(--brand-dark)",
              }}
            >
              <div className='flex items-center gap-2'>
                <Lock className='h-4 w-4' />
                {t.predictions.closedMatches}
                {closedLoaded && closedMatches.length > 0 && (
                  <span
                    className='rounded-full px-2 py-0.5 text-[10px] font-bold text-white'
                    style={{ backgroundColor: "var(--brand-dark)" }}
                  >
                    {closedMatches.length}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${closedOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${closedOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className='overflow-hidden'>
                <div className='space-y-3 pt-3'>
                  {closedLoading && (
                    <>
                      <MatchSkeleton />
                      <MatchSkeleton />
                      <MatchSkeleton />
                    </>
                  )}
                  {!closedLoading &&
                    closedLoaded &&
                    closedMatches.length === 0 && (
                      <p className='py-6 text-center text-sm text-muted-foreground'>
                        {t.predictions.noClosedMatches}
                      </p>
                    )}
                  {!closedLoading &&
                    closedMatches.map((match) => {
                      const pick = scoreToPrediction(match)
                      return (
                        <MatchCard
                          key={match.match_id}
                          match={match}
                          prediction={pick}
                          serverPrediction={pick}
                          tieLabel={t.predictions.tie}
                          locked
                          isPersisted={match.score !== null}
                          isClearing={false}
                          onPredict={() => {}}
                          onClear={() => {}}
                        />
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error banner */}
        {submitError && (
          <div
            className='mb-6 rounded-xl border px-4 py-3 text-sm'
            style={{
              borderColor:
                "color-mix(in srgb, var(--brand-orange) 40%, transparent)",
              backgroundColor:
                "color-mix(in srgb, var(--brand-orange) 8%, transparent)",
              color: "var(--brand-dark)",
            }}
          >
            {submitError}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className='space-y-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <MatchSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Load error */}
        {!isLoading && loadError && (
          <p className='text-center text-sm text-muted-foreground py-12'>
            {t.predictions.loadError}
          </p>
        )}

        {/* Empty */}
        {!isLoading && !loadError && matches.length === 0 && (
          <p className='text-center text-sm text-muted-foreground py-12'>
            {t.predictions.noMatches}
          </p>
        )}

        {/* Match list grouped by date */}
        {!isLoading &&
          !loadError &&
          sortedDates.map((date) => (
            <section key={date} className='mb-8'>
              <h2
                className='mb-3 text-xs font-bold uppercase tracking-widest'
                style={{ color: "var(--brand-orange)" }}
              >
                {formatMatchDate(date, locale)}
              </h2>
              <div className='space-y-3'>
                {matchesByDate[date].map((match) => (
                  <MatchCard
                    key={match.match_id}
                    match={match}
                    prediction={predictions[match.match_id] ?? null}
                    serverPrediction={serverPredictions[match.match_id] ?? null}
                    tieLabel={t.predictions.tie}
                    locked={isMatchLocked(match.due_date) || isSubmitting}
                    isPersisted={persistedMatchIds.has(match.match_id)}
                    isClearing={clearingMatchId === match.match_id}
                    onPredict={handlePredict}
                    onClear={handleClearMatch}
                  />
                ))}
              </div>
            </section>
          ))}
      </main>

      {/* Floating action buttons */}
      {!isLoading && !loadError && (
        <div
          className={`fixed bottom-24 left-0 right-0 z-50 flex justify-center px-4 md:bottom-8 transition-all duration-300 ${
            unsubmittedCount > 0
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        >
          <div className='flex items-center gap-2 rounded-full border border-border bg-background/95 p-1.5 shadow-xl backdrop-blur-sm'>
            <button
              onClick={handleDiscard}
              disabled={isSubmitting || isDiscarding}
              className='flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'
            >
              {t.predictions.discard}
            </button>
            <div className='relative'>
              {!isSubmitting && !isDiscarding && !submitted && (
                <span
                  className='absolute inset-0 rounded-full animate-ping opacity-30 pointer-events-none'
                  style={{ backgroundColor: "var(--brand-orange)" }}
                />
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isDiscarding || submitted}
                className='relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50'
                style={{ backgroundColor: "var(--brand-orange)" }}
              >
                {isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
                {isSubmitting
                  ? t.predictions.submitting
                  : `${t.predictions.submit} (${unsubmittedCount})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
