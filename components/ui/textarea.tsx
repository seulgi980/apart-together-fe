import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-md border border-input bg-brand-0 px-3 py-2 text-body text-brand-900 transition-colors outline-none placeholder:text-brand-700 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:bg-brand-150 disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-danger",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
