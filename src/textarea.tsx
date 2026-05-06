import * as React from "react"

import { cn } from "./utils"

type TextareaProps = React.ComponentProps<"textarea"> & {
  onSubmitShortcut?: () => void
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, onKeyDown, onSubmitShortcut, ...props },
  ref
) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (event.defaultPrevented || (event as any).isComposing) {
      return
    }

    if (event.key !== "Enter" || (!event.metaKey && !event.ctrlKey)) {
      return
    }

    event.preventDefault()
    onSubmitShortcut?.()
  }

  return (
    <textarea
      ref={ref}
      onKeyDown={handleKeyDown}
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:ring-ring/50 min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})

export { Textarea }
