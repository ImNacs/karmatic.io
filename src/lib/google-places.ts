import { useMemo, useCallback } from "react";
import { useGoogleMaps } from "@/components/google-maps-provider";

// Google Places API configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Custom hook for Google Places Autocomplete
export function useGooglePlaces() {
  const { isLoaded: googleMapsLoaded } = useGoogleMaps();
  
  const isLoaded = useMemo(() => {
    return googleMapsLoaded && 
           typeof window !== "undefined" && 
           window.google && 
           window.google.maps && 
           window.google.maps.places;
  }, [googleMapsLoaded]);

  const createAutocompleteService = useCallback(() => {
    if (!isLoaded) return null;
    return new window.google.maps.places.AutocompleteService();
  }, [isLoaded]);

  const createPlacesService = (map: google.maps.Map) => {
    if (!isLoaded) return null;
    return new window.google.maps.places.PlacesService(map);
  };

  const getPlacePredictions = useCallback((
    input: string,
    options: Partial<google.maps.places.AutocompletionRequest> = {}
  ): Promise<google.maps.places.AutocompletePrediction[]> => {
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
          resolve(predictions);
        } else {
          reject(new Error(`Places service error: ${status}`));
        }
      });
    });
  }, [createAutocompleteService]);

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