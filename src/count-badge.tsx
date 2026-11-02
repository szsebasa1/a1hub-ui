import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "./utils"

// Brand guide, notification badges: a small counter pinned to the top-right
// corner of whatever it wraps (an icon button, a tab).
const countBadgeVariants = cva(
  "pointer-events-none absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-card px-[5px] text-[10px] leading-none font-bold",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        pink: "bg-brand-pink text-white",
        gold: "bg-brand-gold text-brand-deep",
        destructive: "bg-[#ef4444] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type CountBadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof countBadgeVariants> & {
    count: number
    /** Counts above it show as "max+". */
    max?: number
    /** Screen-reader text, e.g. "3 unread messages". Defaults to the number. */
    label?: string
  }

function CountBadge({
  count,
  max = 99,
  label,
  variant,
  className,
  children,
  ...props
}: CountBadgeProps) {
  return (
    <span data-slot="count-badge" className={cn("relative inline-flex", className)} {...props}>
      {children}
      {count > 0 ? (
        <span className={countBadgeVariants({ variant })}>
          <span aria-hidden="true">{count > max ? `${max}+` : count}</span>
          <span className="sr-only">{label ?? String(count)}</span>
        </span>
      ) : null}
    </span>
  )
}

export { CountBadge, countBadgeVariants }
