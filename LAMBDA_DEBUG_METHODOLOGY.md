# Lambda Debugging Methodology

## Systematic approach to debugging Lambda functions without guess-and-check or slow CDK deployments

### Phase 1: Pre-flight Analysis (Infrastructure Health Check)

**Goal**: Verify infrastructure state and identify obvious issues before testing

#### 1.1 Verify AWS CloudWatch Logs Accessibility
```bash
# List all Lambda log groups
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda" --query 'logGroups[*].[logGroupName,creationTime,retentionInDays]' --output table

# Check specific function log group (use LoggingConfig.LogGroup from function config)
aws lambda get-function-configuration --function-name FUNCTION_NAME --query 'LoggingConfig.LogGroup'

# Use our lightweight log script (automatically finds correct log group)
./scripts/get-lambda-logs.sh CreateProfile        # Recent logs
./scripts/get-lambda-logs.sh CreateProfile --tail # Tail logs
```

#### 1.2 Check Deployed Resources Status
```bash
# List all Lambda functions and their health
aws lambda list-functions --query 'Functions[*].[FunctionName,Runtime,LastModified,State]' --output table

# Check specific function configuration
aws lambda get-function-configuration --function-name FUNCTION_NAME

# Verify DynamoDB tables exist
aws dynamodb list-tables --query 'TableNames'
```

#### 1.3 Verify Lambda Dependencies (CRITICAL)
```bash
# Check all Lambda function dependencies before anything else
./scripts/verify-lambda-deps.sh

# Install missing dependencies for specific function
cd lambda/profile-esm && npm install
```

#### 1.4 Analyze Lambda Function Configuration
- Check environment variables (TABLE_NAME, EVENT_BUS_NAME, etc.)
- Verify IAM role permissions
- Check runtime version and handler configuration
- Review timeout and memory settings

### Phase 2: Methodical Testing Strategy

**Goal**: Test incrementally with real-time monitoring to isolate failure points

#### 2.1 Setup Real-time Log Monitoring
```bash
# Tail logs in one terminal while testing in another
aws logs tail "LOG_GROUP_NAME" --since 10m --follow

# For specific function, use actual log group name from function config
aws logs tail "ProfileServiceStack-ProfileFunctionsCreateProfileLogGroupC1E04102-kX5PNQ0zlng3" --since 10m --follow
```

#### 2.2 Test Lambda Functions in Isolation (Bypass API Gateway)
```bash
# Direct Lambda invocation with minimal payload
aws lambda invoke \
  --function-name FUNCTION_NAME \
  --payload '{"body":"{\"test\":true}"}' \
  --cli-binary-format raw-in-base64-out \
  response.json && cat response.json
```

#### 2.3 Test with Actual Frontend (Preferred) vs curl
**✅ Preferred: Use actual frontend** - Tests real user flow with Zod validation
- Frontend uses same schemas and API client as production
- Catches frontend-specific edge cases and validation issues
- Tests the complete integration pipeline

**⚠️ curl for quick verification only** - Manual JSON bypasses validation
```bash
# Only for quick API health checks
curl -X POST "https://API_URL/profiles" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","displayName":"Test"}'
```

**Remember**: curl can't guarantee data matches what frontend sends due to Zod schemas

#### 2.4 Correlate HTTP Errors with Lambda Logs
- Run curl command in one terminal
- Monitor CloudWatch logs in another terminal
- Match request timestamps with log entries
- Identify exact failure points (permissions, validation, database, etc.)

### Smart CDK Deployment Strategy

**The nuanced approach to deployments during debugging:**

1. **Prefer non-deployment debugging first** - Use logs, direct function testing, dependency verification
2. **Deploy when you've identified and fixed the actual issue** - Targeted deployments after systematic analysis
3. **Avoid random/exploratory deployments** - No guess-and-check anti-pattern
4. **Deploy for code/dependency changes** - Local fixes always require deployment to take effect

**Deployment Decision Tree:**
- Infrastructure issues (permissions, resources) → Debug without deployment first
- Code/dependency issues → Fix locally, then deploy targeted changes
- Configuration issues → Try environment variable changes via AWS console first
- Unknown issues → Complete Phase 1 analysis before any deployment

### Best Practices

1. **Use our debugging scripts first** - `./scripts/get-lambda-logs.sh` and `./scripts/verify-lambda-deps.sh`
2. **Use curl scripts for consistent testing** - saves time and ensures reproducible tests
3. **Monitor logs in real-time** - provides immediate feedback on failures
4. **Test functions directly first** - isolates Lambda issues from API Gateway issues
5. **Start with minimal payloads** - reduces variables when isolating problems
6. **One change at a time** - systematic approach prevents confusion
7. **Always check our MD docs** - CLAUDE.md, debugging methodology, and ESM best practices

### Common Issues to Check

1. **Missing or misconfigured environment variables**
2. **IAM permission errors** (check CloudWatch logs for AccessDenied)
3. **DynamoDB table not found or wrong region**
4. **Invalid JSON in request/response**
5. **Lambda timeout or memory issues**
6. **API Gateway configuration problems**
7. **CORS issues in browser testing**

### Emergency Commands

```bash
# Quick function health check
aws lambda list-functions --query 'Functions[?contains(FunctionName,`Profile`)].{Name:FunctionName,State:State,Status:LastUpdateStatus}'

# Find recent errors across all logs
aws logs filter-log-events --log-group-name "/aws/lambda/FUNCTION_NAME" --start-time $(date -d '1 hour ago' +%s)000 --filter-pattern "ERROR"

# Check API Gateway stages
aws apigateway get-stages --rest-api-id API_ID
```

This methodology ensures systematic debugging without wasting time on deployments or random changes.