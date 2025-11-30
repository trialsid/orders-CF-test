import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export function useHomePath(): string {
  const { user } = useAuth();

  return useMemo(() => {
    if (user) {
      if (user.role === 'admin') {
        return '/admin';
      }
      if (user.role === 'rider') {
        return '/rider';
      }
      return '/browse';
    }
    return '/';
  }, [user]);
}
