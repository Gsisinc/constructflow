import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gold-50 text-gold-700",
        secondary:
          "border-transparent bg-slate-100 text-slate-700",
        destructive:
          "border-transparent bg-red-50 text-red-700",
        outline: "text-slate-600 border-slate-200 bg-white",
        success:
          "border-transparent bg-green-50 text-green-700",
        warning:
          "border-transparent bg-amber-50 text-amber-700",
        danger:
          "border-transparent bg-red-50 text-red-700",
        info:
          "border-transparent bg-blue-50 text-blue-700",
        neutral:
          "border-transparent bg-slate-100 text-slate-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }