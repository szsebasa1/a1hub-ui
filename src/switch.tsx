"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "./utils"

// Brand guide, "Toggles": 44x24 track, gray off and Brand Purple on.
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-input p-[3px] transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-[18px] rounded-full bg-white shadow-[0_1px_4px_rgb(0_0_0/0.2)] transition-transform duration-200 data-[state=checked]:translate-x-5 dark:data-[state=checked]:bg-brand-deep"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
