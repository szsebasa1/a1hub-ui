# @accelone/a1hub-ui

Shared React component library for the A1Hub platform. Built on Radix UI primitives, styled with Tailwind CSS, and typed with TypeScript.

## Installation

This package is consumed as a local workspace dependency. Add it to your app's `package.json`:

```json
{
  "dependencies": {
    "@accelone/a1hub-ui": "*"
  }
}
```

Then run your package manager's install command to link the workspace.

## Peer dependencies

| Package | Version |
|---|---|
| `react` | `^19` |
| `react-dom` | `^19` |

## Components

### Layout & containers

| Component | Description |
|---|---|
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction` | Flexible card surface with `size` prop (`"default"` \| `"sm"`) |
| `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` | Modal dialog built on Radix Dialog |

### Forms & inputs

| Component | Description |
|---|---|
| `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage` | React Hook Form integration with accessible field wrappers |
| `Input` | Single-line text input |
| `Textarea` | Multi-line textarea with optional `onSubmitShortcut` (⌘↵ / Ctrl↵) |
| `PasswordInput` | Password field with Show/Hide toggle |
| `Button` | Variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`. Sizes: `xs`, `sm`, `default`, `lg`, `icon`, `icon-xs` |

### Data display

| Component | Description |
|---|---|
| `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption` | Responsive scrollable table |
| `Badge` | Inline status chip. Variants: `default`, `secondary`, `outline` |
| `Skeleton` | Animated loading placeholder |
| `StatCard` | KPI card showing a label, value, and optional trend string |
| `ActivityList` | Card listing timestamped activity items |
| `StatusList` | Card showing service health statuses (`healthy` \| `degraded` \| `down`) |
| `ProgressMetric` | Progress bar card with `default` and `danger` tones |
| `SimpleBarChart` | Horizontal bar chart card with optional value formatter |

### Inputs & rich controls

| Component | Description |
|---|---|
| `ComposerInput` | Rich chat composer with file attachments, audio, model/source selection, and submit |
| `AttachmentUploadCard` | Upload progress card for a single file attachment |
| `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, et al. | Dropdown built on Radix DropdownMenu |

### Feedback

| Component | Description |
|---|---|
| `Toaster` | Toast container — render once at the app root |
| `useToast` | Hook to imperatively fire toasts |

### Utilities

| Export | Description |
|---|---|
| `Icon` | Wrapper around any `lucide-react` icon with `size` prop (`"sm"` \| `"md"` \| `"lg"`) |
| `cn` | `clsx` + `tailwind-merge` utility for conditional class names |

## Icon policy

- Official icon set: `lucide-react`
- Consume icons via the `Icon` component exported from this package
- Do not introduce `react-icons` in apps using this design system

```tsx
import { Icon } from "@accelone/a1hub-ui"
import { Search } from "lucide-react"

export function SearchTrigger() {
  return <Icon icon={Search} size="sm" className="text-muted-foreground" />
}
```

## Usage examples

### Button

```tsx
import { Button } from "@accelone/a1hub-ui"

<Button variant="outline" size="sm">Cancel</Button>
<Button variant="destructive">Delete</Button>
```

### Toast

```tsx
import { Toaster, useToast } from "@accelone/a1hub-ui"

// In your root layout:
<Toaster />

// Anywhere in the app:
const { toast } = useToast()
toast({ title: "Saved", description: "Your changes have been saved." })
```

### StatCard

```tsx
import { StatCard } from "@accelone/a1hub-ui"

<StatCard label="Total users" value="1,284" trend="+12% this month" />
```

### ProgressMetric

```tsx
import { ProgressMetric } from "@accelone/a1hub-ui"

<ProgressMetric
  title="Storage"
  label="Used"
  valueText="8.2 GB / 10 GB"
  percent={82}
  tone="danger"
/>
```

### SimpleBarChart

```tsx
import { SimpleBarChart } from "@accelone/a1hub-ui"

<SimpleBarChart
  title="Weekly signups"
  items={[
    { label: "Mon", value: 42 },
    { label: "Tue", value: 78 },
    { label: "Wed", value: 55 },
  ]}
/>
```
