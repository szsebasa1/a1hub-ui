# @accelone/a1hub-ui

Shared React component library for the A1Hub platform, with the AccelOne brand theme. Built on Radix UI primitives, styled with Tailwind CSS v4, and typed with TypeScript.

The look follows the AccelOne brand guide, [docs/accelone-brand-identity.html](docs/accelone-brand-identity.html): palette, Roboto family, radii, shadows and the web UI components of its addendum A.

## Installation

Install it from GitHub:

```json
{
  "dependencies": {
    "@accelone/a1hub-ui": "github:szsebasa1/a1hub-ui#main"
  }
}
```

The package ships its TypeScript sources (`main: src/index.ts`). In Next.js, add it to `transpilePackages`:

```js
const nextConfig = {
  transpilePackages: ["@accelone/a1hub-ui"],
}
```

### Theme

Import the theme from the app's main stylesheet, after Tailwind and its animation helpers:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@accelone/a1hub-ui/theme.css";
```

`theme.css` defines the tokens for light (`:root`) and dark (`.dark`), maps them to Tailwind utilities, sets the radii, shadows and base styles, declares the `dark` variant (`.dark` class, as next-themes sets it) and registers the library's sources, so the app needs no `@source` line for it.

### Fonts

The theme reads two CSS variables: `--font-roboto` (Roboto 300, 400, 500, 700) and `--font-roboto-condensed` (Roboto Condensed 700). With Next.js:

```tsx
import { Roboto, Roboto_Condensed } from "next/font/google"

const roboto = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700"], variable: "--font-roboto" })
const robotoCondensed = Roboto_Condensed({ subsets: ["latin"], weight: ["700"], variable: "--font-roboto-condensed" })

<html className={`${roboto.variable} ${robotoCondensed.variable}`}>
```

Without them the stack falls back to an installed Roboto, then the system font.

### Moving an app to the brand theme

For an app that defined its own shadcn tokens (as a1hub-front did):

1. Import `theme.css` as above and delete the app's `:root`, `.dark` and `@theme inline` token blocks, its `@custom-variant dark` and its `@source` line for this package.
2. Load the fonts as above, instead of Inter or Geist Sans.
3. Replace Tailwind palette colors (`amber-500`, `slate-900`, `emerald-600`, `indigo-500`...) with tokens or component variants (see [Using the brand](#using-the-brand)).
4. The `sidebar-*` tokens are Deep Purple in both themes: a sidebar built on them should use `text-sidebar-foreground`, `bg-sidebar-accent` and `bg-sidebar-primary` inside it, not `text-muted-foreground`.
5. Replace the old logo image with `AccelOneLogo`.

## Peer dependencies

| Package | Version |
|---|---|
| `react` | `^19` |
| `react-dom` | `^19` |

The consuming app also provides `tailwindcss` v4, `tw-animate-css` and `shadcn` (for `shadcn/tailwind.css`).

## Tokens

Use them as Tailwind utilities (`bg-primary`, `text-heading`...). All but the fixed brand colors switch with the theme.

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#F7F7F9` off-white | `#170426` Deep Purple | Page |
| `foreground` | `#1A1A2E` ink | `#F2EDF7` | Body text |
| `heading` | `#170426` | white | Titles (cards, dialogs, header) |
| `card`, `popover` | white | `#22053B`, `#2D0550` | Surfaces |
| `primary` | `#52068E` Brand Purple | `#B98AF0` | Actions, links, focus |
| `primary-hover` | `#6B0DAA` | `#CDAAF5` | Hover of primary |
| `secondary`, `accent` | `#F3EAFB` Purple Mist | Purple Mid | Tinted surfaces, hover of menus and ghost actions |
| `muted`, `muted-foreground` | `#EFEFEF`, `#67637A` | `#2D0550`, `#B3A7C4` | Tracks, skeletons; secondary text |
| `highlight` | `#D4006A` Pink | `#FF5FA8` | The purple-to-pink axis, required marks |
| `success`, `warning`, `destructive` | | | Strong color (text, icons, edges) |
| `*-soft`, `*-soft-foreground` | | | Tinted backgrounds and their text (`success`, `warning`, `destructive`, `highlight`) |
| `border`, `input`, `ring` | | | Lines, field borders, focus ring |
| `tooltip` | Deep Purple | `#3A0A63` | Tooltip box |
| `sidebar-*` | Deep Purple | darker Deep Purple | Navigation sidebar, in both themes |
| `chart-1` to `chart-5` | purple, pink, gold, gray, Purple Mid | lifted versions | Charts |
| `brand-deep`, `brand-mid`, `brand-purple`, `brand-light`, `brand-mist`, `brand-pink`, `brand-gold`, `brand-ink`, `brand-gray` | fixed | fixed | Always-branded surfaces |

