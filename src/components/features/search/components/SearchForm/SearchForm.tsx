"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { FiSearch } from "react-icons/fi"
import type { SearchData } from "@/types/agency"
import type { PlacePrediction } from "@/lib/google-places"
import { LocationAutocomplete } from "../LocationAutocomplete"
import { SearchButton } from "./SearchButton"
import { searchSchema, type SearchFormData } from "../../utils/validation"
import { SEARCH_TEXT } from "../../utils/constants"
import { trackEvent } from "@/lib/gtm/gtm"

interface SearchFormProps {
  onSearch: (data: SearchData) => void
  isLoading?: boolean
  canSearch: boolean
  isAuthenticated: boolean
}

/**
 * SearchForm - Main search form component
 * 
 * @component
 * @description
 * Handles the search form logic including validation, location selection,
 * and form submission. Integrates with Google Places for location autocomplete.
 */
export function SearchForm({ 
  onSearch, 
  isLoading = false,
  canSearch,
  isAuthenticated
}: SearchFormProps) {
  const [selectedPlace, setSelectedPlace] = useState<PlacePrediction | null>(null)
  const [currentLocationCoords, setCurrentLocationCoords] = useState<{ lat: number; lng: number; country?: string } | null>(null)

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      location: "",
      query: "",
    },
  })

  const handleSubmit = async (data: SearchFormData) => {
    // Validate that user has selected a place or used current location
    if (!selectedPlace && !currentLocationCoords) {
      form.setError('location', {
        type: 'manual',
        message: 'Selecciona una ubicación de la lista o usa tu ubicación actual'
      })
      return
    }
    
    // Track search initiation
    trackEvent.searchInitiated(data.location, data.query, isAuthenticated)
    
    // Call the original onSearch to trigger the search
    onSearch({
      ...data,
      placeId: selectedPlace?.place_id,
      placeDetails: selectedPlace ? {
        description: selectedPlace.description,
        mainText: selectedPlace.structured_formatting.main_text,
        secondaryText: selectedPlace.structured_formatting.secondary_text,
      } : undefined,
      // Include coordinates if using current location
      coordinates: currentLocationCoords || undefined
    })
  }

  const handlePlaceSelect = (place: PlacePrediction) => {
    setSelectedPlace(place)
    // Reset current location coords when selecting a place
    setCurrentLocationCoords(null)
  }

  const handleLocationSelect = (coords: { lat: number; lng: number; country?: string }) => {
    setCurrentLocationCoords(coords)
    // Reset selected place when using current location
    setSelectedPlace(null)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                {SEARCH_TEXT.locationLabel}
              </FormLabel>
              <FormControl>
                <LocationAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  onPlaceSelect={handlePlaceSelect}
                  onLocationSelect={handleLocationSelect}
                  placeholder={SEARCH_TEXT.locationPlaceholder}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                {SEARCH_TEXT.queryLabel}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    placeholder={SEARCH_TEXT.queryPlaceholder}
                    className="pl-10"
                    disabled={isLoading}
                    variant="search"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SearchButton
          isLoading={isLoading}
          canSearch={canSearch}
          isAuthenticated={isAuthenticated}
        />
      </form>
    </Form>
  )
}