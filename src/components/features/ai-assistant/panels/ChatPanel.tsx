'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Send, Sparkles, User, Bot, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAIAssistant } from '@/contexts/AIAssistantContext'

export function ChatPanel() {
  const {
    messages,
    sendMessage,
    isTyping,
    searchContext,
    currentSearchId
  } = useAIAssistant()
  
  const [inputValue, setInputValue] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  
  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return
    
    const message = inputValue.trim()
    setInputValue('')
    await sendMessage(message)
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex gap-3",
                message.type === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.type === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.type === 'user'
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                
                {/* Suggested Actions */}
                {message.metadata?.suggestedActions && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Acciones sugeridas:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.metadata.suggestedActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(action)}
                          className="text-xs px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {message.type === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Pensando...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Empty State */}
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              ¡Hola! Soy tu AI Assistant
            </h3>
            
            {/* Context-specific empty state */}
            {searchContext?.currentSearch ? (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-2 max-w-sm">
                  Estoy listo para ayudarte con tu búsqueda en{' '}
                  <span className="font-semibold text-blue-600">
                    {searchContext.currentSearch.location}
                  </span>
                </p>
                {searchContext.currentSearch.query && (
                  <p className="text-sm text-gray-500 mb-4">
                    Búsqueda: &ldquo;{searchContext.currentSearch.query}&rdquo;
                  </p>
                )}
                
                {/* Search-specific suggestions */}
                <div className="space-y-2 w-full max-w-sm">
                  {[
                    `¿Cuáles son los mejores concesionarios en ${searchContext.currentSearch.location}?`,
                    'Analiza los precios y calificaciones',
                    'Muéstrame opciones de financiamiento',
                    'Compara las agencias encontradas'
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left p-3 text-sm bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-900 dark:text-gray-100"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-sm">
                  Puedo ayudarte a analizar concesionarios, comparar precios y encontrar las mejores opciones.
                </p>
                
                {/* Generic suggestions when no search context */}
                <div className="space-y-2 w-full max-w-sm">
                  <p className="text-sm text-gray-500 mb-4">
                    Por favor selecciona una búsqueda para comenzar
                  </p>
                </div>
              </>
            )}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
        <div
          className={cn(
            "flex gap-3 p-3 border rounded-2xl transition-all",
            isInputFocused
              ? "border-blue-500 ring-2 ring-blue-500/20"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          )}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="Escribe tu pregunta..."
            className="flex-1 outline-none text-sm bg-transparent text-gray-900 dark:text-gray-100"
            disabled={isTyping}
          />
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className={cn(
              "p-2 rounded-xl transition-all",
              inputValue.trim() && !isTyping
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {/* Search Context Display */}
        {currentSearchId === 'global-chat' ? (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-700 dark:text-blue-300">
                  Chat Global de Karmatic
                </span>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              💬 Pregúntame cualquier cosa sobre concesionarios y autos
            </div>
          </div>
        ) : searchContext?.currentSearch && currentSearchId ? (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Contexto de búsqueda: 
                  <span className="font-semibold text-gray-900 dark:text-gray-100 ml-1">
                    {searchContext.currentSearch.location}
                  </span>
                </span>
              </div>
              <span className="text-gray-400 text-xs">
                ID: {currentSearchId.slice(-8)}
              </span>
            </div>
            
            {searchContext.currentSearch.query && (
              <div className="mt-1 text-xs text-gray-500">
                Búsqueda: &ldquo;{searchContext.currentSearch.query}&rdquo;
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-400">
              💬 Chat específico para esta búsqueda • Los mensajes se guardan automáticamente
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}