/**
 * Default map center coordinates (Mexico City)
 * @constant
 * @type {{lat: number, lng: number}}
 */
export const DEFAULT_MAP_CENTER = { lat: 19.4326, lng: -99.1332 }

/**
 * Default zoom level for initial map view
 * @constant
 * @type {number}
 * @description Level 13 shows city districts clearly
 */
export const DEFAULT_ZOOM = 13

/**
 * Minimum allowed zoom level
 * @constant
 * @type {number}
 * @description Level 10 shows entire metropolitan area
 */
export const MIN_ZOOM = 10

/**
 * Maximum allowed zoom level
 * @constant
 * @type {number}
 * @description Level 18 shows individual buildings
 */
export const MAX_ZOOM = 18

/**
 * Responsive design breakpoints (in pixels)
 * @constant
 * @readonly
 * @type {{mobile: 640, tablet: 1024, desktop: 1280}}
 * 
 * @example
 * ```typescript
 * if (window.innerWidth < BREAKPOINTS.mobile) {
 *   // Mobile layout
 * } else if (window.innerWidth < BREAKPOINTS.tablet) {
 *   // Tablet layout
 * } else {
 *   // Desktop layout
 * }
 * ```
 */
export const BREAKPOINTS = {
  mobile: 640,   // sm in Tailwind
  tablet: 1024,  // lg in Tailwind
  desktop: 1280, // xl in Tailwind
} as const

/**
 * Feature flags per device type
 * @constant
 * @type {Record<'mobile' | 'tablet' | 'desktop', MapFeatures>}
 * 
 * @description
 * Defines which features are enabled by default for each device type.
 * Mobile has reduced features for performance and UX simplicity.
 * 
 * @property {Object} mobile - Limited features for small screens
 * @property {Object} tablet - Balanced feature set
 * @property {Object} desktop - Full feature set
 * 
 * @example
 * ```typescript
 * const features = DEFAULT_FEATURES[deviceType]
 * if (features.clustering) {
 *   // Enable marker clustering
 * }
 * ```
 */
export const DEFAULT_FEATURES: Record<'mobile' | 'tablet' | 'desktop', any> = {
  mobile: {
    clustering: false,        // Performance: too many markers slow mobile
    advancedFilters: false,   // UX: Complex UI on small screen
    satelliteView: false,     // Performance: Heavy imagery
    directions: true,         // Essential feature
    comparison: false,        // UX: Better on larger screens
    search: true,            // Essential feature
    realtimeUpdates: false,  // Performance: Battery drain
  },
  tablet: {
    clustering: true,         // Screen can handle it
    advancedFilters: false,   // Still complex for touch
    satelliteView: true,      // Good performance
    directions: true,         // Essential feature
    comparison: true,         // Enough screen space
    search: true,            // Essential feature
    realtimeUpdates: true,   // Good performance
  },
  desktop: {
    clustering: true,         // Full feature
    advancedFilters: true,    // Mouse + keyboard friendly
    satelliteView: true,      // Full feature
    directions: true,         // Full feature
    comparison: true,         // Full feature
    search: true,            // Full feature
    realtimeUpdates: true,   // Full feature
  },
}

/**
 * Google Maps custom styles
 * @constant
 * @type {{light: Array, dark: Array}}
 * 
 * @description
 * Custom map styles to match application theme.
 * Generated using Google Maps Styling Wizard.
 * 
 * Key design decisions:
 * - Hide business POIs to reduce clutter
 * - Muted colors for better marker visibility
 * - Simplified road hierarchy
 * 
 * @see {@link https://mapstyle.withgoogle.com/} - Style generator
 * @see {@link https://developers.google.com/maps/documentation/javascript/style-reference} - Style reference
 */
export const MAP_STYLES = {
  /**
   * Light theme map style
   * Clean, minimal design with light grays
   */
  light: [
    { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f8fafc" }] },
    { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#f1f5f9" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] },
    { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#f1f5f9" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#cbd5e1" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] }
  ],
  dark: [
    { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#475569" }] },
    { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
    { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#e2e8f0" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
    { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#1e293b" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#334155" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#475569" }] },
    { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#64748b" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
    { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] }
  ]
}