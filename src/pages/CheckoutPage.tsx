import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import PageSection from '../components/PageSection';
import MobileStickyAction from '../components/MobileStickyAction';
import type { AppOutletContext } from '../layouts/MainLayout';
import { formatCurrency } from '../utils/formatCurrency';
import { useTranslations } from '../i18n/i18n';
import type { CheckoutFormValues, OrderResponse } from '../types';
import { createEmptyCheckoutForm } from '../utils/checkout';

type StepKey = 'details' | 'payment' | 'review';

type TouchedState = Record<keyof CheckoutFormValues, boolean>;

const createInitialTouchedState = (): TouchedState => ({
  name: false,
  phone: false,
  address: false,
  slot: false,
  paymentMethod: false,
  instructions: false,
});

const REQUIRED_FIELDS: Record<StepKey, Array<keyof CheckoutFormValues>> = {
  details: ['name', 'phone', 'address'],
  payment: ['slot', 'paymentMethod'],
  review: [],
};

function CheckoutPage(): JSX.Element {
  const {
    cart,
    submitOrder,
    isSubmitting,
    checkoutDraft,
    updateCheckoutDraft,
    resetCheckoutDraft,
  } = useOutletContext<AppOutletContext>();
  const { t } = useTranslations();
  const navigate = useNavigate();
  const steps = useMemo<Array<{ key: StepKey; label: string }>>(
    () => [
      { key: 'details', label: t('checkout.steps.details') },
      { key: 'payment', label: t('checkout.steps.payment') },
      { key: 'review', label: t('checkout.steps.review') },
    ],
    [t]
  );
  const [stepIndex, setStepIndex] = useState(checkoutDraft.stepIndex);
  const [form, setForm] = useState<CheckoutFormValues>(() => checkoutDraft.form);
  const [touched, setTouched] = useState<TouchedState>(() => createInitialTouchedState());
  const stepHeadingsRef = useRef<Record<StepKey, HTMLHeadingElement | null>>({
    details: null,
    payment: null,
    review: null,
  });
  const fieldRefs = useRef<Record<keyof CheckoutFormValues, HTMLElement | null>>({
    name: null,
    phone: null,
    address: null,
    slot: null,
    paymentMethod: null,
    instructions: null,
  });

  const currentStep = steps[stepIndex];

  const registerField = <T extends HTMLElement>(field: keyof CheckoutFormValues) => (node: T | null) => {
    fieldRefs.current[field] = node;
  };

  const handleBlur = (field: keyof CheckoutFormValues) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleChange = (field: keyof CheckoutFormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => {
      const next = { ...prev, [field]: event.target.value };
      updateCheckoutDraft({ form: next });
      return next;
    });
  };

  const nextStep = () => {
    setStepIndex((prev) => {
      const next = Math.min(prev + 1, steps.length - 1);
      updateCheckoutDraft({ stepIndex: next });
      return next;
    });
  };

  const previousStep = () => {
    setStepIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      updateCheckoutDraft({ stepIndex: next });
      return next;
    });
  };

  const handleStepSelect = (index: number) => {
    if (index > stepIndex) {
      return;
    }
    setStepIndex(index);
    updateCheckoutDraft({ stepIndex: index });
  };

  const handleSubmit = async () => {
    try {
      const result = await submitOrder(form);
      if (result) {
        const clearedForm = createEmptyCheckoutForm();
        setForm(clearedForm);
        setStepIndex(0);
        setTouched(createInitialTouchedState());
        resetCheckoutDraft();
        navigate('/checkout/success', { state: { order: result } });
      }
    } catch {
      // submitOrder surfaces errors via toast notifications.
    }
  };

  const isReviewStep = currentStep.key === 'review';
  const primaryCtaLabel = isReviewStep
    ? isSubmitting
      ? t('checkout.aside.submitting')
      : t('checkout.aside.confirm')
    : t('checkout.aside.continue');
  const primaryCtaDisabled = isReviewStep ? !cart.hasItems || isSubmitting : false;

  const handlePrimaryAction = () => {
    if (!isReviewStep) {
      const requiredFields = REQUIRED_FIELDS[currentStep.key];
      const missingFields = requiredFields.filter((field) => !form[field].trim());
      if (missingFields.length > 0) {
        setTouched((prev) => {
          const next = { ...prev };
          missingFields.forEach((field) => {
            next[field] = true;
          });
          return next;
        });

        const firstMissing = missingFields[0];
        const node = fieldRefs.current[firstMissing];
        if (node) {
          const prefersReducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          node.scrollIntoView({ block: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
          window.requestAnimationFrame(() => {
            if ('focus' in node && typeof (node as HTMLElement).focus === 'function') {
              (node as HTMLElement).focus({ preventScroll: true });
            }
          });
        }
        return;
      }
    }

    if (isReviewStep) {
      void handleSubmit();
      return;
    }
    nextStep();
  };

  useEffect(() => {
    setForm((current) => (current === checkoutDraft.form ? current : checkoutDraft.form));
  }, [checkoutDraft.form]);

  useEffect(() => {
    setStepIndex((current) => (current === checkoutDraft.stepIndex ? current : checkoutDraft.stepIndex));
  }, [checkoutDraft.stepIndex]);

  useEffect(() => {
    const node = stepHeadingsRef.current[currentStep.key];
    if (!node) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    node.scrollIntoView({ block: 'start', behavior });
    node.focus({ preventScroll: true });
  }, [currentStep.key]);

  const registerHeading = (key: StepKey) => (node: HTMLHeadingElement | null) => {
    stepHeadingsRef.current[key] = node;
  };

  const handleEditCart = useCallback(() => {
    navigate('/cart');
  }, [navigate]);

  const detailsPanel = (
    <div className="rounded-3xl border border-emerald-100/60 bg-white/95 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70">
      <h2
        ref={registerHeading('details')}
        tabIndex={-1}
        className="scroll-mt-32 font-display text-xl font-semibold text-emerald-900 focus:outline-none dark:text-brand-100"
      >
        {t('checkout.steps.details')}
      </h2>
      <div className="mt-6 space-y-5">
        <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
          {t('checkout.forms.nameLabel')}
          <input
            ref={registerField<HTMLInputElement>('name')}
            type="text"
            value={form.name}
            onChange={handleChange('name')}
            onBlur={handleBlur('name')}
            autoComplete="name"
            className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${
              touched.name && !form.name.trim() ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600' : 'border-emerald-200'
            }`}
            placeholder={t('checkout.forms.namePlaceholder')}
            required
            aria-invalid={touched.name && !form.name.trim()}
          />
          {touched.name && !form.name.trim() && (
            <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">
              {t('checkout.forms.requiredMessage')}
            </p>
          )}
        </label>
        <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
          {t('checkout.forms.phoneLabel')}
          <input
            ref={registerField<HTMLInputElement>('phone')}
            type="tel"
            value={form.phone}
            onChange={handleChange('phone')}
            onBlur={handleBlur('phone')}
            autoComplete="tel"
            inputMode="tel"
            className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${
              touched.phone && !form.phone.trim() ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600' : 'border-emerald-200'
            }`}
            placeholder={t('checkout.forms.phonePlaceholder')}
            required
            aria-invalid={touched.phone && !form.phone.trim()}
          />
          {touched.phone && !form.phone.trim() && (
            <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">
              {t('checkout.forms.requiredMessage')}
            </p>
          )}
        </label>
        <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
          {t('checkout.forms.addressLabel')}
          <textarea
            ref={registerField<HTMLTextAreaElement>('address')}
            value={form.address}
            onChange={handleChange('address')}
            onBlur={handleBlur('address')}
            autoComplete="street-address"
            className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${
              touched.address && !form.address.trim() ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600' : 'border-emerald-200'
            }`}
            rows={3}
            placeholder={t('checkout.forms.addressPlaceholder')}
            required
            aria-invalid={touched.address && !form.address.trim()}
          />
          {touched.address && !form.address.trim() && (
            <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">
              {t('checkout.forms.requiredMessage')}
            </p>
          )}
        </label>
      </div>
    </div>
  );

  const paymentPanel = (
    <div className="rounded-3xl border border-emerald-100/60 bg-white/95 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70">
      <h2
        ref={registerHeading('payment')}
        tabIndex={-1}
        className="scroll-mt-32 font-display text-xl font-semibold text-emerald-900 focus:outline-none dark:text-brand-100"
      >
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
            className={`mt-2 w-full appearance-none rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${
              touched.slot && !form.slot.trim() ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600' : 'border-emerald-200'
            }`}
            required
            aria-invalid={touched.slot && !form.slot.trim()}
          >
            <option value="" disabled>
              {t('checkout.forms.slotPlaceholder')}
            </option>
            <option value="11:30 AM">11:30 AM</option>
            <option value="6:30 PM">6:30 PM</option>
          </select>
          {touched.slot && !form.slot.trim() && (
            <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">
              {t('checkout.forms.requiredMessage')}
            </p>
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
            className={`mt-2 w-full appearance-none rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${
              touched.paymentMethod && !form.paymentMethod.trim() ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600' : 'border-emerald-200'
            }`}
            required
            aria-invalid={touched.paymentMethod && !form.paymentMethod.trim()}
          >
            <option value="" disabled>
              {t('checkout.forms.paymentPlaceholder')}
            </option>
            <option value="Cash on delivery">{t('checkout.forms.paymentCashOnDelivery')}</option>
            <option value="UPI on delivery">{t('checkout.forms.paymentUpi')}</option>
          </select>
          {touched.paymentMethod && !form.paymentMethod.trim() && (
            <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">
              {t('checkout.forms.requiredMessage')}
            </p>
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

  const reviewPanel = (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-100/60 bg-white/95 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70">
        <h2
          ref={registerHeading('review')}
          tabIndex={-1}
          className="scroll-mt-32 font-display text-xl font-semibold text-emerald-900 focus:outline-none dark:text-brand-100"
        >
          {t('checkout.review.deliveryTitle')}
        </h2>
        <dl className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex justify-between">
            <dt className="font-medium text-emerald-900 dark:text-emerald-100">{t('checkout.review.name')}</dt>
            <dd>{form.name || t('checkout.review.notProvided')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-emerald-900 dark:text-emerald-100">{t('checkout.review.phone')}</dt>
            <dd>{form.phone || t('checkout.review.notProvided')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-emerald-900 dark:text-emerald-100">{t('checkout.review.address')}</dt>
            <dd className="max-w-xs text-right">{form.address || t('checkout.review.notProvided')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-emerald-900 dark:text-emerald-100">{t('checkout.review.slot')}</dt>
            <dd>{form.slot || t('checkout.review.notProvided')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-emerald-900 dark:text-emerald-100">{t('checkout.review.payment')}</dt>
            <dd>{form.paymentMethod || t('checkout.review.notProvided')}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-3xl border border-emerald-100/60 bg-white/95 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70">
        <h2 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">{t('checkout.review.basketTitle')}</h2>
        <ul className="mt-6 space-y-4 text-sm text-emerald-900 dark:text-emerald-100">
          {cart.cartItems.map(({ product, quantity }) => (
            <li key={product.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {quantity} × {product.unit}
                </p>
              </div>
              <span className="font-semibold">{formatCurrency(product.price * quantity)}</span>
            </li>
          ))}
          {!cart.cartItems.length && <li>{t('checkout.review.emptyCart')}</li>}
        </ul>
        <div className="mt-6 flex items-center justify-between border-t border-emerald-100 pt-4 text-base font-semibold text-emerald-900 dark:border-emerald-900 dark:text-brand-100">
          <span>{t('checkout.review.total')}</span>
          <span>{formatCurrency(cart.cartTotal)}</span>
        </div>
        <button
          type="button"
          onClick={handleEditCart}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
        >
          {t('checkout.review.editCart')}
        </button>
      </div>
    </div>
  );

  const stepPanels: Record<StepKey, JSX.Element> = {
    details: detailsPanel,
    payment: paymentPanel,
    review: reviewPanel,
  };

  return (
    <PageSection
      title={t('checkout.title')}
      description={t('checkout.description')}
      className="pb-28 md:pb-16"
      introClassName="text-left sm:text-center"
      spacing="compact"
    >
      <nav
        aria-label={t('checkout.title')}
        className="rounded-3xl border border-emerald-100/70 bg-white/95 p-3 shadow-sm shadow-emerald-200/40 dark:border-emerald-900/60 dark:bg-slate-900/80"
      >
        <ol className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          {steps.map((step, index) => {
            const isActive = index === stepIndex;
            const isComplete = index < stepIndex;
            const isDisabled = index > stepIndex;

            return (
              <li key={step.key}>
                <button
                  type="button"
                  onClick={() => handleStepSelect(index)}
                  disabled={isDisabled}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200'
                      : isComplete
                      ? 'bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'
                      : 'bg-white text-emerald-700 dark:bg-slate-950/60 dark:text-emerald-300'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                  aria-disabled={isDisabled ? 'true' : undefined}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-current">
                    {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className="flex-1 text-sm font-semibold">{step.label}</span>
                  {!isComplete && !isActive && <ChevronRight className="h-4 w-4 opacity-60" />}
                  {isActive && <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <div className="space-y-6">
          {stepPanels[currentStep.key]}
        </div>

        <aside className="space-y-4 rounded-3xl border border-brand-500/20 bg-gradient-to-br from-white via-white to-brand-50/60 p-6 shadow-2xl shadow-brand-900/10 dark:border-brand-700/30 dark:from-slate-900 dark:via-slate-900 dark:to-brand-900/20">
          <h3 className="font-display text-lg font-semibold text-emerald-900 dark:text-brand-100">{t('checkout.aside.nextStepsTitle')}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {isReviewStep ? t('checkout.aside.reviewDescription') : t('checkout.aside.nextStepsDescription')}
          </p>

          <div className="flex flex-col gap-3">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={previousStep}
                className="hidden items-center justify-center gap-2 rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex md:text-sm md:uppercase dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
              >
                {t('checkout.aside.back')}
              </button>
            )}
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={primaryCtaDisabled}
              className="hidden items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-2.5 sm:text-sm sm:uppercase md:inline-flex"
            >
              {primaryCtaLabel}
              {isReviewStep ? (!isSubmitting && <CheckCircle2 className="h-4 w-4" />) : <ChevronRight className="h-4 w-4" />}
            </button>
            {isReviewStep && (
              <button
                type="button"
                onClick={handleEditCart}
                className="hidden items-center justify-center gap-2 rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 md:inline-flex md:text-sm md:uppercase dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
              >
                {t('checkout.review.editCart')}
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('checkout.aside.callout', { phone: '+91 98765 43210' })}
          </p>
        </aside>
      </div>

      <MobileStickyAction
        onClick={handlePrimaryAction}
        disabled={isReviewStep ? primaryCtaDisabled : false}
        label={primaryCtaLabel}
        icon={isReviewStep ? (!isSubmitting ? <CheckCircle2 className="h-5 w-5" /> : undefined) : <ChevronRight className="h-5 w-5" />}
        buttonClassName="uppercase tracking-wide"
        helperText={t('checkout.stickySummary', {
          step: stepIndex + 1,
          total: steps.length,
          totalAmount: formatCurrency(cart.cartTotal),
        })}
        badge={`${stepIndex + 1}/${steps.length}`}
        secondaryLabel={
          isReviewStep
            ? t('checkout.review.editCart')
            : stepIndex > 0
            ? t('checkout.aside.back')
            : undefined
        }
        onSecondaryClick={
          isReviewStep
            ? handleEditCart
            : stepIndex > 0
            ? previousStep
            : undefined
        }
      />
    </PageSection>
  );
}

export default CheckoutPage;
