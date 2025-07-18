/**
 * @fileoverview Tipos para el sistema de chat
 * @module types/chat
 */

/**
 * Mensaje en una conversación
 */
export interface Message {
  /** ID único del mensaje */
  id?: string
  
  /** Rol del emisor */
  role: 'user' | 'assistant' | 'system'
  
  /** Contenido del mensaje */
  content: string
  
  /** Timestamp del mensaje */
  timestamp?: Date | string
  
  /** Metadatos adicionales */
  metadata?: {
    /** Modelo usado para generar la respuesta */
    modelUsed?: string
    
    /** Contexto de búsqueda asociado */
    searchContext?: any
    
    /** Otros datos */
    [key: string]: any
  }
}