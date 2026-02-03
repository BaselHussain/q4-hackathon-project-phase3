---
name: better-auth-jwt
description: Implement JWT-based authentication with FastAPI backend and Next.js frontend using Better Auth patterns including signup, signin, protected routes, and token management.
---

# Better Auth JWT Authentication Skill

A comprehensive skill for implementing JWT-based authentication across a FastAPI + Next.js full-stack application.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐    POST /api/auth/login    ┌─────────────┐         │
│  │   Frontend  │ ─────────────────────────► │   Backend   │         │
│  │  (Next.js)  │                            │  (FastAPI)  │         │
│  │             │ ◄───────────────────────── │             │         │
│  │             │   { access_token, ... }    │             │         │
│  └──────┬──────┘                            └──────┬──────┘         │
│         │                                          │                 │
│         │ Store JWT in localStorage                │ Validate creds  │
│         │                                          │ Generate JWT    │
│         ▼                                          ▼                 │
│  ┌─────────────┐   Authorization: Bearer    ┌─────────────┐         │
│  │ AuthContext │ ─────────────────────────► │ Dependency  │         │
│  │  Provider   │     GET /api/tasks         │ Injection   │         │
│  └─────────────┘                            │ get_current │         │
│                                             │    _user    │         │
│                                             └─────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 16+ | App Router, React Context |
| Backend | FastAPI | REST API with Pydantic validation |
| Database | PostgreSQL | User storage via SQLModel |
| Password | bcrypt | Secure password hashing |
| Token | python-jose | JWT creation and validation |

## Backend Implementation

### 1. Environment Variables

```bash
# .env
BETTER_AUTH_SECRET=your-256-bit-secret-key-here
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
```

### 2. User Model (SQLModel)

```python
# src/models/user.py
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy import Column, DateTime, String, func
from sqlmodel import Field, SQLModel

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    email: str = Field(
        sa_column=Column(String(254), unique=True, index=True, nullable=False),
        max_length=254
    )
    password_hash: str = Field(
        sa_column=Column(String(255), nullable=False),
        max_length=255
    )
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    last_login_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
```

### 3. Security Module (JWT + bcrypt)

```python
# src/core/security.py
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
from jose import ExpiredSignatureError, JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")
if not SECRET_KEY:
    raise ValueError("BETTER_AUTH_SECRET environment variable must be set")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def create_access_token(user_id: UUID, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> tuple[Optional[dict], Optional[str]]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return (payload, None)
    except ExpiredSignatureError:
        return (None, "expired-token")
    except JWTError as e:
        error_msg = str(e).lower()
        if "signature" in error_msg:
            return (None, "invalid-signature")
        if any(k in error_msg for k in ["not enough segments", "invalid"]):
            return (None, "malformed-token")
        return (None, "invalid-token")
```

### 4. Password Service

```python
# src/services/password.py
import re
from typing import Tuple
from src.core.security import pwd_context

def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def validate_password_strength(password: str) -> Tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if len(password) > 128:
        return False, "Password must not exceed 128 characters"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number"
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]", password):
        return False, "Password must contain at least one special character"
    return True, ""
```

### 5. Auth Schemas (Pydantic)

```python
# src/api/schemas/auth.py
from uuid import UUID
from pydantic import BaseModel, Field

class RegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="Password with complexity requirements")

class RegisterResponse(BaseModel):
    user_id: UUID
    email: str
    message: str

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    email: str
```

### 6. Auth Endpoints

```python
# src/api/auth.py
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/api/auth", tags=["authentication"])
limiter = Limiter(key_func=get_remote_address)

@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # 1. Validate email format
    # 2. Validate password strength
    # 3. Check email uniqueness
    # 4. Hash password
    # 5. Create user
    # 6. Return success (no token - user must login)
    pass

@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")  # Rate limit for security
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    # 1. Normalize email (lowercase)
    # 2. Query user by email
    # 3. Verify password (generic error for security)
    # 4. Update last_login_at
    # 5. Generate JWT token
    # 6. Return token + user info
    pass
```

### 7. Auth Dependency (Protected Routes)

