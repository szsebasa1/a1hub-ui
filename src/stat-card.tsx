import { Card, CardContent, CardHeader, CardTitle } from "./card"

type StatCardProps = {
  label: string
  value: string
  trend?: string
}

export function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {trend ? <p className="text-xs text-muted-foreground">{trend}</p> : null}
      </CardContent>
    </Card>
  )
}
