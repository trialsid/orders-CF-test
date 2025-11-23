import React from 'react';
import { useTranslations }'../../i18n/i18n';
import type { CheckoutFormValues } from '../../types';
import type { CheckoutFieldErrors } from '../../utils/checkout';

interface PaymentSectionProps {
  form: CheckoutFormValues;
  touched: Record<keyof CheckoutFormValues, boolean>;
  errors: CheckoutFieldErrors;
  registerField: <T extends HTMLElement>(field: keyof CheckoutFormValues) => (node: T | null) => void;
  handleChange: (field: keyof CheckoutFormValues) => (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleBlur: (field: keyof CheckoutFormValues) => () => void;
}

const DELIVERY_SLOTS = ["11:30 AM", "6:30 PM"];

export function PaymentSection({
  form,
  touched,
  errors,
  registerField,
  handleChange,
  handleBlur,
}: PaymentSectionProps) {
  const { t } = useTranslations();

  const resolveErrorMessage = (code?: string) => {
    if (!code) return undefined;
    return t('checkout.forms.requiredMessage');
  };

  const slotError = touched.slot ? resolveErrorMessage(errors.slot) : undefined;
  const paymentError = touched.paymentMethod ? resolveErrorMessage(errors.paymentMethod) : undefined;

  return (
    <div className="rounded-3xl border border-emerald-100/60 bg-white/95 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70">
      <h2 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">
        {t('checkout.steps.payment')}
      </h2>
      <div className="mt-6 space-y-5">
        <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
          {t('checkout.forms.slotLabel')}
          <select
            ref={registerField<HTMLSelectElement>('slot')}
            value={form.slot}
            onChange={handleChange('slot')}
            onBlur={handleBlur('slot')}
            autoComplete="off"
            className={`mt-2 w-full appearance-none rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${slotError
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
              : 'border-emerald-200'
              }`}
            required
            aria-invalid={Boolean(slotError)}
          >
            <option value="" disabled>
              {t('checkout.forms.slotPlaceholder')}
            </option>
            {DELIVERY_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          {slotError && (
            <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{slotError}</p>
          )}
        </label>
        <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
          {t('checkout.forms.paymentLabel')}
          <select
            ref={registerField<HTMLSelectElement>('paymentMethod')}
            value={form.paymentMethod}
            onChange={handleChange('paymentMethod')}
            onBlur={handleBlur('paymentMethod')}
            autoComplete="off"
            className={`mt-2 w-full appearance-none rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${paymentError
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
              : 'border-emerald-200'
              }`}
            required
            aria-invalid={Boolean(paymentError)}
          >
            <option value="" disabled>
              {t('checkout.forms.paymentPlaceholder')}
            </option>
            <option value="Cash on delivery">{t('checkout.forms.paymentCashOnDelivery')}</option>
            <option value="UPI on delivery">{t('checkout.forms.paymentUpi')}</option>
          </select>
          {paymentError && (
            <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{paymentError}</p>
          )}
        </label>
        <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
          {t('checkout.forms.instructionsLabel')}
          <textarea
            ref={registerField<HTMLTextAreaElement>('instructions')}
            value={form.instructions}
            onChange={handleChange('instructions')}
            onBlur={handleBlur('instructions')}
            autoComplete="off"
            className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
            rows={3}
            placeholder={t('checkout.forms.instructionsPlaceholder')}
          />
        </label>
      </div>
    </div>
  );
}