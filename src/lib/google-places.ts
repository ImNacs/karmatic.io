import { useMemo, useCallback, useRef } from "react";
import { useGoogleMaps } from "@/components/google-maps-provider";

// Google Places API configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Feature flag to enable new API (can be controlled via env variable)
const USE_NEW_AUTOCOMPLETE_API = process.env.NEXT_PUBLIC_USE_NEW_PLACES_API !== 'false';

// Custom hook for Google Places Autocomplete
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

  // Create or get current session token
  const getSessionToken = useCallback(() => {
    if (!isLoaded) return null;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, [isLoaded]);

  // Reset session token (call after place selection)
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

  // Transform new API response to match legacy format
  const transformSuggestion = useCallback((
    suggestion: google.maps.places.AutocompleteSuggestion
  ): PlacePrediction => {
    const { placePrediction } = suggestion;
    return {
      place_id: placePrediction.placeId,
      description: placePrediction.text.text,
      structured_formatting: {
        main_text: placePrediction.structuredFormat.mainText.text,
        secondary_text: placePrediction.structuredFormat.secondaryText.text,
      },
      terms: [], // Terms are not directly available in new API
    };
  }, []);

  // Legacy AutocompleteService implementation
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

  // New AutocompleteSuggestion implementation
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

    const sessionToken = getSessionToken();
    
    const request = {
      input,
      includedRegionCodes: ["MX"], // Replaces componentRestrictions
      includedTypes: ["geocode"], // Replaces types
      sessionToken,
      ...options,
    };

    try {
      const { suggestions } = await window.google.maps.places.AutocompleteSuggestion
        .fetchAutocompleteSuggestions(request);
      
      // Transform suggestions to match legacy format
      return suggestions.map(transformSuggestion);
    } catch (error) {
      console.error("AutocompleteSuggestion error:", error);
      // Fallback to legacy API on error
      console.warn("Falling back to legacy API due to error");
      return getPlacePredictionsLegacy(input, options);
    }
  }, [isLoaded, getSessionToken, transformSuggestion, getPlacePredictionsLegacy]);

  // Main function that routes to new or legacy API
  const getPlacePredictions = useCallback((
    input: string,
    options: Partial<google.maps.places.AutocompletionRequest> = {}
  ): Promise<PlacePrediction[]> => {
    // Use new API if enabled
    if (USE_NEW_AUTOCOMPLETE_API && isLoaded) {
      return getPlacePredictionsNew(input, options);
    }
    
    // Fallback to legacy API
    return getPlacePredictionsLegacy(input, options);
  }, [isLoaded, getPlacePredictionsNew, getPlacePredictionsLegacy]);

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

// Google Places types for TypeScript
export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  terms: Array<{
    offset: number;
    value: string;
  }>;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}