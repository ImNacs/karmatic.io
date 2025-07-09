import { useCallback, useEffect, useRef, useState } from 'react'
import { debounce, throttle, smoothPanTo } from '@/lib/map-utils'

interface UseMapInteractionsProps {
  map: google.maps.Map | null
  onBoundsChange?: (bounds: google.maps.LatLngBounds) => void
  onZoomChange?: (zoom: number) => void
  onCenterChange?: (center: google.maps.LatLng) => void
}

export function useMapInteractions({
  map,
  onBoundsChange,
  onZoomChange,
  onCenterChange
}: UseMapInteractionsProps) {
  const [isInteracting, setIsInteracting] = useState(false)
  const [currentZoom, setCurrentZoom] = useState<number>(14)
  const [currentBounds, setCurrentBounds] = useState<google.maps.LatLngBounds | null>(null)
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced bounds change handler for performance
  const debouncedBoundsChange = useCallback(() => {
    const handler = debounce(() => {
      if (!map) return
      const bounds = map.getBounds()
      if (bounds) {
        setCurrentBounds(bounds)
        onBoundsChange?.(bounds)
      }
    }, 300)
    return handler()
  }, [map, onBoundsChange])

  // Throttled zoom change handler
  const throttledZoomChange = useCallback(() => {
    const handler = throttle(() => {
      if (!map) return
      const zoom = map.getZoom()
      if (zoom !== undefined) {
        setCurrentZoom(zoom)
        onZoomChange?.(zoom)
      }
    }, 100)
    return handler()
  }, [map, onZoomChange])

  // Smooth pan to location
  const panTo = useCallback((location: google.maps.LatLng | google.maps.LatLngLiteral, duration?: number) => {
    if (!map) return
    
    const latLng = location instanceof google.maps.LatLng 
      ? location 
      : new google.maps.LatLng(location.lat, location.lng)
    
    smoothPanTo(map, latLng, duration)
  }, [map])

  // Pan with offset (useful for showing markers with UI overlays)
  const panWithOffset = useCallback((
    location: google.maps.LatLng | google.maps.LatLngLiteral,
    offsetX: number = 0,
    offsetY: number = 0
  ) => {
    if (!map) return
    
    const latLng = location instanceof google.maps.LatLng 
      ? location 
      : new google.maps.LatLng(location.lat, location.lng)
    
    // Convert pixel offset to lat/lng offset
    const scale = Math.pow(2, map.getZoom() || 14)
    const worldCoordinate = map.getProjection()?.fromLatLngToPoint(latLng)
    
    if (worldCoordinate) {
      worldCoordinate.x -= offsetX / scale
      worldCoordinate.y -= offsetY / scale
      
      const offsetLatLng = map.getProjection()?.fromPointToLatLng(worldCoordinate)
      if (offsetLatLng) {
        smoothPanTo(map, offsetLatLng)
      }
    }
  }, [map])

  // Fit bounds with animation
  const fitBoundsAnimated = useCallback((
    bounds: google.maps.LatLngBounds,
    padding?: google.maps.Padding | number
  ) => {
    if (!map) return
    
    // Store current viewport
    const currentBounds = map.getBounds()
    const currentZoom = map.getZoom()
    
    // Fit to new bounds
    map.fitBounds(bounds, padding)
    
    // Get new viewport after fitBounds
    const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
      const newZoom = map.getZoom()
      
      // Restore original viewport
      if (currentBounds && currentZoom !== undefined) {
        map.fitBounds(currentBounds)
        map.setZoom(currentZoom)
        
        // Animate to new viewport
        setTimeout(() => {
          map.fitBounds(bounds, padding)
          if (newZoom !== undefined && newZoom > 16) {
            setTimeout(() => map.setZoom(16), 100)
          }
        }, 50)
      }
    })
    
    return () => google.maps.event.removeListener(listener)
  }, [map])

  // Set up event listeners
  useEffect(() => {
    if (!map) return

    const listeners: google.maps.MapsEventListener[] = []

    // Track interaction state
    const startInteraction = () => {
      setIsInteracting(true)
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current)
      }
    }

    const endInteraction = () => {
      interactionTimeoutRef.current = setTimeout(() => {
        setIsInteracting(false)
      }, 500)
    }

    // Map event listeners
    listeners.push(
      map.addListener('dragstart', startInteraction),
      map.addListener('dragend', () => {
        endInteraction()
        debouncedBoundsChange()
      }),
      map.addListener('zoom_changed', () => {
        throttledZoomChange()
        debouncedBoundsChange()
      }),
      map.addListener('bounds_changed', debouncedBoundsChange),
      map.addListener('center_changed', () => {
        const center = map.getCenter()
        if (center) {
          onCenterChange?.(center)
        }
      })
    )

    // Cleanup
    return () => {
      listeners.forEach(listener => listener.remove())
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current)
      }
    }
  }, [map, debouncedBoundsChange, throttledZoomChange, onCenterChange])

  return {
    isInteracting,
    currentZoom,
    currentBounds,
    panTo,
    panWithOffset,
    fitBoundsAnimated
  }
}