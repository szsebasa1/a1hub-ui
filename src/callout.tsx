import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CircleCheck, CircleX, Lightbulb, Megaphone, TriangleAlert, type LucideIcon } from "lucide-react"

import { cn } from "./utils"

// Brand guide, "Callouts & Alerts": tinted panel with a 4px left edge. `dark` is
// reserved for announcements on light pages.
const calloutVariants = cva(
  "flex w-full gap-3.5 rounded-lg border-l-4 px-5 py-4 text-sm leading-relaxed",
  {
    variants: {
      variant: {
        info: "border-l-primary bg-secondary text-[#3b0764] dark:text-secondary-foreground",
        success: "border-l-[#10b981] bg-success-soft text-[#064e3b] dark:text-success-soft-foreground",
        warning: "border-l-brand-gold bg-warning-soft text-[#78350f] dark:text-warning-soft-foreground",
        destructive:
          "border-l-[#ef4444] bg-destructive-soft text-[#7f1d1d] dark:text-destructive-soft-foreground",
        dark: "dark border-l-brand-gold bg-brand-deep text-white/85",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

type CalloutVariant = NonNullable<VariantProps<typeof calloutVariants>["variant"]>

const DEFAULT_ICONS: Record<CalloutVariant, LucideIcon> = {
  info: Lightbulb,
  success: CircleCheck,
  warning: TriangleAlert,
  destructive: CircleX,
  dark: Megaphone,
}

type CalloutProps = Omit<React.ComponentProps<"div">, "title"> &
  VariantProps<typeof calloutVariants> & {
    title?: React.ReactNode
    /** Replaces the variant's icon; `null` shows none. */
    icon?: LucideIcon | null
  }

function Callout({ className, variant, title, icon, children, ...props }: CalloutProps) {
  const IconComponent = icon === undefined ? DEFAULT_ICONS[variant ?? "info"] : icon

  return (
    <div data-slot="callout" className={cn(calloutVariants({ variant }), className)} {...props}>
      {IconComponent ? <IconComponent aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" /> : null}
      <div className="min-w-0 flex-1">
        {title ? <p className="mb-0.5 text-[13px] font-bold">{title}</p> : null}
        {children}
      </div>
    </div>
  )
}

export { Callout, calloutVariants }
