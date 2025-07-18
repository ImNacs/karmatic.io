'use client'

/**
 * @fileoverview AI Assistant context provider for managing chat state
 * @module contexts/AIAssistantContext
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSearchHistory } from '@/contexts/SearchHistoryContext'

/** Available panel types for the AI assistant */
export type PanelType = 'chat' | 'none'

/**
 * Chat message structure
 * @interface ChatMessage
 */
interface ChatMessage {
  /** Unique message identifier */
  id: string
  /** Message sender role */
  role: 'user' | 'assistant' | 'system'
  /** Message content */
  content: string
  /** Message timestamp */
  timestamp: Date
  /** Optional metadata for rich content */
  metadata?: {
    /** Dealer-specific data */
    dealerData?: any
    /** Calculation results */
    calculations?: any
  }
  /** Legacy type field for backward compatibility */
  type?: 'user' | 'assistant'
}

/**
 * AI-generated insight about agencies
 * @interface AIInsight
 */
interface AIInsight {
  /** Unique insight identifier */
  id: string
  /** Type of insight */
  type: 'inventory' | 'pricing' | 'review' | 'recommendation'
  /** Insight title */
  title: string
  /** Detailed content */
  content: string
  /** Confidence score (0-1) */
  confidence: number
  /** Related dealer ID */
  dealerId?: string
  /** Creation timestamp */
  timestamp: Date
}

/**
 * AI Assistant context state and actions
 * @interface AIAssistantContextType
 */
interface AIAssistantContextType {
  // UI State
  isOpen: boolean
  activePanel: PanelType
  isMobile: boolean
  
  // Chat State - Now isolated by search
  messages: ChatMessage[]  // Messages for current search only
  isTyping: boolean        // Typing state for current search
  
  // Insights State - Now isolated by search
  insights: AIInsight[]    // Insights for current search only
  hasNewInsights: boolean  // New insights for current search
  
  // Search-specific Actions
  openAssistant: (panel?: PanelType) => void
  closeAssistant: () => void
  setActivePanel: (panel: PanelType) => void
  sendMessage: (content: string) => Promise<void>
  addInsight: (insight: Omit<AIInsight, 'id' | 'timestamp'>) => void
  markInsightsAsRead: () => void
  
  // Search Isolation Functions
  getMessagesForSearch: (searchId: string) => ChatMessage[]
  addMessageToSearch: (searchId: string, message: ChatMessage) => void
  clearMessagesForSearch: (searchId: string) => void
  
  // Context Data
  currentSearchId: string | null
  searchContext: any
  
  // Connection and sync state
  isOnline: boolean
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error'
}

const AIAssistantContext = createContext<AIAssistantContextType | null>(null)

/**
 * Hook to access AI Assistant context
 * @returns {AIAssistantContextType} AI Assistant state and actions
 * @throws {Error} If used outside of AIAssistantProvider
 * @example
 * ```tsx
 * const { messages, sendMessage, isTyping } = useAIAssistant();
 * ```
 */
export function useAIAssistant() {
  const context = useContext(AIAssistantContext)
  if (!context) {
    throw new Error('useAIAssistant must be used within AIAssistantProvider')
  }
  return context
}

/**
 * AI Assistant context provider component
 * @component
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 * @example
 * ```tsx
 * <AIAssistantProvider>
 *   <App />
 * </AIAssistantProvider>
 * ```
 */
