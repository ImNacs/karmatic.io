'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAIAssistant } from '@/contexts/AIAssistantContext'
import { AIAssistant } from './AIAssistant'

export function AIAssistantPortal() {
  const { isOpen, closeAssistant, isMobile } = useAIAssistant()
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
  
  
  useEffect(() => {
    // Create portal root if it doesn't exist
    let root = document.getElementById('ai-assistant-portal')
    if (!root) {
      root = document.createElement('div')
      root.id = 'ai-assistant-portal'
      root.style.position = 'fixed'
      root.style.top = '0'
      root.style.left = '0'
      root.style.width = '100%'
      root.style.height = '100%'
      root.style.pointerEvents = 'none'
      root.style.zIndex = '50000' // Much higher z-index to ensure visibility
      document.body.appendChild(root)
    }
    setPortalRoot(root)
    
    return () => {
      // Don't remove on unmount - let it persist for better UX
    }
  }, [])
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAssistant()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeAssistant])
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  if (!portalRoot) return null
  
  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[50000] pointer-events-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAssistant}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          />
          
          {/* AI Assistant Panel */}
          <motion.div
            initial={
              isMobile
                ? { y: '100%' }
                : { x: '100%' }
            }
            animate={
              isMobile
                ? { y: 0 }
                : { x: 0 }
            }
            exit={
              isMobile
                ? { y: '100%' }
                : { x: '100%' }
            }
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className={
              isMobile
                ? "absolute bottom-0 left-0 right-0 h-[80vh] bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl"
                : "absolute right-0 top-0 h-full w-[480px] bg-white dark:bg-gray-900 shadow-2xl"
            }
            style={{
              maxWidth: isMobile ? '100%' : '480px'
            }}
          >
            <AIAssistant />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalRoot
  )
}