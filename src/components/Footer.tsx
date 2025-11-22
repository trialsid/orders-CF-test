import React from 'react';
import { useTranslations } from '../i18n/i18n';

type FooterProps = {
  year: number;
};

function Footer({ year }: FooterProps): JSX.Element {
  const { t } = useTranslations();

  return (
    <footer className="hidden md:block border-t border-emerald-100/60 bg-white/80 py-8 text-sm text-slate-500 dark:border-emerald-900/60 dark:bg-slate-900/70 dark:text-slate-400">
      <div className="page-shell flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p>{t('footer.left', { year })}</p>
        <p>{t('footer.right')}</p>
      </div>
    </footer>
  );
}

export default Footer;
