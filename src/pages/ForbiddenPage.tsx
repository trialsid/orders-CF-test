import React, { useMemo } from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageSection from '../components/PageSection';
import { useAuth } from '../context/AuthContext';
import { useTranslations } from '../i18n/i18n';

function ForbiddenPage(): JSX.Element {
  const { user } = useAuth();
  const { t } = useTranslations();

  const homePath = useMemo(() => {
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

  return (
    <PageSection spacing="compact" contentClassName="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="mb-6 rounded-full bg-rose-100 p-6 dark:bg-rose-900/30">
        <ShieldAlert className="h-16 w-16 text-rose-600 dark:text-rose-400" />
      </div>
      
      <h1 className="mb-3 font-display text-3xl font-bold text-slate-900 dark:text-white">
        {t('errors.accessDenied') || 'Access Denied'}
      </h1>
      
      <p className="mb-8 max-w-md text-slate-600 dark:text-slate-400">
        {t('errors.accessDeniedDescription') || "You don't have permission to view this page. Please sign in with an authorized account or return to the home page."}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to={homePath}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.goBack') || 'Go Back Home'}
        </Link>
      </div>
    </PageSection>
  );
}

export default ForbiddenPage;
