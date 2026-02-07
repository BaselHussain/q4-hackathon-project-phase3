// Type definitions for the application

// User types — matches backend (only id + email, no firstName/lastName/roles)
export interface User {
  id: string;
  email: string;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

// Backend login response: { access_token, token_type, user_id, email }
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
}

// Backend register response: { user_id, email, message }
export interface RegisterResponse {
  user_id: string;
  email: string;
  message: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T | undefined;
  error?: string | undefined;
  message?: string | undefined;
}

// Theme types
export type Theme = 'light' | 'dark';

// Component prop types
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

// Form types
export interface FormErrors {
  [key: string]: string;
}

// Generic component types
export interface SelectOption {
  value: string;
  label: string;
}

// Navigation types
export interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<any>;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// API Client types
export interface ApiRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

export interface ApiErrorResponse {
  message: string;
  status: number;
  data?: any;
}

// Chat types (for ChatKit floating widget)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls: ToolCallResult[] | null;
  createdAt: string; // ISO 8601 datetime
}

export interface ToolCallResult {
  toolName: string; // e.g., "add_task", "list_tasks"
  arguments: Record<string, unknown>;
  result: Record<string, unknown>;
}
