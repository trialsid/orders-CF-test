import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AuthResponse, AuthUser } from '../types';

type AuthStatus = 'checking' | 'ready';

type LoginInput = {
  phone: string;
  password: string;
};

type RegisterInput = LoginInput & {
  displayName?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  authError: string | null;
  isAuthenticating: boolean;
  login: (payload: LoginInput) => Promise<AuthUser>;
  register: (payload: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
  revokeSessions: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    setStatus('ready');
    setAuthError(null);
  }, []);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    const promise = (async () => {
      try {
        const response = await fetch('/api/auth/refresh', { method: 'POST' });
        
        if (response.status === 401) {
           clearAuth();
           return null;
        }

        const payload = await response.json();
        if (!response.ok || payload.error || !payload.token) {
          // If it's not a 401 but failed (e.g. 500), we probably shouldn't log out immediately
          // unless the error specifically indicates session invalidity.
          // For now, we return null so the caller knows it failed, but we keep the local state
          // in case it's a temporary network blip.
           return null;
        }
        setToken(payload.token as string);
        if (payload.user) {
          setUser(payload.user as AuthUser);
        }
        setStatus('ready');
        return payload.token as string;
      } catch (error) {
        // Network errors or JSON parsing errors shouldn't log the user out
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();
    refreshPromiseRef.current = promise;
    return promise;
  }, [clearAuth]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshSession();
      if (!cancelled) {
        setStatus('ready');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  const submitAuthRequest = useCallback(async (path: string, body: Record<string, unknown>) => {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok || payload.error) {
      throw new Error(payload.error || 'Unable to process request.');
    }
    return payload as AuthResponse;
  }, []);

  const login = useCallback(
    async (payload: LoginInput): Promise<AuthUser> => {
      setIsAuthenticating(true);
      setAuthError(null);
      try {
        const result = await submitAuthRequest('/api/auth/login', payload);
        setToken(result.token);
        setUser(result.user);
        setStatus('ready');
        return result.user;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to sign in right now.';
        setAuthError(message);
        throw new Error(message);
      } finally {
        setIsAuthenticating(false);
      }
    },
    [submitAuthRequest]
  );

  const register = useCallback(
    async (payload: RegisterInput): Promise<AuthUser> => {
      setIsAuthenticating(true);
      setAuthError(null);
      try {
        const result = await submitAuthRequest('/auth/register', payload);
        setToken(result.token);
        setUser(result.user);
        setStatus('ready');
        return result.user;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create the account right now.';
        setAuthError(message);
        throw new Error(message);
      } finally {
        setIsAuthenticating(false);
      }
    },
    [submitAuthRequest]
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const revokeSessions = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const activeToken = token ?? (await refreshSession());
      if (!activeToken) {
        throw new Error('Session expired. Please log in again.');
      }
      const response = await fetch('/auth/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Unable to revoke sessions.');
      }
      clearAuth();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to revoke sessions.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsAuthenticating(false);
    }
  }, [token, clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      status,
      authError,
      isAuthenticating,
      login,
      register,
      logout,
      revokeSessions,
      refreshSession,
    }),
    [user, token, status, authError, isAuthenticating, login, register, logout, revokeSessions, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
