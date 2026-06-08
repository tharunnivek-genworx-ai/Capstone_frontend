// src/features/auth/hooks/useAuth.ts
import { useAuthContext } from "../context/AuthContext";

/** Exposes the auth context value. Use anywhere inside <AuthProvider>. */
export const useAuth = () => useAuthContext();
