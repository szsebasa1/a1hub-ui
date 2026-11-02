import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "./utils"

// Brand guide, "Form Inputs": 1.5px border, 6px radius, purple border and a 3px
// ring on focus, red on error. Textarea shares the same field styles.
const fieldClassName =
  "w-full min-w-0 rounded-md border-[1.5px] border-input bg-card text-sm text-foreground transition-[color,border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/12 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/12 dark:focus-visible:ring-primary/25"

type InputProps = React.ComponentProps<"input"> & {
  /** Icon shown inside the field, before the text. */
  startIcon?: LucideIcon
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startIcon: StartIcon, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          fieldClassName,
          "h-10 px-3.5 py-2 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          StartIcon && "pl-10",
          className
        )}
        {...props}
      />
    )

    if (!StartIcon) {
      return input
    }

    return (
      <div data-slot="input-wrapper" className="relative w-full">
        <StartIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        {input}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input, fieldClassName }
