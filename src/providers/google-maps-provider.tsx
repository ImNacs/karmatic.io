/**
 * @fileoverview Google Maps provider for loading and managing Maps API
 * @module providers/google-maps-provider
 */

"use client"

import { useJsApiLoader } from "@react-google-maps/api"
import { createContext, useContext, ReactNode } from "react"

/**
 * Google Maps libraries to load
 * @constant
 */
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"]

/**
 * Google Maps context value type
 * @interface GoogleMapsContextType
 */
interface GoogleMapsContextType {
  /** Whether Google Maps API is loaded */
  isLoaded: boolean
  /** Error if loading failed */
  loadError: Error | undefined
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
})

/**
 * Hook to access Google Maps loading state
 * @returns {GoogleMapsContextType} Google Maps context value
 * @throws {Error} If used outside GoogleMapsProvider
 * @example
 * ```tsx
 * const { isLoaded, loadError } = useGoogleMaps();
 * 
 * if (loadError) return <div>Error loading maps</div>;
 * if (!isLoaded) return <div>Loading...</div>;
 * ```
 */
export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext)
  if (!context) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider")
  }
  return context
}

/**
 * Props for GoogleMapsProvider component
 * @interface GoogleMapsProviderProps
 */
interface GoogleMapsProviderProps {
  /** Child components that need Google Maps access */
  children: ReactNode
}

/**
 * Provider component for Google Maps API loading
 * @component
 * @param {GoogleMapsProviderProps} props - Component props
 * @returns {JSX.Element} Provider wrapper
 * @example
 * ```tsx
 * <GoogleMapsProvider>
 *   <MapComponent />
 * </GoogleMapsProvider>
 * ```
 */
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