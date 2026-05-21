"use client"

import { useT } from "@/i18n/use-t"
import { getTournaments } from "@/services/tournament"
import type { Tournament } from "@/types/tournament"
import { ChevronRight, Trophy } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card px-4 py-4 animate-pulse">
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-48 rounded bg-muted" />
        <div className="h-2.5 w-16 rounded bg-muted" />
      </div>
      <div className="h-4 w-4 rounded bg-muted" />
    </div>
  )
}

export default function TournamentsPage() {
  const t = useT()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    getTournaments()
      .then(setTournaments)
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-12">
      {/* Header */}
      <div
        className="mb-8 rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #2b2b2d 0%, var(--brand-dark) 60%, #2b2b2d 100%)" }}
      >
        <div className="mb-1 flex items-center gap-2">
          <Trophy className="h-5 w-5" style={{ color: "var(--brand-orange)" }} />
          <h1 className="text-xl font-bold">{t.tournaments.title}</h1>
          {!isLoading && tournaments.length > 0 && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: "var(--brand-orange)" }}
            >
              {tournaments.length}
            </span>
          )}
        </div>
        <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
          {t.tournaments.subtitle}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {/* Error */}
      {!isLoading && loadError && (
        <p className="text-center text-sm text-muted-foreground py-12">{t.tournaments.loadError}</p>
      )}

      {/* Empty */}
      {!isLoading && !loadError && tournaments.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">{t.tournaments.noTournaments}</p>
      )}

      {/* List */}
      {!isLoading && !loadError && tournaments.length > 0 && (
        <div className="space-y-2">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.tournament_id}
              href={`/tournaments/${tournament.tournament_id}/predictions`}
              className="flex items-center gap-4 rounded-xl border bg-card px-4 py-4 transition-all hover:shadow-md group"
              style={{ "--hover-border": "color-mix(in srgb, var(--brand-orange) 40%, transparent)" } as React.CSSProperties}
            >
              {/* Tournament icon */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "color-mix(in srgb, var(--brand-orange) 12%, transparent)" }}
              >
                <Trophy className="h-5 w-5" style={{ color: "var(--brand-orange)" }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold">{tournament.tournament_name}</p>
                {tournament.is_owner && (
                  <span
                    className="inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: "var(--brand-dark)" }}
                  >
                    {t.tournaments.owner}
                  </span>
                )}
              </div>

              <ChevronRight
                className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                style={{ color: "var(--brand-muted)" }}
              />
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
