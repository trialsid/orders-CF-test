import React from 'react';
import { ShieldCheck, ShoppingBag, Smartphone } from 'lucide-react';
import { useTranslations, getDictionarySection } from '../i18n/i18n';

const icons = [
  <ShieldCheck className="h-6 w-6 text-brand-500" />,
  <ShoppingBag className="h-6 w-6 text-brand-500" />,
  <Smartphone className="h-6 w-6 text-brand-500" />,
];

function FeaturesSection(): JSX.Element {
  const { t, dictionary } = useTranslations();
  const items = getDictionarySection<Array<{ title: string; description: string }>>(dictionary, 'features.items') ?? [];

  return (
    <section className="section">
      <div className="page-shell">
        <div className="section__intro">
          <h2>{t('features.title')}</h2>
          <p>{t('features.description')}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((feature, index) => (
            <article
              key={feature.title}
              className="flex h-full flex-col gap-3 rounded-3xl border border-emerald-100/70 bg-white/80 p-6 shadow-lg shadow-brand-900/10 backdrop-blur dark:border-emerald-900/60 dark:bg-slate-900/70"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand-500/10 p-2">{icons[index] ?? icons[0]}</span>
                <h3 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">{feature.title}</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
