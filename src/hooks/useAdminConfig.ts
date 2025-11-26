import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { AdminConfig } from '../types';
import { useApiClient } from './useApiClient';

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

type UseAdminConfigResult = {
  config?: AdminConfig;
  status: FetchStatus;
  error?: string;
  refresh: () => void;
  saveConfig: (updates: Partial<AdminConfig>) => Promise<void>;
  saving: boolean;
};

const DEFAULT_ERROR = 'Unable to load configuration right now.';

export function useAdminConfig(): UseAdminConfigResult {
  const { token } = useAuth();
  const { apiFetch } = useApiClient();
  const [config, setConfig] = useState<AdminConfig>();
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
       setStatus('idle');
       return;
    }
    setStatus('loading');
    setError(undefined);

    try {
      const response = await apiFetch('/config', {});
      const payload = await response.json();

      if (!response.ok || payload.error) {
        throw new Error(payload.error || DEFAULT_ERROR);
      }

      setConfig(payload.config);
      setStatus('success');
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : DEFAULT_ERROR;
      setError(message);
      setStatus('error');
    }
  }, [apiFetch, token]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  const saveConfig = useCallback(
    async (updates: Partial<AdminConfig>) => {
      if (!token) throw new Error('Not authenticated');
      setSaving(true);
      setError(undefined);
      try {
        const response = await apiFetch('/config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });
        const payload = await response.json();

        if (!response.ok || payload.error) {
          throw new Error(payload.error || 'Unable to save configuration.');
        }

        setConfig(payload.config);
        setStatus('success');
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : 'Unable to save configuration.';
        setError(message);
        setStatus('error');
        throw fetchError;
      } finally {
        setSaving(false);
      }
    },
    [apiFetch, token]
  );

  return { config, status, error, refresh, saveConfig, saving };
}
