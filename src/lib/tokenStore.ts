/**
 * Central auth token store (module-level, not React state).
 *
 * - access_token  — in-memory only (lost on reload; restored via silent refresh)
 * - refresh_token — sessionStorage (tab-scoped)
 * - user_id/role  — sessionStorage (UI hints only)
 *
 * Interceptors and AuthContext both read/write through this module.
 */

const REFRESH_TOKEN_KEY = "refresh_token";
const USER_ID_KEY = "user_id";
const USER_ROLE_KEY = "user_role";
const MENTOR_DEPT_ID_KEY = "mentor_departmentid";
const MENTOR_DEPT_NAME_KEY = "mentor_department_name";
const MENTOR_DEPT_CODE_KEY = "mentor_department_code";

let accessToken: string | null = null;

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Private mode / quota — degrade silently
  }
}

function removeSession(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  return readSession(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (token === null) {
    removeSession(REFRESH_TOKEN_KEY);
    return;
  }
  writeSession(REFRESH_TOKEN_KEY, token);
}

export function getUserId(): string | null {
  return readSession(USER_ID_KEY);
}

export function setUserId(id: string | null): void {
  if (id === null) {
    removeSession(USER_ID_KEY);
    return;
  }
  writeSession(USER_ID_KEY, id);
}

export function getUserRole(): string | null {
  return readSession(USER_ROLE_KEY);
}

export function setUserRole(role: string | null): void {
  if (role === null) {
    removeSession(USER_ROLE_KEY);
    return;
  }
  writeSession(USER_ROLE_KEY, role);
}

/** Clears in-memory access token, auth session keys, and mentor department hints. */
export function clearAuth(): void {
  accessToken = null;
  removeSession(REFRESH_TOKEN_KEY);
  removeSession(USER_ID_KEY);
  removeSession(USER_ROLE_KEY);
  removeSession(MENTOR_DEPT_ID_KEY);
  removeSession(MENTOR_DEPT_NAME_KEY);
  removeSession(MENTOR_DEPT_CODE_KEY);
}
