import { Button, Card, CardContent, Icon } from "./"
import { FileText, Loader2, RotateCcw, Trash2 } from "lucide-react"

import { cn } from "./utils"

export type AttachmentUploadCardAttachment = {
  localId: string
  fileName: string
  purpose: string
  status: "idle" | "uploading" | "uploaded" | "failed"
  progress: number
  error?: string
}

type AttachmentUploadCardProps = {
  attachment: AttachmentUploadCardAttachment
  onRemove: (localId: string) => void
  onRetry: (localId: string) => void
}

export function AttachmentUploadCard({ attachment, onRemove, onRetry }: AttachmentUploadCardProps) {
  const isUploading = attachment.status === "uploading"
  const isFailed = attachment.status === "failed"
  const isUploaded = attachment.status === "uploaded"

  return (
    <Card className="py-0">
      <CardContent className="space-y-2 px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Icon icon={FileText} size="sm" className="text-muted-foreground" />
              <span className="truncate">{attachment.fileName}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Purpose: {attachment.purpose.replaceAll("_", " ")}</p>
          </div>

          <div className="flex items-center gap-1">
            {isUploading ? <Icon icon={Loader2} size="sm" className="animate-spin text-cyan-700" /> : null}
            {isFailed ? (
              <Button
                type="button"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => onRetry(attachment.localId)}
                aria-label="Retry upload"
              >
                <Icon icon={RotateCcw} size="sm" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onRemove(attachment.localId)}
              aria-label="Remove attachment"
            >
              <Icon icon={Trash2} size="sm" />
            </Button>
          </div>
        </div>

        <div className="h-2 rounded-full bg-muted">
          <div
            className={cn(
              "h-2 rounded-full transition-all",
              isFailed ? "bg-destructive" : isUploaded ? "bg-emerald-500" : "bg-indigo-500"
            )}
            style={{ width: `${attachment.progress}%` }}
          />
        </div>

        <p
          className={cn(
            "text-xs",
            isFailed ? "text-destructive" : isUploaded ? "text-emerald-600" : "text-muted-foreground"
          )}
        >
          {isFailed
            ? attachment.error ?? "Upload failed"
            : isUploaded
              ? "Uploaded"
              : `Uploading ${attachment.progress}%`}
        </p>
      </CardContent>
    </Card>
  )
}
