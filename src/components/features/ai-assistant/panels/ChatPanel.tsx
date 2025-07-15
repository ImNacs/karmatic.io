'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Send, Sparkles, User, Bot, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAIAssistant } from '@/contexts/AIAssistantContext'
import { Input } from '@/components/ui/input'

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
  
  
  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-4xl mx-auto w-full">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {(message.role || message.type) === 'user' ? (
                // User Message - Visual distinction through size and background
                <div className="mb-10 py-6 px-8 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                  <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {message.content}
                  </h2>
                  {/* Source badges if this is the first message */}
                  {index === 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                        Investigación
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <Bot className="w-3 h-3" />
                        Búsqueda
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <Send className="w-3 h-3" />
                        Fuentes
                        <span className="bg-gray-100 dark:bg-gray-700 px-1.5 rounded">3</span>
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                // Assistant Message - Perplexity Style (Clean response)
                <div className="mb-8">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {message.content.split('\n').map((paragraph, pIndex) => {
                        if (paragraph.trim() === '') return <br key={pIndex} />
                        
                        // Check if it's a heading
                        if (paragraph.startsWith('## ')) {
                          return <h3 key={pIndex} className="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">{paragraph.replace('## ', '')}</h3>
                        }
                        if (paragraph.startsWith('# ')) {
                          return <h2 key={pIndex} className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">{paragraph.replace('# ', '')}</h2>
                        }
                        
                        // Check if it's a bullet point
                        if (paragraph.startsWith('- ') || paragraph.startsWith('• ')) {
                          return (
                            <li key={pIndex} className="ml-4 mb-2 list-disc">
                              {paragraph.replace(/^[-•]\s/, '')}
                            </li>
                          )
                        }
                        
                        // Regular paragraph
                        return <p key={pIndex} className="mb-4">{paragraph}</p>
                      })}
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"></div>
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
            className="mb-8"
          >
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Buscando información...</span>
            </div>
          </motion.div>
        )}
        
        {/* Empty State */}
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              ¿En qué puedo ayudarte con tu búsqueda?
            </p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-3">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Pregunta sobre los concesionarios..."
              disabled={isTyping}
              variant="search"
              className="flex-1"
            />
            
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className={cn(
                "p-2 rounded-full transition-all",
                inputValue.trim() && !isTyping
                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        
      </div>
    </div>
  )
}