import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "./utils"

// Brand guide, "Progress Bars": 8px pill track; the fill runs along the
// purple-to-pink axis, or gold / green for budget and completion.
const progressFillVariants = cva("h-full rounded-full transition-[width] duration-600 ease-out", {
  variants: {
    tone: {
      brand: "bg-linear-to-r from-primary to-highlight",
      gold: "bg-linear-to-r from-brand-gold-hover to-brand-gold",
      success: "bg-linear-to-r from-[#059669] to-[#10b981]",
      destructive: "bg-destructive",
    },
  },
  defaultVariants: {
    tone: "brand",
  },
})

type ProgressProps = Omit<React.ComponentProps<"div">, "children"> &
  VariantProps<typeof progressFillVariants> & {
    /** 0 to 100. */
    value: number
    /** Text above the bar, on the left. */
    label?: React.ReactNode
    /** Text above the bar, on the right. Defaults to the rounded percentage when there is a label. */
    valueText?: React.ReactNode
    trackClassName?: string
  }

function Progress({
  value,
  label,
  valueText,
  tone,
  className,
  trackClassName,
  "aria-label": ariaLabel,
  ...props
}: ProgressProps) {
  const percent = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  const shownValue = valueText ?? (label ? `${Math.round(percent)}%` : null)

  return (
    <div data-slot="progress" className={cn("w-full", className)} {...props}>
      {label || shownValue ? (
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          {label ? <span className="font-medium text-foreground">{label}</span> : <span />}
          {shownValue ? <span className="text-muted-foreground">{shownValue}</span> : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
        className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", trackClassName)}
      >
        <div className={progressFillVariants({ tone })} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export { Progress, progressFillVariants }
