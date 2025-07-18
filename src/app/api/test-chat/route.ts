/**
 * Endpoint de prueba para debugging del chat
 */

import { NextRequest } from 'next/server'
import { mastra } from '@/mastra'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test Chat API')
    
    // 1. Verificar Mastra
    console.log('1. Mastra instance:', !!mastra)
    
    // 2. Obtener agente
    const agent = mastra.getAgent('chat')
    console.log('2. Chat agent found:', !!agent)
    
    if (!agent) {
      return Response.json({ 
        error: 'Chat agent not found',
        availableAgents: Object.keys(mastra.agents || {})
      }, { status: 404 })
    }
    
    // 3. Verificar modelo
    console.log('3. Agent model:', agent.model)
    console.log('4. Agent instructions length:', agent.instructions?.length || 0)
    
    // 4. Probar mensaje simple
    const testMessages = [{
      role: 'user' as const,
      content: 'Hola, ¿cómo estás?'
    }]
    
    console.log('5. Testing with messages:', testMessages)
    
    try {
      // Intentar generar respuesta simple
      const response = await agent.generate(testMessages)
      console.log('6. Generate response:', response)
      
      return Response.json({ 
        success: true,
        response: response,
        model: agent.model?.toString(),
        debug: {
          hasAgent: true,
          hasModel: !!agent.model,
          hasGenerate: typeof agent.generate === 'function',
          hasStream: typeof agent.stream === 'function'
        }
      })
    } catch (genError: any) {
      console.error('7. Generate error:', genError)
      return Response.json({ 
        error: 'Generate failed',
        details: genError.message,
        stack: genError.stack
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('Test Chat error:', error)
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}