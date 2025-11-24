import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Phone, Menu, X, ShoppingCart, ChevronDown, UserCircle2, LogOut, Search, Settings, Languages, Compass, CreditCard, Package, Truck } from 'lucide-react';
import { useTranslations, type Locale } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';

type SiteNavProps = {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  cartCount: number;
};

type NavSwitchProps = {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: () => void;
};

function NavSwitch({ label, icon, checked, onChange }: NavSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center justify-between rounded-2xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-white/5"
    >
      <div className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
        <div className="text-slate-400 dark:text-slate-500">{icon}</div>
        <span>{label}</span>
      </div>
      <div
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
          checked ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  );
}

function SiteNav({ theme, onToggleTheme, cartCount }: SiteNavProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [utilityOpen, setUtilityOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
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
  const isRider = user?.role === 'rider';

  const navItems = useMemo(() => {
    if (user?.role === 'rider') {
      return [{ label: t('nav.riderConsole'), to: '/rider', icon: <Truck className="h-4 w-4" /> }];
    }
    return [
      { label: t('nav.discover'), to: '/browse', icon: <Compass className="h-4 w-4" /> },
      { label: t('nav.checkout'), to: '/checkout', icon: <CreditCard className="h-4 w-4" /> },
      { label: t('nav.orders'), to: '/orders', icon: <Package className="h-4 w-4" /> },
    ];
  }, [t, user?.role]);

  useEffect(() => {
    setOpen(false);
    setUtilityOpen(false);
    // Clear search term when navigating away from browse page, or when the search query changes in the URL
    if (!location.pathname.startsWith('/browse')) {
      setSearchTerm('');
    } else {
      const params = new URLSearchParams(location.search);
      setSearchTerm(params.get('search') || '');
    }
  }, [location.pathname, location.search]);

  const utilityRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!utilityOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (utilityRef.current && !utilityRef.current.contains(event.target as Node)) {
        setUtilityOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUtilityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [utilityOpen]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    setUtilityOpen(false);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchTerm.trim())}`);
    } else if (location.pathname === '/browse' && location.search.includes('search=')) {
      navigate('/browse');
    }
    setOpen(false);
  };

  return (
    <header className="relative sticky top-0 z-40 border-b border-emerald-100/60 bg-white/90 shadow-sm backdrop-blur dark:border-emerald-900/40 dark:bg-slate-950/80">
      <a href="#main-content" className="skip-link">
        {t('nav.skipToContent')}
      </a>
      <div className="page-shell flex flex-wrap items-center gap-3 py-3 sm:gap-4 sm:py-4">
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
                `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${isActive
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-emerald-800 hover:bg-emerald-100/70 dark:text-emerald-200 dark:hover:bg-emerald-900/60'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {!isRider && (
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden flex-1 md:block md:ml-2 md:max-w-sm"
          >
            <label htmlFor="search-input" className="sr-only">{t('nav.search')}</label>
            <input
              id="search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="w-full rounded-full border border-emerald-200/70 bg-white py-2.5 pl-4 pr-10 text-sm shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-emerald-700 hover:text-emerald-900 dark:text-emerald-200 dark:hover:text-emerald-50"
              aria-label={t('nav.search')}
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isRider ? (
            <Link
              to="/rider"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/70 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
              aria-label={t('nav.riderConsole')}
            >
              <Truck className="h-5 w-5" />
            </Link>
          ) : (
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
          )}

          {isAuthReady && !user && (
            <Link
              to="/auth/login"
              className="hidden h-11 items-center gap-2 rounded-full border border-emerald-200/70 bg-white px-4 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-100 md:inline-flex"
            >
              <UserCircle2 className="h-4 w-4" />
              {t('nav.signIn')}
            </Link>
          )}

          <div className="relative hidden md:block" ref={utilityRef}>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setUtilityOpen((current) => !current);
                  setOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={utilityOpen}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-200/70 bg-white px-3 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
                  {userDisplayName ? userDisplayName.charAt(0).toUpperCase() : 'U'}
                </span>
                <span className="max-w-[140px] truncate text-left">{userDisplayName || t('nav.account')}</span>
                <ChevronDown className={`h-4 w-4 text-emerald-500 transition ${utilityOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setUtilityOpen((current) => !current);
                  setOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={utilityOpen}
                aria-label={t('nav.toggleMenu')}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-200/70 bg-white px-4 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-100"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.settings')}</span>
              </button>
            )}

            {utilityOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] w-80 overflow-hidden rounded-3xl border border-emerald-100/70 bg-white p-3 shadow-xl shadow-emerald-200/50 ring-1 ring-emerald-100/60 dark:border-emerald-900/70 dark:bg-slate-950 dark:shadow-emerald-950/40 dark:ring-emerald-900/60">
                {user && (
                  <>
                    <div className="mb-2 rounded-2xl bg-emerald-50/50 p-4 dark:bg-emerald-900/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200">
                          <span className="text-lg font-bold">
                            {userDisplayName ? userDisplayName.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate text-sm font-bold text-emerald-950 dark:text-emerald-100">
                            {userDisplayName}
                          </p>
                          <p className="truncate text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">
                            {user.phone}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link
                          to={accountDestination}
                          onClick={() => setUtilityOpen(false)}
                          className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200/60 bg-white py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
                        >
                          <UserCircle2 className="h-3.5 w-3.5" />
                          {t('nav.account')}
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setUtilityOpen(false)}
                          className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200/60 bg-white py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {t('nav.orders')}
                        </Link>
                      </div>
                    </div>
                    <div className="mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800" />
                  </>
                )}

                <div className="space-y-1 p-1">
                  <NavSwitch
                    label="Telugu / తెలుగు"
                    icon={<Languages className="h-4 w-4" />}
                    checked={locale === 'te'}
                    onChange={() => setLocale(locale === 'en' ? 'te' : 'en')}
                  />
                  <NavSwitch
                    label="Dark Mode"
                    icon={<Moon className="h-4 w-4" />}
                    checked={theme === 'dark'}
                    onChange={onToggleTheme}
                  />
                </div>

                <div className="mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800" />

                <div className="space-y-1 p-1">
                  <a
                    href="tel:+919876543210"
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <span>{t('nav.callToOrder')}</span>
                    </div>
                  </a>
                  
                  {user && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                    >
                      <div className="flex items-center gap-3">
                        <LogOut className="h-4 w-4 opacity-70" />
                        <span>{t('nav.signOut')}</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

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
          <div className="flex max-h-[calc(100vh-6rem)] flex-col gap-3 overflow-y-auto rounded-3xl border border-emerald-100/70 bg-white p-5 text-base shadow-xl shadow-emerald-200/50 ring-1 ring-emerald-100/60 dark:border-emerald-900/60 dark:bg-slate-950 dark:shadow-emerald-950/40 dark:ring-emerald-900/60 dark:text-emerald-100">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-3 rounded-full px-5 py-3 font-semibold ${isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-emerald-800 hover:bg-emerald-100/80 dark:text-emerald-200 dark:hover:bg-emerald-900/60'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
            
            <div className="space-y-2 rounded-3xl border border-emerald-100/60 bg-white/70 p-3 dark:border-emerald-900/60 dark:bg-slate-900/60">
              <NavSwitch
                label="Telugu / తెలుగు"
                icon={<Languages className="h-4 w-4" />}
                checked={locale === 'te'}
                onChange={() => setLocale(locale === 'en' ? 'te' : 'en')}
              />
              <NavSwitch
                label="Dark Mode"
                icon={<Moon className="h-4 w-4" />}
                checked={theme === 'dark'}
                onChange={onToggleTheme}
              />
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
