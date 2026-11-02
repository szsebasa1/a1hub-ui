import { ArrowDown, ArrowUp } from "lucide-react"

import { Card } from "./card"
import { cn } from "./utils"

// Brand guide, "Metric Cards": small uppercase label, Roboto Condensed value,
// optional delta pill and the purple-to-pink stat bar.
type StatCardProps = {
  label: string
  value: string
  /** Supporting line under the value. */
  trend?: string
  delta?: { text: string; direction: "up" | "down" }
  /** Width of the stat bar under the value, 0 to 100. Omit for none. */
  bar?: number
  variant?: "default" | "accent" | "bordered" | "dark" | "gold"
  className?: string
}

export function StatCard({ label, value, trend, delta, bar, variant = "default", className }: StatCardProps) {
  const isGold = variant === "gold"

  return (
    <Card size="sm" variant={variant} className={cn("gap-0 px-5 py-5", className)}>
      <p
        className={cn(
          "text-[10px] font-medium tracking-[0.16em] uppercase",
          isGold ? "text-brand-gold/70" : "text-muted-foreground"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-[28px] leading-[1.1] font-bold",
          isGold ? "text-brand-gold" : "text-heading"
        )}
      >
        {value}
      </p>
      {trend ? <p className="mt-1.5 text-xs text-muted-foreground">{trend}</p> : null}
      {delta ? (
        <span
          className={cn(
            "mt-2.5 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            delta.direction === "up"
              ? "bg-success-soft text-success-soft-foreground"
              : "bg-destructive-soft text-destructive-soft-foreground"
          )}
        >
          {delta.direction === "up" ? (
            <ArrowUp aria-label="Up" className="size-3" />
          ) : (
            <ArrowDown aria-label="Down" className="size-3" />
          )}
          {delta.text}
        </span>
      ) : null}
      {bar !== undefined ? (
        <div
          aria-hidden="true"
          className="mt-3.5 h-[3px] rounded-full bg-linear-to-r from-primary to-highlight"
          style={{ width: `${Math.max(0, Math.min(100, bar))}%` }}
        />
      ) : null}
    </Card>
  )
}
