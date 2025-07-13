/**
 * Script para debuggear el problema del historial
 */

const fetch = require('node-fetch');

async function testHistoryProblem() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🔍 Diagnosticando problema del historial...\n');
  
  // 1. Crear una búsqueda
  console.log('1. Creando búsqueda de prueba...');
  const saveResponse = await fetch(`${baseUrl}/api/search/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'Debug Location',
      query: 'Debug Query'
    })
  });
  
  const saveData = await saveResponse.json();
  console.log('   Respuesta:', saveData);
  
  // Extraer cookie de sesión
  const setCookieHeader = saveResponse.headers.get('set-cookie');
  console.log('   Set-Cookie:', setCookieHeader);
  
  let sessionCookie = '';
  if (setCookieHeader) {
    const match = setCookieHeader.match(/karmatic_search_session=([^;]+)/);
    if (match) {
      sessionCookie = `karmatic_search_session=${match[1]}`;
      console.log('   Cookie extraída:', sessionCookie);
    }
  }
  
  // 2. Probar historial SIN cookie
  console.log('\n2. Probando historial SIN cookie...');
  const historyResponse1 = await fetch(`${baseUrl}/api/search/history`);
  const historyData1 = await historyResponse1.json();
  console.log('   Resultado SIN cookie:', historyData1);
  
  // 3. Probar historial CON cookie
  console.log('\n3. Probando historial CON cookie...');
  const historyResponse2 = await fetch(`${baseUrl}/api/search/history`, {
    headers: { 'Cookie': sessionCookie }
  });
  const historyData2 = await historyResponse2.json();
  console.log('   Resultado CON cookie:', historyData2);
  
  // 4. Simular refresh del navegador (nueva petición sin cookie manual)
  console.log('\n4. Simulando refresh del navegador...');
  const historyResponse3 = await fetch(`${baseUrl}/api/search/history`, {
    credentials: 'include' // Esto simula el comportamiento del navegador
  });
  const historyData3 = await historyResponse3.json();
  console.log('   Resultado con credentials include:', historyData3);
  
  // 5. Verificar estado de la base de datos
  console.log('\n5. Estado de búsquedas en BD:');
  // Esta verificación la haremos manualmente
  
  console.log('\n✅ Diagnóstico completado');
}

testHistoryProblem().catch(console.error);