import { Badge } from "./badge"
import { Card, CardContent, CardHeader, CardTitle } from "./card"

type HealthStatus = {
  service: string
  status: "healthy" | "degraded" | "down"
  detail: string
}

type StatusListProps = {
  title: string
  items: HealthStatus[]
}

const statusVariants = {
  healthy: "success",
  degraded: "gold",
  down: "destructive",
} as const satisfies Record<HealthStatus["status"], string>

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
            <Badge dot variant={statusVariants[item.status]} className="uppercase">
              {item.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
