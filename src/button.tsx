import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "./utils"

// Brand guide, "Calls to Action": 6px radius, medium weight, a 1px lift on hover
// for the filled actions. Gold is for hero and conversion moments only, and the
// primary CTA on dark backgrounds; ghost-dark is the secondary one there.
const lift = "hover:-translate-y-px active:translate-y-0 motion-reduce:hover:translate-y-0"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium tracking-[0.01em] whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-40 aria-busy:disabled:opacity-100 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: cn(
          "bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-[0_6px_20px_rgb(82_6_142/0.35)] dark:hover:shadow-[0_6px_20px_rgb(185_138_240/0.3)]",
          lift
        ),
        dark: cn(
          "bg-brand-deep text-white hover:bg-[#0e0218] hover:shadow-[0_6px_20px_rgb(23_4_38/0.4)] dark:bg-white dark:text-brand-deep dark:hover:bg-brand-mist",
          lift
        ),
        secondary: cn(
          "border-[1.5px] border-primary bg-transparent text-primary hover:bg-secondary aria-expanded:bg-secondary",
          lift
        ),
        outline:
          "border-border bg-card text-foreground shadow-xs hover:border-primary/40 hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground dark:border-input",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground",
        "ghost-dark":
          "border-[1.5px] border-white/25 bg-white/10 text-white backdrop-blur-xs hover:border-white/50 hover:bg-white/20 focus-visible:ring-white/40",
        gold: cn(
          "bg-brand-gold font-bold text-brand-deep hover:bg-brand-gold-hover hover:shadow-[0_6px_20px_rgb(249_191_0/0.4)] focus-visible:ring-brand-gold/50",
          lift
        ),
        destructive: cn(
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover focus-visible:ring-destructive/30",
          lift
        ),
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        xs: "h-6 gap-1 rounded-sm px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[5px] px-4 text-xs has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-12 gap-2 rounded-lg px-8 text-base has-data-[icon=inline-end]:pr-7 has-data-[icon=inline-start]:pl-7",
        icon: "size-10 rounded-lg [&_svg:not([class*='size-'])]:size-[18px]",
        "icon-xs": "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-12 rounded-lg [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Shows a spinner in place of the label and blocks the button, keeping its width. */
    loading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const showSpinner = loading && !asChild

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {showSpinner ? (
        <>
          <span className="invisible contents">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin" aria-hidden="true" />
          </span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
