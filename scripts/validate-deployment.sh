#!/bin/bash

# Deployment Validation Script
# Simple curl-based tests to validate API deployment
# Usage: ./validate-deployment.sh [API_URL]

set -e

# Get API URL from argument or default to current deployment
API_URL=${1:-"https://px21il00t5.execute-api.us-east-1.amazonaws.com/prod"}
BASE_URL="$API_URL"

echo "🔍 Validating deployment at: $BASE_URL"
echo

# Test 1: Health Check / Root endpoint
echo "1. Testing root endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 404 ] || [ "$HTTP_STATUS" -eq 403 ]; then
    echo "   ✅ Root endpoint responding (HTTP $HTTP_STATUS)"
else
    echo "   ❌ Root endpoint failed (HTTP $HTTP_STATUS)"
    exit 1
fi

# Test 2: Create Profile endpoint exists
echo "2. Testing profile creation endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/profiles" \
    -H "Content-Type: application/json" \
    -d '{}')
if [ "$HTTP_STATUS" -eq 400 ] || [ "$HTTP_STATUS" -eq 200 ]; then
    echo "   ✅ Profile creation endpoint responding (HTTP $HTTP_STATUS)"
else
    echo "   ❌ Profile creation endpoint failed (HTTP $HTTP_STATUS)"
    exit 1
fi

# Test 3: Get Profile endpoint (expect 404 for non-existent profile)
echo "3. Testing profile retrieval endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/profiles/test-user-123")
if [ "$HTTP_STATUS" -eq 404 ] || [ "$HTTP_STATUS" -eq 200 ]; then
    echo "   ✅ Profile retrieval endpoint responding (HTTP $HTTP_STATUS)"
else
    echo "   ❌ Profile retrieval endpoint failed (HTTP $HTTP_STATUS)"
    exit 1
fi

# Test 4: CORS headers
echo "4. Testing CORS configuration..."
CORS_HEADER=$(curl -s -I -X OPTIONS "$BASE_URL/profiles" | grep -i "access-control-allow-origin" || echo "")
if [ -n "$CORS_HEADER" ]; then
    echo "   ✅ CORS headers present"
else
    echo "   ⚠️  CORS headers not found (may be normal)"
fi

# Test 5: API Gateway is serving JSON responses
echo "5. Testing JSON response format..."
CONTENT_TYPE=$(curl -s -I "$BASE_URL/profiles/test" | grep -i "content-type" | grep -i "json" || echo "")
if [ -n "$CONTENT_TYPE" ]; then
    echo "   ✅ JSON content-type detected"
else
    echo "   ⚠️  JSON content-type not detected"
fi

echo
echo "🎉 Deployment validation completed successfully!"
echo "   API Base URL: $BASE_URL"
echo "   All core endpoints are responding appropriately"
echo
echo "💡 To run a full integration test:"
echo "   1. Create a test profile"
echo "   2. Retrieve the profile"
echo "   3. Update the profile"
echo "   4. Clean up test data"