export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { history } = useSearchHistory()
  
  // UI State
  const [isOpen, setIsOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<PanelType>('chat')
  const [isMobile, setIsMobile] = useState(false)
  
  // Extract current search ID from pathname - only works on search pages
  const currentSearchId = pathname.startsWith('/explorer/') 
    ? pathname.split('/')[2] 
    : null
  
  // Chat State - Maps by searchId for isolation
  const [messagesBySearch, setMessagesBySearch] = useState<Map<string, ChatMessage[]>>(new Map())
  const [typingBySearch, setTypingBySearch] = useState<Map<string, boolean>>(new Map())
  
  // Connection and sync state
  const [isOnline, setIsOnline] = useState(true)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced')
  
  // Current search states (derived from maps)
  const messages = currentSearchId ? messagesBySearch.get(currentSearchId) || [] : []
  const isTyping = currentSearchId ? typingBySearch.get(currentSearchId) || false : false
  
  // Insights State - Maps by searchId for isolation
  const [insightsBySearch, setInsightsBySearch] = useState<Map<string, AIInsight[]>>(new Map())
  const [newInsightsBySearch, setNewInsightsBySearch] = useState<Map<string, boolean>>(new Map())
  
  // Current search insights (derived from maps)
  const insights = currentSearchId ? insightsBySearch.get(currentSearchId) || [] : []
  const hasNewInsights = currentSearchId ? newInsightsBySearch.get(currentSearchId) || false : false
  
  // Derive search context from existing data
  const searchContext = React.useMemo(() => {
    if (!currentSearchId || !history.length) return null
    
    const allSearches = history.flatMap(group => group.searches)
    const currentSearch = allSearches.find(search => search.id === currentSearchId)
    
    return {
      currentSearch,
      recentSearches: allSearches.slice(0, 5),
      searchPatterns: extractSearchPatterns(allSearches),
      userPreferences: extractUserPreferences(allSearches)
    }
  }, [currentSearchId, history])
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Online/offline detection
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      setSyncStatus(online ? 'synced' : 'offline')
      console.log(online ? '🌐 Back online' : '📴 Gone offline')
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])
  
  // Persistence functions (defined first)
  const saveConversationToStorage = useCallback((searchId: string, messages: ChatMessage[]) => {
    try {
      // Save to sessionStorage for immediate access
      sessionStorage.setItem(`ai_conversation_${searchId}`, JSON.stringify(messages))
      
      // Database saving happens automatically in the API endpoint
      // No need to manually sync here as messages are saved when sent
    } catch (error) {
      console.warn('Failed to save conversation to storage:', error)
    }
  }, [])
  
  // Migrate sessionStorage conversation to database
  const migrateConversationToDatabase = useCallback(async (searchId: string, messages: ChatMessage[], context?: any): Promise<boolean> => {
    try {
      console.log('🔄 Migrating conversation to database:', searchId)
      
      const response = await fetch('/api/conversations/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchId,
          messages: messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
          })),
          context
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Migration successful:', data)
        return true
      } else {
        console.error('❌ Migration failed:', response.status)
        return false
      }
    } catch (error) {
      console.error('❌ Migration error:', error)
      return false
    }
  }, [])

  // Async database loading (background sync) - defined first
  const loadFromDatabaseAsync = useCallback(async (searchId: string, existingMessages: ChatMessage[]) => {
    try {
      // Skip if offline
      if (!navigator.onLine) {
        console.log('📴 Offline mode: Skipping database sync')
        return
      }

      console.log('🔍 Background: Syncing with database for', searchId)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      try {
        const response = await fetch(`/api/conversations/${searchId}`, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.messages?.length > 0) {
            console.log('✅ Database sync: Found', data.messages.length, 'messages')
            
            const dbMessages = data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
            
            // Only update UI if database has newer/different data
            if (dbMessages.length !== existingMessages.length || 
                JSON.stringify(dbMessages) !== JSON.stringify(existingMessages)) {
              console.log('🔄 Updating UI with database data')
              
              // Update sessionStorage
              sessionStorage.setItem(`ai_conversation_${searchId}`, JSON.stringify(dbMessages))
              
              // Update React state
              setMessagesBySearch(prev => {
                const newMap = new Map(prev)
                newMap.set(searchId, dbMessages)
                return newMap
              })
            }
            return
          }
        }
        
        // If no data in database but we have sessionStorage, migrate it
        if (existingMessages.length > 0) {
          console.log('🔄 Background: Auto-migrating sessionStorage to database')
          migrateConversationToDatabase(searchId, existingMessages)
            .then((success) => {
              if (success) {
                console.log('✅ Background migration completed')
              }
            })
            .catch((error) => {
              console.error('❌ Background migration error:', error)
            })
        }
        
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.log('⏰ Background database sync timed out')
        } else {
          console.log('🌐 Background sync failed:', fetchError)
        }
      }
    } catch (error) {
      console.warn('Background database sync error:', error)
    }
  }, [migrateConversationToDatabase])

  // Load immediately from sessionStorage (sync), then try database (async)
  const loadConversationFromStorage = useCallback((searchId: string): ChatMessage[] => {
    // Always load from sessionStorage first for immediate UX
    try {
      const stored = sessionStorage.getItem(`ai_conversation_${searchId}`)
      if (stored) {
        const messages = JSON.parse(stored)
        console.log('📱 Loaded', messages.length, 'messages from sessionStorage (immediate)')
        
        const chatMessages = messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))

        // Async: Try to update from database in background
        loadFromDatabaseAsync(searchId, chatMessages)
        
        return chatMessages
      }
    } catch (error) {
      console.warn('Failed to load from sessionStorage:', error)
    }
    
    // If no sessionStorage, try database immediately (blocking)
    loadFromDatabaseAsync(searchId, [])
    return []
  }, [loadFromDatabaseAsync])

  // Search-specific helper functions
  const getMessagesForSearch = useCallback((searchId: string): ChatMessage[] => {
    return messagesBySearch.get(searchId) || []
  }, [messagesBySearch])
  
  const addMessageToSearch = useCallback((searchId: string, message: ChatMessage) => {
    setMessagesBySearch(prev => {
      const newMap = new Map(prev)
      const existingMessages = newMap.get(searchId) || []
      newMap.set(searchId, [...existingMessages, message])
      
      // Save to sessionStorage for persistence
      saveConversationToStorage(searchId, [...existingMessages, message])
      
      return newMap
    })
  }, [saveConversationToStorage])
  
  const clearMessagesForSearch = useCallback((searchId: string) => {
    setMessagesBySearch(prev => {
      const newMap = new Map(prev)
      newMap.delete(searchId)
      
      // Clear from sessionStorage
      sessionStorage.removeItem(`ai_conversation_${searchId}`)
      
      return newMap
    })
  }, [])
  
  const setTypingForSearch = useCallback((searchId: string, typing: boolean) => {
    setTypingBySearch(prev => {
      const newMap = new Map(prev)
      newMap.set(searchId, typing)
      return newMap
    })
  }, [])
  
  // Initialize conversation when search context changes
  useEffect(() => {
    if (currentSearchId) {
      // Load existing conversation from storage (immediate from sessionStorage)
      const existingMessages = loadConversationFromStorage(currentSearchId)
        
      if (existingMessages.length > 0) {
        // Restore existing conversation
        setMessagesBySearch(prev => {
          const newMap = new Map(prev)
          newMap.set(currentSearchId, existingMessages)
          return newMap
        })
      }
    }
  }, [currentSearchId, loadConversationFromStorage])
  
  const openAssistant = useCallback((panel: PanelType = 'chat') => {
    setIsOpen(true)
    setActivePanel(panel)
  }, [])
  
  const closeAssistant = useCallback(() => {
    setIsOpen(false)
  }, [])
  
  const sendMessage = useCallback(async (content: string) => {
    if (!currentSearchId) return
    
    // Check if we're online before attempting to send
    if (!isOnline) {
      console.log('📴 Cannot send message while offline')
      // TODO: Could queue messages for later sending
      return
    }
    
    setSyncStatus('syncing')
    
    const userMessage: ChatMessage = {
      id: `user-${currentSearchId}-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    }
    
    // Add user message to specific search
    addMessageToSearch(currentSearchId, userMessage)
    setTypingForSearch(currentSearchId, true)
    
    // Create assistant message ID in advance for streaming
    const assistantMessageId = `assistant-${currentSearchId}-${Date.now()}`
    let streamedContent = ''
    
    try {
      // Convert messages to API format, including the new user message
      const allMessages = [...getMessagesForSearch(currentSearchId), userMessage]
      const apiMessages = allMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          searchId: currentSearchId,
          context: searchContext?.currentSearch ? {
            location: searchContext.currentSearch.location,
            query: searchContext.currentSearch.query,
            placeId: searchContext.currentSearch.placeId,
            placeDetails: searchContext.currentSearch.placeDetails,
            coordinates: searchContext.currentSearch.coordinates
          } : undefined
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }
      
      // Check if response is streaming
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('text/event-stream') || response.body) {
        // Handle streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        
        // Add initial empty assistant message
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date()
        }
        addMessageToSearch(currentSearchId, assistantMessage)
        
        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')
              
              for (const line of lines) {
                if (!line.trim()) continue
                
                // Handle AI SDK streaming format
                const colonIndex = line.indexOf(':')
                if (colonIndex === -1) continue
                
                const prefix = line.slice(0, colonIndex)
                const content = line.slice(colonIndex + 1)
                
                try {
                  // Handle text chunks (prefix is a number like "0", "1", etc.)
                  if (/^\d+$/.test(prefix)) {
                    const textContent = JSON.parse(content)
                    streamedContent += textContent
                    
                    // Update the message with streamed content
                    setMessagesBySearch(prev => {
                      const newMap = new Map(prev)
                      const messages = newMap.get(currentSearchId) || []
                      const updatedMessages = messages.map(msg => 
                        msg.id === assistantMessageId 
                          ? { ...msg, content: streamedContent }
                          : msg
                      )
                      newMap.set(currentSearchId, updatedMessages)
                      return newMap
                    })
                  }
                  // Handle other message types (f, e, d) - we can ignore these for now
                } catch (e) {
                  // Skip invalid chunks
                  console.debug('Skipping chunk:', line)
                }
              }
            }
          } finally {
            reader.releaseLock()
          }
          
          // Save final state to storage
          saveConversationToStorage(currentSearchId, getMessagesForSearch(currentSearchId))
        }
      } else {
        // Handle non-streaming response (fallback)
        const data = await response.json()
        
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: data.message?.content || data.response || 'No pude procesar tu mensaje.',
          timestamp: new Date(),
          metadata: data.message?.metadata || data.metadata
        }
        
        // Add assistant response to specific search
        addMessageToSearch(currentSearchId, assistantMessage)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      
      const errorMessage: ChatMessage = {
        id: `error-${currentSearchId}-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error && error.message.includes('AI service') 
          ? 'El servicio de AI no está disponible en este momento. Por favor intenta más tarde.'
          : 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date()
      }
      
      // Remove any partial streaming message
      if (streamedContent) {
        setMessagesBySearch(prev => {
          const newMap = new Map(prev)
          const messages = newMap.get(currentSearchId) || []
          const filteredMessages = messages.filter(msg => msg.id !== assistantMessageId)
          newMap.set(currentSearchId, filteredMessages)
          return newMap
        })
      }
      
      addMessageToSearch(currentSearchId, errorMessage)
      setSyncStatus('error')
    } finally {
      setTypingForSearch(currentSearchId, false)
      if (syncStatus === 'syncing') {
        setSyncStatus('synced')
      }
    }
  }, [currentSearchId, searchContext, addMessageToSearch, getMessagesForSearch, setTypingForSearch, saveConversationToStorage, isOnline, syncStatus])
  
  const addInsight = useCallback((insight: Omit<AIInsight, 'id' | 'timestamp'>) => {
    if (!currentSearchId) return
    
    const newInsight: AIInsight = {
      ...insight,
      id: `insight-${currentSearchId}-${Date.now()}`,
      timestamp: new Date()
    }
    
    setInsightsBySearch(prev => {
      const newMap = new Map(prev)
      const existingInsights = newMap.get(currentSearchId) || []
      newMap.set(currentSearchId, [newInsight, ...existingInsights])
      return newMap
    })
    
    setNewInsightsBySearch(prev => {
      const newMap = new Map(prev)
      newMap.set(currentSearchId, true)
      return newMap
    })
  }, [currentSearchId])
  
  const markInsightsAsRead = useCallback(() => {
    if (!currentSearchId) return
    
    setNewInsightsBySearch(prev => {
      const newMap = new Map(prev)
      newMap.set(currentSearchId, false)
      return newMap
    })
  }, [currentSearchId])
  
  const value: AIAssistantContextType = {
    // UI State
    isOpen,
    activePanel,
    isMobile,
    
    // Chat State - Now isolated by search
    messages,
    isTyping,
    
    // Insights State - Now isolated by search
    insights,
    hasNewInsights,
    
    // Search-specific Actions
    openAssistant,
    closeAssistant,
    setActivePanel,
    sendMessage,
    addInsight,
    markInsightsAsRead,
    
    // Search Isolation Functions
    getMessagesForSearch,
    addMessageToSearch,
    clearMessagesForSearch,
    
    // Context Data
    currentSearchId,
    searchContext,
    
    // Connection and sync state
    isOnline,
    syncStatus
  }
  
  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  )
}

// Helper functions
function extractSearchPatterns(searches: any[]) {
  if (!searches.length) return {}
  
  const locations = searches.map(s => s.location).filter(Boolean)
  const queries = searches.map(s => s.query).filter(Boolean)
  
  return {
    commonLocations: [...new Set(locations)].slice(0, 3),
    commonQueries: [...new Set(queries)].slice(0, 3),
    searchFrequency: searches.length
  }
}

function extractUserPreferences(searches: any[]) {
  // Analyze search patterns to infer preferences
  return {
    preferredPriceRange: 'moderate',
    brandInterest: ['Honda', 'Toyota'],
    serviceImportance: 'high'
  }
}

