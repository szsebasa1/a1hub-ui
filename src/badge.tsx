import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "./utils"

// Brand guide, "Tags, Pills & Status Indicators": solid variants for primary
// taxonomy, outlined for secondary; `dot` marks a live status; `onRemove` makes
// the removable tag of filter and input contexts.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 text-[11px] leading-none font-medium tracking-[0.04em] whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border-primary text-primary",
        pink: "bg-highlight-soft text-highlight-soft-foreground",
        gold: "bg-warning-soft text-warning-soft-foreground",
        "gold-solid": "bg-brand-gold font-bold text-brand-deep",
        success: "bg-success-soft text-success-soft-foreground",
        destructive: "bg-destructive-soft text-destructive-soft-foreground",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** Leading dot in the text color, for live status (Live, Offline, Pending). */
    dot?: boolean
    /** Renders a remove button after the label. */
    onRemove?: () => void
    /** Accessible name of the remove button. */
    removeLabel?: string
  }

function Badge({
  className,
  variant,
  dot = false,
  onRemove,
  removeLabel = "Remove",
  children,
  ...props
}: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot ? <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" /> : null}
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="-mr-1 inline-flex size-3.5 cursor-pointer items-center justify-center rounded-full bg-black/10 transition-colors outline-none hover:bg-black/20 focus-visible:ring-2 focus-visible:ring-current dark:bg-white/15 dark:hover:bg-white/25"
        >
          <X className="size-2.5!" aria-hidden="true" />
        </button>
      ) : null}
    </span>
  )
}

export { Badge, badgeVariants, type BadgeProps }
