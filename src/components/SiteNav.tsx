import React, { useState, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Phone, Menu, X, ShoppingCart, ChevronDown, UserCircle2, LogOut, Search, Settings, Languages, Compass, Package, Truck, LayoutDashboard, ChevronRight } from 'lucide-react';
import { useTranslations } from '../i18n/i18n';
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
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${checked ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
          }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
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
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { locale, setLocale, t } = useTranslations();
  const { user, status: authStatus, logout } = useAuth();

  const homePath = useMemo(() => {
    if (user) {
      if (user.role === 'admin') {
        return '/admin';
      }
      if (user.role === 'rider') {
        return '/rider';
      }
      return '/browse'; // Default for customer
    }
    return '/'; // Logged out users go to landing page
  }, [user]);

  useLayoutEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const updateHeight = () => setHeaderHeight(node.getBoundingClientRect().height);
    updateHeight();

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateHeight) : null;
    observer?.observe(node);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  const isAuthReady = authStatus === 'ready';
  const accountDestination = user ? '/account' : '/auth/login';
  const userDisplayName = user?.fullName ?? user?.displayName ?? user?.phone ?? '';
  const isRider = user?.role === 'rider';

  const navItems = useMemo(() => {
    return [
      { label: t('nav.discover'), to: '/browse', icon: <Compass className="h-4 w-4" /> },
      { label: t('nav.orders'), to: '/orders', icon: <Package className="h-4 w-4" /> },
    ];
  }, [t]);

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

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const { body, documentElement } = document;

    const previousBodyOverflow = body.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousHeaderPaddingRight = headerRef.current ? headerRef.current.style.paddingRight : '';

    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    documentElement.style.overflow = 'hidden';

    // Add padding to prevent layout shift if scrollbar exists
    // Only if the browser doesn't support scrollbar-gutter (which handles this natively)
    const supportsScrollbarGutter = window.CSS && CSS.supports('scrollbar-gutter: stable');
    
    if (!supportsScrollbarGutter && scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
      if (headerRef.current) {
        headerRef.current.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setUtilityOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.touchAction = previousBodyTouchAction;
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.paddingRight = previousBodyPaddingRight;

      if (headerRef.current) {
        headerRef.current.style.paddingRight = previousHeaderPaddingRight;
      }

      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

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
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 border-b border-emerald-100/60 bg-white/90 shadow-sm backdrop-blur dark:border-emerald-900/40 dark:bg-slate-950/80"
      >
        <a href="#main-content" className="skip-link">
          {t('nav.skipToContent')}
        </a>
        <div className="page-shell relative z-20 flex flex-wrap items-center gap-3 py-3 sm:gap-4 sm:py-4">
          <Link to={homePath} className="flex items-center gap-3">
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

          <div className="ml-auto flex items-center gap-2">
            {/* Work Console Button for Staff */}
            {user && (user.role === 'admin' || user.role === 'rider') && (
              <>
                <Link
                  to={user.role === 'admin' ? '/admin' : '/rider'}
                  className="hidden md:inline-flex h-11 items-center gap-2 rounded-full bg-emerald-900 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                  aria-label={user.role === 'admin' ? t('nav.adminConsole') : t('nav.riderConsole')}
                >
                  {user.role === 'admin' ? <LayoutDashboard className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                  <span>{user.role === 'admin' ? 'Admin' : 'Rider'}</span>
                </Link>
                {/* Mobile Icon Only Button */}
                <Link
                  to={user.role === 'admin' ? '/admin' : '/rider'}
                  className="inline-flex md:hidden h-11 w-11 items-center justify-center rounded-full bg-emerald-900 text-white shadow-sm transition hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                  aria-label={user.role === 'admin' ? t('nav.adminConsole') : t('nav.riderConsole')}
                >
                  {user.role === 'admin' ? <LayoutDashboard className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                </Link>
              </>
            )}

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
                <div
                  className="absolute right-0 top-[calc(100%+0.5rem)] w-80 overflow-hidden rounded-3xl border border-emerald-100/70 bg-white p-3 shadow-xl shadow-emerald-200/50 ring-1 ring-emerald-100/60 dark:border-emerald-900/70 dark:bg-slate-950 dark:shadow-emerald-950/40 dark:ring-emerald-900/60 transition-all duration-300 ease-out transform opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100"
                  data-state={utilityOpen ? 'open' : 'closed'}
                >
                  {user && (user.role === 'admin' || user.role === 'rider') && (
                    <>
                      <Link
                        to={user.role === 'admin' ? '/admin' : '/rider'}
                        onClick={() => setUtilityOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500/10 py-3 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-500/20 dark:bg-brand-900/30 dark:text-brand-200 dark:hover:bg-brand-900/40"
                      >
                        {user.role === 'admin' ? <LayoutDashboard className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                        {user.role === 'admin' ? t('nav.adminConsole') : t('nav.riderConsole')}
                      </Link>
                      <div className="mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800" />
                    </>
                  )}

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
      </header>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div style={{ height: headerHeight }} aria-hidden="true" />

      {open && createPortal(
        <div
          className="fixed inset-0 z-[100] md:hidden"
          role="dialog"
          aria-modal="true"
          data-state={open ? 'open' : 'closed'}
          style={{ top: headerHeight ? headerHeight - 1 : undefined, '--header-height': `${headerHeight}px` } as React.CSSProperties}
          onClick={() => {
            setOpen(false);
            setUtilityOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur transition-opacity duration-200" aria-hidden="true" />
          <div
            className="relative w-full overflow-hidden rounded-b-3xl bg-white/90 backdrop-blur shadow-2xl shadow-emerald-900/20 transition-all duration-300 ease-out animate-in slide-in-from-top-4 dark:bg-slate-950/80 dark:shadow-emerald-950/50"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col max-h-[calc(100vh-var(--header-height,80px))] overflow-y-auto px-4 pb-6 pt-4">
              {/* 1. Identity / Login Section */}
              {user ? (
                <Link
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-100/60 bg-emerald-50/50 p-3 transition active:scale-[0.98] dark:border-emerald-900/60 dark:bg-emerald-900/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200 text-lg font-bold text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100">
                    {userDisplayName ? userDisplayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-lg font-bold text-emerald-950 dark:text-emerald-100">
                      {userDisplayName}
                    </p>
                    <p className="truncate text-base font-medium text-emerald-600/80 dark:text-emerald-400/80">
                      {user.phone} • <span className="capitalize">{user.role}</span>
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-emerald-400" />
                </Link>
              ) : (
                <div className="mb-4 rounded-2xl border border-emerald-100/60 bg-emerald-50/30 p-3 dark:border-emerald-900/60 dark:bg-emerald-900/10">
                  <p className="mb-3 text-center text-sm text-emerald-800/80 dark:text-emerald-200/80">
                    Sign in to manage orders and save your address.
                  </p>
                  <Link
                    to="/auth/login"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-base font-bold text-white shadow-brand-500/20 shadow-lg transition hover:bg-brand-600"
                  >
                    {t('nav.signIn')}
                  </Link>
                </div>
              )}

              {/* 2. Work Console (Admin/Rider) */}
              {user && (user.role === 'admin' || user.role === 'rider') && (
                <Link
                  to={user.role === 'admin' ? '/admin' : '/rider'}
                  onClick={() => setOpen(false)}
                  className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-900 py-3.5 text-base font-bold text-white shadow-md shadow-emerald-900/10 transition active:scale-[0.98] dark:from-emerald-700 dark:to-emerald-800"
                >
                  {user.role === 'admin' ? <LayoutDashboard className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                  {user.role === 'admin' ? t('nav.adminConsole') : t('nav.riderConsole')}
                </Link>
              )}

              {/* 3. Navigation Grid */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex flex-row items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${isActive
                        ? 'border-brand-500/50 bg-brand-50/50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-900/20 dark:text-brand-200'
                        : 'border-emerald-100/60 bg-white text-slate-600 active:bg-slate-50 dark:border-emerald-800/60 dark:bg-slate-900 dark:text-slate-300'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`rounded-full p-2 ${isActive ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {React.cloneElement(item.icon as React.ReactElement, { className: 'h-5 w-5' })}
                        </div>
                        <span className="text-base font-semibold">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
                {/* Add Cart Link to Grid for convenience */}
                <NavLink
                  to="/checkout"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-row items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${isActive
                      ? 'border-brand-500/50 bg-brand-50/50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-900/20 dark:text-brand-200'
                      : 'border-emerald-100/60 bg-white text-slate-600 active:bg-slate-50 dark:border-emerald-800/60 dark:bg-slate-900 dark:text-slate-300'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`relative rounded-full p-2 ${isActive ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        <ShoppingCart className="h-5 w-5" />
                        {cartCount > 0 && (
                          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-0.5 text-[10px] font-bold text-white">
                            {cartCount}
                          </span>
                        )}
                      </div>
                      <span className="text-base font-semibold">{t('nav.checkout')}</span>
                    </>
                  )}
                </NavLink>
              </div>

              {/* 4. Utilities */}
              <div className="space-y-1 rounded-2xl border border-emerald-100/60 bg-slate-50/50 p-3 dark:border-emerald-900/60 dark:bg-slate-900/30">
                <h4 className="px-1 text-sm font-bold uppercase tracking-wider text-slate-400">Settings</h4>
                <NavSwitch
                  label="Telugu / తెలుగు"
                  icon={<Languages className="h-5 w-5" />}
                  checked={locale === 'te'}
                  onChange={() => setLocale(locale === 'en' ? 'te' : 'en')}
                />
                <NavSwitch
                  label="Dark Mode"
                  icon={<Moon className="h-5 w-5" />}
                  checked={theme === 'dark'}
                  onChange={onToggleTheme}
                />

                <div className="my-2 h-px bg-slate-200 dark:bg-slate-800" />

                <a
                  href="tel:+919876543210"
                  className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-base font-medium text-slate-700 transition hover:bg-white dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <span>{t('nav.callToOrder')}</span>
                  </div>
                </a>

                {user && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-base font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="h-5 w-5 opacity-70" />
                      <span>{t('nav.signOut')}</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default SiteNav;
