# Frontend Foundation

This directory contains the foundational components and utilities for the Next.js frontend application.

## Directory Structure

```
frontend/
├── lib/
│   ├── api.ts          # API client with JWT interceptor
│   ├── auth.ts         # Authentication utilities
│   └── theme.ts        # Theme context/provider
├── types/
│   └── index.ts        # Type definitions
├── components/
│   ├── ui/             # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── alert.tsx
│   ├── AuthProvider.tsx    # Authentication context provider
│   ├── ProtectedRoute.tsx  # Protected route component
│   └── AppProvider.tsx     # Combined app provider
└── .env.local          # Environment variables
```

## Key Features

### API Client (`lib/api.ts`)
- Built with Axios for HTTP requests
- Automatic JWT token injection in headers
- Token expiration handling
- Standardized request methods (GET, POST, PUT, PATCH, DELETE)

### Authentication Utilities (`lib/auth.ts`)
- Token storage in localStorage
- Token validation and expiration checking
- User information extraction from JWT
- Secure token management

### Theme Management (`lib/theme.ts`)
- Light/dark theme support
- System preference detection
- Local storage persistence
- Context-based theme switching

### UI Components (`components/ui/`)
- Accessible and customizable components
- Consistent design system
- TypeScript interfaces for props
- Responsive design patterns

### Authentication Context (`components/AuthProvider.tsx`)
- Global authentication state
- Login/logout functionality
- User data management
- Loading states

### Protected Routes (`components/ProtectedRoute.tsx`)
- Role-based access control
- Authentication checks
- Custom fallback UI
- Automatic redirection

### Type Definitions (`types/index.ts`)
- Comprehensive TypeScript interfaces
- Shared type definitions
- API response types
- Component prop types

## Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Authentication
NEXT_PUBLIC_JWT_SECRET=your-jwt-secret-key-here
NEXT_PUBLIC_REFRESH_TOKEN_SECRET=your-refresh-token-secret-here

# Application Settings
NEXT_PUBLIC_APP_NAME=Project 2 App
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Usage Examples

### Using the API client:
```typescript
import { api } from '@/lib/api';

// GET request
const users = await api.get('/users');

// POST request with JWT token automatically added
const newUser = await api.post('/users', { name: 'John' });
```

### Using the Auth context:
```typescript
import { useAuth } from '@/components/AuthProvider';

const { user, login, logout, isAuthenticated } = useAuth();
```

### Using Protected routes:
```typescript
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Dashboard content</div>
    </ProtectedRoute>
  );
}
```

### Using UI components:
```typescript
import { Button, Input, Card } from '@/components/ui';

<Button variant="primary">Click me</Button>
<Input label="Email" placeholder="Enter email" />
<Card title="Welcome">Content goes here</Card>
```