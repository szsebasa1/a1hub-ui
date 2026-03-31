import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "./utils"

type IconProps = React.ComponentProps<"svg"> & {
  icon: LucideIcon
  size?: "sm" | "md" | "lg"
}

const iconSizeClass: Record<NonNullable<IconProps["size"]>, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
}

export function Icon({ icon: Lucide, size = "md", className, ...props }: IconProps) {
  return (
    <Lucide
      aria-hidden="true"
      className={cn(iconSizeClass[size], "shrink-0", className)}
      {...props}
    />
  )
}
