import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { AuthUser, UserAddress } from '../types';

type AccountStatus = 'idle' | 'loading' | 'success' | 'error';

type AccountData = {
  profile: AuthUser | null;
  addresses: UserAddress[];
  status: AccountStatus;
  error?: string;
};

export function useAccountData() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [status, setStatus] = useState<AccountStatus>('idle');
  const [error, setError] = useState<string>();

  const headers = token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : null;

  const fetchAccount = useCallback(async () => {
    if (!headers) {
      setProfile(null);
      setAddresses([]);
      setStatus('idle');
      setError(undefined);
      return;
    }
    setStatus('loading');
    setError(undefined);
    try {
      const response = await fetch('/account', { headers });
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
  }, [headers]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const updateProfile = useCallback(
    async (updates: { displayName?: string; fullName?: string }) => {
      if (!headers) {
        throw new Error('Not authenticated.');
      }
      const body = JSON.stringify(updates);
      const response = await fetch('/account/profile', {
        method: 'PUT',
        headers,
        body,
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Unable to update profile.');
      }
      await fetchAccount();
    },
    [headers, fetchAccount]
  );

  const createAddress = useCallback(
    async (address: Partial<UserAddress>) => {
      if (!headers) {
        throw new Error('Not authenticated.');
      }
      const response = await fetch('/account/addresses', {
        method: 'POST',
        headers,
        body: JSON.stringify(address),
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Unable to save address.');
      }
      await fetchAccount();
      return payload.address as UserAddress;
    },
    [headers, fetchAccount]
  );

  const updateAddress = useCallback(
    async (address: Partial<UserAddress> & { id: string }) => {
      if (!headers) {
        throw new Error('Not authenticated.');
      }
      const response = await fetch('/account/addresses', {
        method: 'PUT',
        headers,
        body: JSON.stringify(address),
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Unable to update address.');
      }
      await fetchAccount();
      return payload.address as UserAddress;
    },
    [headers, fetchAccount]
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      if (!headers) {
        throw new Error('Not authenticated.');
      }
      const response = await fetch('/account/addresses', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id }),
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Unable to delete address.');
      }
      await fetchAccount();
    },
    [headers, fetchAccount]
  );

  const setDefaultAddress = useCallback(
    async (id: string) => {
      if (!headers) {
        throw new Error('Not authenticated.');
      }
      const response = await fetch('/account/addresses', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id }),
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Unable to update address.');
      }
      await fetchAccount();
    },
    [headers, fetchAccount]
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