Also: `font-display` (Roboto Condensed, for figures and hero titles), `shadow-card` and `shadow-deep` (the guide's purple-tinted shadows), and the radii `rounded-sm` 4px, `rounded-md` 6px (buttons, inputs), `rounded-lg` 10px (cards, callouts, toasts).

The guide's Gray Mid (`#9490A0`) is 3.1:1 on white, so `muted-foreground` uses a darker shade of it that keeps 4.5:1 (WCAG AA). The dark theme lifts Brand Purple to `#B98AF0`, which carries Deep Purple text, because `#52068E` cannot be read on Deep Purple.

## Using the brand

- Brand Purple is the color of actions. The purple-to-pink axis is for highlights (progress, stat bars).
- Gold is used sparingly: hero and conversion moments (`Button variant="gold"`), and the primary action on dark surfaces.
- Statuses go through variants, not ad hoc colors: `Badge` (`success`, `gold`, `destructive`, `muted`, `dot` for live status), `Callout`, `Toast`.
- Dark surfaces in a light page (`Card variant="dark"`, `Callout variant="dark"`, `Toast variant="brand"`) carry the `dark` class, so everything inside them takes the dark tokens.

## Components

### Brand

| Component | Description |
|---|---|
| `AccelOneLogo` | The logo from the guide as SVG. The arc is gold; the wordmark takes `currentColor`: black on light, white in dark mode by default; pass `className="text-white"` on always-dark surfaces. Size it by height (`h-8 w-auto`). `title` sets the accessible name (`""` hides it) |
| `AccelOneMark` | Square mark (the A under the arc), for tight spaces such as a collapsed sidebar |

### Layout & containers

| Component | Description |
|---|---|
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction` | Card surface. `size`: `default` \| `sm`. `variant`: `default` (white with soft shadow), `bordered`, `accent` (purple top edge; change it with `border-t-*`), `dark`, `gold` |
| `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` | Modal dialog built on Radix Dialog |
| `Divider` | Hairline; with children, a small uppercase label in the middle (`align="center"`) or at the start (`align="start"`, the guide's section label) |

### Forms & inputs

| Component | Description |
|---|---|
| `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage` | React Hook Form integration with accessible field wrappers. `FormLabel required` adds the pink asterisk |
| `Input` | Single-line text input; `startIcon` takes a lucide icon shown inside the field |
| `Textarea` | Multi-line textarea with optional `onSubmitShortcut` (⌘↵ / Ctrl↵) |
| `PasswordInput` | Password field with Show/Hide toggle |
| `Switch` | Toggle on Radix Switch (44x24, purple when on) |
| `fieldClassName` | The field styles, for native elements such as `<select>` |
| `Button` | Variants: `default` (Brand Purple), `secondary` (purple outline), `outline` (neutral), `ghost`, `dark` (Deep Purple), `ghost-dark` (secondary action on dark surfaces), `gold`, `destructive`, `link`. Sizes: `xs`, `sm`, `default`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`. `loading` shows a spinner and blocks it |

### Data display

| Component | Description |
|---|---|
| `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption` | Scrollable table with the guide's Deep Purple header and zebra rows |
| `Badge` | Pill tag. Variants: `default`, `secondary`, `outline`, `pink`, `gold`, `gold-solid`, `success`, `destructive`, `muted`. `dot` for live status; `onRemove` makes it removable |
| `CountBadge` | Counter pinned to the corner of what it wraps (`count`, `max`, `label` for screen readers) |
| `Skeleton` | Animated loading placeholder |
| `StatCard` | Metric card: `label`, `value`, optional `trend`, `delta` (`{ text, direction }`), `bar` (0 to 100) and `variant` (`default`, `accent`, `bordered`, `dark`, `gold`) |
| `Progress` | Progress bar with optional `label` and `valueText`. `tone`: `brand` (purple to pink), `gold`, `success`, `destructive` |
| `Steps` | Step indicator: `steps` (labels) and `current` (index in progress) |
| `ActivityList` | Card listing timestamped activity items |
| `StatusList` | Card showing service health statuses (`healthy` \| `degraded` \| `down`) |
| `ProgressMetric` | Progress card with `default`, `danger`, `gold` and `success` tones |
| `SimpleBarChart` | Horizontal bar chart card with optional value formatter |

### Navigation & help

| Component | Description |
|---|---|
| `Breadcrumb` | `items` (`{ label, href? }`); `linkAs` takes the link component (e.g. Next's `Link`) |
| `Tooltip` | Deep Purple tooltip: `content` and a trigger child; empty `content` renders the child alone |
| `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, et al. | Dropdown built on Radix DropdownMenu |

### Inputs & rich controls

| Component | Description |
|---|---|
| `ComposerInput` | Rich chat composer with file attachments, audio, model/source selection, and submit |
| `AttachmentUploadCard` | Upload progress card for a single file attachment |

### Feedback

| Component | Description |
|---|---|
| `Callout` | Contextual alert with a 4px left edge. Variants: `info`, `success`, `warning`, `destructive`, `dark` (announcements). `title`, and `icon` to replace the variant's |
| `Toaster` | Toast container, bottom-right; render once at the app root. Toasts close after 4s, except `destructive` ones |
| `useToast` | Hook to imperatively fire toasts. Variants: `default`, `brand` (Deep Purple), `success`, `warning`, `destructive` |

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
<Button loading={isSaving}>Save</Button>
```

### Toast

```tsx
import { Toaster, useToast } from "@accelone/a1hub-ui"

// In your root layout:
<Toaster />

// Anywhere in the app:
const { toast } = useToast()
toast({ title: "Saved", description: "Your changes have been saved.", variant: "success" })
```

### Badge and Callout

```tsx
import { Badge, Callout } from "@accelone/a1hub-ui"

<Badge dot variant="success">Signed</Badge>
<Callout variant="warning" title="Review needed">The document awaits your approval.</Callout>
```

### StatCard

```tsx
import { StatCard } from "@accelone/a1hub-ui"

<StatCard label="Total users" value="1,284" delta={{ text: "+12% this month", direction: "up" }} />
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
