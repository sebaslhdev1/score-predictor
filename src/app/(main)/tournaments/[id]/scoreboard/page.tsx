"use client"

import { useT } from "@/i18n/use-t"
import { getScoreboard } from "@/services/scoreboard"
import type { ScoreboardEntry } from "@/types/scoreboard"
import { Construction, Medal } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>
  if (rank === 2) return <span className="text-lg">🥈</span>
  if (rank === 3) return <span className="text-lg">🥉</span>
  return (
    <span className="w-7 text-center text-sm font-bold text-muted-foreground">
      {rank}
    </span>
  )
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3 animate-pulse">
      <div className="h-5 w-5 rounded-full bg-muted" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-32 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
      <div className="h-5 w-12 rounded bg-muted" />
    </div>
  )
}

export default function ScoreboardPage() {
  const t = useT()
  const [entries, setEntries] = useState<ScoreboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    getScoreboard()
      .then(setEntries)
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div
        className="mb-8 rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #2b2b2d 0%, var(--brand-dark) 60%, #2b2b2d 100%)" }}
      >
        <div className="mb-1 flex items-center gap-2">
          <Medal className="h-5 w-5" style={{ color: "var(--brand-orange)" }} />
          <h1 className="text-xl font-bold">{t.scoreboard.title}</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
          {t.scoreboard.subtitle}
        </p>
      </div>

      {/* WIP banner */}
      <div
        className="mb-6 flex items-start gap-3 rounded-xl border px-4 py-3"
        style={{
          borderColor: "color-mix(in srgb, var(--brand-orange) 30%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--brand-orange) 6%, transparent)",
        }}
      >
        <Construction className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand-orange)" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--brand-dark)" }}>
            {t.scoreboard.wipBadge}
          </p>
          <p className="text-xs text-muted-foreground">{t.scoreboard.wipDesc}</p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {/* Error */}
      {!isLoading && loadError && (
        <p className="text-center text-sm text-muted-foreground py-12">{t.scoreboard.loadError}</p>
      )}

      {/* Empty */}
      {!isLoading && !loadError && entries.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">{t.scoreboard.noResults}</p>
      )}

      {/* Table */}
      {!isLoading && !loadError && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.user_id}
              className={cn(
                "flex items-center gap-4 rounded-xl border px-4 py-3 transition-all",
                entry.is_current_user ? "shadow-md" : "bg-card",
              )}
              style={
                entry.is_current_user
                  ? {
                      borderColor: "color-mix(in srgb, var(--brand-orange) 40%, transparent)",
                      backgroundColor: "color-mix(in srgb, var(--brand-orange) 6%, transparent)",
                    }
                  : undefined
              }
            >
              {/* Rank */}
              <div className="flex w-7 items-center justify-center shrink-0">
                <RankBadge rank={entry.rank} />
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn("truncate text-sm font-semibold", entry.is_current_user && "text-[var(--brand-orange)]")}>
                    {entry.name}
                  </p>
                  {entry.is_current_user && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: "var(--brand-orange)" }}
                    >
                      {t.scoreboard.you}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {entry.correct_predictions}/{entry.total_predictions} {t.scoreboard.correct}
                </p>
              </div>

              {/* Points */}
              <div className="text-right shrink-0">
                <p
                  className="text-lg font-bold"
                  style={{ color: entry.is_current_user ? "var(--brand-orange)" : "var(--brand-dark)" }}
                >
                  {entry.points}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t.scoreboard.points}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
