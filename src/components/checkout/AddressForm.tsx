import React from 'react';
import { useTranslations } from '../../i18n/i18n';
import type { CheckoutFormValues, AuthUser, UserAddress } from '../../types';
import { formatAddressSnapshot, type CheckoutFieldErrors } from '../../utils/checkout';

interface AddressFormProps {
  form: CheckoutFormValues;
  touched: Record<keyof CheckoutFormValues, boolean>;
  errors: CheckoutFieldErrors;
  user: AuthUser | null;
  addresses: UserAddress[];
  isEditingAddress: boolean;
  selectedAddressId: string | null;
  saveAddressChoice: boolean;
  registerField: <T extends HTMLElement>(field: keyof CheckoutFormValues) => (node: T | null) => void;
  handleChange: (field: keyof CheckoutFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (field: keyof CheckoutFormValues) => () => void;
  startEditAddress: () => void;
  cancelEditAddress: () => void;
  saveAddress: () => void;
  setSaveAddressChoice: (val: boolean) => void;
  handleSelectSavedAddress: (id: string) => void;
}

export function AddressForm({
  form,
  touched,
  errors,
  user,
  addresses,
  isEditingAddress,
  selectedAddressId,
  saveAddressChoice,
  registerField,
  handleChange,
  handleBlur,
  startEditAddress,
  cancelEditAddress,
  saveAddress,
  setSaveAddressChoice,
  handleSelectSavedAddress,
}: AddressFormProps) {
  const { t } = useTranslations();

  const resolveErrorMessage = (code?: string) => {
    if (!code) return undefined;
    if (code === 'invalidPhone') return t('checkout.validation.invalidPhone');
    return t('checkout.forms.requiredMessage');
  };

  const nameError = touched.name ? resolveErrorMessage(errors.name) : undefined;
  const phoneError = touched.phone ? resolveErrorMessage(errors.phone) : undefined;
  const addressError = touched.address ? resolveErrorMessage(errors.address) : undefined;
  const cityError = touched.city ? resolveErrorMessage(errors.city) : undefined;
  const postalError = touched.postalCode ? resolveErrorMessage(errors.postalCode) : undefined;

  return (
    <div className="rounded-3xl border border-emerald-100/60 bg-white/95 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">
          {t('checkout.steps.details')}
        </h2>
        {user && !isEditingAddress && (
          <button
            type="button"
            onClick={startEditAddress}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
          >
            {form.address ? 'Use different address' : 'Add address'}
          </button>
        )}
      </div>
      {!user && (
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
              className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${nameError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
                : 'border-emerald-200'
                }`}
              placeholder={t('checkout.forms.namePlaceholder')}
              required
              aria-invalid={Boolean(nameError)}
            />
            {nameError && (
              <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{nameError}</p>
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
              className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${phoneError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
                : 'border-emerald-200'
                }`}
              placeholder={t('checkout.forms.phonePlaceholder')}
              required
              aria-invalid={Boolean(phoneError)}
            />
            {phoneError && (
              <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{phoneError}</p>
            )}
          </label>
          <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
            {t('checkout.forms.addressLabel')}
            <input
              ref={registerField<HTMLInputElement>('address')}
              type="text"
              value={form.address}
              onChange={handleChange('address')}
              onBlur={handleBlur('address')}
              autoComplete="address-line1"
              className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${
                addressError
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
                  : 'border-emerald-200'
              }`}
              placeholder="House / street"
              required
              aria-invalid={Boolean(addressError)}
            />
            {addressError && (
              <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{addressError}</p>
            )}
          </label>
          <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
            Address line 2 (optional)
            <input
              ref={registerField<HTMLInputElement>('addressLine2')}
              type="text"
              value={form.addressLine2}
              onChange={handleChange('addressLine2')}
              onBlur={handleBlur('addressLine2')}
              autoComplete="address-line2"
              className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
              placeholder="Apartment, area, landmark"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
              City / Town
              <input
                ref={registerField<HTMLInputElement>('city')}
                type="text"
                value={form.city}
                onChange={handleChange('city')}
                onBlur={handleBlur('city')}
                autoComplete="address-level2"
                className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${
                  cityError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
                    : 'border-emerald-200'
                }`}
                placeholder="City"
                required
                aria-invalid={Boolean(cityError)}
              />
              {cityError && (
                <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{cityError}</p>
              )}
            </label>
            <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
              Postal code
              <input
                ref={registerField<HTMLInputElement>('postalCode')}
                type="text"
                value={form.postalCode}
                onChange={handleChange('postalCode')}
                onBlur={handleBlur('postalCode')}
                autoComplete="postal-code"
                className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${
                  postalError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
                    : 'border-emerald-200'
                }`}
                placeholder="PIN / ZIP"
                required
                aria-invalid={Boolean(postalError)}
              />
              {postalError && (
                <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{postalError}</p>
              )}
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
              State (optional)
              <input
                ref={registerField<HTMLInputElement>('state')}
                type="text"
                value={form.state}
                onChange={handleChange('state')}
                onBlur={handleBlur('state')}
                autoComplete="address-level1"
                className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                placeholder="State"
              />
            </label>
            <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
              Nearby landmark (optional)
              <input
                ref={registerField<HTMLInputElement>('landmark')}
                type="text"
                value={form.landmark}
                onChange={handleChange('landmark')}
                onBlur={handleBlur('landmark')}
                className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                placeholder="Park, school, shop"
              />
            </label>
          </div>
        </div>
      )}
      {user && (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-emerald-100/80 bg-white/80 px-4 py-3 dark:border-emerald-900 dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-300">Name</p>
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{form.name || user.fullName || user.displayName || user.phone}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100/80 bg-white/80 px-4 py-3 dark:border-emerald-900 dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-300">Phone</p>
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{form.phone || user.phone}</p>
          </div>
          {addresses.length > 0 && !isEditingAddress && (
            <div className="rounded-2xl border border-emerald-100/80 bg-white/80 px-4 py-3 dark:border-emerald-900 dark:bg-slate-950/70 space-y-3">
              <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-300">Delivery address</p>
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label key={addr.id} className="flex items-start gap-3 rounded-2xl border border-emerald-100/70 bg-white/70 px-3 py-3 text-sm shadow-sm transition hover:border-brand-200 dark:border-emerald-900 dark:bg-slate-950/60">
                    <input
                      type="radio"
                      name="saved-address"
                      className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-200"
                      checked={selectedAddressId === addr.id}
                      onChange={() => handleSelectSavedAddress(addr.id)}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                          {addr.label || 'Saved address'}
                        </span>
                        {addr.isDefault && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-100">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 dark:text-slate-200">
                        {formatAddressSnapshot(addr) || '—'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          {isEditingAddress && (
            <div className="rounded-2xl border border-emerald-100/80 bg-white/80 px-4 py-3 dark:border-emerald-900 dark:bg-slate-950/70">
              <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-300">Delivery address</p>
              <input
                ref={registerField<HTMLInputElement>('address')}
                value={form.address}
                onChange={handleChange('address')}
                onBlur={handleBlur('address')}
                autoComplete="address-line1"
                className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${
                  addressError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
                    : 'border-emerald-200'
                }`}
                placeholder={t('checkout.forms.addressPlaceholder')}
                required
                aria-invalid={Boolean(addressError)}
              />
              {addressError && (
                <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{addressError}</p>
              )}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  ref={registerField<HTMLInputElement>('addressLine2')}
                  value={form.addressLine2}
                  onChange={handleChange('addressLine2')}
                  onBlur={handleBlur('addressLine2')}
                  className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                  placeholder="Address line 2 (optional)"
                  autoComplete="address-line2"
                />
                <input
                  ref={registerField<HTMLInputElement>('landmark')}
                  value={form.landmark}
                  onChange={handleChange('landmark')}
                  onBlur={handleBlur('landmark')}
                  className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                  placeholder="Landmark (optional)"
                />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <input
                    ref={registerField<HTMLInputElement>('city')}
                    value={form.city}
                    onChange={handleChange('city')}
                    onBlur={handleBlur('city')}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${
                      cityError
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
                        : 'border-emerald-200'
                    }`}
                    placeholder="City / Town"
                    required
                    aria-invalid={Boolean(cityError)}
                    autoComplete="address-level2"
                  />
                  {cityError && (
                    <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{cityError}</p>
                  )}
                </div>
                <div>
                  <input
                    ref={registerField<HTMLInputElement>('postalCode')}
                    value={form.postalCode}
                    onChange={handleChange('postalCode')}
                    onBlur={handleBlur('postalCode')}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${
                      postalError
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
                        : 'border-emerald-200'
                    }`}
                    placeholder="PIN / ZIP"
                    required
                    aria-invalid={Boolean(postalError)}
                    autoComplete="postal-code"
                  />
                  {postalError && (
                    <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{postalError}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  ref={registerField<HTMLInputElement>('area')}
                  value={form.area}
                  onChange={handleChange('area')}
                  onBlur={handleBlur('area')}
                  className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                  placeholder="Area (optional)"
                />
                <input
                  ref={registerField<HTMLInputElement>('state')}
                  value={form.state}
                  onChange={handleChange('state')}
                  onBlur={handleBlur('state')}
                  className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                  placeholder="State (optional)"
                  autoComplete="address-level1"
                />
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                <input
                  type="checkbox"
                  checked={saveAddressChoice}
                  onChange={(e) => setSaveAddressChoice(e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-200"
                />
                Save this address to my account
              </label>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveAddress}
                  className="rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                >
                  Use address
                </button>
                <button
                  type="button"
                  onClick={cancelEditAddress}
                  className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-900 hover:border-emerald-300 dark:border-emerald-800 dark:text-emerald-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
