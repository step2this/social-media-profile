# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **event-driven social media profile service** built with AWS CDK, TypeScript, and serverless architecture. The service manages user profiles with real-time event processing using EventBridge, DynamoDB for data storage, and Lambda functions for business logic.

The project includes both a **serverless backend** and a **modern React web UI** for complete profile management functionality.

## Architecture

### Core Components
- **DynamoDB Table** (`user-profiles`): Single table design with PK/SK pattern for user profiles
  - PK: `USER#{userId}`, SK: `PROFILE`
  - GSI: `username-index` for username lookups
  - Streams enabled for change data capture
- **EventBridge Custom Bus** (`social-media-events`): Event-driven communication hub
- **Lambda Functions**: Profile CRUD operations and event processing
- **API Gateway**: RESTful API endpoints for profile management

### Event-Driven Architecture
The system uses EventBridge for decoupled, event-driven processing:
- Profile operations (create/update) publish events to the custom bus
- Event processor Lambda handles downstream tasks (search indexing, notifications, analytics)
- Events: `Profile Created`, `Profile Updated` with source `social-media.profile`

### Data Access Pattern
- Single table design with composite keys
- Profile data: `USER#{userId}#PROFILE`
- Username lookups via GSI for unique constraint checking
- Optimistic concurrency with version field

## Development Commands

### Build & Development
```bash
npm run build          # Compile TypeScript
npm run watch          # Watch mode compilation
npm run test           # Run Jest tests
```

### CDK Commands
```bash
npm run cdk synth      # Generate CloudFormation template
npm run cdk diff       # Compare with deployed stack
npm run cdk deploy     # Deploy to AWS
npm run cdk destroy    # Remove stack
npm run bootstrap      # Bootstrap CDK environment
```

### Web UI Commands
```bash
cd web-ui
npm start              # Start React development server (localhost:3000)
npm run build          # Build for production
npm test               # Run React tests
```

### Testing
- Tests located in `test/` directory
- Uses Jest with ts-jest transformer
- Test file pattern: `**/*.test.ts`
- Run single test: `npm test -- --testNamePattern="test name"`

## Project Structure

```
├── bin/                    # CDK app entry point
├── lib/                    # CDK stack definitions
├── lambda/
│   ├── profile/           # Profile CRUD operations
│   │   ├── create.ts      # POST /profiles
│   │   ├── get.ts         # GET /profiles/{userId}
│   │   └── update.ts      # PUT /profiles/{userId}
│   └── events/            # Event processing
│       └── profile-processor.ts  # EventBridge event handler
├── lambda-layers/         # Shared Lambda layers
├── test/                  # Jest tests
└── web-ui/                # React Web Application
    ├── src/
    │   ├── components/    # Reusable React components
    │   ├── pages/         # Page components (Home, Create, Profile)
    │   ├── services/      # API service layer
    │   └── types/         # TypeScript type definitions
    └── public/            # Static assets
```

## Key Implementation Details

### Lambda Function Configuration
- Runtime: Node.js 22.x
- Bundling excludes aws-sdk (available in runtime)
- 30-second timeout
- Log retention: 1 week
- Environment variables for table/bus names

### API Endpoints
- `POST /profiles` - Create profile (returns 201, publishes ProfileCreated event)
- `GET /profiles/{userId}` - Get profile by ID
- `PUT /profiles/{userId}` - Update profile (publishes ProfileUpdated event)

### Error Handling
- Conditional writes prevent duplicate profiles (409 Conflict)
- Comprehensive error responses with proper HTTP status codes
- Event processing failures trigger Lambda retry mechanism

### Event Processing Patterns
The profile-processor.ts demonstrates common event-driven patterns:
- Search index management
- Cache invalidation
- Analytics initialization
- Email notifications (placeholder implementations)

## Development Notes

- Uses AWS SDK v3 with modular imports for optimal bundle size
- DynamoDB operations use DocumentClient for simplified JSON handling
- EventBridge events follow consistent source/detail-type naming
- CORS enabled for API Gateway with standard headers
- Remove policies set to DESTROY for development (change for production)

## Code Design Principles

**ALWAYS follow these principles when writing code:**

