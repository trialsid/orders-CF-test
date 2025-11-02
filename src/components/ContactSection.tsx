import React from 'react';
import { MapPin, PhoneCall, MessageCircle, Mail, Clock } from 'lucide-react';
import { useTranslations } from '../i18n/i18n';

function ContactSection(): JSX.Element {
  const { t } = useTranslations();

  return (
    <section id="contact" className="section">
      <div className="page-shell">
        <div className="section__intro">
          <h2>{t('contact.title')}</h2>
          <p>{t('contact.description')}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-lg shadow-brand-900/10 dark:border-emerald-900/60 dark:bg-slate-900/70">
            <h3 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-500" />
              {t('contact.coverageTitle')}
            </h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{t('contact.coverageDescription')}</p>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{t('contact.coverageFee')}</p>
          </article>
          <article className="rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-100/60 via-white to-brand-50/70 p-6 shadow-xl shadow-brand-900/10 dark:border-brand-700/30 dark:from-brand-900/20 dark:via-slate-900 dark:to-brand-900/20">
            <h3 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100 flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-brand-500" />
              {t('contact.talkTitle')}
            </h3>
            <ul className="mt-4 space-y-3 text-sm font-medium text-brand-700 dark:text-brand-200">
              <li className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4" />
                <a className="transition hover:text-brand-900 dark:hover:text-brand-100" href="tel:+919876543210">
                  {t('contact.callLabel')}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <a className="transition hover:text-brand-900 dark:hover:text-brand-100" href="https://wa.me/919876543210">
                  {t('contact.whatsappLabel')}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a className="transition hover:text-brand-900 dark:hover:text-brand-100" href="mailto:support@ieeja.com">
                  {t('contact.emailLabel')}
                </a>
              </li>
            </ul>
            <p className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="h-4 w-4" />
              {t('contact.hours')}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
