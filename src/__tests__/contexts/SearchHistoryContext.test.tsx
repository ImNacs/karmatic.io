import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { SearchHistoryProvider, useSearchHistory } from '@/contexts/SearchHistoryContext'
import useSWR from 'swr'

// Mock dependencies
jest.mock('swr')
const mockedUseSWR = useSWR as jest.MockedFunction<typeof useSWR>

// Mock fetch
global.fetch = jest.fn()

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SearchHistoryProvider>{children}</SearchHistoryProvider>
)

describe('SearchHistoryContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should provide search history from API', async () => {
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
        ],
      },
    ]

    mockedUseSWR.mockReturnValue({
      data: mockHistory,
      isLoading: false,
      error: undefined,
      mutate: jest.fn(),
      isValidating: false,
    } as any)

    const { result } = renderHook(() => useSearchHistory(), { wrapper })

    expect(result.current.history).toEqual(mockHistory)
    expect(result.current.isLoading).toBe(false)
  })

  it('should add optimistic search immediately', async () => {
    const mockHistory: any[] = []
    const mockMutate = jest.fn()

    mockedUseSWR.mockReturnValue({
      data: mockHistory,
      isLoading: false,
      error: undefined,
      mutate: mockMutate,
      isValidating: false,
    } as any)

    const { result } = renderHook(() => useSearchHistory(), { wrapper })

    let tempId: string = ''
    act(() => {
      tempId = result.current.addOptimisticSearch({
        location: 'New York',
        query: 'insurance',
      })
    })

    // Verify mutate was called to update cache
    expect(mockMutate).toHaveBeenCalledWith(
      expect.any(Function),
      { revalidate: false }
    )

    // Verify temporary ID was returned
    expect(tempId).toMatch(/^[a-zA-Z0-9_-]+$/)
  })

  it('should update search ID from temporary to real', async () => {
    const mockHistory = [
      {
        label: 'Hoy',
        searches: [
          {
            id: 'temp_123',
            location: 'Chicago',
            query: null,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ]
    const mockMutate = jest.fn()

    mockedUseSWR.mockReturnValue({
      data: mockHistory,
      isLoading: false,
      error: undefined,
      mutate: mockMutate,
      isValidating: false,
    } as any)

    const { result } = renderHook(() => useSearchHistory(), { wrapper })

    act(() => {
      result.current.updateSearchId('temp_123', 'real_456')
    })

    expect(mockMutate).toHaveBeenCalledWith(
      expect.any(Function),
      { revalidate: false }
    )
  })

  it('should delete search optimistically', async () => {
    const mockHistory = [
      {
        label: 'Hoy',
        searches: [
          {
            id: 'search_1',
            location: 'Los Angeles',
            query: 'real estate',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'search_2',
            location: 'Seattle',
            query: null,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ]
    const mockMutate = jest.fn()

    mockedUseSWR.mockReturnValue({
      data: mockHistory,
      isLoading: false,
      error: undefined,
      mutate: mockMutate,
      isValidating: false,
    } as any)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    const { result } = renderHook(() => useSearchHistory(), { wrapper })

    await act(async () => {
      await result.current.deleteSearch('search_1')
    })

    // Verify optimistic update
    expect(mockMutate).toHaveBeenCalledWith(
      expect.any(Function),
      { revalidate: false }
    )

    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/search/history/search_1',
      {
        method: 'DELETE',
        credentials: 'include',
      }
    )
  })

  it('should revalidate on delete failure', async () => {
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
    const mockMutate = jest.fn()

    mockedUseSWR.mockReturnValue({
      data: mockHistory,
      isLoading: false,
      error: undefined,
      mutate: mockMutate,
      isValidating: false,
    } as any)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useSearchHistory(), { wrapper })

    await act(async () => {
      await result.current.deleteSearch('search_1')
    })

    // Verify mutate was called twice - once for optimistic update, once for revalidation
    expect(mockMutate).toHaveBeenCalledTimes(2)
  })

  it('should handle loading state', () => {
    mockedUseSWR.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
      mutate: jest.fn(),
      isValidating: false,
    } as any)

    const { result } = renderHook(() => useSearchHistory(), { wrapper })

    expect(result.current.history).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it('should handle error state gracefully', () => {
    mockedUseSWR.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      mutate: jest.fn(),
      isValidating: false,
    } as any)

    const { result } = renderHook(() => useSearchHistory(), { wrapper })

    expect(result.current.history).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })
})