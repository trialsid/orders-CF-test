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
  return '/browse';
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
        switchPrompt: t('auth.switchPrompt'), // Assuming this key works for both or checking if 'auth.switchPrompt' is generic
      };
    }
    return {
      title: t('auth.registerTitle'),
      description: t('auth.registerDescription'),
      submit: t('auth.submitRegister'),
      switchLabel: t('auth.switchToLogin'),
      switchPath: '/auth/login',
      switchPrompt: t('auth.switchPrompt'),
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
      spacing="compact"
      contentClassName="flex flex-col items-center justify-center min-h-[60vh]"
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-emerald-900 dark:text-emerald-100">
            {labels.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {labels.description}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-100/70 bg-white p-8 shadow-xl shadow-emerald-900/5 dark:border-emerald-900/60 dark:bg-slate-950/70 dark:shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('auth.phoneLabel')}
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200/50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/50"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="9876543210"
                required
              />
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('auth.displayNameLabel')}
                </label>
                <input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200/50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/50"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={t('auth.displayNamePlaceholder')}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('auth.displayNameHelper')}</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('auth.passwordLabel')}
                </label>
              </div>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200/50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/50"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('auth.passwordHelper')}</p>
            </div>

            {(localError || authError) && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-200">
                {localError || authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-900"
              disabled={isAuthenticating}
            >
              {isAuthenticating ? t('auth.submitting') : labels.submit}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600 dark:text-slate-400">{labels.switchPrompt} </span>
            <Link
              to={labels.switchPath}
              className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              {labels.switchLabel}
            </Link>
          </div>
        </div>
      </div>
    </PageSection>
  );
}

export default AuthPage;
