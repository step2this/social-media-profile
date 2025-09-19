# ESM Lambda Best Practices

## Common ESM Gotchas We've Encountered

### 1. Dependency Resolution Issues
**Problem**: `Cannot find package 'uuid'` errors even when dependencies are declared in package.json
**Root Cause**: CDK bundling doesn't properly include node_modules in Lambda package

### 2. Log Group Confusion
**Problem**: CDK generates random log group suffixes making debugging difficult
**Root Cause**: CDK auto-generates names instead of using predictable patterns

### 3. Local vs Deployed Code Mismatch
**Problem**: Local dependency fixes don't affect deployed Lambda functions
**Root Cause**: Deployed packages use bundled code, not local development code

## Best Practices for ESM Lambdas

### Directory Structure
```
lambda/
├── function-name-esm/           # ESM function directory
│   ├── package.json            # Dependencies for this function only
│   ├── index.mjs               # Main handler (use .mjs extension)
│   ├── lib/                    # Function-specific utilities
│   └── node_modules/           # Must be present for CDK bundling
├── shared/                     # Shared utilities across functions
│   ├── index.mjs
│   └── utils.mjs
└── layers/                     # Shared dependencies as Lambda layers
```

### Package.json Requirements
```json
{
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.490.0",
    "uuid": "^9.0.1"
  }
}
```

### Import Patterns
```javascript
// ✅ Good: Use explicit .mjs extensions for local modules
import { helper } from './lib/helper.mjs';
import { utils } from '../shared/utils.mjs';

// ✅ Good: Use package names for npm dependencies
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// ❌ Bad: Missing file extensions for local modules
import { helper } from './lib/helper';

// ❌ Bad: Relative imports without proper path resolution
import { utils } from '../../shared/utils';
```

### CDK Lambda Function Configuration
```typescript
// ✅ Good: Proper ESM Lambda setup
new NodejsFunction(this, 'ProfileCreateFunction', {
  entry: 'lambda/profile-esm/create.mjs',
  handler: 'handler',
  runtime: Runtime.NODEJS_22_X,
  bundling: {
    target: 'es2022',
    format: OutputFormat.ESM,
    // Ensure dependencies are bundled
    nodeModules: ['uuid', '@aws-sdk/client-dynamodb'],
    minify: false, // Keep readable for debugging
  },
  environment: {
    NODE_OPTIONS: '--enable-source-maps'
  }
});
```

### Development Workflow
1. **Always install dependencies locally first**
   ```bash
   cd lambda/profile-esm && npm install
   ```

2. **Verify dependencies before deployment**
   ```bash
   ./scripts/verify-lambda-deps.sh
   ```

3. **Test locally when possible**
   ```bash
   node lambda/profile-esm/create.mjs
   ```

4. **Deploy with dependency changes**
   ```bash
   npx cdk deploy ProfileServiceStack
   ```

### Debugging ESM Issues

#### Module Resolution Errors
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'uuid'
```
**Solution**:
1. Check `./scripts/verify-lambda-deps.sh`
2. Install missing dependencies: `cd lambda/function-name && npm install`
3. Redeploy Lambda function

#### Import/Export Errors
```
SyntaxError: Named export 'handler' not found
```
**Solution**:
```javascript
// ✅ Correct ESM export
export const handler = async (event) => {
  // function logic
};

// ❌ Wrong: CommonJS style
module.exports.handler = async (event) => {
  // function logic
};
```

#### Path Resolution Issues
```
Error: Cannot resolve module './helper'
```
**Solution**: Always use explicit .mjs extensions for local imports
```javascript
// ✅ Correct
import { helper } from './helper.mjs';

// ❌ Wrong
import { helper } from './helper';
```

### Testing Strategy
1. **Unit tests**: Test individual functions with mocked dependencies
2. **Integration tests**: Test with real AWS services in dev environment
3. **Local validation**: Use scripts to verify dependencies before deployment
4. **Log monitoring**: Use `./scripts/get-lambda-logs.sh` for real-time debugging

### Dependency Management
1. **Keep function-specific dependencies separate**: Each function has its own package.json
2. **Use Lambda layers for shared dependencies**: Heavy dependencies like AWS SDK
3. **Pin dependency versions**: Avoid ^ and ~ in production
4. **Regular dependency audits**: `npm audit` in each function directory

### Common Anti-patterns
- ❌ Mixing CommonJS and ESM in the same project
- ❌ Forgetting .mjs extensions for local imports
- ❌ Not installing dependencies before CDK deployment
- ❌ Using complex bundling without testing
- ❌ Deploying without verifying log groups exist

### Emergency Fixes
```bash
# Quick dependency fix for specific function
cd lambda/profile-esm && npm install && cd ../.. && npx cdk deploy

# Check all functions at once
./scripts/verify-lambda-deps.sh

# Fix logs confusion
./scripts/get-lambda-logs.sh FunctionNamePattern
```

The key insight: **ESM Lambda development requires careful coordination between local development, CDK bundling, and AWS deployment**. Always verify the complete pipeline, not just local code.