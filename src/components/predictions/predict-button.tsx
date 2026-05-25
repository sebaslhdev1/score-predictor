import { cn } from "@/lib/utils"
import type { PredictionValue } from "@/types/predictions"
import Image from "next/image"

export interface PredictButtonProps {
  label: string
  flag?: string | null
  value: NonNullable<PredictionValue>
  selected: boolean
  locked: boolean
  onClick: () => void
}

export function PredictButton({
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
