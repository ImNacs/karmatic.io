"use client"

import React from "react"
import { FiMapPin } from "react-icons/fi"
import { cn } from "@/lib/utils"

interface LocationSuggestionProps {
  mainText: string
  secondaryText: string
  isSelected?: boolean
  onClick: () => void
}

/**
 * LocationSuggestion - Individual location suggestion item
 * 
 * @component
 * @description
 * Renders a single location suggestion with main and secondary text.
 * Used within the autocomplete dropdown.
 */
export function LocationSuggestion({
  mainText,
  secondaryText,
  isSelected = false,
  onClick
}: LocationSuggestionProps) {
  return (
    <button
      type="button"
      className={cn(
        "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors",
        "border-b border-border last:border-b-0 focus:outline-none focus:bg-muted/50",
        isSelected && "bg-muted/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <FiMapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">
            {mainText}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {secondaryText}
          </div>
        </div>
      </div>
    </button>
  )
}