"use client"

import { useEffect } from "react"
import { CircleCheck, CircleX, Info, TriangleAlert, type LucideIcon } from "lucide-react"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastVariant,
} from "./toast"
import { useToast } from "./use-toast"
import { cn } from "./utils"

const VARIANT_ICONS: Record<ToastVariant, { icon: LucideIcon; className: string }> = {
  default: { icon: Info, className: "text-primary" },
  brand: { icon: CircleCheck, className: "text-brand-gold" },
  success: { icon: CircleCheck, className: "text-success" },
  warning: { icon: TriangleAlert, className: "text-warning-soft-foreground" },
  destructive: { icon: CircleX, className: "text-destructive" },
}

// The guide's toasts close by themselves after 4s; destructive ones stay until
// dismissed (see useToast) so an error is never missed.
const TOAST_DURATION_MS = 4000

export function Toaster() {
  const { toasts, dismiss } = useToast()

  useEffect(() => {
    const destructiveToasts = toasts.filter((toast) => toast.variant === "destructive")

    if (destructiveToasts.length === 0) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      const clickedInsideToast = Boolean(target.closest("[data-toast-root='true']"))

      if (clickedInsideToast) {
        return
      }

      destructiveToasts.forEach((toast) => {
        dismiss(toast.id)
      })
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [dismiss, toasts])

  return (
    <ToastProvider duration={TOAST_DURATION_MS}>
      {toasts.map(({ id, title, description, action, ...props }) => {
        const { icon: VariantIcon, className: iconClassName } =
          VARIANT_ICONS[props.variant ?? "default"] ?? VARIANT_ICONS.default

        return (
          <Toast key={id} {...props}>
            <VariantIcon aria-hidden="true" className={cn("mt-px size-[18px] shrink-0", iconClassName)} />
            <div className="grid min-w-0 flex-1 gap-0.5">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? <ToastDescription>{description}</ToastDescription> : null}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
