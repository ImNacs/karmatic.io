/**
 * Script manual para probar la integración de Mastra
 * 
 * Uso:
 * 1. Configura al menos una API key en .env.local
 * 2. Ejecuta: pnpm tsx src/mastra/test-manual.ts
 */

import { mastra } from './index'
import { prepareContext } from './agents/karmatic-assistant'
import { getConfiguredProviders } from './config/llm-providers'

async function testMastraIntegration() {
  console.log('🚀 Probando integración de Mastra...\n')
  
  // 1. Verificar proveedores configurados
  const providers = getConfiguredProviders()
  console.log('✅ Proveedores configurados:', providers)
  
  if (providers.length === 0) {
    console.error('❌ No hay proveedores configurados. Configura al menos una API key.')
    process.exit(1)
  }
  
  // 2. Obtener el agente
  try {
    const agent = mastra.getAgent('karmaticAssistant')
    console.log('✅ Agente cargado:', agent?.name)
  } catch (error) {
    console.error('❌ Error al cargar agente:', error)
    process.exit(1)
  }
  
  // 3. Probar generación simple
  console.log('\n📝 Probando generación simple...')
  try {
    const agent = mastra.getAgent('karmaticAssistant')
    const response = await agent!.generate('Hola, ¿puedes ayudarme a encontrar un concesionario Honda en San Francisco?')
    console.log('✅ Respuesta:', response.text)
  } catch (error) {
    console.error('❌ Error en generación:', error)
  }
  
  // 4. Probar con contexto
  console.log('\n📝 Probando con contexto de búsqueda...')
  try {
    const context = prepareContext({
      location: 'San Francisco, CA',
      query: 'Honda dealers',
      results: [
        {
          name: 'Honda of San Francisco',
          rating: 4.5,
          address: '123 Market St, San Francisco, CA'
        }
      ]
    })
    
    const agent = mastra.getAgent('karmaticAssistant')
    const response = await agent!.generate(
      '¿Cuál es el mejor concesionario Honda aquí?' + context
    )
    console.log('✅ Respuesta con contexto:', response.text)
  } catch (error) {
    console.error('❌ Error con contexto:', error)
  }
  
  // 5. Probar streaming
  console.log('\n📝 Probando streaming...')
  try {
    const agent = mastra.getAgent('karmaticAssistant')
    const stream = await agent!.stream([
      { role: 'user', content: 'Dame 3 consejos para comprar un auto usado' }
    ])
    
    process.stdout.write('✅ Streaming: ')
    for await (const chunk of stream) {
      if (chunk.type === 'text-delta') {
        process.stdout.write(chunk.textDelta)
      }
    }
    console.log('\n')
  } catch (error) {
    console.error('❌ Error en streaming:', error)
  }
  
  console.log('✨ Pruebas completadas!')
}

// Ejecutar pruebas
testMastraIntegration().catch(console.error)