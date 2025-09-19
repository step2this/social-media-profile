# Shared Schema Principles

This document establishes the foundational principles for maintaining **single sources of truth** for all data contracts across our client-server architecture. These principles ensure consistency, prevent schema drift, and maintain type safety throughout the entire stack.

## Core Principle: One Definition, Everywhere

> **There must be one and only one definition for all wire protocols, persistence schemas, interfaces, and APIs. These definitions must be shared between client and server.**

### What This Means

- ✅ **Single Source of Truth**: Every data structure has exactly one canonical definition
- ✅ **Shared Validation**: Client and server use identical validation rules
- ✅ **No Duplication**: Never define the same schema in multiple places
- ✅ **No Drift**: Schema changes automatically propagate to all consumers
- ✅ **Type Safety**: Full TypeScript support across the entire stack

### What This Prevents

- ❌ **Schema Drift**: Client and server getting out of sync
- ❌ **Validation Inconsistencies**: Different rules on client vs server
- ❌ **Runtime Errors**: Type mismatches causing production failures
- ❌ **Duplicate Maintenance**: Updating schemas in multiple places
- ❌ **Integration Issues**: API contracts changing without notice

## Implementation Architecture

### 1. Shared Schema Location

**Primary Schema File**: `/lambda/shared/schemas.mjs`
- Contains all domain schemas in plain JavaScript/ESM format
- Works in both Lambda (Node.js) and client (TypeScript) environments
- Includes validation functions for server-side use
- Provides response formatting helpers

**TypeScript Wrapper**: `/web-ui-vite/src/schemas/shared-schemas.ts`
- Imports concepts from shared schemas
- Provides Zod-based validation for compile-time and runtime safety
- Exports TypeScript types for full IDE support
- Handles client-specific preprocessing (e.g., empty string handling)

### 2. Domain Organization

Each domain (Profile, Posts, Likes, etc.) follows this pattern:

```javascript
// In /lambda/shared/schemas.mjs

// Request validation schema (what comes from client)
export const CreateDomainRequestSchema = { /* schema definition */ };

// Response schema (what server returns)
export const DomainResponseSchema = { /* schema definition */ };

// Validation function for server use
export function validateCreateDomainRequest(data) { /* validation logic */ }

// Response formatter for consistent output
export function createDomainResponse(data) { /* formatting logic */ }
```

```typescript
// In /web-ui-vite/src/schemas/shared-schemas.ts

// Zod schemas matching server definitions exactly
export const CreateDomainRequestSchema = z.object({ /* matching rules */ });
export const DomainResponseSchema = z.object({ /* matching rules */ });

// TypeScript types
export type CreateDomainRequest = z.infer<typeof CreateDomainRequestSchema>;
export type DomainResponse = z.infer<typeof DomainResponseSchema>;

// Validation helpers
export const validateCreateDomainRequest = (data: unknown): CreateDomainRequest =>
  CreateDomainRequestSchema.parse(data);
```

### 3. Lambda Integration

All Lambda functions must:

```javascript
import { validateCreateDomainRequest, createDomainResponse } from '../shared/schemas.mjs';

export const handler = async (event) => {
  // 1. Parse request
  const request = JSON.parse(event.body);

  // 2. Validate using shared schema
  const validation = validateCreateDomainRequest(request);
  if (!validation.isValid) {
    return createValidationError('Validation failed', validation.errors);
  }

  // 3. Process business logic
  const result = await processRequest(request);

  // 4. Format response using shared formatter
  const response = createDomainResponse(result);

  return createSuccessResponse(response);
};
```

### 4. Client Integration

All API clients must:

```typescript
import { validateDomainResponse, type CreateDomainRequest, type DomainResponse } from '../schemas/shared-schemas';

export const domainApi = {
  create: async (data: CreateDomainRequest): Promise<DomainResponse> => {
    const response = await makeRequest<DomainResponse>('post', 'domain', { json: data });
    return validateDomainResponse(response); // Ensures server response is valid
  }
};
```

## Development Workflow

### When Adding New Domains

1. **Define Schema** in `/lambda/shared/schemas.mjs`
   - Request validation schema
   - Response schema
   - Validation function
   - Response formatter

2. **Create TypeScript Wrapper** in `/web-ui-vite/src/schemas/shared-schemas.ts`
   - Matching Zod schemas
   - TypeScript types
   - Validation helpers

3. **Update Lambda Functions**
   - Import shared validation
   - Replace manual validation with shared functions
   - Use shared response formatters

