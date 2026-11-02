import * as React from "react"

import { cn } from "./utils"

type DividerProps = React.ComponentProps<"div"> & {
  /** `center` is the guide's "or continue with" divider; `start` its section label. */
  align?: "center" | "start"
}

// Brand guide, "Divider" and "section-label": a hairline, optionally around a
// small uppercase label.
function Divider({ align = "center", className, children, ...props }: DividerProps) {
  if (!children) {
    return (
      <div
        role="separator"
        data-slot="divider"
        className={cn("h-px w-full shrink-0 bg-border", className)}
        {...props}
      />
    )
  }

  // With a label it is read as text, so it is not marked as a separator (whose
  // content screen readers skip).
  return (
    <div
      data-slot="divider"
      className={cn(
        "flex w-full items-center gap-3 text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase after:h-px after:flex-1 after:bg-border",
        align === "center" && "before:h-px before:flex-1 before:bg-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Divider }
