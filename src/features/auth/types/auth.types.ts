// src/features/auth/types/auth.types.ts
/**
 * TypeScript interfaces matching the Identity Service auth schemas exactly.
 * Reference: src/api/schemas/auth_schema.py
 */

export type UserRole = "itadmin" | "mentor" | "trainee";

/** POST /auth/login — request body */
export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /auth/login — response body */
export interface LoginResponse {
  access_token: string;
  token_type: string;        // "bearer"
  expires_in_minutes: number;
  refresh_token: string;
  refresh_token_expires_in_days: number;
  /** Present when the authenticated user is a mentor */
  departmentid?: string | null;
  department_name?: string | null;
  department_code?: string | null;
}

/** POST /auth/refresh — request body */
export interface RefreshRequest {
  refresh_token: string;
}

/** POST /auth/refresh — response body */
export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
}

/** POST /auth/logout — request body */
export interface LogoutRequest {
  refresh_token: string;
}

/** Decoded JWT payload (for role/sub extraction) */
export interface TokenPayload {
  sub: string;          // UUID of user
  role: UserRole;
  exp: number;          // Unix timestamp
  iat: number;          // Unix timestamp
  jti: string;          // Unique token ID
}
