import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-input bg-brand-0 px-3 text-body text-brand-900 transition-colors outline-none placeholder:text-brand-700 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:bg-brand-150 disabled:opacity-50 aria-invalid:border-error-text aria-invalid:ring-error-text lg:h-10",
        className
      )}
      {...props}
    />
  )
}

export { Input }
