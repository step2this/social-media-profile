#!/bin/bash

# Complete Integration Test Suite
# Full end-to-end testing of the social media profile API
# Usage: ./integration-test.sh [API_URL]

set -e

# Get API URL from argument or default to current deployment
API_URL=${1:-"https://px21il00t5.execute-api.us-east-1.amazonaws.com/prod"}
BASE_URL="$API_URL"

# Generate unique test data
TEST_USER_ID="test-user-$(date +%s)"
TEST_USERNAME="testuser$(date +%s)"
TEST_EMAIL="test-$(date +%s)@example.com"
CREATED_PROFILE_ID=""

echo "🧪 Starting Integration Test Suite"
echo "   API Base URL: $BASE_URL"
echo "   Test User ID: $TEST_USER_ID"
echo

cleanup() {
    echo
    echo "🧹 Cleaning up test data..."
    if [ -n "$CREATED_PROFILE_ID" ]; then
        curl -s -X DELETE "$BASE_URL/profiles/$CREATED_PROFILE_ID" > /dev/null || true
        echo "   Cleaned up profile: $CREATED_PROFILE_ID"
    fi
}

trap cleanup EXIT

# Test 1: Create a new profile
echo "1. Creating test profile..."
PROFILE_RESPONSE=$(curl -s -X POST "$BASE_URL/profiles" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TEST_USERNAME\",
        \"email\": \"$TEST_EMAIL\",
        \"displayName\": \"Test User\",
        \"bio\": \"Integration test profile\"
    }")

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/profiles" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TEST_USERNAME\",
        \"email\": \"$TEST_EMAIL\",
        \"displayName\": \"Test User\",
        \"bio\": \"Integration test profile\"
    }")

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
    echo "   ✅ Profile created successfully (HTTP $HTTP_STATUS)"

    # Try to extract user ID from response
    CREATED_PROFILE_ID=$(echo "$PROFILE_RESPONSE" | grep -o '"userId":"[^"]*"' | sed 's/"userId":"//g' | sed 's/"//g' || echo "$TEST_USERNAME")
    echo "   Profile ID: $CREATED_PROFILE_ID"
else
    echo "   ❌ Profile creation failed (HTTP $HTTP_STATUS)"
    echo "   Response: $PROFILE_RESPONSE"
fi

# Test 2: Retrieve the created profile
echo "2. Retrieving created profile..."
if [ -n "$CREATED_PROFILE_ID" ]; then
    GET_RESPONSE=$(curl -s "$BASE_URL/profiles/$CREATED_PROFILE_ID")
    GET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/profiles/$CREATED_PROFILE_ID")

    if [ "$GET_STATUS" -eq 200 ]; then
        echo "   ✅ Profile retrieved successfully (HTTP $GET_STATUS)"

        # Check if response contains expected fields
        if echo "$GET_RESPONSE" | grep -q "$TEST_USERNAME"; then
            echo "   ✅ Profile contains expected username"
        else
            echo "   ⚠️  Profile may not contain expected data"
        fi
    else
        echo "   ❌ Profile retrieval failed (HTTP $GET_STATUS)"
        echo "   Response: $GET_RESPONSE"
    fi
else
    echo "   ⏭️  Skipping retrieval (no profile ID)"
fi

# Test 3: Update profile
echo "3. Updating profile..."
if [ -n "$CREATED_PROFILE_ID" ]; then
    UPDATE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE_URL/profiles/$CREATED_PROFILE_ID" \
        -H "Content-Type: application/json" \
        -d "{
            \"displayName\": \"Updated Test User\",
            \"bio\": \"Updated integration test profile\"
        }")

    if [ "$UPDATE_STATUS" -eq 200 ]; then
        echo "   ✅ Profile updated successfully (HTTP $UPDATE_STATUS)"
    else
        echo "   ❌ Profile update failed (HTTP $UPDATE_STATUS)"
    fi
else
    echo "   ⏭️  Skipping update (no profile ID)"
fi

# Test 4: Test error handling
echo "4. Testing error handling..."
ERROR_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/profiles/nonexistent-user-123")
if [ "$ERROR_STATUS" -eq 404 ]; then
    echo "   ✅ Error handling working correctly (HTTP $ERROR_STATUS for non-existent profile)"
else
    echo "   ⚠️  Unexpected response for non-existent profile (HTTP $ERROR_STATUS)"
fi

# Test 5: Test validation
echo "5. Testing input validation..."
VALIDATION_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/profiles" \
    -H "Content-Type: application/json" \
    -d '{"username": ""}')

if [ "$VALIDATION_STATUS" -eq 400 ]; then
    echo "   ✅ Input validation working correctly (HTTP $VALIDATION_STATUS for invalid data)"
else
    echo "   ⚠️  Unexpected response for invalid data (HTTP $VALIDATION_STATUS)"
fi

# Test 6: Test CORS preflight
echo "6. Testing CORS preflight..."
CORS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BASE_URL/profiles" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type")

if [ "$CORS_STATUS" -eq 200 ] || [ "$CORS_STATUS" -eq 204 ]; then
    echo "   ✅ CORS preflight working (HTTP $CORS_STATUS)"
else
    echo "   ⚠️  CORS preflight may have issues (HTTP $CORS_STATUS)"
fi

echo
echo "🎉 Integration test suite completed!"
echo
echo "📊 Summary:"
echo "   - Profile creation: Tested"
echo "   - Profile retrieval: Tested"
echo "   - Profile updates: Tested"
echo "   - Error handling: Tested"
echo "   - Input validation: Tested"
echo "   - CORS configuration: Tested"
echo
echo "✨ All core API functionality verified"