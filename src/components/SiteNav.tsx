import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Moon, Sun, Phone, Menu, X, ShoppingCart, ChevronDown, UserCircle2, LogOut } from 'lucide-react';
import { useTranslations, type Locale } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';

type SiteNavProps = {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  cartCount: number;
};

function SiteNav({ theme, onToggleTheme, cartCount }: SiteNavProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { locale, setLocale, t } = useTranslations();
  const { user, status: authStatus, logout } = useAuth();
  const isAuthReady = authStatus === 'ready';
  const accountDestination = user
    ? user.role === 'admin'
      ? '/admin'
      : user.role === 'rider'
        ? '/rider'
        : '/account'
    : '/auth/login';
  const accountLabel = user
    ? user.role === 'admin'
      ? t('nav.adminConsole')
      : user.role === 'rider'
        ? t('nav.riderConsole')
        : t('nav.account')
    : t('nav.signIn');
  const userDisplayName = user?.fullName ?? user?.displayName ?? user?.phone ?? '';

  const navItems = useMemo(
    () => [
      { label: t('nav.home'), to: '/' },
      { label: t('nav.discover'), to: '/browse' },
      { label: t('nav.orders'), to: '/orders' },
      { label: t('nav.support'), to: '/support' },
    ],
    [t]
  );

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLocaleChange = (value: Locale) => {
    setLocale(value);
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  return (
    <header className="relative sticky top-0 z-40 border-b border-emerald-100/60 bg-white/90 shadow-sm backdrop-blur dark:border-emerald-900/40 dark:bg-slate-950/80">
      <a href="#main-content" className="skip-link">
        {t('nav.skipToContent')}
      </a>
      <div className="page-shell flex items-center justify-between gap-3 py-3 sm:gap-4 sm:py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 text-base font-semibold text-white">
            OI
          </span>
          <div className="hidden sm:block">
            <p className="font-display text-lg font-semibold text-emerald-900 dark:text-brand-100">Order.Ieeja</p>
            <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-200/80">{t('nav.tagline')}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-emerald-800 hover:bg-emerald-100/70 dark:text-emerald-200 dark:hover:bg-emerald-900/60'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/checkout"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/70 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
            aria-label={t('nav.openCart')}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/70 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
            aria-label={t('nav.toggleTheme')}
          >
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          <label className="sr-only" htmlFor="locale-switcher">
            {t('nav.language')}
          </label>
          <div className="relative hidden md:block">
            <select
              id="locale-switcher"
              value={locale}
              onChange={(event) => handleLocaleChange(event.target.value as Locale)}
              className="appearance-none rounded-full border border-emerald-200/70 bg-white px-4 py-2 pr-9 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200 dark:hover:border-emerald-600"
            >
              <option value="en">{t('nav.english')}</option>
              <option value="te">{t('nav.telugu')}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500 dark:text-emerald-300" />
          </div>

          {isAuthReady && !user && (
            <Link
              to="/auth/login"
              className="hidden items-center gap-2 rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-100 md:inline-flex"
            >
              <UserCircle2 className="h-4 w-4" />
              {t('nav.signIn')}
            </Link>
          )}

          {isAuthReady && user && (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to={accountDestination}
                className="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-400 hover:text-brand-800 dark:border-brand-400/60 dark:bg-brand-900/30 dark:text-brand-200"
              >
                <UserCircle2 className="h-4 w-4" />
                {accountLabel}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/70 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-100"
                aria-label={t('nav.signOut')}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}

          <a
            className="hidden items-center gap-2 rounded-full border border-brand-500/20 bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 md:inline-flex"
            href="tel:+919876543210"
          >
            <Phone className="h-4 w-4" />
            <span>{t('nav.call')}</span>
          </a>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/70 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200 md:hidden"
            aria-label={t('nav.toggleMenu')}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 px-4 pb-6 md:hidden">
          <div className="flex max-h-[calc(100vh-6rem)] flex-col gap-3 overflow-y-auto rounded-3xl border border-emerald-100/60 bg-white/95 p-5 text-base shadow-lg shadow-emerald-200/40 backdrop-blur dark:border-emerald-900/60 dark:bg-slate-950/85 dark:text-emerald-100">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-5 py-3 font-semibold ${isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-emerald-800 hover:bg-emerald-100/80 dark:text-emerald-200 dark:hover:bg-emerald-900/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-100/60 bg-white/70 px-4 py-3 text-sm dark:border-emerald-900/60 dark:bg-slate-900/60">
              <span className="font-semibold text-emerald-700 dark:text-emerald-200">{t('nav.language')}</span>
              <div className="relative flex-1">
                <select
                  id="locale-switcher-mobile"
                  value={locale}
                  onChange={(event) => handleLocaleChange(event.target.value as Locale)}
                  className="w-full appearance-none rounded-full border border-emerald-200/70 bg-white px-3 py-2 pr-10 text-sm font-semibold text-emerald-800 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
                >
                  <option value="en">{t('nav.english')}</option>
                  <option value="te">{t('nav.telugu')}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500 dark:text-emerald-300" />
              </div>
            </div>
            <a
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:from-brand-600 hover:to-brand-700"
              href="tel:+919876543210"
            >
              {t('nav.callToOrder')}
            </a>
            {isAuthReady && !user && (
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center rounded-full border border-emerald-200/70 bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-200"
              >
                {t('nav.signIn')}
              </Link>
            )}
            {isAuthReady && user && (
              <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/40 dark:text-emerald-100">
                <div className="flex items-center gap-2 font-semibold">
                  <UserCircle2 className="h-5 w-5" />
                  {userDisplayName}
                </div>
                <Link
                  to={accountDestination}
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-brand-600 shadow-sm dark:bg-slate-950 dark:text-brand-200"
                >
                  {accountLabel}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                >
                  {t('nav.signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default SiteNav;
