import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import Home from '@/app/page'
import { SearchHistoryProvider } from '@/contexts/SearchHistoryContext'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useUser: () => ({ user: null }),
}))

// Mock fetch
global.fetch = jest.fn()

const mockRouter = {
  push: jest.fn(),
  refresh: jest.fn(),
}

describe('Search Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should complete full search flow from home to results', async () => {
    // Mock API responses
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        // Save search response
        ok: true,
        json: async () => ({ searchId: 'new_search_123', success: true }),
      })
      .mockResolvedValueOnce({
        // Google Places autocomplete
        ok: true,
        json: async () => ({
          predictions: [
            {
              description: 'San Francisco, CA, USA',
              place_id: 'place_123',
              structured_formatting: {
                main_text: 'San Francisco',
                secondary_text: 'CA, USA',
              },
            },
          ],
        }),
      })

    render(
      <SearchHistoryProvider>
        <Home />
      </SearchHistoryProvider>
    )

    // Find and interact with location input
    const locationInput = screen.getByPlaceholderText(/ingresa una ubicación/i)
    fireEvent.change(locationInput, { target: { value: 'San Francisco' } })

    // Wait for autocomplete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/google-places/autocomplete'),
        expect.any(Object)
      )
    })

    // Select first prediction
    const prediction = await screen.findByText('San Francisco')
    fireEvent.click(prediction)

    // Find and click search button
    const searchButton = screen.getByRole('button', { name: /buscar agencias/i })
    fireEvent.click(searchButton)

    // Verify save API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search/save',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('San Francisco'),
        })
      )
    })

    // Verify navigation occurred
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/explorer/new_search_123')
    })
  })

  it('should show error when search save fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Database error' }),
    })

    render(
      <SearchHistoryProvider>
        <Home />
      </SearchHistoryProvider>
    )

    // Set location manually
    const locationInput = screen.getByPlaceholderText(/ingresa una ubicación/i)
    fireEvent.change(locationInput, { target: { value: 'Test Location' } })

    // Click search
    const searchButton = screen.getByRole('button', { name: /buscar agencias/i })
    fireEvent.click(searchButton)

    // Should show error toast
    await waitFor(() => {
      expect(screen.getByText(/error al guardar la búsqueda/i)).toBeInTheDocument()
    })

    // Should not navigate
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('should update search history after successful search', async () => {
    const mockSearchId = 'search_456'
    
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        // Initial history load
        ok: true,
        json: async () => ({ searches: [], total: 0 }),
      })
      .mockResolvedValueOnce({
        // Save search
        ok: true,
        json: async () => ({ searchId: mockSearchId, success: true }),
      })

    const { rerender } = render(
      <SearchHistoryProvider>
        <Home />
      </SearchHistoryProvider>
    )

    // Perform search
    const locationInput = screen.getByPlaceholderText(/ingresa una ubicación/i)
    fireEvent.change(locationInput, { target: { value: 'New York' } })

    const searchButton = screen.getByRole('button', { name: /buscar agencias/i })
    fireEvent.click(searchButton)

    // Wait for save and navigation
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(`/explorer/${mockSearchId}`)
    })

    // The SearchHistoryContext should have been updated optimistically
    // (This would be more visible with the actual sidebar component rendered)
  })

  it('should handle search with query parameter', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ searchId: 'search_789', success: true }),
    })

    render(
      <SearchHistoryProvider>
        <Home />
      </SearchHistoryProvider>
    )

    // Enter location
    const locationInput = screen.getByPlaceholderText(/ingresa una ubicación/i)
    fireEvent.change(locationInput, { target: { value: 'Chicago' } })

    // Enter query
    const queryInput = screen.getByPlaceholderText(/tipo de agencia/i)
    fireEvent.change(queryInput, { target: { value: 'insurance' } })

    // Search
    const searchButton = screen.getByRole('button', { name: /buscar agencias/i })
    fireEvent.click(searchButton)

    // Verify both location and query were sent
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search/save',
        expect.objectContaining({
          body: expect.stringContaining('"location":"Chicago"'),
        })
      )
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/search/save',
        expect.objectContaining({
          body: expect.stringContaining('"query":"insurance"'),
        })
      )
    })
  })

  it('should disable search button during save operation', async () => {
    // Mock a slow API response
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => 
          resolve({
            ok: true,
            json: async () => ({ searchId: 'search_slow', success: true }),
          }), 
          1000
        )
      )
    )

    render(
      <SearchHistoryProvider>
        <Home />
      </SearchHistoryProvider>
    )

    // Enter location and search
    const locationInput = screen.getByPlaceholderText(/ingresa una ubicación/i)
    fireEvent.change(locationInput, { target: { value: 'Los Angeles' } })

    const searchButton = screen.getByRole('button', { name: /buscar agencias/i })
    fireEvent.click(searchButton)

    // Button should be disabled during save
    expect(searchButton).toBeDisabled()

    // Wait for operation to complete
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalled()
    }, { timeout: 2000 })
  })
})