/**
 * Prueba simple del endpoint de análisis
 * Simula una consulta real para verificar la integración
 */

const API_URL = 'http://localhost:3000/api/analyze';

// Datos de prueba para Ciudad de México
const testQuery = {
  query: "Toyota Camry 2022 barato cerca de mi",
  location: {
    lat: 19.4326,
    lng: -99.1332,
    address: "Ciudad de México, CDMX",
    city: "Ciudad de México",
    state: "CDMX"
  },
  options: {
    radius: 5000,
    maxResults: 5,
    includeDeepAnalysis: true
  }
};

console.log('🧪 Iniciando prueba del endpoint...');
console.log('📍 Query de prueba:', testQuery.query);
console.log('📍 Ubicación:', testQuery.location);

async function testEndpoint() {
  try {
    console.log('🚀 Enviando request al endpoint...');
    const startTime = Date.now();
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testQuery)
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`⏱️  Tiempo de respuesta: ${executionTime}ms`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error en el endpoint:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ Respuesta exitosa recibida');
    console.log('📊 Metadatos:', data.searchMetadata);
    console.log('🔍 Query parseada:', {
      parseMethod: data.query.parseMethod,
      marca: data.query.marca,
      modelo: data.query.modelo,
      año: data.query.año,
      precio: data.query.precio,
      financiamiento: data.query.financiamiento
    });
    
    console.log(`🏢 Agencias encontradas: ${data.agencies.length}`);
    
    // Mostrar top 3 agencias
    if (data.agencies.length > 0) {
      console.log('\n🏆 Top 3 Agencias:');
      data.agencies.slice(0, 3).forEach((agency, index) => {
        console.log(`\n${index + 1}. ${agency.agency.name}`);
        console.log(`   📍 ${agency.agency.address}`);
        console.log(`   ⭐ ${agency.agency.rating}/5 (${agency.agency.totalReviews} reviews)`);
        console.log(`   🛡️  Trust Score: ${agency.trustAnalysis.trustScore}/100 (${agency.trustAnalysis.trustLevel})`);
        console.log(`   📝 Reviews analizadas: ${agency.reviewsCount}`);
        console.log(`   🚩 Red flags: ${agency.trustAnalysis.redFlags.length}`);
        console.log(`   ✅ Green flags: ${agency.trustAnalysis.greenFlags.length}`);
        console.log(`   🚗 Distancia: ${agency.distance}km`);
        
        if (agency.trustAnalysis.redFlags.length > 0) {
          console.log(`   ⚠️  Alertas: ${agency.trustAnalysis.redFlags.slice(0, 2).join(', ')}`);
        }
        
        if (agency.trustAnalysis.greenFlags.length > 0) {
          console.log(`   ✨ Fortalezas: ${agency.trustAnalysis.greenFlags.slice(0, 2).join(', ')}`);
        }
        
        if (agency.deepAnalysis) {
          console.log(`   🔍 Análisis profundo disponible`);
          if (agency.deepAnalysis.socialMedia?.facebook) {
            console.log(`   📱 Facebook: ${agency.deepAnalysis.socialMedia.facebook}`);
          }
          if (agency.deepAnalysis.inventoryUrl) {
            console.log(`   🚗 Inventario: ${agency.deepAnalysis.inventoryUrl}`);
          }
        }
      });
    }
    
    // Estadísticas generales
    console.log('\n📊 Estadísticas Generales:');
    const trustScores = data.agencies.map(a => a.trustAnalysis.trustScore);
    const avgTrustScore = trustScores.reduce((a, b) => a + b, 0) / trustScores.length;
    const totalReviews = data.agencies.reduce((sum, a) => sum + a.reviewsCount, 0);
    
    console.log(`   📈 Trust Score promedio: ${avgTrustScore.toFixed(1)}/100`);
    console.log(`   📝 Total reviews analizadas: ${totalReviews}`);
    console.log(`   🔍 Agencias con análisis profundo: ${data.agencies.filter(a => a.deepAnalysis).length}`);
    
    // Distribución de trust levels
    const trustLevels = {};
    data.agencies.forEach(agency => {
      const level = agency.trustAnalysis.trustLevel;
      trustLevels[level] = (trustLevels[level] || 0) + 1;
    });
    
    console.log('   📊 Distribución de confianza:');
    Object.entries(trustLevels).forEach(([level, count]) => {
      console.log(`      ${level}: ${count} agencias`);
    });
    
    console.log('\n🎉 Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Asegúrate de que el servidor Next.js esté ejecutándose (npm run dev)');
    }
  }
}

// Ejecutar prueba
testEndpoint();