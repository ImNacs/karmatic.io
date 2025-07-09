declare namespace google.maps.places {
  interface AutocompleteSuggestion {
    placePrediction: PlacePrediction
  }

  interface PlacePrediction {
    placeId: string
    text: {
      text: string
      matches: Array<{
        startOffset: number
        endOffset: number
      }>
    }
    structuredFormat: {
      mainText: {
        text: string
        matches: Array<{
          startOffset: number
          endOffset: number
        }>
      }
      secondaryText: {
        text: string
        matches: Array<{
          startOffset: number
          endOffset: number
        }>
      }
    }
    types: string[]
  }

  interface AutocompleteSuggestionRequest {
    input: string
    sessionToken?: google.maps.places.AutocompleteSessionToken
    includedRegionCodes?: string[]
    includedTypes?: string[]
    includedPrimaryTypes?: string[]
    locationBias?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral
    locationRestriction?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral
    origin?: google.maps.LatLng | google.maps.LatLngLiteral
    region?: string
    language?: string
  }

  namespace AutocompleteSuggestion {
    function fetchAutocompleteSuggestions(
      request: AutocompleteSuggestionRequest
    ): Promise<{ suggestions: AutocompleteSuggestion[] }>
  }
}