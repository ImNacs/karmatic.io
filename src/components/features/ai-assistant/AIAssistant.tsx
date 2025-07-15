/**
 * @fileoverview Main AI Assistant interface component
 * @module components/features/ai-assistant/AIAssistant
 */

'use client'

import React from 'react'
import { X, MessageSquare } from 'lucide-react'
import { useAIAssistant } from '@/contexts/AIAssistantContext'
import { ChatPanel } from './panels/ChatPanel'

/**
 * AI Assistant main interface with header and chat panel
 * @component
 * @returns {JSX.Element} AI Assistant interface
 * @example
 * ```tsx
 * // Usually rendered in sidebar or modal
 * <AIAssistant />
 * ```
 */
export function AIAssistant() {
  const { 
    closeAssistant,
    currentSearchId 
  } = useAIAssistant()
  
  // Now we always have a currentSearchId (either from path or 'global-chat')
  // So we can proceed directly to rendering the chat
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tu asesor inteligente de chat</p>
            </div>
          </div>
          
          <button
            onClick={closeAssistant}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar AI Assistant"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  )
}