import * as React from "react"

import { fieldClassName } from "./input"
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
        fieldClassName,
        "min-h-28 px-3.5 py-2.5",
        className
      )}
      {...props}
    />
  )
})

export { Textarea }
