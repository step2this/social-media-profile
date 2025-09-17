# Social Media Profile Web UI

A modern React application for managing social media profiles, built with TypeScript, Tailwind CSS, and Shadcn/UI components.

## Features

- **Create Profile**: Complete profile creation with validation
- **View Profile**: Beautiful profile display with stats
- **Edit Profile**: Update profile information and privacy settings
- **Responsive Design**: Mobile-first design that works on all devices
- **Modern UI**: Clean, professional interface using Shadcn/UI components

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/UI** for components
- **React Router** for navigation
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your API URL:
   ```
   REACT_APP_API_URL=https://your-api-gateway-url.com/prod
   ```

### Development

Start the development server:

```bash
npm start
```

The app will run on [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

### Testing

```bash
npm test
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/UI base components
│   ├── ProfileCard.tsx # Profile display component
│   ├── CreateProfileForm.tsx
│   └── EditProfileForm.tsx
├── pages/              # Page components
│   ├── HomePage.tsx
│   ├── CreateProfilePage.tsx
│   └── ProfilePage.tsx
├── services/           # API services
│   └── api.ts
├── types/              # TypeScript type definitions
│   └── profile.ts
└── lib/                # Utilities
    └── utils.ts
```

## Available Scripts

- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## API Integration

The app connects to a serverless AWS backend with the following endpoints:

- `POST /profiles` - Create a new profile
- `GET /profiles/{userId}` - Get profile by ID
- `PUT /profiles/{userId}` - Update profile

## Environment Variables

- `REACT_APP_API_URL` - Backend API base URL

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests if needed
4. Submit a pull request