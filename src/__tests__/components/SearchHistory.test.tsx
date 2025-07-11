import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchHistory } from '@/components/features/sidebar/SearchHistory'
import { useSearchHistory } from '@/contexts/SearchHistoryContext'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('@/contexts/SearchHistoryContext')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockUseSearchHistory = useSearchHistory as jest.MockedFunction<typeof useSearchHistory>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('SearchHistory Component', () => {
  const mockPush = jest.fn()
  const mockDeleteSearch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any)
  })

  it('should render search history items', () => {
    const mockHistory = [
      {
        label: 'Hoy',
        searches: [
          {
            id: 'search_1',
            location: 'San Francisco',
            query: 'agencies',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'search_2',
            location: 'New York',
            query: null,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ]

    mockUseSearchHistory.mockReturnValue({
      history: mockHistory,
      isLoading: false,
      addOptimisticSearch: jest.fn(),
      refreshHistory: jest.fn(),
      updateSearchId: jest.fn(),
      deleteSearch: mockDeleteSearch,
    })

    render(<SearchHistory />)

    expect(screen.getByText('Búsquedas recientes')).toBeInTheDocument()
    expect(screen.getByText('HOY')).toBeInTheDocument()
    expect(screen.getByText('San Francisco')).toBeInTheDocument()
    expect(screen.getByText('agencies')).toBeInTheDocument()
    expect(screen.getByText('New York')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockUseSearchHistory.mockReturnValue({
      history: [],
      isLoading: true,
      addOptimisticSearch: jest.fn(),
      refreshHistory: jest.fn(),
      updateSearchId: jest.fn(),
      deleteSearch: mockDeleteSearch,
    })

    render(<SearchHistory />)

    // Check for loading skeleton elements
    const loadingElements = screen.getAllByRole('status')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('should show empty state when no searches', () => {
    mockUseSearchHistory.mockReturnValue({
      history: [],
      isLoading: false,
      addOptimisticSearch: jest.fn(),
      refreshHistory: jest.fn(),
      updateSearchId: jest.fn(),
      deleteSearch: mockDeleteSearch,
    })

    render(<SearchHistory />)

    expect(screen.getByText('No hay búsquedas recientes')).toBeInTheDocument()
  })

  it('should navigate when clicking a search item', () => {
    const mockHistory = [
      {
        label: 'Hoy',
        searches: [
          {
            id: 'search_1',
            location: 'Chicago',
            query: 'insurance',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ]

    mockUseSearchHistory.mockReturnValue({
      history: mockHistory,
      isLoading: false,
      addOptimisticSearch: jest.fn(),
      refreshHistory: jest.fn(),
      updateSearchId: jest.fn(),
      deleteSearch: mockDeleteSearch,
    })

    render(<SearchHistory />)

    const searchItem = screen.getByText('Chicago').closest('div')
    fireEvent.click(searchItem!)

    expect(mockPush).toHaveBeenCalledWith('/explorer/search_1')
  })

  it('should show delete button on hover', async () => {
    const mockHistory = [
      {
        label: 'Hoy',
        searches: [
          {
            id: 'search_1',
            location: 'Boston',
            query: null,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ]

    mockUseSearchHistory.mockReturnValue({
      history: mockHistory,
      isLoading: false,
      addOptimisticSearch: jest.fn(),
      refreshHistory: jest.fn(),
      updateSearchId: jest.fn(),
      deleteSearch: mockDeleteSearch,
    })

    render(<SearchHistory />)

    const searchItem = screen.getByText('Boston').closest('.group')
    
    // Hover over search item
    fireEvent.mouseEnter(searchItem!)

    // Delete button should be visible (has opacity-100 class on hover)
    const deleteButton = searchItem!.querySelector('button[class*="group-hover:opacity-100"]')
    expect(deleteButton).toBeInTheDocument()
  })

  it('should call deleteSearch when clicking delete button', async () => {
    const mockHistory = [
      {
        label: 'Hoy',
        searches: [
          {
            id: 'search_1',
            location: 'Seattle',
            query: 'tech companies',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ]

    mockUseSearchHistory.mockReturnValue({
      history: mockHistory,
      isLoading: false,
      addOptimisticSearch: jest.fn(),
      refreshHistory: jest.fn(),
      updateSearchId: jest.fn(),
      deleteSearch: mockDeleteSearch,
    })

    render(<SearchHistory />)

    const searchItem = screen.getByText('Seattle').closest('.group')
    
    // Hover to show delete button
    fireEvent.mouseEnter(searchItem!)

    // Click delete button
    const deleteButton = searchItem!.querySelector('button[class*="hover:bg-red-100"]')
    fireEvent.click(deleteButton!)

    expect(mockDeleteSearch).toHaveBeenCalledWith('search_1')
  })

  it('should filter searches based on search query', () => {
    const mockHistory = [
      {
        label: 'Hoy',
        searches: [
          {
            id: 'search_1',
            location: 'San Francisco',
            query: 'agencies',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'search_2',
            location: 'New York',
            query: 'insurance',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ]

    mockUseSearchHistory.mockReturnValue({
      history: mockHistory,
      isLoading: false,
      addOptimisticSearch: jest.fn(),
      refreshHistory: jest.fn(),
      updateSearchId: jest.fn(),
      deleteSearch: mockDeleteSearch,
    })

    render(<SearchHistory />)

    // Open search input
    const searchButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(searchButton)

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Buscar en el historial...')
    fireEvent.change(searchInput, { target: { value: 'francisco' } })

    // Should only show San Francisco
    expect(screen.getByText('San Francisco')).toBeInTheDocument()
    expect(screen.queryByText('New York')).not.toBeInTheDocument()
  })

  it('should show no results message when search finds nothing', () => {
    const mockHistory = [
      {
        label: 'Hoy',
        searches: [
          {
            id: 'search_1',
            location: 'Miami',
            query: null,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ]

    mockUseSearchHistory.mockReturnValue({
      history: mockHistory,
      isLoading: false,
      addOptimisticSearch: jest.fn(),
      refreshHistory: jest.fn(),
      updateSearchId: jest.fn(),
      deleteSearch: mockDeleteSearch,
    })

    render(<SearchHistory />)

    // Open search and search for non-existent term
    const searchButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(searchButton)

    const searchInput = screen.getByPlaceholderText('Buscar en el historial...')
    fireEvent.change(searchInput, { target: { value: 'xyz123' } })

    expect(screen.getByText('No se encontraron resultados para "xyz123"')).toBeInTheDocument()
  })
})