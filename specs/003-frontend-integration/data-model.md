# Data Model: Frontend & Full Integration

**Feature**: Frontend & Full Integration (003-frontend-integration)
**Date**: 2026-01-26

## Overview

This document defines the data models and structures used in the frontend application that connects to the FastAPI backend for task management with authentication.

## Frontend-Specific Data Models

### User Session
Represents the authenticated user's session state in the frontend application.

**Fields**:
- `userId`: string (UUID format) - Unique identifier for the authenticated user
- `token`: string - JWT token for API authentication
- `expiresAt`: Date - Expiration timestamp for the token
- `isAuthenticated`: boolean - Current authentication status
- `email`: string - User's email address

**Validation**:
- userId must be a valid UUID format
- token must be a valid JWT format
- expiresAt must be in the future

### Theme Preference
Represents the user's preferred visual appearance settings.

**Fields**:
- `mode`: 'light' | 'dark' | 'system' - Current theme selection
- `isDarkMode`: boolean - Computed property based on mode and system preference
- `lastChanged`: Date - Timestamp of last theme change

**State Transitions**:
- `light` → `dark` when user toggles theme
- `dark` → `light` when user toggles theme
- `system` → `light`/`dark` based on system preference

### Task Form State
Represents the state of the task creation/editing form.

**Fields**:
- `title`: string - Task title (required)
- `description`: string - Task description (optional)
- `status`: 'pending' | 'completed' - Task completion status
- `errors`: Record<string, string[]> - Field-specific validation errors
- `isSubmitting`: boolean - Form submission state
- `isValid`: boolean - Form validation state

**Validation Rules**:
- title: Required, 1-200 characters
- description: Optional, max 2000 characters
- status: Required, must be 'pending' or 'completed'

### API Response State
Represents the state of API responses for loading and error handling.

**Fields**:
- `isLoading`: boolean - Loading state indicator
- `hasError`: boolean - Error state indicator
- `error`: string | null - Error message if any
- `data`: T | null - Response data if successful
- `lastUpdated`: Date | null - Timestamp of last successful update

## Backend Data Models (Consumed)

### Task (from backend API)
Represents a user's individual task item as received from the backend API.

**Fields**:
- `id`: string (UUID) - Unique identifier for the task
- `user_id`: string (UUID) - Owner of the task
- `title`: string - Task title
- `description`: string - Task description (may be null)
- `status`: 'pending' | 'completed' - Task completion status
- `created_at`: string (ISO date) - Creation timestamp
- `updated_at`: string (ISO date) - Last update timestamp

**Validation** (from backend):
- id must be a valid UUID
- user_id must match authenticated user
- title must be 1-200 characters
- description must be max 2000 characters
- status must be 'pending' or 'completed'

### API Error Response (RFC 7807)
Standardized error response format from the backend API.

**Fields**:
- `type`: string - Error type identifier
- `title`: string - Human-readable error title
- `status`: number - HTTP status code
- `detail`: string - Specific error details
- `instance`: string - URI reference to the specific occurrence

## Frontend State Management

### Task List State
Manages the collection of tasks in the frontend state.

**Fields**:
- `tasks`: Task[] - Array of user's tasks
- `filteredTasks`: Task[] - Tasks after applying any filters
- `isLoading`: boolean - Whether tasks are being fetched
- `error`: string | null - Error message if fetch failed
- `selectedTaskId`: string | null - Currently selected task for editing

### Form Validation Schema
Zod schema definitions for form validation.

**Task Schema**:
- `title`: String with min 1, max 200 characters
- `description`: Optional string with max 2000 characters
- `status`: Enum of 'pending' | 'completed'

## Type Definitions

### TypeScript Interfaces

```typescript
interface UserSession {
  userId: string;
  token: string;
  expiresAt: Date;
  isAuthenticated: boolean;
  email: string;
}

interface ThemePreference {
  mode: 'light' | 'dark' | 'system';
  isDarkMode: boolean;
  lastChanged: Date;
}

interface TaskFormData {
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  errors: Record<string, string[]>;
  isSubmitting: boolean;
  isValid: boolean;
}

interface ApiResponse<T> {
  isLoading: boolean;
  hasError: boolean;
  error: string | null;
  data: T | null;
  lastUpdated: Date | null;
}

type TaskStatus = 'pending' | 'completed';

interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}
```

## Relationships

### User Session → Tasks
- A user session is associated with multiple tasks
- Tasks are filtered by the user_id in the session
- All API requests for tasks require the token from the session

### Theme Preference → UI Components
- Theme preference affects all UI components
- Components subscribe to theme changes
- Theme changes trigger re-rendering with updated styles

### Task Form State → API Client
- Form state triggers API calls
- API responses update form state
- Validation errors from API update form state