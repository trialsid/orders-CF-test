import React, { useEffect, useState } from 'react';
import type { Product } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { Moon, Phone, Sun, Menu, X, ArrowRight, Sparkles, TrendingUp, Car, Sunrise } from 'lucide-react';

const metrics = [
  { label: 'Households served', value: '180+', icon: <TrendingUp className="h-5 w-5" /> },
  { label: 'Same-day slots', value: '12', icon: <Sunrise className="h-5 w-5" /> },
  { label: 'Free delivery from', value: '₹499', icon: <Car className="h-5 w-5" /> },
];

type HeaderProps = {
  highlights: Product[];
  onBrowse: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
};

function Header({ highlights, onBrowse, theme, onToggleTheme }: HeaderProps): JSX.Element {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNavOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navOpen]);

  const closeNav = () => setNavOpen(false);

  return (
    <header className="relative isolate overflow-hidden border-b border-emerald-100/60 bg-gradient-to-b from-brand-50/80 to-transparent pb-20 dark:border-emerald-900/40 dark:from-emerald-900/30">
      <div className="absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.25),_transparent_60%)]" />

      <div className="page-shell">
        <nav className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-emerald-100/60 bg-white/80 p-4 shadow-lg shadow-brand-900/5 backdrop-blur dark:border-emerald-900/60 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 text-base font-semibold text-white">
              OI
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-emerald-900 dark:text-brand-100">Order.Ieeja</p>
              <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-200/80">Same-day groceries for Ieeja households</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/70 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <a
              className="hidden items-center gap-2 rounded-full border border-brand-500/20 bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:inline-flex"
              href="tel:+919876543210"
            >
              <Phone className="h-4 w-4" />
              <span>Call to order</span>
            </a>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/70 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200 sm:hidden"
              aria-label="Toggle menu"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((open) => !open)}
            >
              <span className="sr-only">Toggle menu</span>
              {navOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {navOpen && (
          <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-emerald-100/60 bg-white/90 p-4 text-sm shadow-sm dark:border-emerald-900/60 dark:bg-slate-900/80 sm:hidden">
            <a className="rounded-full px-4 py-2 font-medium text-emerald-800 hover:bg-emerald-100/80 dark:text-emerald-200 dark:hover:bg-emerald-900/50" href="#products" onClick={closeNav}>
              Shop inventory
            </a>
            <a className="rounded-full px-4 py-2 font-medium text-emerald-800 hover:bg-emerald-100/80 dark:text-emerald-200 dark:hover:bg-emerald-900/50" href="#contact" onClick={closeNav}>
              Contact & coverage
            </a>
            <a className="rounded-full px-4 py-2 font-medium text-emerald-800 hover:bg-emerald-100/80 dark:text-emerald-200 dark:hover:bg-emerald-900/50" href="tel:+919876543210">
              Call us
            </a>
          </div>
        )}

        <div className="relative mt-12 grid gap-12 lg:grid-cols-[1.1fr_minmax(0,0.75fr)]">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-700/40 dark:bg-brand-600/20 dark:text-brand-200">
                Same-day delivery • Ieeja town
              </span>
              <h1 className="font-display text-4xl font-semibold text-emerald-900 drop-shadow-sm dark:text-brand-100 sm:text-5xl">
                Order fresh staples online & receive them before dinner.
              </h1>
              <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
                Pick the essentials your kitchen needs right now. We handpack every order and dispatch twice daily across Ieeja, Gadwal bypass, and nearby gram panchayats.
              </p>
              <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onBrowse}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
              >
                Start ordering
                <ArrowRight className="h-5 w-5" />
              </button>
                <a
                  href="tel:+919876543210"
                  className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 px-5 py-3 text-base font-semibold text-brand-700 transition hover:border-brand-500 hover:text-brand-900 dark:border-brand-600/50 dark:text-brand-200 dark:hover:border-brand-400"
                >
                  Call +91 98765 43210
                </a>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="flex items-start gap-3 rounded-2xl border border-emerald-100/70 bg-white/80 p-4 text-left shadow-sm dark:border-emerald-900/60 dark:bg-slate-900/60">
                  <div className="rounded-full bg-brand-500/10 p-2 text-brand-600 dark:text-brand-300">{metric.icon}</div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">{metric.label}</dt>
                    <dd className="mt-1 text-2xl font-semibold text-emerald-900 dark:text-brand-100">{metric.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-3xl border border-emerald-100/70 bg-white/80 p-6 shadow-xl shadow-brand-900/10 backdrop-blur dark:border-emerald-900/50 dark:bg-slate-900/70">
            <h2 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">Today’s handpicked items</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Fresh arrivals curated from local farmers, dairies, and suppliers. Add them straight to your basket below.
              </p>
            <ul className="mt-6 space-y-4 text-sm text-emerald-900 dark:text-emerald-100">
              {highlights.length ? (
                highlights.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-100/80 bg-white/80 px-4 py-3 shadow-sm dark:border-emerald-900/70 dark:bg-slate-900/60">
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{item.unit}</p>
                    </div>
                    <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">{formatCurrency(item.price)}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-emerald-200/70 bg-white/60 px-4 py-3 text-sm text-slate-500 dark:border-emerald-800/60 dark:bg-slate-900/40">
                  Loading daily picks...
                </li>
              )}
            </ul>
            <div className="mt-6 rounded-2xl border border-brand-100/70 bg-brand-500/10 px-4 py-3 text-xs font-medium text-brand-700 dark:border-brand-700/40 dark:bg-brand-900/20 dark:text-brand-200">
              Delivery windows: 11:30 AM • 6:30 PM. Place your order at least 45 minutes prior to slot time.
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
