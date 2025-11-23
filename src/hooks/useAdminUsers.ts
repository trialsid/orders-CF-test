import { useCallback, useEffect, useState } from 'react';
import type { User } from '../types';

type AdminUsersHook = {
  users: User[];
  status: 'loading' | 'idle' | 'error';
  error: string | null;
  refresh: () => Promise<void>;
  updateUserRole: (userId: string, role: User['role']) => Promise<void>;
  updateUserStatus: (userId: string, status: User['status']) => Promise<void>;
};

export function useAdminUsers(token?: string): AdminUsersHook {
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) {
      setStatus('idle');
      setUsers([]);
      return;
    }

    setStatus('loading');
    setError(null);
    try {
      const response = await fetch('/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
  }, [token]);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    if (!token) return;

    try {
      const response = await fetch(`/admin/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
  }, [token, fetchUsers]);

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
    refresh: fetchUsers,
    updateUserRole,
    updateUserStatus,
  };
}
