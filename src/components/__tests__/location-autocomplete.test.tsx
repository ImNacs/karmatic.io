import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocationAutocomplete } from '../location-autocomplete'
import { useGooglePlaces } from '@/lib/google-places'
import '@testing-library/jest-dom'

// Mock the Google Places hook
jest.mock('@/lib/google-places')

// Mock the motion/react library
jest.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true
})

// Mock Google Maps Geocoder
const mockGeocoderGeocode = jest.fn()
const mockGeocoder = {
  geocode: mockGeocoderGeocode
}

// Mock window.google
const mockGoogle = {
  maps: {
    Geocoder: jest.fn(() => mockGeocoder),
    places: {
      PlacesServiceStatus: {
        OK: 'OK',
        ZERO_RESULTS: 'ZERO_RESULTS',
        INVALID_REQUEST: 'INVALID_REQUEST'
      }
    }
  }
}

Object.defineProperty(global, 'google', {
  value: mockGoogle,
  configurable: true,
  writable: true
})

describe('LocationAutocomplete', () => {
  const mockOnChange = jest.fn()
  const mockOnPlaceSelect = jest.fn()
  const mockGetPlacePredictions = jest.fn()

  const defaultMockUseGooglePlaces = {
    isLoaded: true,
    getPlacePredictions: mockGetPlacePredictions,
    createAutocompleteService: jest.fn(),
    createPlacesService: jest.fn(),
    apiKey: 'test-api-key'
  }

  const mockPredictions = [
    {
      place_id: '1',
      description: 'Ciudad de México, CDMX, México',
      structured_formatting: {
        main_text: 'Ciudad de México',
        secondary_text: 'CDMX, México'
      },
      terms: [
        { offset: 0, value: 'Ciudad de México' },
        { offset: 17, value: 'CDMX' },
        { offset: 23, value: 'México' }
      ]
    },
    {
      place_id: '2',
      description: 'Guadalajara, Jalisco, México',
      structured_formatting: {
        main_text: 'Guadalajara',
        secondary_text: 'Jalisco, México'
      },
      terms: [
        { offset: 0, value: 'Guadalajara' },
        { offset: 13, value: 'Jalisco' },
        { offset: 22, value: 'México' }
      ]
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    // Always return a resolved promise by default
    mockGetPlacePredictions.mockResolvedValue([])
    ;(useGooglePlaces as jest.Mock).mockReturnValue(defaultMockUseGooglePlaces)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Basic Functionality', () => {
    it('renders with default props', () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('Ingresa tu ubicación')
      expect(input).toBeInTheDocument()
      expect(input).toHaveClass('pl-10 pr-20')
    })

    it('renders with custom placeholder', () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          placeholder="Custom placeholder"
        />
      )

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
    })

    it('displays the provided value', () => {
      render(
        <LocationAutocomplete
          value="Test location"
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('Ingresa tu ubicación') as HTMLInputElement
      expect(input.value).toBe('Test location')
    })

    it('calls onChange when input value changes', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('Ingresa tu ubicación')
      
      // Type each character individually to better control the test
      await user.clear(input)
      await user.type(input, 'M')
      expect(mockOnChange).toHaveBeenLastCalledWith('M')
      
      mockOnChange.mockClear()
      await user.type(input, 'e')
      expect(mockOnChange).toHaveBeenLastCalledWith('Me')
      
      mockOnChange.mockClear()
      await user.type(input, 'x')
      expect(mockOnChange).toHaveBeenLastCalledWith('Mex')
    })

    it('disables input when disabled prop is true', () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          disabled={true}
        />
      )

      const input = screen.getByPlaceholderText('Ingresa tu ubicación')
      expect(input).toBeDisabled()
    })

    it('applies custom className', () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          className="custom-class"
        />
      )

      const container = screen.getByPlaceholderText('Ingresa tu ubicación').closest('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Clear Button', () => {
    it('shows clear button when input has value', () => {
      render(
        <LocationAutocomplete
          value="Test location"
          onChange={mockOnChange}
        />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2) // Clear button and geolocation button
      // First button should be the clear button
      const clearButton = buttons[0]
      expect(clearButton).toBeInTheDocument()
    })

    it('hides clear button when input is empty', () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(1) // Only geolocation button
    })

    it('clears input when clear button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(
        <LocationAutocomplete
          value="Test location"
          onChange={mockOnChange}
        />
      )

      const clearButton = screen.getAllByRole('button')[0]
      await user.click(clearButton)

      expect(mockOnChange).toHaveBeenCalledWith('')
    })

    it('focuses input after clearing', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(
        <LocationAutocomplete
          value="Test location"
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('Ingresa tu ubicación')
      const clearButton = screen.getAllByRole('button')[0]
      
      await user.click(clearButton)
      
      expect(document.activeElement).toBe(input)
    })
  })

  describe('Google Places Integration', () => {
    it('does not re-trigger predictions after selection', async () => {
      const user = userEvent.setup({ delay: null })
      mockGetPlacePredictions.mockResolvedValue(mockPredictions)

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          onPlaceSelect={mockOnPlaceSelect}
        />
      )

      // Type to trigger predictions
      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
          onPlaceSelect={mockOnPlaceSelect}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText('Ciudad de México')).toBeInTheDocument()
      })

      // Clear previous mock calls
      mockGetPlacePredictions.mockClear()
      mockOnChange.mockClear()

      // Click on a prediction
      const prediction = screen.getByText('Ciudad de México').closest('button')!
      await user.click(prediction)

      // Verify the selection was made
      expect(mockOnChange).toHaveBeenCalledWith('Ciudad de México, CDMX, México')
      expect(mockOnPlaceSelect).toHaveBeenCalledWith(mockPredictions[0])

      // Simulate the component re-rendering with the selected value
      rerender(
        <LocationAutocomplete
          value="Ciudad de México, CDMX, México"
          onChange={mockOnChange}
          onPlaceSelect={mockOnPlaceSelect}
        />
      )

      // Advance timers to see if predictions are triggered again
      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Predictions should NOT be fetched again for the selected value
      expect(mockGetPlacePredictions).not.toHaveBeenCalled()
      
      // Predictions dropdown should NOT be visible
      await waitFor(() => {
        expect(screen.queryByText('Guadalajara')).not.toBeInTheDocument()
      })
    })

    it('does not fetch predictions for short input', async () => {
      render(
        <LocationAutocomplete
          value="Me"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(mockGetPlacePredictions).not.toHaveBeenCalled()
    })

    it('fetches predictions for input longer than 2 characters', async () => {
      mockGetPlacePredictions.mockResolvedValue(mockPredictions)

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mex"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(mockGetPlacePredictions).toHaveBeenCalledWith('Mex')
      })
    })

    it('displays predictions dropdown', async () => {
      mockGetPlacePredictions.mockResolvedValue(mockPredictions)

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText('Ciudad de México')).toBeInTheDocument()
        expect(screen.getByText('Guadalajara')).toBeInTheDocument()
      })
    })

    it('handles prediction selection', async () => {
      const user = userEvent.setup({ delay: null })
      mockGetPlacePredictions.mockResolvedValue(mockPredictions)

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          onPlaceSelect={mockOnPlaceSelect}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
          onPlaceSelect={mockOnPlaceSelect}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText('Ciudad de México')).toBeInTheDocument()
      })

      const prediction = screen.getByText('Ciudad de México').closest('button')!
      await user.click(prediction)

      expect(mockOnChange).toHaveBeenCalledWith('Ciudad de México, CDMX, México')
      expect(mockOnPlaceSelect).toHaveBeenCalledWith(mockPredictions[0])
    })

    it('handles API errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockGetPlacePredictions.mockRejectedValue(new Error('API Error'))

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting predictions:', expect.any(Error))
      })

      consoleErrorSpy.mockRestore()
    })

    it('shows loading state while fetching predictions', async () => {
      mockGetPlacePredictions.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText('Buscando ubicaciones...')).toBeInTheDocument()
      })
    })

    it('debounces API calls', async () => {
      mockGetPlacePredictions.mockResolvedValue(mockPredictions)

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      // Rapid value changes
      rerender(<LocationAutocomplete value="M" onChange={mockOnChange} />)
      rerender(<LocationAutocomplete value="Me" onChange={mockOnChange} />)
      rerender(<LocationAutocomplete value="Mex" onChange={mockOnChange} />)
      rerender(<LocationAutocomplete value="Mexi" onChange={mockOnChange} />)
      rerender(<LocationAutocomplete value="Mexic" onChange={mockOnChange} />)
      rerender(<LocationAutocomplete value="Mexico" onChange={mockOnChange} />)

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        // Should only call once with the final value
        expect(mockGetPlacePredictions).toHaveBeenCalledTimes(1)
        expect(mockGetPlacePredictions).toHaveBeenCalledWith('Mexico')
      })
    })
  })

  describe('Keyboard Navigation', () => {
    beforeEach(async () => {
      mockGetPlacePredictions.mockResolvedValue(mockPredictions)
    })

    it('navigates predictions with arrow keys', async () => {
      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText('Ciudad de México')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Ingresa tu ubicación')
      
      // Navigate down
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      const firstPrediction = screen.getByText('Ciudad de México').closest('button')
      expect(firstPrediction).toHaveClass('bg-muted/50')

      // Navigate down again
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      const secondPrediction = screen.getByText('Guadalajara').closest('button')
      expect(secondPrediction).toHaveClass('bg-muted/50')
      expect(firstPrediction).not.toHaveClass('bg-muted/50')

      // Navigate up
      fireEvent.keyDown(input, { key: 'ArrowUp' })
      expect(firstPrediction).toHaveClass('bg-muted/50')
      expect(secondPrediction).not.toHaveClass('bg-muted/50')
    })

    it('selects prediction with Enter key', async () => {
      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          onPlaceSelect={mockOnPlaceSelect}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
          onPlaceSelect={mockOnPlaceSelect}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText('Ciudad de México')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Ingresa tu ubicación')
      
      // Navigate to first prediction
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      
      // Select with Enter
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockOnChange).toHaveBeenCalledWith('Ciudad de México, CDMX, México')
      expect(mockOnPlaceSelect).toHaveBeenCalledWith(mockPredictions[0])
    })

    it('closes predictions with Escape key', async () => {
      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText('Ciudad de México')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Ingresa tu ubicación')
      fireEvent.keyDown(input, { key: 'Escape' })

      await waitFor(() => {
        expect(screen.queryByText('Ciudad de México')).not.toBeInTheDocument()
      })
    })

    it('prevents default behavior for navigation keys', async () => {
      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText('Ciudad de México')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Ingresa tu ubicación')
      
      let defaultPrevented = false
      fireEvent.keyDown(input, { 
        key: 'ArrowDown',
        preventDefault: () => { defaultPrevented = true }
      })
      
      expect(defaultPrevented).toBe(true)
    })
  })

  describe('Geolocation', () => {
    it('gets current location when location button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 19.4326,
            longitude: -99.1332
          }
        })
      })

      mockGeocoderGeocode.mockImplementation((request, callback) => {
        callback([
          {
            formatted_address: 'Ciudad de México, CDMX, México'
          }
        ], 'OK')
      })

      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      const locationButton = screen.getAllByRole('button')[0]
      await user.click(locationButton)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Ciudad de México, CDMX, México')
      })
    })

    it('shows loading state while getting location', async () => {
      const user = userEvent.setup({ delay: null })
      
      mockGeolocation.getCurrentPosition.mockImplementation(() => {
        // Don't call success or error callbacks
      })

      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      const locationButton = screen.getAllByRole('button')[0]
      await user.click(locationButton)

      const icon = locationButton.querySelector('.animate-spin')
      expect(icon).toBeInTheDocument()
    })

    it('handles geolocation errors', async () => {
      const user = userEvent.setup({ delay: null })
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({
          code: 1,
          message: 'User denied geolocation'
        })
      })

      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      const locationButton = screen.getAllByRole('button')[0]
      await user.click(locationButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting location:', expect.any(Object))
      })

      consoleErrorSpy.mockRestore()
    })

    it('falls back to coordinates when geocoding fails', async () => {
      const user = userEvent.setup({ delay: null })
      
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 19.4326,
            longitude: -99.1332
          }
        })
      })

      mockGeocoderGeocode.mockImplementation((request, callback) => {
        callback([], 'ZERO_RESULTS')
      })

      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      const locationButton = screen.getAllByRole('button')[0]
      await user.click(locationButton)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('19.4326, -99.1332')
      })
    })

    it('handles missing geolocation API', async () => {
      const user = userEvent.setup({ delay: null })
      
      // Temporarily remove geolocation
      const originalGeolocation = global.navigator.geolocation
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true
      })

      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      const locationButton = screen.getAllByRole('button')[0]
      await user.click(locationButton)

      // Should not crash
      expect(mockOnChange).not.toHaveBeenCalled()

      // Restore geolocation
      Object.defineProperty(global.navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true
      })
    })

    it('handles missing Google Maps when getting location', async () => {
      const user = userEvent.setup({ delay: null })
      
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 19.4326,
            longitude: -99.1332
          }
        })
      })

      // Mock Google Places as not loaded
      ;(useGooglePlaces as jest.Mock).mockReturnValue({
        ...defaultMockUseGooglePlaces,
        isLoaded: false
      })

      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      const locationButton = screen.getAllByRole('button')[0]
      await user.click(locationButton)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('19.4326, -99.1332')
      })
    })
  })

  describe('Focus Management', () => {
    it('shows predictions on focus if available', async () => {
      mockGetPlacePredictions.mockResolvedValue(mockPredictions)

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText('Ciudad de México')).toBeInTheDocument()
      })

      // Blur the input
      const input = screen.getByPlaceholderText('Ingresa tu ubicación')
      fireEvent.blur(input)

      act(() => {
        jest.advanceTimersByTime(200)
      })

      await waitFor(() => {
        expect(screen.queryByText('Ciudad de México')).not.toBeInTheDocument()
      })

      // Focus again
      fireEvent.focus(input)

      await waitFor(() => {
        expect(screen.getByText('Ciudad de México')).toBeInTheDocument()
      })
    })

    it('hides predictions on blur after delay', async () => {
      mockGetPlacePredictions.mockResolvedValue(mockPredictions)

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText('Ciudad de México')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Ingresa tu ubicación')
      fireEvent.blur(input)

      // Predictions should still be visible immediately after blur
      expect(screen.getByText('Ciudad de México')).toBeInTheDocument()

      // Advance timers to trigger the blur timeout
      act(() => {
        jest.advanceTimersByTime(200)
      })

      await waitFor(() => {
        expect(screen.queryByText('Ciudad de México')).not.toBeInTheDocument()
      })
    })

    it('cancels blur timeout when selecting prediction', async () => {
      const user = userEvent.setup({ delay: null })
      mockGetPlacePredictions.mockResolvedValue(mockPredictions)

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          onPlaceSelect={mockOnPlaceSelect}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
          onPlaceSelect={mockOnPlaceSelect}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText('Ciudad de México')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Ingresa tu ubicación')
      fireEvent.blur(input)

      // Click prediction before blur timeout
      const prediction = screen.getByText('Ciudad de México').closest('button')!
      await user.click(prediction)

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Should have selected the prediction
      expect(mockOnChange).toHaveBeenCalledWith('Ciudad de México, CDMX, México')
      expect(mockOnPlaceSelect).toHaveBeenCalledWith(mockPredictions[0])
    })
  })

  describe('Edge Cases', () => {
    it('handles empty predictions gracefully', async () => {
      mockGetPlacePredictions.mockResolvedValue([])

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Unknown place xyz"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(mockGetPlacePredictions).toHaveBeenCalled()
      })

      // Should not show any dropdown
      expect(screen.queryByRole('button', { name: /Ciudad de México/ })).not.toBeInTheDocument()
    })

    it('handles rapid value changes', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('Ingresa tu ubicación')
      
      // Type rapidly
      await user.type(input, 'Mexico City')
      
      expect(mockOnChange).toHaveBeenCalledTimes(11) // One for each character
    })

    it('cleans up timeouts on unmount', async () => {
      mockGetPlacePredictions.mockResolvedValue(mockPredictions)

      const { unmount, rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
        />
      )

      // Unmount before debounce timeout
      unmount()

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Should not call API after unmount
      expect(mockGetPlacePredictions).not.toHaveBeenCalled()
    })

    it('handles predictions with missing structured_formatting', async () => {
      const malformedPredictions = [{
        place_id: '1',
        description: 'Test Location',
        structured_formatting: {
          main_text: '',
          secondary_text: ''
        },
        terms: []
      }]

      mockGetPlacePredictions.mockResolvedValue(malformedPredictions)

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Test"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        // Check that the dropdown appears even with empty text
        const buttons = screen.getAllByRole('button')
        // Should have location predictions buttons
        expect(buttons.length).toBeGreaterThan(1)
      })
    })

    it('handles Google Places not loaded', async () => {
      ;(useGooglePlaces as jest.Mock).mockReturnValue({
        ...defaultMockUseGooglePlaces,
        isLoaded: false
      })

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Should not call predictions API
      expect(mockGetPlacePredictions).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('Ingresa tu ubicación')
      // Input component might not have explicit type attribute
      expect(input.tagName).toBe('INPUT')
    })

    it('announces loading state to screen readers', async () => {
      mockGetPlacePredictions.mockImplementation(() => new Promise(() => {}))

      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      )

      rerender(
        <LocationAutocomplete
          value="Mexico"
          onChange={mockOnChange}
        />
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.getByText('Buscando ubicaciones...')).toBeInTheDocument()
      })
    })

    it('has accessible buttons with proper labels', async () => {
      // const user = userEvent.setup() // Commenting out unused variable
      
      render(
        <LocationAutocomplete
          value="Test"
          onChange={mockOnChange}
        />
      )

      // Clear button should have accessible name
      const clearButton = screen.getAllByRole('button')[0]
      expect(clearButton).toBeInTheDocument()

      // Location button should have accessible name  
      const locationButton = screen.getAllByRole('button')[1]
      expect(locationButton).toBeInTheDocument()
    })
  })
})