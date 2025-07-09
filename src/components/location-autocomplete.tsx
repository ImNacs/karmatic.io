"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FiMapPin, FiCrosshair, FiX } from "react-icons/fi"
import { useGooglePlaces, type PlacePrediction } from "@/lib/google-places"
import { motion, AnimatePresence } from "motion/react"

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect?: (place: PlacePrediction) => void
  onLocationSelect?: (coords: { lat: number; lng: number }) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function LocationAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  onLocationSelect,
  placeholder = "Ingresa tu ubicación",
  disabled = false,
  className = "",
}: LocationAutocompleteProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const { isLoaded, getPlacePredictions, resetSessionToken } = useGooglePlaces()

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const blurTimeout = useRef<NodeJS.Timeout | null>(null)
  const wasSelectedRef = useRef<boolean>(false)

  useEffect(() => {
    // If the value was just selected from predictions, don't fetch again
    if (wasSelectedRef.current) {
      wasSelectedRef.current = false
      return
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    if (value.length > 2 && isLoaded) {
      setIsLoading(true)
      debounceTimeout.current = setTimeout(() => {
        getPlacePredictions(value)
          .then((results) => {
            setPredictions(results)
            setShowPredictions(true)
            setIsLoading(false)
          })
          .catch((error) => {
            console.error("Error getting predictions:", error)
            setPredictions([])
            setIsLoading(false)
          })
      }, 300)
    } else {
      setPredictions([])
      setShowPredictions(false)
      setIsLoading(false)
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [value, isLoaded, getPlacePredictions])

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeout.current) {
        clearTimeout(blurTimeout.current)
      }
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setSelectedIndex(-1)
  }

  const handlePredictionClick = (prediction: PlacePrediction) => {
    // Clear any pending blur timeout
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current)
    }
    
    // Mark that this value change is from a selection
    wasSelectedRef.current = true
    
    onChange(prediction.description)
    setShowPredictions(false)
    setPredictions([]) // Clear predictions after selection
    onPlaceSelect?.(prediction)
    resetSessionToken() // Reset session token after place selection
    inputRef.current?.blur() // Remove focus after selection
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showPredictions || predictions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev < predictions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => prev > 0 ? prev - 1 : -1)
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          handlePredictionClick(predictions[selectedIndex])
        }
        break
      case "Escape":
        setShowPredictions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const getCurrentLocation = () => {
    setIsGettingLocation(true)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const coords = { lat: latitude, lng: longitude }
          
          // Always pass coordinates to parent
          if (onLocationSelect) {
            onLocationSelect(coords)
          }
          
          // Use Google Geocoding API to get neighborhood/area instead of exact address
          if (isLoaded && window.google?.maps) {
            const geocoder = new window.google.maps.Geocoder()
            const latlng = { lat: latitude, lng: longitude }
            
            geocoder.geocode({ location: latlng }, (results, status) => {
              if (status === "OK" && results) {
                // Look for neighborhood, locality, or administrative area
                let locationName = ""
                let cityName = ""
                let stateName = ""
                
                // Extract location components
                for (const result of results) {
                  for (const component of result.address_components) {
                    if (component.types.includes("neighborhood") && !locationName) {
                      locationName = component.long_name
                    } else if (component.types.includes("sublocality_level_1") && !locationName) {
                      locationName = component.long_name
                    } else if (component.types.includes("sublocality") && !locationName) {
                      locationName = component.long_name
                    } else if (component.types.includes("locality")) {
                      cityName = component.long_name
                    } else if (component.types.includes("administrative_area_level_1")) {
                      stateName = component.short_name
                    }
                  }
                  // Stop when we have enough information
                  if (locationName && cityName) break
                }
                
                // Build the location string with available information
                let finalLocation = ""
                if (locationName) {
                  finalLocation = locationName
                  if (cityName && cityName !== locationName) {
                    finalLocation += `, ${cityName}`
                  }
                  if (stateName) {
                    finalLocation += `, ${stateName}`
                  }
                } else if (cityName) {
                  // If no neighborhood found, use city
                  finalLocation = cityName
                  if (stateName) {
                    finalLocation += `, ${stateName}`
                  }
                } else if (stateName) {
                  // Last resort, just use state
                  finalLocation = stateName
                }
                
                if (finalLocation) {
                  wasSelectedRef.current = true
                  onChange(finalLocation)
                } else {
                  // Ultimate fallback
                  wasSelectedRef.current = true
                  onChange("Mi ubicación actual")
                }
              } else {
                // Fallback to general area if geocoding fails
                wasSelectedRef.current = true
                onChange("Mi ubicación actual")
              }
              setIsGettingLocation(false)
            })
          } else {
            // Fallback when Google Maps is not loaded
            wasSelectedRef.current = true
            onChange("Mi ubicación actual")
            setIsGettingLocation(false)
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          setIsGettingLocation(false)
        }
      )
    } else {
      setIsGettingLocation(false)
    }
  }

  const clearInput = () => {
    onChange("")
    setShowPredictions(false)
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <FiMapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowPredictions(true)
            }
          }}
          onBlur={() => {
            // Delay hiding predictions to allow clicking
            blurTimeout.current = setTimeout(() => setShowPredictions(false), 200)
          }}
          placeholder={placeholder}
          className="pl-10 pr-20 h-12 text-base"
          disabled={disabled}
        />
        
        <div className="absolute right-1 top-1 flex items-center space-x-1">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0"
              onClick={clearInput}
              disabled={disabled}
            >
              <FiX className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
            onClick={getCurrentLocation}
            disabled={isGettingLocation || disabled}
          >
            <FiCrosshair className={`h-4 w-4 ${isGettingLocation ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showPredictions && predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 z-50 mt-1"
          >
            <Card className="shadow-lg border">
              <CardContent className="p-0">
                <div className="max-h-60 overflow-y-auto">
                  {predictions.map((prediction, index) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 focus:outline-none focus:bg-muted/50 ${
                        index === selectedIndex ? "bg-muted/50" : ""
                      }`}
                      onClick={() => handlePredictionClick(prediction)}
                    >
                      <div className="flex items-start space-x-3">
                        <FiMapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {prediction.structured_formatting.main_text}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {prediction.structured_formatting.secondary_text}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card className="shadow-lg border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Buscando ubicaciones...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}