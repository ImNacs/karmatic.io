/**
 * Script de prueba para verificar el funcionamiento del chat
 */

async function testChatAPI() {
  try {
    console.log('🧪 Probando API de chat...\n');
    
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchId: 'MEGoglg-0rJf0KsxkMSqe',
        messages: [{
          role: 'user',
          content: '¿Cuál agencia de Mazda recomiendas?'
        }]
      })
    });
    
    console.log('📡 Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Error response:', text);
      return;
    }
    
    // Leer el stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    console.log('\n📨 Respuesta del chat:\n');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      process.stdout.write(chunk);
    }
    
    console.log('\n\n✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

testChatAPI();