"use client"

import { useEffect, useRef, useState } from "react"
import { useAIAssistant } from "@/contexts/AIAssistantContext"
import { FiSend, FiMessageSquare } from "react-icons/fi"
import { motion, AnimatePresence } from "motion/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function ChatPanelMobile() {
  const { messages, sendMessage, isTyping } = useAIAssistant()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [showQuickActions, setShowQuickActions] = useState(true)

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
      setShowQuickActions(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickActions = [
    "¿Cuál agencia tiene mejor calificación?",
    "Compara precios entre agencias",
    "¿Qué agencia está más cerca?",
    "Muéstrame las especialidades"
  ]

  const handleQuickAction = (action: string) => {
    setInput(action)
    setShowQuickActions(false)
    setTimeout(() => {
      handleSend()
    }, 100)
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
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FiMessageSquare className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-1">Pregunta algo...</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Información sobre las agencias encontradas
            </p>
            
            {showQuickActions && (
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleQuickAction(action)}
                    className="w-full text-left p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors text-sm haptic-press"
                  >
                    {action}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex items-start gap-3",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback
                  className={cn(
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  )}
                >
                  {message.role === "user" ? "U" : "AI"}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  "flex flex-col gap-1 max-w-[80%]",
                  message.role === "user" && "items-end"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 mobile-shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <span className="text-xs text-muted-foreground px-1">
                  {formatTime(new Date(message.timestamp))}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                AI
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-2xl px-4 py-2">
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
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-background p-4 safe-area-bottom">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregunta algo..."
            className={cn(
              "w-full resize-none rounded-full bg-muted px-4 py-3 pr-12",
              "focus:outline-none focus:ring-1 focus:ring-border",
              "placeholder:text-muted-foreground text-sm",
              "min-h-[48px] max-h-[120px]"
            )}
            rows={1}
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