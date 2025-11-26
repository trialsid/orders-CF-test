import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

type ApiFetchOptions = RequestInit & {
  skipAuthRefresh?: boolean;
  tokenOverride?: string | null;
};

export function useApiClient() {
  const { token, refreshSession, logout } = useAuth();
  const tokenRef = useRef<string | null>(token);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const apiFetch = useCallback(
    async (input: RequestInfo | URL, init?: ApiFetchOptions) => {
      const { skipAuthRefresh, tokenOverride, ...rest } = init ?? {};
      const doFetch = async (authToken?: string | null) => {
        const headers = new Headers(rest.headers || {});
        if (authToken) {
          headers.set('Authorization', `Bearer ${authToken}`);
        }
        return fetch(input, { ...rest, headers });
      };

      let response = await doFetch(tokenOverride ?? tokenRef.current);

      if (!skipAuthRefresh && response.status === 401) {
        const refreshedToken = await refreshSession();
        if (!refreshedToken) {
          logout();
          return response;
        }
        response = await doFetch(refreshedToken);
        if (response.status === 401) {
          logout();
        }
      }

      return response;
    },
    [logout, refreshSession]
  );

  return { apiFetch };
}
