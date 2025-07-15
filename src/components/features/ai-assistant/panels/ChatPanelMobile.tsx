"use client"

import { useEffect, useRef, useState } from "react"
import { useAIAssistant } from "@/contexts/AIAssistantContext"
import { FiSend, FiMessageSquare } from "react-icons/fi"
import { motion, AnimatePresence } from "motion/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function ChatPanelMobile() {
  const { messages, sendMessage, isTyping } = useAIAssistant()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim())
      setInput("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }


  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-MX", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date)
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mobile-scroll p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 px-4"
          >
            <p className="text-sm text-muted-foreground">
              ¿En qué puedo ayudarte con tu búsqueda?
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {message.role === "user" ? (
                // User Message - Visual distinction through size and background
                <div className="mb-6 py-4 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <h3 className="text-xl font-semibold text-foreground leading-snug">
                    {message.content}
                  </h3>
                  {index === 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white dark:bg-gray-800 text-xs">
                        <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                        Buscando
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                // Assistant Message - Perplexity Style (Clean response)
                <div className="mb-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="text-sm text-foreground leading-relaxed">
                      {message.content.split('\n').map((paragraph, pIndex) => {
                        if (paragraph.trim() === '') return <br key={pIndex} />
                        
                        // Regular paragraph
                        return <p key={pIndex} className="mb-3">{paragraph}</p>
                      })}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border"></div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-1">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2 h-2 bg-muted-foreground rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                className="w-2 h-2 bg-muted-foreground rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                className="w-2 h-2 bg-muted-foreground rounded-full"
              />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-background p-4 safe-area-bottom">
        <div className="relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu pregunta..."
            variant="search"
            className="pr-12"
          />
          
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2",
              "p-2 rounded-full transition-all",
              input.trim()
                ? "text-primary hover:bg-accent"
                : "text-muted-foreground"
            )}
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}