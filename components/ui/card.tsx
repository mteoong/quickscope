import type * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-sm border py-6 shadow-sm", className)}
      {...props}
    >
      {props.children}
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center px-6 [.border-t]:pt-6", className)} {...props} />
}

function TokenCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="token-card"
      className={cn(
        "bg-card text-card-foreground flex flex-row items-center gap-4 rounded-sm border px-4 py-3 shadow-sm",
        className,
      )}
      {...props}
    />
  )
}

function TokenImage({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="token-image"
      className={cn(
        "flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center",
        className,
      )}
      {...props}
    />
  )
}

function TokenInfo({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="token-info"
      className={cn("flex-1 flex items-center justify-between min-w-0", className)}
      {...props}
    />
  )
}

function TokenDetails({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="token-details" className={cn("flex flex-col gap-1", className)} {...props} />
}

function TokenMetrics({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="token-metrics" className={cn("flex items-center gap-4 text-sm", className)} {...props} />
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  TokenCard,
  TokenImage,
  TokenInfo,
  TokenDetails,
  TokenMetrics,
}
