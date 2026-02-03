# Quickstart Guide: Frontend & Full Integration

**Feature**: Frontend & Full Integration (003-frontend-integration)
**Date**: 2026-01-26

## Overview

This guide provides step-by-step instructions to set up, develop, and run the Next.js frontend application that connects to the FastAPI backend for task management with authentication.

## Prerequisites

- Node.js 18+ with npm/yarn/pnpm
- Access to the FastAPI backend (from Spec 1 & 2)
- Better Auth configured with shared secrets
- PostgreSQL database running and accessible via backend

## Setup Instructions

### 1. Clone and Navigate to Project
```bash
# Navigate to the project root directory
cd F:\Q4 Hackathon\Project 2 (Phase 2)\
```

### 2. Create Frontend Directory
```bash
mkdir frontend
cd frontend
```

### 3. Initialize Next.js Project
```bash
# Create a new Next.js app with TypeScript
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Or if you prefer manual setup:
npm create next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 4. Install Dependencies
```bash
# Navigate to frontend directory
cd frontend

# Install required dependencies
npm install @types/node @types/react @types/react-dom better-auth react-hook-form zod lucide-react framer-motion sonner @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-tooltip

# Install shadcn/ui CLI
npx shadcn-ui@latest init

# Add shadcn/ui components as needed
npx shadcn-ui@latest add button card dialog form input label select sheet switch toast tooltip
```

### 5. Environment Configuration
Create a `.env.local` file in the frontend directory:

```env
# Next.js Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Task Management App

# Better Auth Configuration
NEXT_PUBLIC_BETTER_AUTH_SECRET=your-better-auth-secret-here
```

**Note**: The `NEXT_PUBLIC_BETTER_AUTH_SECRET` should match the one used in the backend.

### 6. Configure Next.js and Tailwind
Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['localhost', 'your-backend-domain.com'],
  },
}

module.exports = nextConfig
```

Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## Development Workflow

### 1. Start the Backend First
Make sure your FastAPI backend (from Specs 1 & 2) is running:

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 2. Run the Frontend Development Server
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3. Key Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Run linting
npm run lint

# Run tests (when added)
npm run test
```

## Key Implementation Steps

### 1. Implement Authentication Pages
- Create `/app/page.tsx` with redirect to login/signup
- Create `/app/login/page.tsx` with Better Auth integration
- Create `/app/signup/page.tsx` with Better Auth integration
- Implement JWT token storage in localStorage

### 2. Create Protected Task Dashboard
- Create `/app/tasks/layout.tsx` with theme support
- Create `/app/tasks/page.tsx` with task list and form
- Implement route protection using authentication context

### 3. Build Task Components
- Create `components/TaskList.tsx` with task cards
- Create `components/TaskForm.tsx` with validation
- Create `components/ThemeToggle.tsx` for dark/light mode

### 4. Implement API Client
- Create `lib/api.ts` with JWT interceptor
- Create `lib/auth.ts` with authentication utilities
- Create `hooks/useAuth.ts` for authentication state

### 5. Add Theme Support
- Implement `lib/theme.ts` with next-themes
- Add theme toggle component
- Ensure text colors adapt (white on dark, dark on light)

## Testing the Implementation

### 1. Manual Testing Steps
```bash
# 1. Start both backend and frontend
# Backend: uvicorn main:app --reload --port 8000
# Frontend: npm run dev
```

1. Navigate to `http://localhost:3000` → should redirect to login
2. Click sign up and register with valid credentials
3. Log in with the registered account
4. Verify access to task dashboard
5. Create a new task → verify it appears with animation
6. Edit an existing task → verify changes save
7. Toggle task completion → verify status updates
8. Delete a task → verify removal with confirmation
9. Toggle theme → verify text colors adapt correctly
10. Log out → verify redirect to login page
11. Try accessing tasks page without authentication → verify redirect to login

### 2. Mobile Responsiveness Testing
- Open browser dev tools
- Switch to mobile view (iPhone/Android device)
- Verify all functionality works on smaller screens
- Check that touch targets are adequately sized

### 3. Cross-Browser Testing
- Test in Chrome, Firefox, Safari, and Edge
- Verify consistent behavior and appearance
- Check that animations and transitions work properly

## API Integration Points

### Backend Endpoints Used
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/{user_id}/tasks` - Fetch user tasks
- `POST /api/{user_id}/tasks` - Create new task
- `PUT /api/{user_id}/tasks/{task_id}` - Update task
- `PATCH /api/{user_id}/tasks/{task_id}/complete` - Toggle task completion
- `DELETE /api/{user_id}/tasks/{task_id}` - Delete task

### Error Handling
- 401 Unauthorized → Redirect to login page
- 403 Forbidden → Show access denied message
- 422 Validation Error → Show field-specific errors
- Network errors → Show appropriate error messages

## Troubleshooting

### Common Issues

1. **API calls failing with CORS errors**:
   - Verify backend has proper CORS configuration allowing frontend origin
   - Check that backend is running on expected port

2. **Authentication not persisting**:
   - Verify JWT token is properly stored in localStorage
   - Check that Authorization header is included in API requests

3. **Theme not applying correctly**:
   - Ensure tailwind.config.js is properly configured for dark mode
   - Verify next-themes is correctly implemented

4. **Form validation not working**:
   - Check that React Hook Form and Zod are properly configured
   - Verify validation schemas match backend requirements

### Debugging Commands
```bash
# Check environment variables
echo $NEXT_PUBLIC_API_URL

# Clear browser storage for testing
# (In browser dev tools: Application → Storage → Clear site data)

# Check API connectivity
curl http://localhost:8000/health
```