### Core Principles
- **Single Responsibility Principle (SRP)**: Each function/class has one job
- **DRY (Don't Repeat Yourself)**: Avoid code duplication, create reusable components
- **Functional Programming**: Use lodash for idiomatic functional patterns
- **Composability**: Build small, composable functions that work together
- **Separation of Concerns**: Keep different responsibilities in different modules
- **SOLID**: Use solid design patterns

### Code Style
- **No hardcoding**: Use constants, configuration, or environment variables
- **Pure functions**: Functions that don't cause side effects when possible
- **Small functions**: Keep functions focused and small (single responsibility)
- **Minimal conditional logic**: Avoid complex if/else chains
- **Functional over procedural**: Prefer map/filter/reduce over for loops
- lodash/fp returns things in different orders from lodash. Don't be afraid of lodash/fp, understand deeply how it works and adapt how you consume functions in lodash/fp to work with other things. don't give up on it because something doesn't return what you expect in the right place. 
- **Documentation** include some comments in a consistent format at the top of every file explaining what it does, and add a comment on top of each method. if typescript or js supports something similar to JavaDoc formatting, use that. 
- **Use libraries**: For example use a library to handle JSON formatting, do not use obvious anti-patterns like constructing http requests by hand, constructing JSON by hand, etc. When you find yourself concatanating strings, use a library. 

### Testing Principles
- **Small, focused tests**: Each test validates one specific behavior
- **Use data fixtures**: Create reusable test data (consider faker.js or similar)
- **No hardcoded values in tests**: Use fixtures and constants
- **Functional test structure**: Arrange-Act-Assert pattern
- **Mock external dependencies**: Keep tests isolated and fast
- **All code must be testable with dependency injection**: keep a consistent interface and hide the implementation details

### Error Handling
- **Hard errors**: Throw clear, descriptive errors that crash the system
- **Fail fast**: Don't hide errors, make them visible immediately
- **Type safety**: Use Zod schemas for runtime validation
- **Request IDs**: Include context for debugging (request IDs, timestamps)

### API Design
- **Schema validation**: Use Zod for input/output validation
- **Typed clients**: Generate typed API clients for type safety
- **Consistent responses**: Follow standard HTTP status codes and error formats
- **No manual JSON handling**: Use typed schemas and validation

## Environment Variables

Lambda functions expect these environment variables:
- `TABLE_NAME`: DynamoDB table name
- `EVENT_BUS_NAME`: EventBridge bus name (for functions that publish events)

Web UI environment variables (in `web-ui/.env`):
- `REACT_APP_API_URL`: Backend API Gateway URL

## Web UI Features

The React web application provides a modern, responsive interface with:

### Technology Stack
- **React 18** with TypeScript
- **Tailwind CSS** with custom design system
- **Shadcn/UI** component library for consistent styling
- **React Router** for client-side routing
- **Lucide React** for icons

### Pages and Components
- **HomePage**: Landing page with feature overview and navigation
- **CreateProfilePage**: Complete profile creation form with validation
- **ProfilePage**: Profile display with edit functionality
- **ProfileCard**: Reusable profile display component with stats
- **Form Components**: Validated forms for create/update operations

### Key Features
- Form validation with error messaging
- Responsive mobile-first design
- Loading states and error handling
- Modern UI with hover effects and animations
- Clean component architecture with separation of concerns

## Lambda Debugging Guidelines

When lambda functions fail, use this systematic debugging methodology to identify and resolve issues quickly.

### Debugging Process

Follow this step-by-step process for lambda debugging:

1. **Configuration Check** - Verify lambda exists and is properly configured
2. **API Endpoint Testing** - Test the API Gateway integration
3. **Direct Lambda Invocation** - Bypass API Gateway to isolate lambda issues
4. **Log Analysis** - Examine CloudWatch logs for error details

### Error Categorization

Lambda errors typically fall into these categories:

- **Syntax Errors**: Code compilation issues (TypeScript in .mjs files, invalid JavaScript)
- **Runtime Errors**: Execution failures (missing dependencies, import errors)
- **Dependency Errors**: Missing packages or incorrect imports
- **Configuration Errors**: Wrong environment variables or permissions

### Tools and Scripts

#### Lambda Validation Script
Use the `validate-lambda.sh` script for systematic debugging:

```bash
./validate-lambda.sh
```

This script performs:
- Lambda function discovery by partial name
- Configuration validation
- API endpoint testing with timing
- Log group analysis
- Direct lambda invocation with test payloads

#### Manual Debugging Commands

```bash
# Find lambda function
aws lambda list-functions --query "Functions[?contains(FunctionName, 'GenerateTestData')].FunctionName"

# Check configuration
aws lambda get-function-configuration --function-name FUNCTION_NAME

# View recent logs
aws logs tail "/aws/lambda/FUNCTION_NAME" --since 10m

# Test API endpoint
curl -X POST "API_URL/endpoint" -H "Content-Type: application/json" -d "{}"

# Direct lambda invocation
aws lambda invoke --function-name FUNCTION_NAME --payload '{}' response.json
```

### Common Issues and Solutions

#### TypeScript Syntax in .mjs Files
**Problem**: `SyntaxError: Unexpected identifier 'as'`
**Solution**: Remove TypeScript-specific syntax like `as const` from .mjs files

#### Missing Dependencies
**Problem**: `Cannot find package 'uuid'`
**Solution**: Add missing packages to lambda deployment bundle or layer

#### CDK Not Detecting Changes
**Problem**: CDK shows "(no changes)" when lambda code was modified
**Solution**: Update lambda code directly via AWS CLI or force CDK deployment

#### Log Group Discovery
**Problem**: Cannot find CloudWatch log group for lambda
**Solution**: Use pattern `/aws/lambda/FUNCTION_NAME` and verify lambda has been invoked

### Troubleshooting Best Practices

- **Start with validation script**: Run `validate-lambda.sh` for comprehensive checking
- **Check logs first**: CloudWatch logs reveal most lambda issues
- **Test incrementally**: Configuration → API → Direct invocation → Logs
- **Isolate components**: Separate API Gateway issues from lambda execution issues
- **Document error patterns**: Add new error types to this guide when discovered
- **Use structured logging**: Include request IDs and timestamps for debugging context