4. **Update Client API**
   - Add API endpoints using shared types
   - Include response validation

5. **Write Tests**
   - Schema validation tests
   - Cross-domain consistency tests
   - Edge case testing

6. **Commit and Verify**
   - Test build and validation
   - Verify no schema drift
   - Document any breaking changes

### When Modifying Existing Schemas

1. **Update Source Schema** in `/lambda/shared/schemas.mjs` first
2. **Update TypeScript Wrapper** to match exactly
3. **Test All Affected Endpoints** (both client and server)
4. **Update Tests** to reflect new requirements
5. **Version API** if making breaking changes
6. **Communicate Changes** to all consumers

## Testing Strategy

### Schema Consistency Tests

Every domain must have tests that verify:

```typescript
describe('Domain Schema Consistency', () => {
  it('should validate same data on client and server', () => {
    // Test that both validation methods accept/reject identical data
  });

  it('should have matching field requirements', () => {
    // Verify request fields appear in response where appropriate
  });

  it('should enforce identical constraints', () => {
    // Test length limits, formats, etc. are identical
  });
});
```

### Integration Tests

```typescript
describe('API Schema Integration', () => {
  it('should reject invalid requests at all endpoints', () => {
    // Test that server validation actually works
  });

  it('should return valid responses for all endpoints', () => {
    // Test that server responses pass client validation
  });
});
```

## Schema Evolution Guidelines

### Backward Compatibility

- **Additive Changes**: New optional fields are safe
- **Field Removal**: Requires API versioning
- **Type Changes**: Usually breaking, require versioning
- **Constraint Changes**: May be breaking (e.g., making required field optional is safe, opposite is breaking)

### Versioning Strategy

- Use API versions for breaking changes: `/v1/profiles`, `/v2/profiles`
- Maintain shared schemas for each version
- Deprecate old versions with migration timeline
- Update clients to new versions systematically

## Common Patterns

### Optional Field Handling

```typescript
// Client preprocessing for empty strings
bio: z.preprocess(
  (val) => val === '' ? undefined : val,
  z.string().max(500).optional()
),
```

### Error Response Standardization

```javascript
// Standard error format across all endpoints
export const ApiErrorSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string' },
    details: { type: ['string', 'array'] }
  }
};
```

### Response Formatting

```javascript
// Consistent response structure
export function createDomainResponse(data) {
  return {
    // Only include fields that should be public
    id: data.id,
    publicField: data.publicField,
    // Transform or filter as needed
    computedField: computeValue(data),
    // Always include timestamp
    createdAt: data.createdAt
  };
}
```

## Monitoring and Maintenance

### Schema Drift Detection

- Run consistency tests in CI/CD pipeline
- Monitor API response validation failures
- Set up alerts for schema validation errors
- Regular audits of schema usage across codebase

### Performance Considerations

- Validation should be fast (< 1ms per request)
- Cache compiled schemas where possible
- Profile validation performance in production
- Consider validation sampling for high-traffic endpoints

## Migration Strategy

For existing codebases with inconsistent schemas:

1. **Audit Current State**: Identify all existing schemas and their usage
2. **Prioritize by Risk**: Start with most critical/frequently used endpoints
3. **Migrate Domain by Domain**: One domain at a time with full testing
4. **Deprecate Old Patterns**: Mark old validation patterns as deprecated
5. **Measure and Monitor**: Track schema consistency metrics
6. **Document Everything**: Update all documentation and examples

## Benefits Achieved

Following these principles delivers:

- 🛡️ **Type Safety**: Compile-time and runtime validation
- 🔄 **Consistency**: Identical behavior across client and server
- 🚀 **Developer Velocity**: No time lost debugging schema mismatches
- 🧪 **Testability**: Easy to test all edge cases systematically
- 📈 **Maintainability**: Schema changes propagate automatically
- 🐛 **Fewer Bugs**: Catch integration issues at development time
- 📚 **Self-Documenting**: Types serve as living documentation

## Anti-Patterns to Avoid

❌ **Never Do This:**
- Define same schema in multiple files
- Use different validation rules on client vs server
- Skip validation on either client or server
- Copy-paste schema definitions
- Use any-types or disable TypeScript checking
- Make assumptions about data shape without validation

✅ **Always Do This:**
- Define schema once in shared location
- Use shared validation everywhere
- Test schema consistency explicitly
- Version schemas for breaking changes
- Document schema evolution rationale
- Monitor schema validation in production

---

*This document serves as the definitive guide for schema management in our codebase. All developers must follow these principles to maintain system integrity and developer productivity.*