```python
# src/api/dependencies.py
from fastapi import Depends, HTTPException, Request, status
from uuid import UUID
from src.core.security import decode_access_token

async def get_current_user(request: Request) -> UUID:
    auth_header = request.headers.get("authorization")

    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header required")

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = parts[1]
    payload, error = decode_access_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail=f"Token error: {error}")

    return UUID(payload["sub"])

# Usage in protected endpoints:
@router.get("/tasks")
async def get_tasks(current_user: UUID = Depends(get_current_user)):
    # Only authenticated users can access
    pass
```

## Frontend Implementation

### 1. Environment Variables

```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 2. Auth Utilities

```typescript
// lib/auth.ts
interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
}

export const setToken = (token: string): void => {
  const decoded = decodeToken(token);
  const tokenData = decoded?.exp
    ? { token, expiry: decoded.exp * 1000 }
    : { token };
  localStorage.setItem('jwt_token', JSON.stringify(tokenData));
};

export const setUserEmail = (email: string): void => {
  localStorage.setItem('user_email', email);
};

export const getToken = (): string | null => {
  const tokenString = localStorage.getItem('jwt_token');
  if (!tokenString) return null;
  try {
    const tokenData = JSON.parse(tokenString);
    return typeof tokenData === 'string' ? tokenData : tokenData.token;
  } catch {
    return null;
  }
};

export const removeToken = (): void => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_email');
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1]!;
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(paddedPayload));
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp < Math.floor(Date.now() / 1000);
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  return token ? !isTokenExpired(token) : false;
};
```

### 3. Auth Context Provider

```tsx
// components/AuthProvider.tsx
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { setToken, setUserEmail, getToken, removeToken, isAuthenticated, isTokenExpired } from '@/lib/auth';

interface AuthContextType {
  user: { id: string; email: string } | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [token, setLocalToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    const storedToken = getToken();
    if (storedToken && isAuthenticated()) {
      setLocalToken(storedToken);
      // Restore user from token/localStorage
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      setToken(data.access_token);
      setUserEmail(data.email);
      setLocalToken(data.access_token);
      setUser({ id: String(data.user_id), email: data.email });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { email: string; password: string }) => {
    // Register then auto-login
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Registration failed');
    }

    // Auto-login after successful registration
    await login({ email: userData.email, password: userData.password });
  };

  const logout = () => {
    removeToken();
    setLocalToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      error,
      login,
      register,
      logout,
      isAuthenticated: !!token && !isLoading && (token ? !isTokenExpired(token) : false),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 4. Protected Route Component

```tsx
// components/ProtectedRoute.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

### 5. API Client with Auth Header

```typescript
// lib/api.ts
import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired - redirect to login
      window.location.href = '/login';
    }
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};
```

## Security Best Practices

1. **Password Storage**: Always use bcrypt with automatic salting
2. **Generic Errors**: Return same error for wrong email/password to prevent enumeration
3. **Rate Limiting**: Apply rate limits on login endpoint (5/minute)
4. **Token Expiration**: Use short-lived tokens (24 hours or less)
5. **HTTPS Only**: Never transmit tokens over HTTP
6. **No Secrets in Frontend**: Only NEXT_PUBLIC_ vars in frontend code
7. **Token in Header**: Use `Authorization: Bearer <token>` header
8. **Validate All Inputs**: Use Pydantic for backend, Zod for frontend

## Required Dependencies

### Backend (Python)
```txt
fastapi>=0.109.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
sqlmodel>=0.0.14
slowapi>=0.1.9
```

### Frontend (Node.js)
```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "sonner": "^1.0.0"
  }
}
```

## File Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── auth.py           # Auth endpoints
│   │   ├── dependencies.py   # get_current_user
│   │   └── schemas/
│   │       └── auth.py       # Pydantic models
│   ├── core/
│   │   └── security.py       # JWT + bcrypt
│   ├── models/
│   │   └── user.py           # User SQLModel
│   └── services/
│       └── password.py       # Password utilities

frontend/
├── app/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── dashboard/page.tsx
├── components/
│   ├── AuthProvider.tsx
│   └── ProtectedRoute.tsx
└── lib/
    ├── auth.ts               # Token utilities
    └── api.ts                # API client
```

## Usage Example

```tsx
// app/layout.tsx
import { AuthProvider } from '@/components/AuthProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

// Any protected page
'use client';
import { useAuth } from '@/components/AuthProvider';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```
