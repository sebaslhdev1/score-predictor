import type { Match, PredictionValue } from "@/types/predictions"
import { CheckCircle2, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface MatchCardProps {
  match: Match
  prediction: PredictionValue
  tieLabel: string
  onPredict: (matchId: string, value: PredictionValue) => void
}

interface PredictButtonProps {
  label: string
  value: NonNullable<PredictionValue>
  selected: boolean
  onClick: () => void
}

function PredictButton({ label, value, selected, onClick }: PredictButtonProps) {
  const isTie = value === "tie"
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg px-2 py-2.5 text-sm font-medium transition-all duration-150",
        "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        selected
          ? isTie
            ? "border-transparent text-white shadow-sm"
            : "border-transparent text-white shadow-sm"
          : "border-border bg-white text-foreground hover:bg-muted/60",
      )}
      style={
        selected
          ? {
              backgroundColor: isTie ? "var(--brand-dark)" : "var(--brand-orange)",
            }
          : undefined
      }
    >
      {label}
    </button>
  )
}

export function MatchCard({ match, prediction, tieLabel, onPredict }: MatchCardProps) {
  function handlePredict(value: NonNullable<PredictionValue>) {
    // Re-clicking the active button deselects it
    onPredict(match.match_id, prediction === value ? null : value)
  }

  const isPredicted = prediction !== null

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm transition-all duration-200",
        isPredicted
          ? "border-transparent shadow-md"
          : "border-border hover:border-muted-foreground/30",
      )}
      style={
        isPredicted
          ? {
              borderColor: "color-mix(in srgb, var(--brand-orange) 35%, transparent)",
              boxShadow: "0 2px 12px color-mix(in srgb, var(--brand-orange) 12%, transparent)",
            }
          : undefined
      }
    >
      {/* Header row: location + check */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{match.location}</span>
        </div>
        {isPredicted && (
          <CheckCircle2
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--brand-green)" }}
          />
        )}
      </div>

      {/* Teams */}
      <p className="mb-3 font-semibold text-base leading-snug">
        {match.local_team}
        <span className="mx-2 text-sm font-normal text-muted-foreground">vs</span>
        {match.away_team}
      </p>

      {/* Prediction buttons: local | tie | away — vertical on mobile, horizontal on sm+ */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-2">
        <PredictButton
          label={match.local_team}
          value="local"
          selected={prediction === "local"}
          onClick={() => handlePredict("local")}
        />
        <PredictButton
          label={tieLabel}
          value="tie"
          selected={prediction === "tie"}
          onClick={() => handlePredict("tie")}
        />
        <PredictButton
          label={match.away_team}
          value="away"
          selected={prediction === "away"}
          onClick={() => handlePredict("away")}
        />
      </div>
    </div>
  )
}
