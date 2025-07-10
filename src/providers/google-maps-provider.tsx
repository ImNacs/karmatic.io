"use client"

import { useJsApiLoader } from "@react-google-maps/api"
import { createContext, useContext, ReactNode } from "react"

// Google Maps libraries to load
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"]

interface GoogleMapsContextType {
  isLoaded: boolean
  loadError: Error | undefined
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
})

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext)
  if (!context) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider")
  }
  return context
}

interface GoogleMapsProviderProps {
  children: ReactNode
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
    language: "es",
    region: "MX",
  })

  const value = {
    isLoaded,
    loadError,
  }

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  )
}