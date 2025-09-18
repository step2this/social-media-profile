#!/bin/bash

# Lambda Bootstrap Validation Script
# Ensures lambdas are properly deployed, configured, and accessible

set -e  # Exit on any error

# Configuration
API_BASE_URL="https://px21il00t5.execute-api.us-east-1.amazonaws.com/prod"
STACK_NAME="ProfileServiceStack"

echo "🚀 Lambda Bootstrap Validation Script"
echo "====================================="

# Function to find lambda by partial name
find_lambda() {
    local partial_name="$1"
    aws lambda list-functions --query "Functions[?contains(FunctionName, '${partial_name}')].FunctionName" --output text
}

# Function to get log group for lambda
get_log_group() {
    local function_name="$1"
    echo "/aws/lambda/${function_name}"
}

# Function to test API endpoint
test_api_endpoint() {
    local endpoint="$1"
    local method="${2:-GET}"
    local data="${3:-{}}"

    echo "Testing: ${method} ${API_BASE_URL}${endpoint}"

    if [[ "$method" == "POST" ]]; then
        curl -s -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
             -X POST "${API_BASE_URL}${endpoint}" \
             -H "Content-Type: application/json" \
             -d "${data}"
    else
        curl -s -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
             "${API_BASE_URL}${endpoint}"
    fi
    echo ""
}

# Function to check lambda configuration
check_lambda_config() {
    local function_name="$1"

    echo "📋 Lambda Configuration: ${function_name}"
    aws lambda get-function-configuration --function-name "${function_name}" \
        --query '{Handler: Handler, Runtime: Runtime, Environment: Environment.Variables, LastModified: LastModified}' \
        --output table
}

# Function to check recent logs
check_logs() {
    local function_name="$1"
    local log_group=$(get_log_group "$function_name")

    echo "📊 Recent Logs: ${log_group}"

    if aws logs describe-log-groups --log-group-name-prefix "${log_group}" --query 'logGroups[0]' > /dev/null 2>&1; then
        echo "Log group exists. Recent entries:"
        aws logs tail "${log_group}" --since 5m || echo "No recent logs found"
    else
        echo "❌ Log group does not exist yet - lambda may not have been invoked"
    fi
    echo ""
}

# Function to trigger lambda directly
trigger_lambda() {
    local function_name="$1"
    local test_payload="$2"

    echo "🎯 Direct Lambda Invocation: ${function_name}"

    # Create test event file
    cat > /tmp/test-event.json << EOF
${test_payload}
EOF

    # Invoke lambda
    aws lambda invoke \
        --function-name "${function_name}" \
        --payload file:///tmp/test-event.json \
        /tmp/lambda-response.json

    echo "Response:"
    cat /tmp/lambda-response.json | jq '.' 2>/dev/null || cat /tmp/lambda-response.json
    echo ""

    # Clean up
    rm -f /tmp/test-event.json /tmp/lambda-response.json
}

echo "🔍 Step 1: Finding Lambda Functions"
echo "===================================="

# Find GenerateTestData lambda
GENERATE_LAMBDA=$(find_lambda "GenerateTestData")
if [[ -n "$GENERATE_LAMBDA" ]]; then
    echo "✅ Found GenerateTestData Lambda: ${GENERATE_LAMBDA}"
else
    echo "❌ GenerateTestData Lambda not found!"
    exit 1
fi

echo ""

echo "🔧 Step 2: Lambda Configuration Check"
echo "====================================="
check_lambda_config "$GENERATE_LAMBDA"
echo ""

echo "🌐 Step 3: API Endpoint Tests"
echo "============================"

# Test the generate test data endpoint
test_api_endpoint "/admin/test-data?userCount=2&postsPerUser=1" "POST" "{}"

echo ""

echo "📝 Step 4: Log Analysis"
echo "======================"
check_logs "$GENERATE_LAMBDA"

echo "🚀 Step 5: Direct Lambda Test"
echo "============================="

# Create API Gateway-like test event
TEST_EVENT='{
  "httpMethod": "POST",
  "path": "/admin/test-data",
  "queryStringParameters": {
    "userCount": "2",
    "postsPerUser": "1"
  },
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{}"
}'

trigger_lambda "$GENERATE_LAMBDA" "$TEST_EVENT"

echo "✅ Bootstrap validation complete!"
echo ""
echo "🔧 Troubleshooting Commands:"
echo "=============================="
echo "1. Check logs: aws logs tail '/aws/lambda/${GENERATE_LAMBDA}' --since 10m"
echo "2. Test API: curl -X POST '${API_BASE_URL}/admin/test-data?userCount=2&postsPerUser=1' -H 'Content-Type: application/json' -d '{}'"
echo "3. Lambda config: aws lambda get-function-configuration --function-name '${GENERATE_LAMBDA}'"
echo "4. Deploy stack: npx cdk deploy ProfileServiceStack --require-approval never"