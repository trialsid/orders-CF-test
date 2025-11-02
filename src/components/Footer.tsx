import React from 'react';

type FooterProps = {
  year: number;
};

function Footer({ year }: FooterProps): JSX.Element {
  return (
    <footer className="border-t border-emerald-100/60 bg-white/80 py-8 text-sm text-slate-500 dark:border-emerald-900/60 dark:bg-slate-900/70 dark:text-slate-400">
      <div className="page-shell flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p>&copy; {year} Order.Ieeja. Serving families across Ieeja &amp; Gadwal district.</p>
        <p>Cloudflare Pages • Same-day grocery logistics.</p>
      </div>
    </footer>
  );
}

export default Footer;
