'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSearchHistory } from '@/contexts/SearchHistoryContext'

export type PanelType = 'chat' | 'none'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    suggestedActions?: string[]
    dealerData?: any
    calculations?: any
  }
}

interface AIInsight {
  id: string
  type: 'inventory' | 'pricing' | 'review' | 'recommendation'
  title: string
  content: string
  confidence: number
  dealerId?: string
  timestamp: Date
}

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
}

const AIAssistantContext = createContext<AIAssistantContextType | null>(null)

export function useAIAssistant() {
  const context = useContext(AIAssistantContext)
  if (!context) {
    throw new Error('useAIAssistant must be used within AIAssistantProvider')
  }
  return context
}

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
  
  // Persistence functions (defined first)
  const saveConversationToStorage = useCallback((searchId: string, messages: ChatMessage[]) => {
    try {
      sessionStorage.setItem(`ai_conversation_${searchId}`, JSON.stringify(messages))
    } catch (error) {
      console.warn('Failed to save conversation to storage:', error)
    }
  }, [])
  
  const loadConversationFromStorage = useCallback((searchId: string): ChatMessage[] => {
    try {
      const stored = sessionStorage.getItem(`ai_conversation_${searchId}`)
      if (stored) {
        const messages = JSON.parse(stored)
        return messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }
    } catch (error) {
      console.warn('Failed to load conversation from storage:', error)
    }
    return []
  }, [])

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
      // Load existing conversation from storage
      const existingMessages = loadConversationFromStorage(currentSearchId)
      
      if (existingMessages.length > 0) {
        // Restore existing conversation
        setMessagesBySearch(prev => {
          const newMap = new Map(prev)
          newMap.set(currentSearchId, existingMessages)
          return newMap
        })
      } else if (messages.length === 0 && searchContext?.currentSearch) {
        // Create welcome message for new conversation only if we have search context
        const welcomeContent = generateWelcomeMessage(searchContext.currentSearch)
        if (welcomeContent) {
          const welcomeMessage: ChatMessage = {
            id: `welcome-${currentSearchId}-${Date.now()}`,
            type: 'assistant',
            content: welcomeContent,
            timestamp: new Date(),
            metadata: {
              suggestedActions: [
                '¿Cuáles son los mejores concesionarios aquí?',
                'Muéstrame opciones de financiamiento',
                'Calcula pagos mensuales',
                'Compara precios'
              ]
            }
          }
          addMessageToSearch(currentSearchId, welcomeMessage)
        }
      }
    }
  }, [currentSearchId, searchContext, addMessageToSearch, loadConversationFromStorage, messages.length])
  
  const openAssistant = useCallback((panel: PanelType = 'chat') => {
    setIsOpen(true)
    setActivePanel(panel)
  }, [])
  
  const closeAssistant = useCallback(() => {
    setIsOpen(false)
  }, [])
  
  const sendMessage = useCallback(async (content: string) => {
    if (!currentSearchId) return
    
    const userMessage: ChatMessage = {
      id: `user-${currentSearchId}-${Date.now()}`,
      type: 'user',
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
        role: msg.type === 'user' ? 'user' : 'assistant' as 'user' | 'assistant',
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
            query: searchContext.currentSearch.query
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
          type: 'assistant',
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
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  if (data === '[DONE]') continue
                  
                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.delta?.content) {
                      streamedContent += parsed.delta.content
                      
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
                  } catch (e) {
                    // Skip invalid JSON chunks
                  }
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
          type: 'assistant',
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
        type: 'assistant',
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
    } finally {
      setTypingForSearch(currentSearchId, false)
    }
  }, [currentSearchId, searchContext, addMessageToSearch, getMessagesForSearch, setTypingForSearch, saveConversationToStorage])
  
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
    searchContext
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

function generateWelcomeMessage(search: any) {
  if (!search) {
    return '' // No welcome message if no search context
  }
  
  const location = search.location
  const query = search.query
  
  if (query) {
    return `¡Hola! Veo que estás buscando ${query} en ${location}. Te puedo ayudar a encontrar las mejores opciones y analizar los concesionarios de la zona. ¿En qué te puedo asistir?`
  }
  
  return `¡Hola! Estás explorando concesionarios en ${location}. Puedo ayudarte a analizar precios, inventario, reseñas y opciones de financiamiento. ¿Qué te gustaría saber?`
}