'use client'

import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAIAssistant } from '@/contexts/AIAssistantContext'

export function FloatingAITrigger() {
  const { 
    openAssistant, 
    hasNewInsights, 
    isOpen,
    isMobile 
  } = useAIAssistant()
  
  // Don't show if already open
  if (isOpen) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          delay: 0.5 // Slight delay to not interfere with page load
        }}
        className={cn(
          "fixed z-[49999]",
          isMobile ? "bottom-20 right-4" : "bottom-6 right-6"
        )}
      >
        {/* Main FAB Button */}
        <motion.button
          onClick={() => openAssistant('chat')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative group",
            "w-14 h-14 rounded-full shadow-lg",
            "bg-blue-600 hover:bg-blue-700",
            "text-white",
            "flex items-center justify-center",
            "transition-all duration-200",
            "ring-4 ring-blue-600/20 hover:ring-blue-600/40",
            hasNewInsights && "animate-pulse"
          )}
        >
          <Sparkles className="w-6 h-6" />
          
          {/* New insights indicator */}
          {hasNewInsights && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
            />
          )}
          
          {/* Tooltip */}
          <div className={cn(
            "absolute bottom-full mb-3 right-0",
            "px-3 py-2 bg-gray-900 text-white text-sm rounded-lg",
            "opacity-0 group-hover:opacity-100",
            "transition-opacity duration-200",
            "pointer-events-none whitespace-nowrap",
            "transform translate-x-1/2"
          )}>
            AI Assistant
            <div className="absolute top-full right-1/2 transform translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </motion.button>
        
        {/* Floating animations */}
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-600"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}