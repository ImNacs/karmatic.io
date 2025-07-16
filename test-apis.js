/**
 * Test individual de las APIs para debug
 */

// Usar fetch nativo de Node.js (disponible desde Node 18+)

// Configuración de APIs
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// Ubicación de prueba (Ciudad de México)
const testLocation = {
  lat: 19.4326,
  lng: -99.1332
};

console.log('🧪 Probando APIs individuales...\n');

// Test 1: Google Places API
async function testGooglePlaces() {
  console.log('📍 Test 1: Google Places API');
  
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${testLocation.lat},${testLocation.lng}&radius=5000&type=car_dealer&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      console.log(`✅ Google Places: ${data.results.length} agencias encontradas`);
      
      if (data.results.length > 0) {
        const firstAgency = data.results[0];
        console.log(`   📍 Primera agencia: ${firstAgency.name}`);
        console.log(`   🆔 Place ID: ${firstAgency.place_id}`);
        console.log(`   ⭐ Rating: ${firstAgency.rating}/5`);
        console.log(`   📝 Reviews: ${firstAgency.user_ratings_total}`);
        return firstAgency.place_id;
      }
    } else {
      console.log(`❌ Google Places error: ${data.status}`);
    }
  } catch (error) {
    console.log(`❌ Error en Google Places: ${error.message}`);
  }
  
  return null;
}

// Test 2: Apify Reviews (versión simplificada)
async function testApifyReviews(placeId) {
  console.log('\n📝 Test 2: Apify Reviews API');
  
  if (!placeId) {
    console.log('❌ No hay place ID para probar');
    return;
  }
  
  try {
    console.log(`🔍 Probando con place ID: ${placeId}`);
    
    // Configuración del actor con formato correcto
    const actorInput = {
      personalData: true,
      placeIds: [placeId],
      reviewsOrigin: 'google',
      reviewsSort: 'newest',
      reviewsStartDate: '1 year',
      language: 'es-419'
    };
    
    console.log('🚀 Iniciando scraping de reviews...');
    
    const response = await fetch('https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_TOKEN}`
      },
      body: JSON.stringify(actorInput)
    });
    
    if (!response.ok) {
      console.log(`❌ Error iniciando Apify: ${response.status} ${response.statusText}`);
      return;
    }
    
    const runData = await response.json();
    const runId = runData.data.id;
    
    console.log(`✅ Scraping iniciado, run ID: ${runId}`);
    console.log('⏳ Esperando resultados (máximo 30 segundos)...');
    
    // Polling simplificado
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${APIFY_API_TOKEN}`
        }
      });
      
      const statusData = await statusResponse.json();
      const status = statusData.data.status;
      
      console.log(`   📊 Status: ${status}`);
      
      if (status === 'SUCCEEDED') {
        console.log('✅ Scraping completado, obteniendo resultados...');
        
        const resultsResponse = await fetch(`https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/runs/${runId}/dataset/items`, {
          headers: {
            'Authorization': `Bearer ${APIFY_API_TOKEN}`
          }
        });
        
        const results = await resultsResponse.json();
        console.log(`✅ Apify Reviews: ${results.length} reviews obtenidas`);
        
        if (results.length > 0) {
          const firstReview = results[0];
          console.log(`   👤 Primer review: ${firstReview.reviewerName}`);
          console.log(`   ⭐ Rating: ${firstReview.stars}/5`);
          console.log(`   📝 Texto: ${firstReview.text.substring(0, 100)}...`);
        }
        
        return results.length;
      } else if (status === 'FAILED') {
        console.log('❌ Scraping falló');
        break;
      }
    }
    
    console.log('⚠️ Scraping tardó demasiado (timeout)');
    
  } catch (error) {
    console.log(`❌ Error en Apify: ${error.message}`);
  }
}

// Test 3: Perplexity API
async function testPerplexity() {
  console.log('\n🧠 Test 3: Perplexity API');
  
  try {
    const prompt = 'Analiza esta consulta automotriz: "Toyota Camry 2022 barato". Responde con un JSON con marca, modelo, año y precio.';
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200
      })
    });
    
    if (!response.ok) {
      console.log(`❌ Error en Perplexity: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    console.log(`✅ Perplexity: Respuesta obtenida (${data.usage.total_tokens} tokens)`);
    console.log(`   📝 Respuesta: ${content.substring(0, 200)}...`);
    
  } catch (error) {
    console.log(`❌ Error en Perplexity: ${error.message}`);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🔧 Configuración:');
  console.log(`   🗝️  Google Places API: ${GOOGLE_PLACES_API_KEY ? 'Configurada' : 'No configurada'}`);
  console.log(`   🗝️  Apify API: ${APIFY_API_TOKEN ? 'Configurada' : 'No configurada'}`);
  console.log(`   🗝️  Perplexity API: ${PERPLEXITY_API_KEY ? 'Configurada' : 'No configurada'}`);
  console.log('');
  
  const placeId = await testGooglePlaces();
  await testApifyReviews(placeId);
  await testPerplexity();
  
  console.log('\n🎯 Pruebas completadas');
}

runAllTests().catch(console.error);