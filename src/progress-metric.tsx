import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"

import { cn } from "./utils"

type ProgressMetricProps = {
  title: string
  label: string
  valueText: string
  percent: number
  tone?: "default" | "danger"
  description?: string
}

export function ProgressMetric({
  title,
  label,
  valueText,
  percent,
  tone = "default",
  description,
}: ProgressMetricProps) {
  const safePercent = Math.max(0, Math.min(100, percent))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{valueText}</span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div
            className={cn(
              "h-2 rounded-full bg-primary",
              tone === "danger" && "bg-destructive"
            )}
            style={{ width: `${safePercent}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
