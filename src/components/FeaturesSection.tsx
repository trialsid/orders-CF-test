import React from 'react';
import { ShieldCheck, ShoppingBag, Smartphone } from 'lucide-react';

const features = [
  {
    title: 'Packed with care',
    description: 'Fresh greens, pulses, and dairy sealed airtight so they reach your doorstep crisp and cool.',
    icon: <ShieldCheck className="h-6 w-6 text-brand-500" />,
  },
  {
    title: 'Hyperlocal sourcing',
    description: 'We buy directly from Ieeja growers and trusted Gadwal wholesalers every morning.',
    icon: <ShoppingBag className="h-6 w-6 text-brand-500" />,
  },
  {
    title: 'Flexible ordering',
    description: 'Place online, WhatsApp, or phone orders. Pay online soon—cash on delivery today.',
    icon: <Smartphone className="h-6 w-6 text-brand-500" />,
  },
];

function FeaturesSection(): JSX.Element {
  return (
    <section className="section">
      <div className="page-shell">
        <div className="section__intro">
          <h2>Your Ieeja grocery team on demand</h2>
          <p>
            From school lunch staples to temple offerings, our riders cover town lanes and gram panchayats twice a day so you can
            skip the market rush.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="flex h-full flex-col gap-3 rounded-3xl border border-emerald-100/70 bg-white/80 p-6 shadow-lg shadow-brand-900/10 backdrop-blur dark:border-emerald-900/60 dark:bg-slate-900/70"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand-500/10 p-2">{feature.icon}</span>
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
