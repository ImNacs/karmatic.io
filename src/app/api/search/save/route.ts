/**
 * @fileoverview API endpoint to save user search history
 * @module app/api/search/save
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { saveSearchHistory, getOrCreateSearchSession } from '@/lib/search-tracking'

/**
 * Save search history to database
 * @method POST
 * @param {NextRequest} request - Request object
 * @returns {Promise<NextResponse>} JSON response with search ID
 * @body {Object} Search data
 * @body {string} body.location - Search location (required)
 * @body {string} [body.query] - Search query
 * @body {string} [body.placeId] - Google Place ID
 * @body {Object} [body.coordinates] - Location coordinates
 * @body {number} body.coordinates.lat - Latitude
 * @body {number} body.coordinates.lng - Longitude
 * @body {Array} [body.results] - Search results
 * @response {Object} 200 - Success response
 * @response {string} response.searchId - Saved search ID
 * @response {boolean} response.success - Success status
 * @response {Object} 400 - Bad request
 * @response {Object} 429 - Rate limit exceeded
 * @response {Object} 500 - Server error
 * @example
 * // Request body
 * {
 *   "location": "Ciudad de México",
 *   "query": "Toyota",
 *   "placeId": "ChIJU1NoiDs6BIQREZgJa760ZO0",
 *   "coordinates": { "lat": 19.4326, "lng": -99.1332 },
 *   "results": [{...}]
 * }
 * 
 * // Success response
 * {
 *   "searchId": "abc123",
 *   "success": true
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location, query, placeId, coordinates, results } = body
    
    // Validate required fields
    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      )
    }
    
    // Get authentication status
    const { userId } = await auth()
    
    // Get session ID for anonymous users
    const sessionId = !userId ? await getOrCreateSearchSession() : undefined
    
    // Save search using the new function
    const searchResult = await saveSearchHistory({
      location,
      query: query || null,
      results: {
        agencies: results || [],
        placeId,
        coordinates,
        searchedAt: new Date().toISOString()
      },
      userId: userId || undefined,
      anonymousId: sessionId
    })
    
    return NextResponse.json({
      searchId: searchResult.id,
      success: true
    })
    
  } catch (error) {
    console.error('Error saving search to database:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    
    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error))
    
    // Check if it's a rate limit error
    if (errorMessage.includes('rate limit') || errorMessage.includes('limit reached')) {
      return NextResponse.json({
        error: 'Daily search limit reached for anonymous users',
        code: 'RATE_LIMIT_EXCEEDED'
      }, { status: 429 })
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to save search',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}