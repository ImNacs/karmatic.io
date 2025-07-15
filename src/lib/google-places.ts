/**
 * @fileoverview Google Places API integration hook
 * @module lib/google-places
 */

import { useMemo, useCallback, useRef } from "react";
import { useGoogleMaps } from "@/providers/google-maps-provider";

/** Google Maps API key from environment */
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/** Flag to use new Autocomplete API (legacy deprecated March 2025) */
const USE_NEW_AUTOCOMPLETE_API = true;

/**
 * Custom hook for Google Places Autocomplete functionality
 * @returns {Object} Google Places utilities and state
 * @returns {boolean} isLoaded - Whether Google Maps API is loaded
 * @returns {Function} getPlacePredictions - Get autocomplete predictions
 * @returns {Function} getPlaceDetails - Get detailed place information
 * @returns {Function} resetSessionToken - Reset session token after selection
 * @example
 * ```tsx
 * const { isLoaded, getPlacePredictions, getPlaceDetails } = useGooglePlaces();
 * 
 * // Get predictions
 * const predictions = await getPlacePredictions("Roma Norte");
 * 
 * // Get place details
 * const details = await getPlaceDetails(predictions[0].place_id);
 * ```
 */
export function useGooglePlaces() {
  const { isLoaded: googleMapsLoaded } = useGoogleMaps();
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  
  const isLoaded = useMemo(() => {
    return googleMapsLoaded && 
           typeof window !== "undefined" && 
           window.google && 
           window.google.maps && 
           window.google.maps.places;
  }, [googleMapsLoaded]);

  /**
   * Get or create a session token for billing optimization
   * @private
   * @returns {google.maps.places.AutocompleteSessionToken | null} Session token
   */
  const getSessionToken = useCallback(() => {
    if (!isLoaded) return null;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, [isLoaded]);

  /**
   * Reset session token after place selection
   * Should be called after user selects a place to optimize billing
   * @public
   */
  const resetSessionToken = useCallback(() => {
    sessionTokenRef.current = null;
  }, []);

  const createAutocompleteService = useCallback(() => {
    if (!isLoaded) return null;
    return new window.google.maps.places.AutocompleteService();
  }, [isLoaded]);

  const createPlacesService = (map: google.maps.Map) => {
    if (!isLoaded) return null;
    return new window.google.maps.places.PlacesService(map);
  };

  /**
   * Transform new AutocompleteSuggestion API response to legacy format
   * @private
   * @param {google.maps.places.AutocompleteSuggestion} suggestion - New API suggestion
   * @returns {PlacePrediction} Transformed prediction in legacy format
   */
  const transformSuggestion = useCallback((
    suggestion: google.maps.places.AutocompleteSuggestion
  ): PlacePrediction => {
    const { placePrediction } = suggestion;
    
    // Defensive checks for nested properties
    const mainText = placePrediction?.structuredFormat?.mainText?.text || 
                    placePrediction?.text?.text || 
                    '';
    const secondaryText = placePrediction?.structuredFormat?.secondaryText?.text || 
                         '';
    
    return {
      place_id: placePrediction?.placeId || '',
      description: placePrediction?.text?.text || '',
      structured_formatting: {
        main_text: mainText,
        secondary_text: secondaryText,
      },
      terms: [], // Terms are not directly available in new API
    };
  }, []);

  /**
   * Get place predictions using legacy AutocompleteService
   * @private
   * @param {string} input - Search input text
   * @param {Partial<google.maps.places.AutocompletionRequest>} options - Additional options
   * @returns {Promise<PlacePrediction[]>} Array of place predictions
   * @throws {Error} If Google Places service is not available
   */
  const getPlacePredictionsLegacy = useCallback((
    input: string,
    options: Partial<google.maps.places.AutocompletionRequest> = {}
  ): Promise<PlacePrediction[]> => {
    return new Promise((resolve, reject) => {
      const service = createAutocompleteService();
      if (!service) {
        reject(new Error("Google Places service not available"));
        return;
      }

      const request: google.maps.places.AutocompletionRequest = {
        input,
        componentRestrictions: { country: "mx" }, // Restrict to Mexico
        types: ["geocode"], // Only use geocode to avoid mixing types
        ...options,
      };

      service.getPlacePredictions(request, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          // Convert to our PlacePrediction type
          const transformed = predictions.map(pred => ({
            place_id: pred.place_id,
            description: pred.description,
            structured_formatting: pred.structured_formatting,
            terms: pred.terms,
          }));
          resolve(transformed);
        } else {
          reject(new Error(`Places service error: ${status}`));
        }
      });
    });
  }, [createAutocompleteService]);

  /**
   * Get place predictions using new AutocompleteSuggestion API
   * @private
   * @param {string} input - Search input text
   * @param {Object} options - Additional options for the API
   * @returns {Promise<PlacePrediction[]>} Array of place predictions
   * @throws {Error} If Google Places service is not available
   */
  const getPlacePredictionsNew = useCallback(async (
    input: string,
    options: any = {}
  ): Promise<PlacePrediction[]> => {
    if (!isLoaded) {
      throw new Error("Google Places service not available");
    }

    // Check if the new API is available
    if (!window.google?.maps?.places?.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
      console.warn("AutocompleteSuggestion API not available, falling back to legacy");
      return getPlacePredictionsLegacy(input, options);
    }

    // Early return for empty input
    if (!input || input.trim().length === 0) {
      return [];
    }

    const sessionToken = getSessionToken();
    
    const request = {
      input,
      sessionToken: sessionToken, // Pass the token object directly
      region: "MX", // Use region instead of includedRegionCodes
      includedPrimaryTypes: ["geocode"], // Use includedPrimaryTypes, not includedTypes
      // Only include valid options for the new API
      ...(options && {
        locationBias: options.locationBias,
        locationRestriction: options.locationRestriction,
        origin: options.origin,
      }),
    };

    try {
      console.log("AutocompleteSuggestion request:", request);
      const { suggestions } = await window.google.maps.places.AutocompleteSuggestion
        .fetchAutocompleteSuggestions(request);
      
      console.log("AutocompleteSuggestion response:", suggestions);
      
      // Transform suggestions to match legacy format
      return suggestions.map(transformSuggestion);
    } catch (error) {
      console.error("AutocompleteSuggestion error details:", {
        error,
        message: error?.message,
        stack: error?.stack,
        request
      });
      // Fallback to legacy API on error
      console.warn("Falling back to legacy API due to error");
      return getPlacePredictionsLegacy(input, options);
    }
  }, [isLoaded, getSessionToken, transformSuggestion, getPlacePredictionsLegacy]);

  /**
   * Get place predictions with automatic API selection
   * Automatically uses new API if available, falls back to legacy
   * @public
   * @param {string} input - Search input text
   * @param {Partial<google.maps.places.AutocompletionRequest>} options - Additional options
   * @returns {Promise<PlacePrediction[]>} Array of place predictions
   */
  const getPlacePredictions = useCallback((
    input: string,
    options: Partial<google.maps.places.AutocompletionRequest> = {}
  ): Promise<PlacePrediction[]> => {
    // Return empty array for empty input
    if (!input || input.trim().length === 0) {
      return Promise.resolve([]);
    }

    // Check if Google Maps is loaded
    if (!isLoaded) {
      console.warn("Google Maps not loaded yet");
      return Promise.resolve([]);
    }

    // Use new API if enabled
    if (USE_NEW_AUTOCOMPLETE_API) {
      return getPlacePredictionsNew(input, options);
    }
    
    // Fallback to legacy API
    return getPlacePredictionsLegacy(input, options);
  }, [isLoaded, getPlacePredictionsNew, getPlacePredictionsLegacy]);

  /**
   * Get detailed information about a specific place
   * @public
   * @param {string} placeId - Google Place ID
   * @returns {Promise<google.maps.places.PlaceResult>} Detailed place information
   * @throws {Error} If place details cannot be retrieved
   */
  const getPlaceDetails = useCallback((
    placeId: string
  ): Promise<google.maps.places.PlaceResult> => {
    return new Promise((resolve, reject) => {
      if (!isLoaded || !window.google?.maps) {
        reject(new Error("Google Maps not loaded"));
        return;
      }

      // Create a temporary div for the PlacesService
      const tempDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(tempDiv);

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ['geometry', 'formatted_address', 'name', 'place_id', 'types', 'address_components']
      };

      service.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          reject(new Error(`Place details error: ${status}`));
        }
      });
    });
  }, [isLoaded]);

  return {
    isLoaded,
    createAutocompleteService,
    createPlacesService,
    getPlacePredictions,
    getPlaceDetails,
    resetSessionToken,
    apiKey: GOOGLE_MAPS_API_KEY,
  };
}

/**
 * Google Places prediction result
 * @interface PlacePrediction
 */
export interface PlacePrediction {
  /** Google Place ID */
  place_id: string;
  /** Full formatted place description */
  description: string;
  /** Structured formatting for display */
  structured_formatting: {
    /** Primary text (usually place name) */
    main_text: string;
    /** Secondary text (usually address) */
    secondary_text: string;
  };
  /** Parsed terms from the prediction */
  terms: Array<{
    /** Character offset in description */
    offset: number;
    /** Term value */
    value: string;
  }>;
}

/**
 * Detailed place information from Google Places
 * @interface PlaceDetails
 */
export interface PlaceDetails {
  /** Google Place ID */
  place_id: string;
  /** Place name */
  name: string;
  /** Full formatted address */
  formatted_address: string;
  /** Geographic information */
  geometry: {
    /** Coordinates */
    location: {
      /** Latitude */
      lat: number;
      /** Longitude */
      lng: number;
    };
  };
  /** Parsed address components */
  address_components: Array<{
    /** Full name of the component */
    long_name: string;
    /** Abbreviated name */
    short_name: string;
    /** Component types (e.g., 'locality', 'country') */
    types: string[];
  }>;
}