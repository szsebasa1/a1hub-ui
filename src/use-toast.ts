"use client"

import * as React from "react"

import type { ToastActionElement, ToastProps } from "./toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 3000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

type State = {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(state: State) {
  memoryState = state
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function removeToast(id: string) {
  dispatch({
    toasts: memoryState.toasts.filter((toastItem) => toastItem.id !== id),
  })
}

function addToRemoveQueue(id: string) {
  if (toastTimeouts.has(id)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(id)
    removeToast(id)
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(id, timeout)
}

function createToast(props: Omit<ToasterToast, "id">) {
  const id = crypto.randomUUID()

  const update = (next: ToasterToast) => {
    dispatch({
      toasts: memoryState.toasts.map((currentToast) =>
        currentToast.id === id ? { ...currentToast, ...next } : currentToast
      ),
    })
  }

  const dismiss = () => {
    dispatch({
      toasts: memoryState.toasts.map((currentToast) =>
        currentToast.id === id ? { ...currentToast, open: false } : currentToast
      ),
    })
    addToRemoveQueue(id)
  }

  const nextToast: ToasterToast = {
    ...props,
    id,
    open: true,
    duration:
      props.duration ?? (props.variant === "destructive" ? Number.POSITIVE_INFINITY : undefined),
    onOpenChange: (open) => {
      if (!open) {
        dismiss()
      }
    },
  }

  dispatch({
    toasts: [nextToast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
  })

  return {
    id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)

    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    ...state,
    toast: createToast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        removeToast(toastId)
        return
      }

      dispatch({ toasts: [] })
    },
  }
}

export { useToast, createToast as toast }
