# a1hub-ui

## Icon policy

- Official icon set: `lucide-react`
- Preferred consumption from apps: `Icon` exported by `@accelone/a1hub-ui`
- Do not introduce `react-icons` in apps using this design system

## Usage

```tsx
import { Icon } from "@accelone/a1hub-ui"
import { Search } from "lucide-react"

export function SearchTrigger() {
	return <Icon icon={Search} size="sm" className="text-muted-foreground" />
}
```
