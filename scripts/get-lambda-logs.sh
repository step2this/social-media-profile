#!/bin/bash

# Lightweight solution for log group confusion
# Usage: ./scripts/get-lambda-logs.sh <function-name-pattern> [--tail]

set -e

FUNCTION_PATTERN="$1"
TAIL_MODE="$2"

if [ -z "$FUNCTION_PATTERN" ]; then
    echo "Usage: $0 <function-name-pattern> [--tail]"
    echo "Examples:"
    echo "  $0 CreateProfile"
    echo "  $0 CreateProfile --tail"
    exit 1
fi

# Find function name containing the pattern
FUNCTION_NAME=$(aws lambda list-functions \
    --query "Functions[?contains(FunctionName, '$FUNCTION_PATTERN')].FunctionName" \
    --output text | head -1)

if [ -z "$FUNCTION_NAME" ]; then
    echo "❌ No Lambda function found matching pattern: $FUNCTION_PATTERN"
    echo "Available functions:"
    aws lambda list-functions --query 'Functions[*].FunctionName' --output text | tr '\t' '\n' | grep -i profile
    exit 1
fi

echo "🎯 Found function: $FUNCTION_NAME"

# Get the actual log group name from function configuration
LOG_GROUP=$(aws lambda get-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --query 'LoggingConfig.LogGroup' \
    --output text 2>/dev/null || echo "")

# Fallback to default log group naming if LoggingConfig not found
if [ "$LOG_GROUP" = "" ] || [ "$LOG_GROUP" = "None" ]; then
    LOG_GROUP="/aws/lambda/$FUNCTION_NAME"
fi

echo "📋 Using log group: $LOG_GROUP"

# Check if log group exists
if ! aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --query 'logGroups[0].logGroupName' --output text >/dev/null 2>&1; then
    echo "❌ Log group does not exist: $LOG_GROUP"
    echo "Available log groups matching function name:"
    aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/" \
        --query "logGroups[?contains(logGroupName, '$FUNCTION_PATTERN')].logGroupName" --output table
    exit 1
fi

# Tail or show recent logs
if [ "$TAIL_MODE" = "--tail" ]; then
    echo "📡 Tailing logs for $FUNCTION_NAME..."
    aws logs tail "$LOG_GROUP" --since 10m --follow
else
    echo "📜 Recent logs for $FUNCTION_NAME (last 2 hours):"
    aws logs tail "$LOG_GROUP" --since 2h --format short
fi