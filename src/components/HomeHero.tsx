import React from 'react';
import { ArrowRight, Sparkles, TrendingUp, Car, Sunrise } from 'lucide-react';
import type { Product } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { useTranslations, getDictionarySection } from '../i18n/i18n';

type HomeHeroProps = {
  highlights: Product[];
  onBrowse: () => void;
};

function HomeHero({ highlights, onBrowse }: HomeHeroProps): JSX.Element {
  const { t, dictionary } = useTranslations();
  const metrics = getDictionarySection<Array<{ label: string; value: string }>>(dictionary, 'metrics') ?? [];
  const metricIcons = [
    <TrendingUp className="h-5 w-5" />,
    <Sunrise className="h-5 w-5" />,
    <Car className="h-5 w-5" />,
  ];

  return (
    <section className="relative isolate overflow-hidden border-b border-emerald-100/60 bg-gradient-to-b from-brand-50/80 to-transparent pb-14 pt-8 dark:border-emerald-900/40 dark:from-emerald-900/30 sm:pb-20 sm:pt-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.25),_transparent_60%)]" />
      <div className="page-shell">
        <div className="relative mt-2 grid gap-10 lg:mt-4 lg:grid-cols-[1.1fr_minmax(0,0.9fr)] lg:gap-12">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-white/90 px-4 py-2 text-sm font-medium text-brand-700 shadow-sm backdrop-blur dark:border-emerald-900/60 dark:bg-slate-950/80 dark:text-brand-200">
              <Sparkles className="h-4 w-4" />
              {t('hero.badge')}
            </div>
            <div className="max-w-xl space-y-6">
              <h1 className="font-display text-3xl font-semibold text-emerald-950 sm:text-5xl dark:text-brand-50">{t('hero.title')}</h1>
              <p className="text-base text-slate-600 dark:text-slate-200 sm:text-lg">{t('hero.description')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={onBrowse}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 sm:w-auto"
              >
                {t('hero.startBrowsing')}
                <ArrowRight className="h-5 w-5" />
              </button>
              <a
                href="tel:+919876543210"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200/70 bg-white px-6 py-3 text-base font-semibold text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200 sm:w-auto"
              >
                {t('hero.call')}
              </a>
            </div>

            <dl className="grid gap-4 sm:grid-cols-3">
              {metrics.map((metric, index) => (
                <div
                  key={metric.label}
                  className="flex items-start gap-3 rounded-2xl border border-emerald-100/70 bg-white/80 p-4 text-left shadow-sm dark:border-emerald-900/60 dark:bg-slate-900/60"
                >
                  <div className="rounded-full bg-brand-500/10 p-2 text-brand-600 dark:text-brand-300">{metricIcons[index] ?? metricIcons[0]}</div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">{metric.label}</dt>
                    <dd className="mt-1 text-2xl font-semibold text-emerald-900 dark:text-brand-100">{metric.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-3xl border border-emerald-100/70 bg-white/80 p-5 shadow-xl shadow-brand-900/10 backdrop-blur dark:border-emerald-900/50 dark:bg-slate-900/70 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">{t('hero.highlightsTitle')}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('hero.highlightsDescription')}</p>
            <ul className="mt-6 space-y-4 text-sm text-emerald-900 dark:text-emerald-100">
              {highlights.length ? (
                highlights.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-100/80 bg-white/80 px-4 py-3 shadow-sm dark:border-emerald-900/70 dark:bg-slate-900/60"
                  >
                    <div>
                      <p className="flex items-center gap-2 font-semibold">
                        <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{item.department || item.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">{formatCurrency(item.price)}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-emerald-200/70 bg-white/60 px-4 py-3 text-sm text-slate-500 dark:border-emerald-800/60 dark:bg-slate-900/40">
                  {t('hero.highlightsLoading')}
                </li>
              )}
            </ul>
            <div className="mt-6 rounded-2xl border border-brand-100/70 bg-brand-500/10 px-4 py-3 text-xs font-medium text-brand-700 dark:border-brand-700/40 dark:bg-brand-900/20 dark:text-brand-200">
              {t('hero.deliveryNote')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
