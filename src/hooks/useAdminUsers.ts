import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';
import { useApiClient } from './useApiClient';

type AdminUsersHook = {
  users: User[];
  status: 'loading' | 'idle' | 'error';
  error: string | null;
  refresh: () => Promise<void>;
  updateUserRole: (userId: string, role: User['role']) => Promise<void>;
  updateUserStatus: (userId: string, status: User['status']) => Promise<void>;
};

export function useAdminUsers(): AdminUsersHook {
  const { token } = useAuth();
  const { apiFetch } = useApiClient();
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (force = false) => {
    if (!token) {
      setStatus('idle');
      setUsers([]);
      return;
    }

    setStatus('loading');
    setError(null);
      try {
        const response = await apiFetch('/api/admin/users', {
          cache: force ? 'no-cache' : 'default',
          tokenOverride: token ?? undefined,
      });

      if (response.status === 304) {
        setStatus('idle');
        return;
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setStatus('idle');
    } catch (err) {
      console.error('Error fetching admin users:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  }, [apiFetch, token]);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    if (!token) return;

    try {
      const response = await apiFetch(`/admin/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId, ...updates }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update user');
      }

      // Refresh the list after successful update
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err; // Re-throw to allow UI to handle error
    }
  }, [fetchUsers, apiFetch, token]);

  const updateUserRole = useCallback(async (userId: string, role: User['role']) => {
    await updateUser(userId, { role });
  }, [updateUser]);

  const updateUserStatus = useCallback(async (userId: string, status: User['status']) => {
    await updateUser(userId, { status });
  }, [updateUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    status,
    error,
    refresh: () => fetchUsers(true),
    updateUserRole,
    updateUserStatus,
  };
}
