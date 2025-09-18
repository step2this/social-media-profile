// Simple direct test using fetch to validate our lambda response
const testApiResponse = async (): Promise<void> => {
  try {
    console.log('Testing API with hard error validation...');

    const response = await fetch('https://px21il00t5.execute-api.us-east-1.amazonaws.com/prod/admin/test-data?userCount=2&postsPerUser=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Success - Response data:', data);

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response: expected object');
    }

    console.log('✅ Response structure is valid');
  } catch (error) {
    console.error('❌ Hard API Error:', error);
    throw error; // Re-throw to crash and force debugging
  }
};

// Run the test
testApiResponse()
  .then(() => console.log('✅ Test completed successfully'))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });