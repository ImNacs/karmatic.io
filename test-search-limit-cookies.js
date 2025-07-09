// Test script with proper cookie handling
const baseUrl = 'http://localhost:3000';

async function testSearchLimitWithCookies() {
  console.log('🧪 Testing Search Limit with Proper Cookie Handling\n');
  
  // Use a consistent session ID for all requests
  let sessionId = null;
  let cookies = '';
  
  // Step 1: Check initial limit
  console.log('1️⃣ Checking initial search limit...');
  const checkResponse1 = await fetch(`${baseUrl}/api/search/check-limit`);
  const limit1 = await checkResponse1.json();
  
  // Extract cookie from response
  const setCookieHeader = checkResponse1.headers.get('set-cookie');
  if (setCookieHeader) {
    cookies = setCookieHeader.split(';')[0]; // Get just the cookie name=value part
    sessionId = limit1.sessionId;
    console.log('Got cookie:', cookies);
  }
  
  console.log('Initial limit:', limit1);
  console.log('Session ID:', sessionId);
  
  // Step 2: Perform a search WITH THE COOKIE
  console.log('\n2️⃣ Performing first search with cookie...');
  const searchResponse = await fetch(`${baseUrl}/api/search/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({
      location: 'Mexico City',
      query: 'KIA Forte 2018'
    })
  });
  
  const searchResult = await searchResponse.json();
  console.log('Search result:', searchResult);
  console.log('Search success:', searchResult.success);
  
  // Update cookie if new one was sent
  const newCookie = searchResponse.headers.get('set-cookie');
  if (newCookie) {
    cookies = newCookie.split(';')[0];
    console.log('Updated cookie:', cookies);
  }
  
  // Step 3: Check limit again WITH THE COOKIE
  console.log('\n3️⃣ Checking search limit after search...');
  const checkResponse2 = await fetch(`${baseUrl}/api/search/check-limit`, {
    headers: {
      'Cookie': cookies
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
      'Cookie': cookies
    },
    body: JSON.stringify({
      location: 'Guadalajara',
      query: 'Honda Civic'
    })
  });
  
  if (searchResponse2.ok) {
    const result2 = await searchResponse2.json();
    console.log('Second search result:', result2);
    if (result2.success) {
      console.log('❌ Second search succeeded (should have failed)');
    }
  } else {
    console.log('✅ Second search blocked as expected!');
    const error = await searchResponse2.text();
    console.log('Error:', error);
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`- Initial searches remaining: ${limit1.remaining}`);
  console.log(`- Searches remaining after first search: ${limit2.remaining}`);
  console.log(`- Can search after limit: ${limit2.canSearch}`);
  console.log(`- Session ID consistency: ${sessionId === limit2.sessionId ? '✅ Maintained' : '❌ Changed'}`);
  console.log(`- Search limit enforcement: ${searchResponse2.ok ? '❌ Not working' : '✅ Working'}`);
}

// Run the test
testSearchLimitWithCookies().catch(console.error);