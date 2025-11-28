import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { AuthUser, UserAddress } from '../types';
import { useApiClient } from './useApiClient';

type AccountStatus = 'idle' | 'loading' | 'success' | 'error';

type AccountData = {
  profile: AuthUser | null;
  addresses: UserAddress[];
  status: AccountStatus;
  error?: string;
};

export function useAccountData() {
  const { token } = useAuth();
  const { apiFetch } = useApiClient();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [status, setStatus] = useState<AccountStatus>('idle');
  const [error, setError] = useState<string>();

  const headers = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        : null,
    [token]
  );

  const fetchAccount = useCallback(async () => {
    if (!token || !headers) {
      setProfile(null);
      setAddresses([]);
      setStatus('idle');
      setError(undefined);
      return;
    }
    setStatus('loading');
    setError(undefined);
    try {
      const response = await apiFetch('/api/account', { headers, tokenOverride: token ?? undefined });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Unable to load account details.');
      }
      setProfile(payload.user ?? null);
      setAddresses(payload.addresses ?? []);
      setStatus('success');
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Unable to load account details.';
      setError(message);
      setStatus('error');
    }
  }, [headers, apiFetch]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const updateProfile = useCallback(
    async (updates: { displayName?: string; fullName?: string }) => {
      if (!headers) {
        throw new Error('Not authenticated.');
      }
      const body = JSON.stringify(updates);
      const response = await apiFetch('/api/account/profile', {
        method: 'PUT',
        headers,
        body,
        tokenOverride: token ?? undefined,
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Unable to update profile.');
      }
      await fetchAccount();
    },
    [headers, fetchAccount, apiFetch]
  );

  const createAddress = useCallback(
    async (address: Partial<UserAddress>) => {
      if (!headers) {
        throw new Error('Not authenticated.');
      }
      const response = await apiFetch('/api/account/addresses', {
        method: 'POST',
        headers,
        body: JSON.stringify(address),
        tokenOverride: token ?? undefined,
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Unable to save address.');
      }
      await fetchAccount();
      return payload.address as UserAddress;
    },
    [headers, fetchAccount, apiFetch]
  );

  const updateAddress = useCallback(
    async (address: Partial<UserAddress> & { id: string }) => {
      if (!headers) {
        throw new Error('Not authenticated.');
      }
      const response = await apiFetch('/api/account/addresses', {
        method: 'PUT',
        headers,
        body: JSON.stringify(address),
        tokenOverride: token ?? undefined,
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Unable to update address.');
      }
      await fetchAccount();
      return payload.address as UserAddress;
    },
    [headers, fetchAccount, apiFetch]
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      if (!headers) {
        throw new Error('Not authenticated.');
      }
      const response = await apiFetch('/api/account/addresses', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id }),
        tokenOverride: token ?? undefined,
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Unable to delete address.');
      }
      await fetchAccount();
    },
    [headers, fetchAccount, apiFetch]
  );

  const setDefaultAddress = useCallback(
    async (id: string) => {
      if (!headers) {
        throw new Error('Not authenticated.');
      }
      const response = await apiFetch('/api/account/addresses', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id }),
        tokenOverride: token ?? undefined,
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Unable to update address.');
      }
      await fetchAccount();
    },
    [headers, fetchAccount, apiFetch]
  );

  return {
    profile,
    addresses,
    status,
    error,
    refresh: fetchAccount,
    updateProfile,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
}
