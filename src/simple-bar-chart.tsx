import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"

import { cn } from "./utils"

const numberFormatter = new Intl.NumberFormat()

type BarDatum = {
  label: string
  value: number
}

type SimpleBarChartProps = {
  title: string
  description?: string
  items: BarDatum[]
  formatter?: (value: number) => string
  barClassName?: string
}

export function SimpleBarChart({
  title,
  description,
  items,
  formatter = (value) => numberFormatter.format(value),
  barClassName,
}: SimpleBarChartProps) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const widthPercent = Math.round((item.value / maxValue) * 100)

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{formatter(item.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className={cn("h-2 rounded-full bg-primary", barClassName)}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
