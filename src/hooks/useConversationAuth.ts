import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'

export interface ConversationAuth {
  userId?: string
  sessionId?: string
  isAuthenticated: boolean
  isLoading: boolean
}

/**
 * Hook para manejar autenticación en conversaciones
 * Determina si usar userId (autenticado) o sessionId (anónimo)
 */
export function useConversationAuth(): ConversationAuth {
  const { userId, isLoaded } = useAuth()
  const [sessionId, setSessionId] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)

  // Obtener session ID para usuarios anónimos
  const getSessionId = useCallback(async () => {
    if (!userId && isLoaded) {
      try {
        // Crear session ID local si no existe
        let storedSessionId = localStorage.getItem('karmatic_local_session')
        
        if (!storedSessionId) {
          storedSessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          localStorage.setItem('karmatic_local_session', storedSessionId)
        }
        
        setSessionId(storedSessionId)
      } catch (error) {
        console.error('Error getting session ID:', error)
        // Fallback: generate temp session
        setSessionId(`temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
      }
    }
    setIsLoading(false)
  }, [userId, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      getSessionId()
    }
  }, [isLoaded, getSessionId])

  return {
    userId: userId || undefined,
    sessionId: !userId ? sessionId : undefined,
    isAuthenticated: !!userId,
    isLoading: !isLoaded || isLoading
  }
}

/**
 * Hook para transferir conversaciones anónimas cuando el usuario se autentica
 */
export function useConversationTransfer() {
  const { userId, isLoaded } = useAuth()
  const [hasTransferred, setHasTransferred] = useState(false)

  const transferAnonymousConversations = useCallback(async () => {
    if (userId && isLoaded && !hasTransferred) {
      try {
        console.log('🔄 Transferring anonymous conversations to authenticated user')
        
        const localSessionId = localStorage.getItem('karmatic_local_session')
        if (!localSessionId) {
          console.log('ℹ️ No local session found, nothing to transfer')
          setHasTransferred(true)
          return
        }

        const response = await fetch('/api/conversations/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            anonymousSessionId: localSessionId
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('✅ Transfer successful:', data)
          
          // Clean up local session
          localStorage.removeItem('karmatic_local_session')
          setHasTransferred(true)
        } else {
          console.error('❌ Transfer failed:', response.status)
        }
      } catch (error) {
        console.error('❌ Transfer error:', error)
      }
    }
  }, [userId, isLoaded, hasTransferred])

  useEffect(() => {
    transferAnonymousConversations()
  }, [transferAnonymousConversations])

  return {
    hasTransferred,
    transferAnonymousConversations
  }
}