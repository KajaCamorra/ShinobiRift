# Shinobi Rift Web Client

A Next.js-based web client for Shinobi Rift game.

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Authentication**: Discord OAuth + PlayFab
- **State Management**: React Context + Hooks
- **Real-time Communication**: SignalR/Socket.IO
- **Game Services**: PlayFab
- **Code Quality**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- A PlayFab account and title ID
- Discord OAuth credentials

### Environment Setup

Create a `.env.local` file in the web directory:

```env
NEXT_PUBLIC_PLAYFAB_TITLE_ID=your_playfab_title_id
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/callback/discord
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
web/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── game/           # Game-specific components
│   │   ├── landing/        # Landing page components
│   │   ├── shared/         # Shared components
│   │   └── ui/             # UI components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and services
│   └── styles/             # Global styles
├── public/                 # Static assets
└── types/                  # TypeScript type definitions
```

## Features

- **Authentication**
  - Discord OAuth integration
  - PlayFab session management
  - Protected routes

- **Game Features**
  - Real-time gameplay
  - Chat system
  - Status tracking
  - Resizable game panels

- **UI/UX**
  - Responsive design
  - Loading states
  - Error boundaries
  - Toast notifications
  - Mobile menu

## Best Practices

- **TypeScript**
  - Strict mode enabled
  - Comprehensive type definitions
  - No any types

- **Security**
  - CSRF protection
  - Security headers
  - Protected API routes
  - Secure session management

- **Performance**
  - Code splitting
  - Image optimization
  - Production optimizations
  - Console log removal in production

- **Code Quality**
  - ESLint configuration
  - Prettier formatting
  - React hooks rules
  - Security best practices

## Development Workflow

1. Create a new branch for your feature
2. Write code following the established patterns
3. Ensure all TypeScript types are properly defined
4. Add necessary documentation
5. Run linting and formatting
6. Test your changes
7. Create a pull request

## Common Tasks

### Adding a New Component

1. Create component in appropriate directory
2. Define TypeScript interfaces
3. Implement component logic
4. Add necessary styles
5. Document props and usage

### Adding a New Feature

1. Plan the feature implementation
2. Create necessary components
3. Add required context/hooks
4. Implement API integration if needed
5. Add error handling
6. Test thoroughly
7. Document the feature

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is private and confidential.
