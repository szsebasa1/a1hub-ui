"use client"

import * as React from "react"

import { cn } from "./utils"
import { Input } from "./input"

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={isVisible ? "text" : "password"}
          className={cn("pr-16", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs font-medium text-muted-foreground hover:bg-muted"
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = "PasswordInput"
