import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'edge'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  searchId?: string
  context?: {
    location?: string
    query?: string
    results?: unknown[]
  }
}

export async function POST(request: NextRequest) {
  try {
    await auth() // Authentication check
    const body: ChatRequest = await request.json()
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }
    
    const lastMessage = body.messages[body.messages.length - 1]
    
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      )
    }
    
    // Simulate AI response based on context and message content
    const response = await generateAIResponse(lastMessage.content, body.context)
    
    return NextResponse.json({
      message: {
        role: 'assistant',
        content: response.content,
        metadata: response.metadata
      }
    })
    
  } catch (error) {
    console.error('AI Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateAIResponse(userMessage: string, context?: ChatRequest['context']) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  const message = userMessage.toLowerCase()
  
  // Context-aware responses
  if (context?.location) {
    if (message.includes('mejor') || message.includes('recomienda')) {
      return {
        content: `Basado en tu búsqueda en ${context.location}, te recomiendo considerar estos factores:\n\n🏆 **Honda San Jose** - Mejor calificación general (4.5/5)\n💰 **Toyota Sunnyvale** - Mejor relación calidad-precio\n⚡ **Honda San Jose** - Tiempo de atención más rápido (2.1 horas)\n\nTodos estos concesionarios tienen excelente inventario de vehículos certificados. ¿Te gustaría que analice algún modelo específico?`,
        metadata: {
          suggestedActions: [
            'Muéstrame Honda Civic disponibles',
            'Compara precios Toyota vs Honda',
            'Opciones de financiamiento'
          ]
        }
      }
    }
    
    if (message.includes('precio') || message.includes('costo') || message.includes('financ')) {
      return {
        content: `Para tu búsqueda en ${context.location}, he analizado las opciones de financiamiento:\n\n💸 **Rango de precios**: $18,500 - $65,000\n📊 **Precio promedio**: $32,500\n\n**Mejores opciones de financiamiento:**\n• Navy Federal Credit Union: 4.89% APR\n• Chase Auto Finance: 6.24% APR\n• Capital One Auto: 5.94% APR\n\n¿Quieres que calcule pagos específicos para algún vehículo?`,
        metadata: {
          suggestedActions: [
            'Calcular pago mensual',
            'Ver todos los prestamistas',
            'Requisitos de crédito'
          ]
        }
      }
    }
    
    if (message.includes('honda') || message.includes('toyota') || message.includes('ford')) {
      const brand = message.includes('honda') ? 'Honda' : 
                   message.includes('toyota') ? 'Toyota' : 'Ford'
      
      return {
        content: `Análisis de ${brand} en ${context.location}:\n\n🚗 **Inventario disponible**: ${Math.floor(Math.random() * 50) + 20} vehículos\n⭐ **Calificación promedio**: ${(Math.random() * 1.5 + 3.5).toFixed(1)}/5\n💰 **Rango de precios**: $${(Math.random() * 10000 + 20000).toLocaleString()} - $${(Math.random() * 20000 + 45000).toLocaleString()}\n\n**Modelos más populares:**\n${brand === 'Honda' ? '• Civic, Accord, CR-V' : 
  brand === 'Toyota' ? '• Camry, Corolla, RAV4' : 
  '• F-150, Escape, Explorer'}\n\n¿Te interesa algún modelo específico?`,
        metadata: {
          suggestedActions: [
            `Ver ${brand} Civic disponibles`,
            `Comparar ${brand} vs otras marcas`,
            'Opciones de garantía'
          ]
        }
      }
    }
  }
  
  // General responses
  if (message.includes('hola') || message.includes('ayuda')) {
    return {
      content: `¡Hola! Soy tu AI Assistant para ayudarte a encontrar el vehículo perfecto. Puedo ayudarte con:\n\n🔍 **Análisis de concesionarios** - Comparar calificaciones y precios\n💰 **Opciones de financiamiento** - Calcular pagos y encontrar las mejores tasas\n📊 **Insights del mercado** - Tendencias y recomendaciones personalizadas\n\n¿En qué te gustaría que te ayude hoy?`,
      metadata: {
        suggestedActions: [
          '¿Cuáles son los mejores concesionarios aquí?',
          'Muéstrame opciones de financiamiento',
          'Compara precios de Honda vs Toyota'
        ]
      }
    }
  }
  
  if (message.includes('gracias')) {
    return {
      content: `¡De nada! Me alegra poder ayudarte en tu búsqueda del vehículo perfecto. Si tienes más preguntas sobre concesionarios, precios o financiamiento, estaré aquí para asistirte.`,
      metadata: {}
    }
  }
  
  // Default intelligent response
  return {
    content: `Entiendo tu consulta. Como tu AI Assistant especializado en vehículos, puedo ayudarte con:\n\n• **Análisis de concesionarios** - Comparar opciones en tu área\n• **Cálculos de financiamiento** - Pagos mensuales y tasas\n• **Recomendaciones personalizadas** - Basadas en tu búsqueda\n\n¿Podrías ser más específico sobre lo que necesitas? Por ejemplo, ¿buscas un modelo particular o tienes un presupuesto en mente?`,
    metadata: {
      suggestedActions: [
        'Busco un Honda Civic',
        'Presupuesto de $25,000',
        'Mejores concesionarios cerca'
      ]
    }
  }
}