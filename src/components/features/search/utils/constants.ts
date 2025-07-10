/**
 * Search feature constants
 * 
 * @description
 * Centralized constants for the search feature including
 * UI text, configuration, and feature flags.
 */

/**
 * UI Text constants
 */
export const SEARCH_TEXT = {
  title: "Encuentra las mejores agencias automotrices",
  description: "Explora, analiza y selecciona las agencias más confiables cerca de ti",
  locationLabel: "¿Dónde quieres buscar?",
  locationPlaceholder: "Ingresa tu ubicación",
  queryLabel: "¿Qué auto estás buscando? (opcional)",
  queryPlaceholder: "KIA Forte 2018, Autos de 250 mil pesos",
  searchButton: "Buscar agencias",
  searchingButton: "Buscando agencias...",
  limitReachedButton: "Límite de búsqueda alcanzado",
  currentLocation: "Mi ubicación actual",
  searchingLocations: "Buscando ubicaciones...",
} as const

/**
 * Search configuration
 */
export const SEARCH_CONFIG = {
  /** Minimum characters to trigger location autocomplete */
  minLocationChars: 3,
  /** Debounce delay for autocomplete (ms) */
  autocompleteDelay: 300,
  /** Maximum query length */
  maxQueryLength: 100,
  /** Default search radius (km) */
  defaultRadius: 10,
  /** Maximum search results */
  maxResults: 20,
} as const

/**
 * Search limit configuration
 */
export const SEARCH_LIMITS = {
  /** Free searches for anonymous users */
  anonymousLimit: 1,
  /** Period for limit reset (hours) */
  resetPeriod: 24,
  /** Searches for authenticated users */
  authenticatedLimit: Infinity,
} as const

/**
 * Animation durations (ms)
 */
export const ANIMATION_CONFIG = {
  fadeIn: 500,
  slideIn: 300,
  autocompleteDropdown: 150,
  limitIndicator: 300,
} as const