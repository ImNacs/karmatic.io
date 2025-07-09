// Test script for search limiting functionality
const baseUrl = 'http://localhost:3000';

async function testSearchLimit() {
  console.log('🧪 Testing Search Limit Functionality\n');
  
  // Step 1: Check initial limit
  console.log('1️⃣ Checking initial search limit...');
  const checkResponse1 = await fetch(`${baseUrl}/api/search/check-limit`);
  const limit1 = await checkResponse1.json();
  const sessionCookie = checkResponse1.headers.get('set-cookie');
  console.log('Initial limit:', limit1);
  console.log('Session cookie:', sessionCookie);
  
  // Extract session ID from response
  const sessionId = limit1.sessionId;
  console.log('Session ID:', sessionId);
  
  // Step 2: Perform a search
  console.log('\n2️⃣ Performing first search...');
  const searchResponse = await fetch(`${baseUrl}/api/search/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `search_session=${sessionId}`
    },
    body: JSON.stringify({
      location: 'Mexico City',
      query: 'KIA Forte 2018'
    })
  });
  const searchResult = await searchResponse.json();
  console.log('Search result:', searchResult);
  
  // Step 3: Check limit again
  console.log('\n3️⃣ Checking search limit after search...');
  const checkResponse2 = await fetch(`${baseUrl}/api/search/check-limit`, {
    headers: {
      'Cookie': `search_session=${sessionId}`
    }
  });
  const limit2 = await checkResponse2.json();
  console.log('Limit after search:', limit2);
  
  // Step 4: Try another search (should fail)
  console.log('\n4️⃣ Attempting second search (should be blocked)...');
  const searchResponse2 = await fetch(`${baseUrl}/api/search/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `search_session=${sessionId}`
    },
    body: JSON.stringify({
      location: 'Guadalajara',
      query: 'Honda Civic'
    })
  });
  
  if (searchResponse2.ok) {
    const result2 = await searchResponse2.json();
    console.log('❌ Second search succeeded (should have failed):', result2);
  } else {
    console.log('✅ Second search blocked as expected!');
    const error = await searchResponse2.text();
    console.log('Error message:', error);
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`- Initial searches remaining: ${limit1.remaining}`);
  console.log(`- Searches remaining after first search: ${limit2.remaining}`);
  console.log(`- Can search after limit: ${limit2.canSearch}`);
  console.log(`- Session tracking: ${limit1.sessionId === limit2.sessionId ? '✅ Working' : '❌ Not working'}`);
}

// Run the test
testSearchLimit().catch(console.error);