import * as React from "react"

import { cn } from "./utils"

export type BreadcrumbItem = {
  label: React.ReactNode
  /** Omit on the current page (the last item). */
  href?: string
}

type BreadcrumbProps = Omit<React.ComponentProps<"nav">, "children"> & {
  items: BreadcrumbItem[]
  /** Link element, e.g. Next's `Link` for client-side navigation. Default `a`. */
  linkAs?: React.ElementType
}

// Brand guide, "Breadcrumb": purple links, gray › separators, gray current page.
function Breadcrumb({ items, linkAs: LinkComponent = "a", className, ...props }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" data-slot="breadcrumb" className={cn("text-[13px]", className)} {...props}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="inline-flex items-center gap-1">
              {item.href && !isLast ? (
                <LinkComponent
                  href={item.href}
                  className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {item.label}
                </LinkComponent>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="text-muted-foreground">
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <span aria-hidden="true" className="text-[11px] text-muted-foreground">
                  ›
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export { Breadcrumb }
