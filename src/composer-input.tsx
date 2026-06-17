"use client"

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import type { DragEvent, ReactNode } from "react"

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
} from "./"
import {
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  Cpu,
  Globe,
  Loader2,
  Mic,
  Paperclip,
  SendHorizontal,
  SquareStop,
  X,
} from "lucide-react"

import {
  AttachmentUploadCard,
  type AttachmentUploadCardAttachment,
} from "./attachment-upload-card"
import { Textarea } from "./textarea"
import { cn } from "./utils"

export interface LlmModelSummary {
  id: string
  display_name: string
  provider: string
  enabled: boolean
  input_cost_per_1m?: number
  output_cost_per_1m?: number
  currency?: string
}

export type AttachmentPurpose = "transcript" | "notes" | "supporting_doc" | "similar_project"

// ---------------------------------------------------------------------------
// Speech Recognition interfaces
// ---------------------------------------------------------------------------

interface SpeechRecognitionResultEntry {
  readonly transcript: string
}

interface SpeechRecognitionResultItem {
  readonly [index: number]: SpeechRecognitionResultEntry
  readonly length: number
  readonly isFinal: boolean
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResultItem
  readonly length: number
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ComposerInputHandle = {
  focusTextarea: () => void
}

export type ComposerInputProps = {
  // ---- Core ----
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Blanket disabled — applies pointer-events-none + opacity-60 to the root */
  isDisabled?: boolean
  className?: string

  // ---- Primary action button ----
  /** Label shown when idle. Default: "Send" */
  submitLabel?: string
  /** Label shown while isSubmitting=true. Default: "Sending..." */
  submitLoadingLabel?: string
  isSubmitting?: boolean
  isSubmitDisabled?: boolean
  onSubmit: () => void
  /** Custom className for the submit button (idle state). Default: indigo-500 + w-40 */
  submitClassName?: string

  // ---- Cancel (turns submit button into a cancel button) ----
  canCancel?: boolean
  onCancel?: () => void

  // ---- Optional header bar (title + close button) ----
  headerTitle?: string
  onClose?: () => void
  /** Disabled state for the close button (ComposerInput also adds internal isSubmittingUpload) */
  isCloseDisabled?: boolean

  // ---- Attachments ----
  /** Show the paperclip / upload dialog button. Default: true */
  showAttachButton?: boolean
  attachments?: AttachmentUploadCardAttachment[]
  purposeOptions: Array<{ value: AttachmentPurpose; label: string }>
  onAttachFiles?: (
    files: File[],
    purpose: AttachmentPurpose,
    addToKnowledge?: boolean
  ) => Promise<void>
  onRemoveAttachment?: (localId: string) => void
  onRetryAttachment?: (localId: string) => void
  /** Show "Add to A1Hub Knowledge base" checkbox inside the upload dialog. Default: false */
  showKnowledgeBaseOption?: boolean

  // ---- LLM selector ----
  showModelSelector?: boolean
  llmModels?: LlmModelSummary[]
  isLlmModelsLoading?: boolean
  selectedLlm?: string
  onSelectedLlmChange?: (value: string) => void

  // ---- Sources selector ----
  showSourcesSelector?: boolean
  useWeb?: boolean
  onUseWebChange?: (value: boolean) => void
  useKnowledge?: boolean
  onUseKnowledgeChange?: (value: boolean) => void
  /** Agentic mode — when enabled the backend orchestrates web + knowledge automatically. */
  useAgentic?: boolean
  onUseAgenticChange?: (value: boolean) => void

  // ---- Loading overlay ----
  /**
   * When provided and isDisabled=true, this node is rendered instead of the
   * normal composer body (e.g. the "Generating proposal brief" card).
   */
  loadingOverlay?: ReactNode

  // ---- Focus ----
  /** Auto-focus the textarea on mount (multi-frame strategy). Default: false */
  autoFocusOnMount?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ComposerInput = forwardRef<ComposerInputHandle, ComposerInputProps>(
  function ComposerInput(
    {
      value,
      onChange,
      placeholder,
      isDisabled = false,
      className,
      submitLabel = "Send",
      submitLoadingLabel = "Sending...",
      isSubmitting = false,
      isSubmitDisabled = false,
      onSubmit,
      submitClassName,
      canCancel = false,
      onCancel,
      headerTitle,
      onClose,
      isCloseDisabled = false,
      showAttachButton = true,
      attachments = [],
      purposeOptions,
      onAttachFiles,
      onRemoveAttachment,
      onRetryAttachment,
      showKnowledgeBaseOption = false,
      showModelSelector = false,
      llmModels = [],
      isLlmModelsLoading = false,
      selectedLlm,
      onSelectedLlmChange,
      showSourcesSelector = false,
      useWeb = false,
      onUseWebChange,
      useKnowledge = false,
      onUseKnowledgeChange,
      useAgentic = false,
      onUseAgenticChange,
      loadingOverlay,
      autoFocusOnMount = false,
    },
    ref
  ) {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [selectedPurpose, setSelectedPurpose] = useState<AttachmentPurpose>(
      purposeOptions[0]?.value ?? "transcript"
    )
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [addToKnowledgeBase, setAddToKnowledgeBase] = useState(false)
    const [isSubmittingUpload, setIsSubmittingUpload] = useState(false)
    const [isComposerDropActive, setIsComposerDropActive] = useState(false)
    const [isModalDropActive, setIsModalDropActive] = useState(false)
    const [isLlmSelectorOpen, setIsLlmSelectorOpen] = useState(false)
    const [isSourcesSelectorOpen, setIsSourcesSelectorOpen] = useState(false)

    type DictationState = "idle" | "listening" | "stopped"
    const [dictationState, setDictationState] = useState<DictationState>("idle")
    const [dictationError, setDictationError] = useState<"not-allowed" | null>(null)
    const [isSpeechSupported, setIsSpeechSupported] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const composerDragDepthRef = useRef(0)
    const modalDragDepthRef = useRef(0)
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
    const dictationBaselineRef = useRef("")
    const llmSelectorRef = useRef<HTMLDivElement | null>(null)
    const sourcesSelectorRef = useRef<HTMLDivElement | null>(null)

    const isInteractionLocked = isDisabled || isSubmittingUpload
    const isBodyDisabled = isDisabled || isSubmitting

    // ---- Imperative handle ----
    useImperativeHandle(ref, () => ({
      focusTextarea: () => {
        const node = textareaRef.current
        if (!node) return
        node.focus()
        const end = node.value.length
        node.setSelectionRange(end, end)
      },
    }))

    // ---- Auto-focus on mount ----
    useEffect(() => {
      if (!autoFocusOnMount) return

      const focusTextarea = () => {
        const node = textareaRef.current
        if (!node) return
        node.focus()
        const end = node.value.length
        node.setSelectionRange(end, end)
      }

      focusTextarea()

      const raf1 = requestAnimationFrame(() => {
        focusTextarea()
        requestAnimationFrame(() => {
          focusTextarea()
        })
      })

      const timeoutId = window.setTimeout(() => {
        focusTextarea()
      }, 80)

      return () => {
        cancelAnimationFrame(raf1)
        window.clearTimeout(timeoutId)
      }
    }, [autoFocusOnMount])

    // ---- Speech support detection ----
    useEffect(() => {
      setIsSpeechSupported(
        !!(
          (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition ??
          (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
        )
      )
    }, [])

    // ---- Cleanup speech on unmount ----
    useEffect(() => {
      return () => {
        recognitionRef.current?.abort()
      }
    }, [])

    // ---- Reset all open UI on blanket isDisabled ----
    useEffect(() => {
      if (!isDisabled) return
      recognitionRef.current?.abort()
      setDictationState("idle")
      setUploadDialogOpen(false)
      setIsComposerDropActive(false)
      setIsModalDropActive(false)
      setIsLlmSelectorOpen(false)
      setIsSourcesSelectorOpen(false)
      composerDragDepthRef.current = 0
      modalDragDepthRef.current = 0
    }, [isDisabled])

    // ---- Close selectors on outside click ----
    useEffect(() => {
      if (!isLlmSelectorOpen && !isSourcesSelectorOpen) return

      const handlePointerDown = (event: MouseEvent) => {
        const llmNode = llmSelectorRef.current
        const sourcesNode = sourcesSelectorRef.current

        if (
          (llmNode && llmNode.contains(event.target as Node)) ||
          (sourcesNode && sourcesNode.contains(event.target as Node))
        ) {
          return
        }

        setIsLlmSelectorOpen(false)
        setIsSourcesSelectorOpen(false)
      }

      document.addEventListener("mousedown", handlePointerDown)
      return () => {
        document.removeEventListener("mousedown", handlePointerDown)
      }
    }, [isLlmSelectorOpen, isSourcesSelectorOpen])

    // ---- Upload state helpers ----
    const resetUploadState = () => {
      setSelectedFiles([])
      setSelectedPurpose(purposeOptions[0]?.value ?? "transcript")
      setAddToKnowledgeBase(false)
      setIsComposerDropActive(false)
      setIsModalDropActive(false)
      composerDragDepthRef.current = 0
      modalDragDepthRef.current = 0
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }

    const closeUploadDialog = () => {
      if (isSubmittingUpload || isDisabled) return
      setUploadDialogOpen(false)
      resetUploadState()
    }

    const hasFiles = (event: DragEvent<HTMLElement>) =>
      Array.from(event.dataTransfer.types).includes("Files")

    const updateSelectedFiles = (files: File[] | FileList | null) => {
      if (!files) {
        setSelectedFiles([])
        return
      }
      const nextFiles = Array.isArray(files) ? files : Array.from(files)
      setSelectedFiles(nextFiles)
    }

    // ---- Drag handlers — composer container ----
    const handleComposerDragEnter = (event: DragEvent<HTMLDivElement>) => {
      if (isInteractionLocked || !hasFiles(event)) return
      event.preventDefault()
      composerDragDepthRef.current += 1
      setIsComposerDropActive(true)
    }

    const handleComposerDragOver = (event: DragEvent<HTMLDivElement>) => {
      if (isInteractionLocked || !hasFiles(event)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = "copy"
      setIsComposerDropActive(true)
    }

    const handleComposerDragLeave = (event: DragEvent<HTMLDivElement>) => {
      if (isInteractionLocked || !hasFiles(event)) return
      event.preventDefault()
      composerDragDepthRef.current = Math.max(0, composerDragDepthRef.current - 1)
      if (composerDragDepthRef.current === 0) setIsComposerDropActive(false)
    }

    const handleComposerDrop = (event: DragEvent<HTMLDivElement>) => {
      if (isInteractionLocked || !hasFiles(event)) return
      event.preventDefault()
      composerDragDepthRef.current = 0
      setIsComposerDropActive(false)
      const droppedFiles = Array.from(event.dataTransfer.files)
      if (droppedFiles.length === 0) return
      updateSelectedFiles(droppedFiles)
      setUploadDialogOpen(true)
    }

    // ---- Drag handlers — upload modal ----
    const handleModalDragEnter = (event: DragEvent<HTMLDivElement>) => {
      if (isInteractionLocked || !hasFiles(event)) return
      event.preventDefault()
      modalDragDepthRef.current += 1
      setIsModalDropActive(true)
    }

    const handleModalDragOver = (event: DragEvent<HTMLDivElement>) => {
      if (isInteractionLocked || !hasFiles(event)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = "copy"
      setIsModalDropActive(true)
    }

    const handleModalDragLeave = (event: DragEvent<HTMLDivElement>) => {
      if (isInteractionLocked || !hasFiles(event)) return
      event.preventDefault()
      modalDragDepthRef.current = Math.max(0, modalDragDepthRef.current - 1)
      if (modalDragDepthRef.current === 0) setIsModalDropActive(false)
    }

    const handleModalDrop = (event: DragEvent<HTMLDivElement>) => {
      if (isInteractionLocked || !hasFiles(event)) return
      event.preventDefault()
      modalDragDepthRef.current = 0
      setIsModalDropActive(false)
      const droppedFiles = Array.from(event.dataTransfer.files)
      if (droppedFiles.length === 0) return
      updateSelectedFiles(droppedFiles)
    }

    // ---- Speech recognition ----
    const startDictation = () => {
      if (isDisabled) return

      const SpeechRecognitionClass = (
        (window as Window & { SpeechRecognition?: new () => SpeechRecognitionInstance })
          .SpeechRecognition ??
        (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionInstance })
          .webkitSpeechRecognition
      )

      if (!SpeechRecognitionClass) return

      const recognition = new SpeechRecognitionClass()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      dictationBaselineRef.current = value
      setDictationError(null)

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let sessionTranscript = ""
        for (let i = 0; i < event.results.length; i++) {
          sessionTranscript += event.results[i][0].transcript
        }
        const baseline = dictationBaselineRef.current
        onChange(baseline ? `${baseline} ${sessionTranscript}` : sessionTranscript)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setDictationError("not-allowed")
        }
        setDictationState("idle")
        recognitionRef.current = null
      }

      recognition.onend = () => {
        setDictationState("idle")
        recognitionRef.current = null
      }

      recognitionRef.current = recognition
      recognition.start()
      setDictationState("listening")
    }

    const stopDictation = () => {
      setDictationState("stopped")
      recognitionRef.current?.stop()
    }

    const handleMicClick = () => {
      if (isDisabled) return
      if (dictationState === "listening") {
        stopDictation()
      } else {
        startDictation()
      }
    }

    // ---- Upload submit ----
    const submitUpload = async () => {
      if (isDisabled || selectedFiles.length === 0 || !onAttachFiles) return
      setIsSubmittingUpload(true)
      try {
        await onAttachFiles(selectedFiles, selectedPurpose, addToKnowledgeBase)
        setUploadDialogOpen(false)
        resetUploadState()
      } finally {
        setIsSubmittingUpload(false)
      }
    }

    // ---- LLM selector helpers ----
    const formatModelCost = (val: number | undefined, currency: string | undefined) => {
      if (typeof val !== "number") return null
      return `${new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: val < 0.1 ? 4 : 2,
        minimumFractionDigits: val < 0.1 ? 4 : 2,
      }).format(val)}/1M`
    }

    const getModelCostLabel = (model?: LlmModelSummary) => {
      if (!model) return "Auto"
      const inputCost = formatModelCost(model.input_cost_per_1m, model.currency)
      const outputCost = formatModelCost(model.output_cost_per_1m, model.currency)
      if (!inputCost && !outputCost) return "Cost not available"
      if (inputCost && outputCost) return `In ${inputCost} · Out ${outputCost}`
      return inputCost ? `In ${inputCost}` : `Out ${outputCost}`
    }

    const llmOptions: Array<{
      id: string
      label: string
      provider: string
      costLabel: string
      enabled: boolean
    }> = [
      {
        id: "default",
        label: "Default",
        provider: "Auto routing",
        costLabel: "Managed by backend",
        enabled: true,
      },
      ...llmModels.map((model) => ({
        id: model.id,
        label: model.display_name,
        provider: model.provider,
        costLabel: getModelCostLabel(model),
        enabled: model.enabled,
      })),
    ]

    const selectedLlmOption = llmOptions.find((opt) => opt.id === selectedLlm) ?? llmOptions[0]

    const handleSubmitShortcut = () => {
      if (isSubmitDisabled || isSubmitting || canCancel) return
      onSubmit()
    }

    // ---- Render ----
    return (
      <div
        className={cn(
          "space-y-3 bg-background px-4 py-4 transition-colors",
          isComposerDropActive && "bg-cyan-50/70",
          isDisabled && "pointer-events-none opacity-60",
          className
        )}
        onDragEnter={handleComposerDragEnter}
        onDragOver={handleComposerDragOver}
        onDragLeave={handleComposerDragLeave}
        onDrop={handleComposerDrop}
      >
        {/* Optional header bar */}
        {headerTitle ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{headerTitle}</p>
            {onClose ? (
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={onClose}
                disabled={isCloseDisabled || isSubmittingUpload}
                aria-label="Close composer"
              >
                <Icon icon={X} size="sm" />
              </Button>
            ) : null}
          </div>
        ) : null}

        {/* Loading overlay OR composer body */}
        {isDisabled && loadingOverlay ? (
          loadingOverlay
        ) : (
          <>
            {/* Attachment grid */}
            {attachments.length ? (
              <div className="grid gap-2 md:grid-cols-2">
                {attachments.map((attachment) => (
                  <AttachmentUploadCard
                    key={attachment.localId}
                    attachment={attachment}
                    onRemove={onRemoveAttachment ?? (() => {})}
                    onRetry={onRetryAttachment ?? (() => {})}
                  />
                ))}
              </div>
            ) : null}

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={value}
              placeholder={placeholder}
              disabled={isBodyDisabled}
              onSubmitShortcut={handleSubmitShortcut}
              onChange={(event: any) => onChange(event.target.value)}
            />

            {/* Drop hint */}
            {isComposerDropActive ? (
              <div className="rounded-lg border border-dashed border-cyan-400 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
                Drop files here to choose a purpose and upload them.
              </div>
            ) : null}

            {/* Dictation indicator */}
            {dictationState === "listening" ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-indigo-400 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-indigo-500 animate-pulse" />
                Kyber is listening...
              </div>
            ) : null}

            {/* Microphone permission error */}
            {dictationError === "not-allowed" ? (
              <div className="rounded-lg border border-dashed border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                Microphone access was denied. If this page is embedded, ensure the iframe includes{" "}
                <code className="font-mono text-xs">allow=&quot;microphone&quot;</code>.
              </div>
            ) : null}

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                {/* Attach button + upload dialog */}
                {showAttachButton ? (
                  <Dialog
                    open={uploadDialogOpen}
                    onOpenChange={(open) => {
                      if (open) {
                        setUploadDialogOpen(true)
                        return
                      }
                      closeUploadDialog()
                    }}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => setUploadDialogOpen(true)}
                      disabled={isBodyDisabled}
                      aria-label="Attach files"
                    >
                      <Icon icon={Paperclip} size="sm" />
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Attachment</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Purpose</p>
                          <select
                            className="border-input h-10 w-full rounded-md border bg-background px-3 text-sm"
                            value={selectedPurpose}
                            disabled={isDisabled}
                            onChange={(event) => setSelectedPurpose(event.target.value as AttachmentPurpose)}
                          >
                            {purposeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium">File</p>
                          <div
                            className={cn(
                              "rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
                              isModalDropActive
                                ? "border-cyan-500 bg-cyan-50 text-cyan-900"
                                : "border-border bg-muted/30 text-foreground"
                            )}
                            onDragEnter={handleModalDragEnter}
                            onDragOver={handleModalDragOver}
                            onDragLeave={handleModalDragLeave}
                            onDrop={handleModalDrop}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="sr-only"
                              multiple
                              disabled={isDisabled}
                              onChange={(event) => updateSelectedFiles(event.target.files)}
                            />
                            <div className="space-y-2">
                              <p className="text-sm font-medium">
                                {selectedFiles.length > 0
                                  ? `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`
                                  : "Drag files here or browse from your computer"}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmittingUpload || isDisabled}
                              >
                                Choose Files
                              </Button>
                            </div>
                          </div>

                          {selectedFiles.length ? (
                            <div className="rounded-md border border-border bg-background px-3 py-2">
                              <p className="text-xs font-medium text-foreground">Selected files</p>
                              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                {selectedFiles.map((file) => (
                                  <li
                                    key={`${file.name}-${file.lastModified}`}
                                    className="max-w-87.5 truncate"
                                  >
                                    {file.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          <p className="text-xs text-muted-foreground">PDF, DOCX, TXT up to 25MB</p>
                        </div>

                        {showKnowledgeBaseOption ? (
                          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-input"
                              checked={addToKnowledgeBase}
                              disabled={isSubmittingUpload || isDisabled}
                              onChange={(event) => setAddToKnowledgeBase(event.target.checked)}
                            />
                            Add to A1Hub Knowledge base
                          </label>
                        ) : null}
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeUploadDialog}
                          disabled={isSubmittingUpload || isDisabled}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={() => void submitUpload()}
                          disabled={selectedFiles.length === 0 || isSubmittingUpload || isDisabled}
                        >
                          {isSubmittingUpload ? (
                            <>
                              <Icon icon={Loader2} size="sm" className="animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            "Upload"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : null}

                {/* Mic button */}
                {isSpeechSupported ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-8 w-8 p-0",
                      dictationState === "listening" && "bg-indigo-100 text-indigo-600"
                    )}
                    aria-label={dictationState === "listening" ? "Stop dictation" : "Start dictation"}
                    onClick={handleMicClick}
                    disabled={isBodyDisabled}
                  >
                    <Icon icon={Mic} size="sm" />
                  </Button>
                ) : null}

                {/* LLM model selector */}
                {showModelSelector ? (
                  <div ref={llmSelectorRef} className="relative ml-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 min-w-56 justify-between gap-2 px-2"
                      disabled={isInteractionLocked || isLlmModelsLoading}
                      aria-expanded={isLlmSelectorOpen}
                      onClick={() => {
                        setIsSourcesSelectorOpen(false)
                        setIsLlmSelectorOpen((open) => !open)
                      }}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon icon={Cpu} size="sm" className="text-cyan-600" />
                        <span className="min-w-0 text-left leading-tight">
                          <span className="block truncate text-xs font-semibold text-foreground">
                            {isLlmModelsLoading ? "Loading models..." : selectedLlmOption.label}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {selectedLlmOption.costLabel}
                          </span>
                        </span>
                      </span>
                      <Icon
                        icon={ChevronDown}
                        size="sm"
                        className={cn("transition-transform", isLlmSelectorOpen && "rotate-180")}
                      />
                    </Button>

                    {isLlmSelectorOpen ? (
                      <div className="absolute bottom-10 left-0 z-30 w-80 rounded-xl border border-border bg-background/95 p-1 shadow-2xl backdrop-blur-sm">
                        <div className="mb-1 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          LLM Model
                        </div>
                        <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                          {llmOptions.map((option) => {
                            const isSelected = option.id === selectedLlm
                            return (
                              <button
                                key={option.id}
                                type="button"
                                className={cn(
                                  "flex w-full items-start justify-between gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                                  isSelected ? "bg-cyan-50 text-cyan-950" : "hover:bg-muted/70",
                                  !option.enabled && "opacity-50"
                                )}
                                disabled={!option.enabled || isInteractionLocked}
                                onClick={() => {
                                  onSelectedLlmChange?.(option.id)
                                  setIsLlmSelectorOpen(false)
                                }}
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-medium">
                                    {option.label}
                                  </span>
                                  <span className="block truncate text-[11px] text-muted-foreground">
                                    {option.provider}
                                  </span>
                                  <span className="block truncate text-[11px] text-slate-600">
                                    {option.costLabel}
                                  </span>
                                </span>
                                {isSelected ? (
                                  <Icon icon={Check} size="sm" className="mt-0.5 text-cyan-700" />
                                ) : null}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Sources selector */}
                {showSourcesSelector ? (
                  <div ref={sourcesSelectorRef} className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 min-w-36 justify-between gap-2 px-2"
                      disabled={isInteractionLocked}
                      aria-expanded={isSourcesSelectorOpen}
                      onClick={() => {
                        setIsLlmSelectorOpen(false)
                        setIsSourcesSelectorOpen((open) => !open)
                      }}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon icon={Globe} size="sm" className={useWeb ? "text-cyan-600" : "text-muted-foreground"} />
                        <Icon icon={BookOpen} size="sm" className={useKnowledge ? "text-cyan-600" : "text-muted-foreground"} />
                        <Icon icon={Bot} size="sm" className={useAgentic ? "text-cyan-600" : "text-muted-foreground"} />
                        <span className="truncate text-xs font-semibold text-foreground">Sources</span>
                      </span>
                      <Icon
                        icon={ChevronDown}
                        size="sm"
                        className={cn("transition-transform", isSourcesSelectorOpen && "rotate-180")}
                      />
                    </Button>

                    {isSourcesSelectorOpen ? (
                      <div className="absolute bottom-10 left-0 z-30 w-80 rounded-xl border border-border bg-background/95 p-1 shadow-2xl backdrop-blur-sm">
                        <div className="mb-1 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Sources
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/70">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Icon icon={Globe} size="sm" className="text-cyan-700" />
                                Web
                              </div>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                Search across the entire internet
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={useWeb}
                              aria-label="Use web source"
                              className={cn(
                                "relative h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                                useWeb ? "bg-cyan-500" : "bg-slate-300"
                              )}
                              onClick={() => onUseWebChange?.(!useWeb)}
                              disabled={isInteractionLocked}
                            >
                              <span
                                className={cn(
                                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                                  useWeb ? "left-4" : "left-0.5"
                                )}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/70">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Icon icon={BookOpen} size="sm" className="text-cyan-700" />
                                Use Knowledge
                              </div>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                Search Kyber indexed attachments and workspace context
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={useKnowledge}
                              aria-label="Use knowledge source"
                              className={cn(
                                "relative h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                                useKnowledge ? "bg-cyan-500" : "bg-slate-300"
                              )}
                              onClick={() => onUseKnowledgeChange?.(!useKnowledge)}
                              disabled={isInteractionLocked}
                            >
                              <span
                                className={cn(
                                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                                  useKnowledge ? "left-4" : "left-0.5"
                                )}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/70">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Icon icon={Bot} size="sm" className="text-cyan-700" />
                                Agentic
                              </div>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                Let Kyber plan and combine web + knowledge automatically
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={useAgentic}
                              aria-label="Use agentic source"
                              className={cn(
                                "relative h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                                useAgentic ? "bg-cyan-500" : "bg-slate-300"
                              )}
                              onClick={() => onUseAgenticChange?.(!useAgentic)}
                              disabled={isInteractionLocked}
                            >
                              <span
                                className={cn(
                                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                                  useAgentic ? "left-4" : "left-0.5"
                                )}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Submit / Cancel button */}
              <Button
                type="button"
                className={cn(
                  "text-white",
                  canCancel
                    ? "w-40 bg-slate-600 hover:bg-slate-500"
                    : submitClassName ?? "w-40 bg-indigo-500 hover:bg-indigo-400"
                )}
                onClick={() => {
                  if (canCancel) {
                    onCancel?.()
                  } else {
                    onSubmit()
                  }
                }}
                disabled={(isSubmitDisabled || isSubmitting) && !canCancel}
              >
                {canCancel ? (
                  <>
                    <Icon icon={SquareStop} size="sm" />
                    Cancel
                  </>
                ) : isSubmitting ? (
                  <>
                    <Icon icon={Loader2} size="sm" className="animate-spin" />
                    {submitLoadingLabel}
                  </>
                ) : (
                  <>
                    <Icon icon={SendHorizontal} size="sm" />
                    {submitLabel}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    )
  }
)
