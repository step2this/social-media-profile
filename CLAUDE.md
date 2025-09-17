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
- Runtime: Node.js 18.x
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