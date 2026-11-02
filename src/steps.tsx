import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "./utils"

type StepsProps = Omit<React.ComponentProps<"ol">, "children"> & {
  steps: React.ReactNode[]
  /** Index of the step in progress; the ones before it are done. */
  current: number
}

// Brand guide, "Step Indicator" (onboarding, checkout): done steps in Brand
// Purple with a check, the current one in Deep Purple with a halo.
function Steps({ steps, current, className, ...props }: StepsProps) {
  return (
    <ol data-slot="steps" className={cn("flex w-full items-start", className)} {...props}>
      {steps.map((label, index) => {
        const state = index < current ? "done" : index === current ? "active" : "pending"
        const isLast = index === steps.length - 1

        return (
          <li
            key={index}
            aria-current={state === "active" ? "step" : undefined}
            className="flex flex-1 flex-col items-center"
          >
            <div className="flex w-full items-center">
              <span
                className={cn(
                  "z-1 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                  state === "done" && "bg-primary text-primary-foreground",
                  state === "active" &&
                    "bg-brand-deep text-white shadow-[0_0_0_4px_rgb(82_6_142/0.2)] dark:bg-white dark:text-brand-deep dark:shadow-[0_0_0_4px_rgb(185_138_240/0.35)]",
                  state === "pending" && "bg-muted text-muted-foreground"
                )}
              >
                {state === "done" ? <Check className="size-3.5" aria-label="Done" /> : index + 1}
              </span>
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className={cn("h-0.5 flex-1", state === "done" ? "bg-primary" : "bg-muted")}
                />
              ) : null}
            </div>
            <span
              className={cn(
                "mt-2 self-start text-[11px] font-medium",
                state === "active" ? "text-primary" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export { Steps }
