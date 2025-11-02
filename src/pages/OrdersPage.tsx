import React from 'react';

const mockOrders = [
  {
    id: 'ORD-1098',
    placedAt: 'Oct 28, 2025',
    status: 'Delivered',
    summary: 'Vegetables, dairy, and snacks',
  },
  {
    id: 'ORD-1099',
    placedAt: 'Nov 02, 2025',
    status: 'Out for delivery',
    summary: 'Breakfast essentials',
  },
];

function OrdersPage(): JSX.Element {
  return (
    <section className="section">
      <div className="page-shell space-y-10">
        <header className="section__intro">
          <h1>Orders</h1>
          <p>Track past and current orders. We’ll keep this list updated once account sign-in launches.</p>
        </header>

        <div className="space-y-4">
          {mockOrders.map((order) => (
            <article
              key={order.id}
              className="rounded-3xl border border-emerald-100/60 bg-white/90 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70"
            >
              <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-emerald-900 dark:text-brand-100">{order.id}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-300">Placed {order.placedAt}</p>
                </div>
                <span className="rounded-full bg-brand-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-200">
                  {order.status}
                </span>
              </header>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{order.summary}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
                >
                  View invoice
                </button>
                <button
                  type="button"
                  className="rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                >
                  Reorder items
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default OrdersPage;
