/**
 * Google Maps Places API Type Definitions
 * 
 * @description
 * Extended type definitions for the Google Maps Places API v3
 * AutocompleteSuggestion feature. These types are not included
 * in the standard @types/google.maps package.
 * 
 * @see {@link https://developers.google.com/maps/documentation/javascript/place-autocomplete-new}
 */
declare namespace google.maps.places {
  /**
   * AutocompleteSuggestion - Represents a single autocomplete suggestion
   * 
   * @interface AutocompleteSuggestion
   * @memberof google.maps.places
   */
  interface AutocompleteSuggestion {
    /** The place prediction details */
    placePrediction: PlacePrediction
  }

  /**
   * PlacePrediction - Detailed information about a predicted place
   * 
   * @interface PlacePrediction
   * @memberof google.maps.places
   * 
   * @example
   * ```typescript
   * const prediction: PlacePrediction = {
   *   placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
   *   text: {
   *     text: "Roma Norte, Ciudad de México, CDMX, México",
   *     matches: [{ startOffset: 0, endOffset: 10 }]
   *   },
   *   structuredFormat: {
   *     mainText: {
   *       text: "Roma Norte",
   *       matches: [{ startOffset: 0, endOffset: 10 }]
   *     },
   *     secondaryText: {
   *       text: "Ciudad de México, CDMX, México",
   *       matches: []
   *     }
   *   },
   *   types: ["neighborhood", "political"]
   * }
   * ```
   */
  interface PlacePrediction {
    /** Unique identifier for the place */
    placeId: string
    
    /** Full text description of the place */
    text: {
      /** Complete place description */
      text: string
      /** Array of substring matches to the user input */
      matches: Array<{
        /** Start position of match in text */
        startOffset: number
        /** End position of match in text */
        endOffset: number
      }>
    }
    
    /** Structured format breaking down the place name */
    structuredFormat: {
      /** Primary text (usually place name) */
      mainText: {
        /** Main place name */
        text: string
        /** Matches in main text */
        matches: Array<{
          /** Start position of match */
          startOffset: number
          /** End position of match */
          endOffset: number
        }>
      }
      /** Secondary text (usually address/context) */
      secondaryText: {
        /** Additional location context */
        text: string
        /** Matches in secondary text */
        matches: Array<{
          /** Start position of match */
          startOffset: number
          /** End position of match */
          endOffset: number
        }>
      }
    }
    
    /** Place types (e.g., "locality", "neighborhood", "route") */
    types: string[]
  }

  /**
   * AutocompleteSuggestionRequest - Parameters for fetching suggestions
   * 
   * @interface AutocompleteSuggestionRequest
   * @memberof google.maps.places
   * 
   * @example
   * ```typescript
   * const request: AutocompleteSuggestionRequest = {
   *   input: "Roma Norte",
   *   includedRegionCodes: ["mx"],
   *   includedTypes: ["locality", "neighborhood"],
   *   locationBias: {
   *     north: 19.5,
   *     south: 19.3,
   *     east: -99.0,
   *     west: -99.3
   *   },
   *   language: "es"
   * }
   * ```
   */
  interface AutocompleteSuggestionRequest {
    /** User input text to search for */
    input: string
    
    /** Session token for billing optimization (optional) */
    sessionToken?: google.maps.places.AutocompleteSessionToken
    
    /** ISO 3166-1 alpha-2 country codes to restrict results (optional) */
    includedRegionCodes?: string[]
    
    /** Place types to include in results (optional) */
    includedTypes?: string[]
    
    /** Primary place types to include (optional) */
    includedPrimaryTypes?: string[]
    
    /** Bias results towards this area (optional) */
    locationBias?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral
    
    /** Restrict results to this area (optional) */
    locationRestriction?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral
    
    /** Origin point for distance calculations (optional) */
    origin?: google.maps.LatLng | google.maps.LatLngLiteral
    
    /** Region code for biasing (deprecated, use includedRegionCodes) */
    region?: string
    
    /** Language code for results (optional) */
    language?: string
  }

  /**
   * AutocompleteSuggestion namespace - Contains static methods
   * 
   * @namespace AutocompleteSuggestion
   * @memberof google.maps.places
   */
  namespace AutocompleteSuggestion {
    /**
     * Fetch autocomplete suggestions from Google Places API
     * 
     * @function fetchAutocompleteSuggestions
     * @param {AutocompleteSuggestionRequest} request - Request parameters
     * @returns {Promise<{ suggestions: AutocompleteSuggestion[] }>} Promise with suggestions
     * 
     * @example
     * ```typescript
     * const { suggestions } = await google.maps.places.AutocompleteSuggestion
     *   .fetchAutocompleteSuggestions({
     *     input: "Roma",
     *     includedRegionCodes: ["mx"]
     *   });
     * ```
     */
    function fetchAutocompleteSuggestions(
      request: AutocompleteSuggestionRequest
    ): Promise<{ suggestions: AutocompleteSuggestion[] }>
  }
}