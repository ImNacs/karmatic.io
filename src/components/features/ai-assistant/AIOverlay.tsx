'use client'

import React from 'react'
import { AIAssistantProvider } from '@/contexts/AIAssistantContext'
import { FloatingAITrigger } from './FloatingAITrigger'
import { AIAssistantPortal } from './AIAssistantPortal'

export function AIOverlay() {
  return (
    <AIAssistantProvider>
      <FloatingAITrigger />
      <AIAssistantPortal />
    </AIAssistantProvider>
  )
}