"use client"

import { useT } from "@/i18n/use-t"
import { getParticipants } from "@/services/scoreboard"
import type { Participant } from "@/types/scoreboard"
import { Users } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-36 rounded bg-muted" />
        <div className="h-2.5 w-24 rounded bg-muted" />
      </div>
      <div className="h-4 w-10 rounded bg-muted" />
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ backgroundColor: "var(--brand-dark)" }}
    >
      {initials}
    </div>
  )
}

export default function ParticipantsPage() {
  const t = useT()
  const { id: tournamentId } = useParams() as { id: string }
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    getParticipants(tournamentId)
      .then(setParticipants)
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }, [tournamentId])

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div
        className="mb-8 rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #2b2b2d 0%, var(--brand-dark) 60%, #2b2b2d 100%)" }}
      >
        <div className="mb-1 flex items-center gap-2">
          <Users className="h-5 w-5" style={{ color: "var(--brand-orange)" }} />
          <h1 className="text-xl font-bold">{t.participants.title}</h1>
          {!isLoading && participants.length > 0 && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: "var(--brand-orange)" }}
            >
              {participants.length}
            </span>
          )}
        </div>
        <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
          {t.participants.subtitle}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {/* Error */}
      {!isLoading && loadError && (
        <p className="text-center text-sm text-muted-foreground py-12">{t.participants.loadError}</p>
      )}

      {/* Empty */}
      {!isLoading && !loadError && participants.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">{t.participants.noParticipants}</p>
      )}

      {/* List */}
      {!isLoading && !loadError && participants.length > 0 && (
        <div className="space-y-2">
          {participants.map((p) => (
            <div
              key={p.user_id}
              className={cn(
                "flex items-center gap-4 rounded-xl border px-4 py-3",
                p.is_current_user ? "shadow-md" : "bg-card",
              )}
              style={
                p.is_current_user
                  ? {
                      borderColor: "color-mix(in srgb, var(--brand-orange) 40%, transparent)",
                      backgroundColor: "color-mix(in srgb, var(--brand-orange) 6%, transparent)",
                    }
                  : undefined
              }
            >
              <Avatar name={p.name} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn("truncate text-sm font-semibold", p.is_current_user && "text-(--brand-orange)")}>
                    {p.name}
                  </p>
                  {p.is_current_user && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: "var(--brand-orange)" }}
                    >
                      {t.scoreboard.you}
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </main>
  )
}
