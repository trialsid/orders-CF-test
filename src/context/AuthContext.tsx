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
};

type StoredAuthState = {
  token: string;
  user?: AuthUser | null;
};

const STORAGE_KEY = 'order-ieeja::auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredAuth = (): StoredAuthState | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredAuthState;
  } catch (error) {
    console.warn('Failed to read stored auth state', error);
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const stored = typeof window !== 'undefined' ? readStoredAuth() : null;
  const [token, setToken] = useState<string | null>(stored?.token ?? null);
  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null);
  const [status, setStatus] = useState<AuthStatus>(() => (stored?.token ? 'checking' : 'ready'));
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const profileEtagRef = useRef<string | null>(null);

  const persistAuth = useCallback((nextToken: string | null, nextUser: AuthUser | null) => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!nextToken) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: nextToken,
        user: nextUser,
      })
    );
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    setStatus('ready');
    setAuthError(null);
    profileEtagRef.current = null;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    persistAuth(token, user);
  }, [persistAuth, token, user]);

  useEffect(() => {
    if (!token) {
      setStatus('ready');
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const shouldShowSpinner = !user;
    if (shouldShowSpinner) {
      setStatus('checking');
    }

    (async () => {
      try {
        const response = await fetch('/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            ...(profileEtagRef.current ? { 'If-None-Match': profileEtagRef.current } : {}),
          },
          signal: controller.signal,
        });
        if (response.status === 304) {
          if (!cancelled) {
            setStatus('ready');
          }
          return;
        }
        const payload = await response.json();
        if (!response.ok || payload.error) {
          throw new Error(payload.error || 'Unable to refresh session.');
        }
        if (cancelled) {
          return;
        }
        profileEtagRef.current = response.headers.get('ETag');
        setUser(payload.user as AuthUser);
        setStatus('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.warn('Auth session refresh failed', error);
        clearAuth();
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, clearAuth]);

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
        const result = await submitAuthRequest('/auth/login', payload);
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

  const revokeSessions = useCallback(async () => {
    if (!token) return;
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const response = await fetch('/auth/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      logout: clearAuth,
      revokeSessions,
    }),
    [user, token, status, authError, isAuthenticating, login, register, clearAuth, revokeSessions]
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
