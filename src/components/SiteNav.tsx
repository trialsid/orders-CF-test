import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Moon, Sun, Phone, Menu, X, ShoppingCart } from 'lucide-react';

type SiteNavProps = {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  cartCount: number;
};

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Discover', to: '/discover' },
  { label: 'Cart', to: '/cart' },
  { label: 'Checkout', to: '/checkout' },
  { label: 'Orders', to: '/orders' },
  { label: 'Support', to: '/support' },
];

function SiteNav({ theme, onToggleTheme, cartCount }: SiteNavProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100/60 bg-white/90 shadow-sm backdrop-blur dark:border-emerald-900/40 dark:bg-slate-950/80">
      <div className="page-shell flex items-center justify-between gap-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 text-base font-semibold text-white">
            OI
          </span>
          <div className="hidden sm:block">
            <p className="font-display text-lg font-semibold text-emerald-900 dark:text-brand-100">Order.Ieeja</p>
            <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-200/80">Fresh groceries delivered today</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
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
            to="/cart"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/70 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
            aria-label="Open cart"
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
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          <a
            className="hidden items-center gap-2 rounded-full border border-brand-500/20 bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 md:inline-flex"
            href="tel:+919876543210"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/70 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200 md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="page-shell pb-4 md:hidden">
          <div className="flex flex-col gap-2 rounded-2xl border border-emerald-100/60 bg-white/90 p-4 text-sm shadow-sm dark:border-emerald-900/60 dark:bg-slate-900/80">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 font-semibold ${
                    isActive
                      ? 'bg-brand-500 text-white'
                      : 'text-emerald-800 hover:bg-emerald-100/80 dark:text-emerald-200 dark:hover:bg-emerald-900/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <a
              className="rounded-full px-4 py-2 font-semibold text-emerald-800 hover:bg-emerald-100/80 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
              href="tel:+919876543210"
            >
              Call the store
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

export default SiteNav;
