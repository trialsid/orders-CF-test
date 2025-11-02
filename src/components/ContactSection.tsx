import React from 'react';
import { MapPin, PhoneCall, MessageCircle, Mail, Clock } from 'lucide-react';

function ContactSection(): JSX.Element {
  return (
    <section id="contact" className="section">
      <div className="page-shell">
        <div className="section__intro">
          <h2>Need help with bulk or recurring orders?</h2>
          <p>Reach out to schedule weekly staples, hostel provisions, or temple offerings. We’ll tailor delivery to your routine.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-lg shadow-brand-900/10 dark:border-emerald-900/60 dark:bg-slate-900/70">
            <h3 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-500" />
              Delivery coverage
            </h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Ieeja town, Gadwal bypass, Thimmapuram, Amaravai, and surrounding gram panchayats. Flexible slots for institutions and
              events.
            </p>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Standard fee ₹40 below ₹499. Free delivery thereafter.</p>
          </article>
          <article className="rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-100/60 via-white to-brand-50/70 p-6 shadow-xl shadow-brand-900/10 dark:border-brand-700/30 dark:from-brand-900/20 dark:via-slate-900 dark:to-brand-900/20">
            <h3 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100 flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-brand-500" />
              Talk to us
            </h3>
            <ul className="mt-4 space-y-3 text-sm font-medium text-brand-700 dark:text-brand-200">
              <li className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4" />
                <a className="transition hover:text-brand-900 dark:hover:text-brand-100" href="tel:+919876543210">
                  Call: +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <a className="transition hover:text-brand-900 dark:hover:text-brand-100" href="https://wa.me/919876543210">
                  WhatsApp: order.ieeja.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a className="transition hover:text-brand-900 dark:hover:text-brand-100" href="mailto:support@ieeja.com">
                  support@ieeja.com
                </a>
              </li>
            </ul>
            <p className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="h-4 w-4" />
              Business hours: Monday–Saturday 7 AM – 9 PM, Sunday 8 AM – 1 PM. Emergency orders? Call and we’ll accommodate if riders are available.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
