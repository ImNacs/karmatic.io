#!/usr/bin/env node

/**
 * Script para probar la integración de Mastra con el chat
 * Uso: node scripts/test-mastra-chat.js
 */

const testMessages = [
  { role: 'user', content: 'Hola, ¿cómo estás?' }
];

async function testEndpoint(url, name) {
  console.log(`\n🧪 Probando ${name}...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: testMessages }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Error (${response.status}):`, error);
      return;
    }

    // Verificar que la respuesta sea streaming
    const contentType = response.headers.get('content-type');
    console.log(`📝 Content-Type: ${contentType}`);

    if (response.body) {
      console.log('✅ Respuesta streaming detectada');
      
      // Leer algunos chunks para verificar el formato
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let chunks = 0;
      
      while (chunks < 3) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        console.log(`📦 Chunk ${chunks + 1}:`, chunk.slice(0, 100) + '...');
        chunks++;
      }
      
      reader.releaseLock();
    } else {
      console.log('❌ No se detectó respuesta streaming');
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de integración Mastra-Chat\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Probar endpoint principal con Mastra
  await testEndpoint(`${baseUrl}/api/ai/chat`, 'Endpoint Mastra (/api/ai/chat)');
  
  // Probar endpoint alternativo con AI SDK
  await testEndpoint(`${baseUrl}/api/ai/chat-sdk`, 'Endpoint AI SDK (/api/ai/chat-sdk)');
  
  console.log('\n✨ Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}