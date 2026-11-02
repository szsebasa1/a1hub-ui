"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "./utils"

// Brand guide, "Tooltips": Deep Purple box, white 12px text, 6px radius, arrow.
// Self-contained (provider + root + content) so callers pass `content` and a
// trigger child; an empty `content` renders the child alone.
type TooltipProps = {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  delayDuration?: number
  className?: string
}

function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 150,
  className,
}: TooltipProps) {
  if (content === null || content === undefined || content === false || content === "") {
    return <>{children}</>
  }

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            data-slot="tooltip-content"
            side={side}
            align={align}
            sideOffset={8}
            className={cn(
              "z-50 max-w-xs rounded-md bg-tooltip px-3 py-2 text-xs leading-normal text-tooltip-foreground shadow-[0_4px_16px_rgb(0_0_0/0.25)]",
              "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
              className
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-tooltip" width={10} height={5} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export { Tooltip }
