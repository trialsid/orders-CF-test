import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

type RequireAuthProps = {
  roles?: UserRole[];
  children: JSX.Element;
};

const FALLBACK_PATH = '/auth/login';

function RequireAuth({ roles, children }: RequireAuthProps): JSX.Element {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'checking') {
    return (
      <section className="page-shell py-28 text-center">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-300">Checking your access…</p>
      </section>
    );
  }

  if (!user) {
    return <Navigate to={FALLBACK_PATH} replace state={{ from: location.pathname }} />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={FALLBACK_PATH} replace state={{ from: location.pathname, denied: true }} />;
  }

  return children;
}

export default RequireAuth;
