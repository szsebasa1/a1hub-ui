import { Card, CardContent, CardHeader, CardTitle } from "./card"

type ActivityItem = {
  title: string
  detail: string
  time: string
}

type ActivityListProps = {
  title: string
  items: ActivityItem[]
}

export function ActivityList({ title, items }: ActivityListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={`${item.title}-${item.time}`} className="flex items-start justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}