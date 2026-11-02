import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Progress } from "./progress"

type ProgressMetricProps = {
  title: string
  label: string
  valueText: string
  percent: number
  tone?: "default" | "danger" | "gold" | "success"
  description?: string
}

const TONES = {
  default: "brand",
  danger: "destructive",
  gold: "gold",
  success: "success",
} as const

export function ProgressMetric({
  title,
  label,
  valueText,
  percent,
  tone = "default",
  description,
}: ProgressMetricProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <Progress value={percent} label={label} valueText={valueText} tone={TONES[tone]} />
      </CardContent>
    </Card>
  )
}
