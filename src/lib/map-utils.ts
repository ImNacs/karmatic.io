import type { Agency } from '@/types/agency'

export interface ViewportBounds {
  north: number
  south: number
  east: number
  west: number
}

export function isInViewport(lat: number, lng: number, bounds: ViewportBounds): boolean {
  return lat <= bounds.north && 
         lat >= bounds.south && 
         lng <= bounds.east && 
         lng >= bounds.west
}

export function getVisibleAgencies(
  agencies: Agency[], 
  bounds: google.maps.LatLngBounds | null,
  buffer: number = 0.01 // Add a small buffer to preload nearby markers
): Agency[] {
  if (!bounds) return agencies

  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  
  const viewportBounds: ViewportBounds = {
    north: ne.lat() + buffer,
    south: sw.lat() - buffer,
    east: ne.lng() + buffer,
    west: sw.lng() - buffer
  }

  return agencies.filter(agency => 
    isInViewport(agency.coordinates.lat, agency.coordinates.lng, viewportBounds)
  )
}

export function calculateZoomLevel(bounds: google.maps.LatLngBounds, mapWidth: number): number {
  const GLOBE_WIDTH = 256 // Base tile width
  const west = bounds.getSouthWest().lng()
  const east = bounds.getNorthEast().lng()
  let angle = east - west
  
  if (angle < 0) {
    angle += 360
  }
  
  const angleFraction = angle / 360
  const zoom = Math.round(Math.log(mapWidth / GLOBE_WIDTH / angleFraction) / Math.LN2)
  
  return Math.min(Math.max(zoom, 0), 21) // Clamp between 0 and 21
}

export function optimizeMarkerContent(agency: Agency, isSelected: boolean, isDarkMode: boolean = false): string {
  // Return optimized HTML string for marker content with theme support
  return `
    <div class="marker-wrapper theme-transition" data-agency-id="${agency.id}">
      <div class="marker-content ${isSelected ? 'selected' : ''} ${isDarkMode ? 'dark-mode' : ''}">
        <svg class="marker-icon" viewBox="0 0 24 24">
          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      ${isSelected ? '<div class="marker-badge"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg></div>' : ''}
    </div>
  `
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Smooth animation function for map movements
export function smoothPanTo(
  map: google.maps.Map,
  destination: google.maps.LatLng,
  duration: number = 1000
): void {
  const start = map.getCenter()
  if (!start) return
  
  const startLat = start.lat()
  const startLng = start.lng()
  const endLat = destination.lat()
  const endLng = destination.lng()
  
  let startTime: number | null = null
  
  const animate = (currentTime: number) => {
    if (!startTime) startTime = currentTime
    const progress = Math.min((currentTime - startTime) / duration, 1)
    
    // Use ease-in-out cubic bezier curve for smooth animation
    const easeProgress = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2
    
    const lat = startLat + (endLat - startLat) * easeProgress
    const lng = startLng + (endLng - startLng) * easeProgress
    
    map.setCenter(new google.maps.LatLng(lat, lng))
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  requestAnimationFrame(animate)
}