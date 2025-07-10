"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { FiSearch } from "react-icons/fi"
import { SEARCH_TEXT } from "../../utils/constants"

interface SearchButtonProps {
  isLoading: boolean
  canSearch: boolean
  isAuthenticated: boolean
}

/**
 * SearchButton - Smart button with multiple states
 * 
 * @component
 * @description
 * Renders the search button with appropriate text and state
 * based on loading, authentication, and search limit status.
 */
export function SearchButton({ 
  isLoading, 
  canSearch, 
  isAuthenticated 
}: SearchButtonProps) {
  const isDisabled = isLoading || (!canSearch && !isAuthenticated)

  return (
    <Button
      type="submit"
      className="w-full h-12 text-base font-semibold"
      disabled={isDisabled}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>{SEARCH_TEXT.searchingButton}</span>
        </div>
      ) : !canSearch && !isAuthenticated ? (
        <div className="flex items-center space-x-2">
          <FiSearch className="h-4 w-4 opacity-50" />
          <span>{SEARCH_TEXT.limitReachedButton}</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <FiSearch className="h-4 w-4" />
          <span>{SEARCH_TEXT.searchButton}</span>
        </div>
      )}
    </Button>
  )
}