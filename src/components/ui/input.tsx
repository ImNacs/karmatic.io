import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, variant = "default", ...props }: React.ComponentProps<"input"> & { variant?: "default" | "search" }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "flex w-full min-w-0 text-sm transition-all outline-none",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        
        // Variant styles
        variant === "search" ? [
          // Search/Chat style - like Perplexity
          "h-12 rounded-full bg-gray-50 dark:bg-gray-800 px-4 py-3",
          "border-0 shadow-none",
          "focus:ring-2 focus:ring-blue-500/20",
          "hover:bg-gray-100 dark:hover:bg-gray-700/50"
        ] : [
          // Default style - forms
          "h-10 rounded-lg border border-input bg-transparent px-3 py-2",
          "shadow-xs dark:bg-input/30",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        ],
        
        // Error states
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        
        className
      )}
      {...props}
    />
  )
}

export { Input }
