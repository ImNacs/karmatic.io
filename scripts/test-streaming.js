#!/usr/bin/env node

/**
 * Test directo del streaming del endpoint de chat
 */

const https = require('https');

async function testStreaming() {
  console.log('🧪 Probando streaming del endpoint de chat...\n');

  const data = JSON.stringify({
    messages: [
      { role: 'user', content: 'Di "hola" y nada más' }
    ]
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/ai/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = require('http').request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    console.log(`📝 Headers:`, res.headers);
    console.log('\n📦 Chunks recibidos:\n');

    let fullResponse = '';
    let chunkCount = 0;

    res.on('data', (chunk) => {
      chunkCount++;
      const chunkStr = chunk.toString();
      fullResponse += chunkStr;
      
      console.log(`Chunk ${chunkCount} (${chunk.length} bytes):`);
      console.log('---');
      console.log(chunkStr);
      console.log('---\n');
    });

    res.on('end', () => {
      console.log('\n✅ Respuesta completa recibida');
      console.log(`📊 Total chunks: ${chunkCount}`);
      console.log(`📏 Tamaño total: ${fullResponse.length} bytes`);
      
      if (fullResponse.length === 0) {
        console.log('\n❌ ERROR: La respuesta está vacía!');
      } else {
        console.log('\n📄 Respuesta completa:');
        console.log(fullResponse);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Error: ${e.message}`);
  });

  req.write(data);
  req.end();
}

// Test alternativo con fetch
async function testWithFetch() {
  console.log('\n\n🧪 Probando con fetch API...\n');

  try {
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Di "hola" y nada más' }
        ]
      }),
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Content-Type: ${response.headers.get('content-type')}`);
    
    if (!response.body) {
      console.log('❌ No hay body en la respuesta');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    console.log('\n📦 Leyendo stream...\n');

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('\n✅ Stream completado');
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      console.log(`Chunk recibido (${value.length} bytes):`);
      console.log(chunk);
    }

    console.log('\n📄 Texto completo:');
    console.log(fullText);

  } catch (error) {
    console.error('❌ Error con fetch:', error);
  }
}

// Ejecutar ambos tests
async function main() {
  await testStreaming();
  await testWithFetch();
}

if (require.main === module) {
  main();
}