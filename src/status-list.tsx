import { Card, CardContent, CardHeader, CardTitle } from "./card"

import { cn } from "./utils"

type HealthStatus = {
  service: string
  status: "healthy" | "degraded" | "down"
  detail: string
}

type StatusListProps = {
  title: string
  items: HealthStatus[]
}

const statusStyles: Record<HealthStatus["status"], string> = {
  healthy: "bg-emerald-500/15 text-emerald-700",
  degraded: "bg-amber-500/15 text-amber-700",
  down: "bg-destructive/15 text-destructive",
}

export function StatusList({ title, items }: StatusListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.service} className="flex items-start justify-between gap-4 rounded-md border p-3">
            <div>
              <p className="font-medium">{item.service}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium uppercase",
                statusStyles[item.status]
              )}
            >
              {item.status}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
