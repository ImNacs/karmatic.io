export interface Agency {
  id: string
  name: string
  rating: number
  reviewCount: number
  address: string
  phone: string
  hours: string
  distance: string
  coordinates: { lat: number; lng: number }
  isHighRated: boolean
  specialties: string[]
  website?: string
  description?: string
  images: string[]
  recentReviews: Array<{
    id: string
    author: string
    rating: number
    comment: string
    date: string
  }>
  analysis?: {
    summary: string
    strengths: string[]
    recommendations: string[]
  }
  placeId?: string
  openingHours?: string[]
  googleMapsUrl?: string
  businessStatus?: string
}

export interface SearchData {
  location: string
  query?: string
  placeId?: string
  placeDetails?: {
    description: string
    mainText: string
    secondaryText: string
  }
  coordinates?: {
    lat: number
    lng: number
  }
}