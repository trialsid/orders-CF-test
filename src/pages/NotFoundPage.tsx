import React from 'react';
import { Frown, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageSection from '../components/PageSection';
import { useTranslations } from '../i18n/i18n';
import { useHomePath } from '../hooks/useHomePath';

function NotFoundPage(): JSX.Element {
  const { t } = useTranslations();
  const homePath = useHomePath();

  return (
    <PageSection spacing="compact" contentClassName="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="mb-6 rounded-full bg-slate-100 p-6 dark:bg-slate-900/30">
        <Frown className="h-16 w-16 text-slate-600 dark:text-slate-400" />
      </div>
      
      <h1 className="mb-3 font-display text-3xl font-bold text-slate-900 dark:text-white">
        {t('errors.notFoundTitle') || 'Page Not Found'}
      </h1>
      
      <p className="mb-8 max-w-md text-slate-600 dark:text-slate-400">
        {t('errors.notFoundDescription') || "We couldn't find the page you're looking for. It might have been moved or deleted."}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to={homePath}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.goBackHome') || 'Go Back Home'}
        </Link>
      </div>
    </PageSection>
  );
}

export default NotFoundPage;
