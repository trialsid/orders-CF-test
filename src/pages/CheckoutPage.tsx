import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import type { AppOutletContext } from '../layouts/MainLayout';
import { formatCurrency } from '../utils/formatCurrency';

const steps = [
  { key: 'details', label: 'Delivery details' },
  { key: 'payment', label: 'Payment preference' },
  { key: 'review', label: 'Review & confirm' },
] as const;

function CheckoutPage(): JSX.Element {
  const { cart, submitOrder, isSubmitting } = useOutletContext<AppOutletContext>();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    slot: 'Evening 6:30 PM',
    paymentMethod: 'Cash on delivery',
    instructions: '',
  });

  const currentStep = steps[stepIndex];
  const canProceed = useMemo(() => {
    if (currentStep.key === 'details') {
      return Boolean(form.name && form.phone && form.address);
    }
    if (currentStep.key === 'payment') {
      return Boolean(form.paymentMethod && form.slot);
    }
    return true;
  }, [currentStep.key, form]);

  const nextStep = () => {
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const previousStep = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    await submitOrder();
  };

  return (
    <section className="section">
      <div className="page-shell space-y-10">
        <header className="section__intro">
          <h1>Checkout</h1>
          <p>Complete the delivery details, choose how you’d like to pay, and confirm your order. We’ll call within 5 minutes to verify.</p>
        </header>

        <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {steps.map((step, index) => {
            const isActive = index === stepIndex;
            const isComplete = index < stepIndex;
            return (
              <li
                key={step.key}
                className={`flex flex-1 items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:border-brand-400 dark:text-brand-200'
                    : isComplete
                    ? 'border-emerald-200 bg-emerald-100/60 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'border-emerald-100 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300'
                }`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-current">
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </span>
                <span>{step.label}</span>
                {index < steps.length - 1 && <ChevronRight className="ml-auto hidden h-4 w-4 sm:block" />}
              </li>
            );
          })}
        </ol>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {currentStep.key === 'details' && (
              <div className="rounded-3xl border border-emerald-100/60 bg-white/90 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70">
                <h2 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">Delivery details</h2>
                <div className="mt-6 space-y-5">
                  <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    Full name
                    <input
                      type="text"
                      value={form.name}
                      onChange={handleChange('name')}
                      className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                      placeholder="Ayush Patel"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    Phone number
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handleChange('phone')}
                      className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                      placeholder="98765 43210"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    Delivery address
                    <textarea
                      value={form.address}
                      onChange={handleChange('address')}
                      className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                      rows={4}
                      placeholder="Flat 102, Green Residency, Ieeja"
                      required
                    />
                  </label>
                </div>
              </div>
            )}

            {currentStep.key === 'payment' && (
              <div className="rounded-3xl border border-emerald-100/60 bg-white/90 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70">
                <h2 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">Delivery slot & payment</h2>
                <div className="mt-6 space-y-5">
                  <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    Preferred slot
                    <input
                      type="text"
                      value={form.slot}
                      onChange={handleChange('slot')}
                      className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                      placeholder="Morning 11:30 AM"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    Payment method
                    <input
                      type="text"
                      value={form.paymentMethod}
                      onChange={handleChange('paymentMethod')}
                      className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                      placeholder="UPI on delivery"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    Delivery instructions (optional)
                    <textarea
                      value={form.instructions}
                      onChange={handleChange('instructions')}
                      className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                      rows={3}
                      placeholder="Ring the doorbell twice"
                    />
                  </label>
                </div>
              </div>
            )}

            {currentStep.key === 'review' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-emerald-100/60 bg-white/90 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70">
                  <h2 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">Delivery summary</h2>
                  <dl className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <dt className="font-medium text-emerald-900 dark:text-emerald-100">Name</dt>
                      <dd>{form.name || 'Not provided'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-emerald-900 dark:text-emerald-100">Phone</dt>
                      <dd>{form.phone || 'Not provided'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-emerald-900 dark:text-emerald-100">Address</dt>
                      <dd className="max-w-xs text-right">{form.address || 'Not provided'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-emerald-900 dark:text-emerald-100">Slot</dt>
                      <dd>{form.slot}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium text-emerald-900 dark:text-emerald-100">Payment</dt>
                      <dd>{form.paymentMethod}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-3xl border border-emerald-100/60 bg-white/90 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70">
                  <h2 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">Your basket</h2>
                  <ul className="mt-6 space-y-4 text-sm text-emerald-900 dark:text-emerald-100">
                    {cart.cartItems.map(({ product, quantity }) => (
                      <li key={product.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{quantity} × {product.unit}</p>
                        </div>
                        <span className="font-semibold">{formatCurrency(product.price * quantity)}</span>
                      </li>
                    ))}
                    {!cart.cartItems.length && <li>Your cart is empty.</li>}
                  </ul>
                  <div className="mt-6 flex items-center justify-between border-t border-emerald-100 pt-4 text-base font-semibold text-emerald-900 dark:border-emerald-900 dark:text-brand-100">
                    <span>Total due</span>
                    <span>{formatCurrency(cart.cartTotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4 rounded-3xl border border-brand-500/20 bg-gradient-to-br from-white via-white to-brand-50/60 p-6 shadow-2xl shadow-brand-900/10 dark:border-brand-700/30 dark:from-slate-900 dark:via-slate-900 dark:to-brand-900/20">
            <h3 className="font-display text-lg font-semibold text-emerald-900 dark:text-brand-100">Next steps</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {currentStep.key === 'review'
                ? 'Confirm to submit your order. We will call to verify slot availability.'
                : 'Complete the current step to move forward. You can always go back to make changes.'}
            </p>

            <div className="flex flex-col gap-3">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={previousStep}
                  className="rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
                >
                  Back
                </button>
              )}
              {currentStep.key !== 'review' ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed}
                  className="rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!cart.hasItems || isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting…' : 'Confirm order'}
                  {!isSubmitting && <CheckCircle2 className="h-4 w-4" />}
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Need to make a phone order instead? Call <a className="font-semibold text-brand-600 hover:underline" href="tel:+919876543210">+91 98765 43210</a> and mention your basket items.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default CheckoutPage;
