/**
 * Agency - Core data model for automotive agencies
 * 
 * @description
 * Represents a car dealership or automotive agency with all relevant
 * business information, reviews, and AI-generated analysis.
 * 
 * @interface Agency
 * 
 * @example
 * ```typescript
 * const agency: Agency = {
 *   id: "agency-123",
 *   name: "Auto Premium México",
 *   rating: 4.8,
 *   reviewCount: 245,
 *   address: "Av. Insurgentes Sur 1234, CDMX",
 *   phone: "+52 55 1234 5678",
 *   hours: "9:00–18:00",
 *   distance: "2.5 km",
 *   coordinates: { lat: 19.4326, lng: -99.1332 },
 *   isHighRated: true,
 *   specialties: ["BMW", "Mercedes-Benz", "Audi"],
 *   images: ["url1", "url2"],
 *   recentReviews: [{
 *     id: "review-1",
 *     author: "Juan Pérez",
 *     rating: 5,
 *     comment: "Excelente servicio",
 *     date: "Hace 2 días"
 *   }]
 * }
 * ```
 */
export interface Agency {
  /** Unique identifier for the agency */
  id: string
  
  /** Business name */
  name: string
  
  /** Average rating (1-5 scale) */
  rating: number
  
  /** Total number of customer reviews */
  reviewCount: number
  
  /** Full street address */
  address: string
  
  /** Contact phone number */
  phone: string
  
  /** Today's operating hours (e.g., "9:00–18:00" or "Cerrado") */
  hours: string
  
  /** Distance from search location (e.g., "2.5 km") */
  distance: string
  
  /** Geographic coordinates for map display */
  coordinates: { 
    /** Latitude */
    lat: number
    /** Longitude */
    lng: number 
  }
  
  /** Flag indicating rating >= 4.5 */
  isHighRated: boolean
  
  /** Car brands or services offered */
  specialties: string[]
  
  /** Business website URL (optional) */
  website?: string
  
  /** Business description or tagline (optional) */
  description?: string
  
  /** Array of image URLs for the agency */
  images: string[]
  
  /** Recent customer reviews */
  recentReviews: Array<{
    /** Review unique identifier */
    id: string
    /** Reviewer name */
    author: string
    /** Review rating (1-5) */
    rating: number
    /** Review text content */
    comment: string
    /** Relative date (e.g., "Hace 2 días") */
    date: string
  }>
  
  /** AI-generated analysis (optional) */
  analysis?: {
    /** Brief summary of the agency */
    summary: string
    /** Key strengths identified */
    strengths: string[]
    /** Improvement recommendations */
    recommendations: string[]
  }
  
  /** Google Place ID for API reference (optional) */
  placeId?: string
  
  /** Weekly schedule array (optional) */
  openingHours?: string[]
  
  /** Direct Google Maps link (optional) */
  googleMapsUrl?: string
  
  /** Operational status (e.g., "OPERATIONAL", "CLOSED") (optional) */
  businessStatus?: string
}

/**
 * SearchData - User search parameters and location data
 * 
 * @description
 * Contains all information about a user's search query, including
 * the location (either typed or selected from autocomplete) and
 * optional search filters.
 * 
 * @interface SearchData
 * 
 * @example
 * ```typescript
 * // Basic search by location name
 * const search1: SearchData = {
 *   location: "Roma Norte, CDMX"
 * }
 * 
 * // Search with Google Places data
 * const search2: SearchData = {
 *   location: "Roma Norte, Ciudad de México",
 *   placeId: "ChIJX5-wUc0D0oURQW9U2Q",
 *   placeDetails: {
 *     description: "Roma Norte, Ciudad de México, CDMX, México",
 *     mainText: "Roma Norte",
 *     secondaryText: "Ciudad de México, CDMX, México"
 *   },
 *   coordinates: {
 *     lat: 19.4199,
 *     lng: -99.1613
 *   }
 * }
 * ```
 */
export interface SearchData {
  /** Location string entered or selected by user */
  location: string
  
  /** Optional search query/filters (e.g., "BMW", "premium") */
  query?: string
  
  /** Google Place ID if location was selected from autocomplete */
  placeId?: string
  
  /** Structured place information from Google Places (optional) */
  placeDetails?: {
    /** Full formatted description */
    description: string
    /** Primary location name (e.g., "Roma Norte") */
    mainText: string
    /** Additional context (e.g., "Ciudad de México, CDMX") */
    secondaryText: string
  }
  
  /** Geographic coordinates if available (optional) */
  coordinates?: {
    /** Latitude */
    lat: number
    /** Longitude */
    lng: number
  }
}