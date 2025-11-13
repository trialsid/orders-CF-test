import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageSection from '../components/PageSection';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { useTranslations } from '../i18n/i18n';

type AuthMode = 'login' | 'register';

type AuthPageProps = {
  mode: AuthMode;
};

const cleanPhone = (value: string): string => value.replace(/\D/g, '');

const getDashboardPath = (role: UserRole): string => {
  if (role === 'admin') {
    return '/admin';
  }
  if (role === 'rider') {
    return '/rider';
  }
  return '/orders';
};

function AuthPage({ mode }: AuthPageProps): JSX.Element {
  const { t } = useTranslations();
  const { login, register, isAuthenticating, authError, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const redirectTarget = useMemo(() => {
    const state = location.state as { from?: string } | undefined;
    if (state?.from) {
      return state.from;
    }
    if (user) {
      return getDashboardPath(user.role);
    }
    return '/';
  }, [location.state, user]);

  useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [navigate, user]);

  const labels = useMemo(() => {
    if (mode === 'login') {
      return {
        title: t('auth.loginTitle'),
        description: t('auth.loginDescription'),
        submit: t('auth.submitLogin'),
        switchLabel: t('auth.switchToRegister'),
        switchPath: '/auth/register',
      };
    }
    return {
      title: t('auth.registerTitle'),
      description: t('auth.registerDescription'),
      submit: t('auth.submitRegister'),
      switchLabel: t('auth.switchToLogin'),
      switchPath: '/auth/login',
    };
  }, [mode, t]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    const numericPhone = cleanPhone(phone);
    if (numericPhone.length < 6) {
      setLocalError(t('auth.validation.phone'));
      return;
    }
    if (password.length < 8) {
      setLocalError(t('auth.validation.password'));
      return;
    }

    try {
      const fromPath = (location.state as { from?: string } | undefined)?.from;
      if (mode === 'login') {
        const nextUser = await login({ phone: numericPhone, password });
        navigate(fromPath ?? getDashboardPath(nextUser.role), { replace: true });
      } else {
        const nextUser = await register({
          phone: numericPhone,
          password,
          displayName: displayName.trim() || undefined,
        });
        navigate(getDashboardPath(nextUser.role), { replace: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.genericError');
      setLocalError(message);
    }
  };

  return (
    <PageSection
      title={labels.title}
      description={labels.description}
      eyebrow={t('auth.eyebrow')}
      spacing="compact"
      contentClassName="max-w-3xl"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-emerald-100/70 bg-white/95 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-950/70"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                {t('auth.phoneLabel')}
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-4 py-2 text-base text-emerald-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="9876543210"
                required
              />
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="displayName" className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  {t('auth.displayNameLabel')}
                </label>
                <input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-4 py-2 text-base text-emerald-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={t('auth.displayNamePlaceholder')}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{t('auth.displayNameHelper')}</p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                {t('auth.passwordLabel')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-4 py-2 text-base text-emerald-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                required
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{t('auth.passwordHelper')}</p>
            </div>
          </div>

          {(localError || authError) && (
            <p className="mt-4 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/40 dark:text-rose-100">
              {localError || authError}
            </p>
          )}

          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-base font-semibold text-white shadow-brand transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-60"
            disabled={isAuthenticating}
          >
            {isAuthenticating ? t('auth.submitting') : labels.submit}
          </button>

          <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
            {t('auth.helperText')}
          </p>
        </form>

        <aside className="rounded-3xl border border-emerald-100/70 bg-gradient-to-b from-emerald-50 to-white p-6 text-sm text-emerald-900 shadow-inner dark:border-emerald-900/60 dark:from-slate-900 dark:to-slate-950 dark:text-emerald-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
            {t('auth.sidebarTitle')}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-emerald-900 dark:text-emerald-50">{t('auth.sidebarHeadline')}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('auth.sidebarBody')}</p>
          <div className="mt-6 rounded-2xl border border-dashed border-emerald-200/70 p-4 dark:border-emerald-900/60">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
              {t('auth.nextStepsTitle')}
            </p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-200">
              <li>{t('auth.nextStepsLine1')}</li>
              <li>{t('auth.nextStepsLine2')}</li>
              <li>{t('auth.nextStepsLine3')}</li>
            </ul>
          </div>
          <p className="mt-6 text-sm">
            {t('auth.switchPrompt')}{' '}
            <Link to={labels.switchPath} className="font-semibold text-brand-600 underline-offset-2 hover:underline dark:text-brand-300">
              {labels.switchLabel}
            </Link>
          </p>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{t('auth.redirectNote', { destination: redirectTarget })}</p>
        </aside>
      </div>
    </PageSection>
  );
}

export default AuthPage;
