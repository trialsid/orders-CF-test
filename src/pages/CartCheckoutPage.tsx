import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronRight, Truck, ShoppingBag } from 'lucide-react';
import PageSection from '../components/PageSection';
import MobileStickyAction from '../components/MobileStickyAction';
import CartItemList from '../components/CartItemList';
import type { AppOutletContext } from '../layouts/MainLayout';
import { formatCurrency } from '../utils/formatCurrency';
import { useTranslations } from '../i18n/i18n';
import type { CheckoutFormValues } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAccountData } from '../hooks/useAccount';
import {
    createEmptyCheckoutForm,
    prepareOrderPayload,
    type CheckoutFieldErrors,
    validateCheckoutFields,
} from '../utils/checkout';

type TouchedState = Record<keyof CheckoutFormValues, boolean>;

const createInitialTouchedState = (): TouchedState => ({
    name: false,
    phone: false,
    address: false,
    slot: false,
    paymentMethod: false,
    instructions: false,
});

const formatAddressSnapshot = (address?: CheckoutFormValues | { line1?: string | null; line2?: string | null; area?: string | null; city?: string | null; state?: string | null; postalCode?: string | null; landmark?: string | null } | null) => {
    if (!address || typeof address !== 'object') return '';
    const parts = [
        'line1' in address ? address.line1 : undefined,
        'line2' in address ? address.line2 : undefined,
        'area' in address ? address.area : undefined,
        'city' in address ? address.city : undefined,
        'state' in address ? address.state : undefined,
        'postalCode' in address ? address.postalCode : undefined,
        'landmark' in address ? address.landmark : undefined,
    ]
        .map((part) => (typeof part === 'string' ? part.trim() : ''))
        .filter((part) => part.length > 0);
    return parts.join(', ');
};

const DELIVERY_SLOTS = ["11:30 AM", "6:30 PM"];

function CartCheckoutPage(): JSX.Element {
    const {
        cart,
        submitOrder,
        isSubmitting,
        checkoutDraft,
        updateCheckoutDraft,
        resetCheckoutDraft,
    } = useOutletContext<AppOutletContext>();
    const { user } = useAuth();
    const { addresses, status: accountStatus } = useAccountData();
    const { t } = useTranslations();
    const navigate = useNavigate();

    const [form, setForm] = useState<CheckoutFormValues>(() => checkoutDraft.form);
    const [touched, setTouched] = useState<TouchedState>(() => createInitialTouchedState());
    const [errors, setErrors] = useState<CheckoutFieldErrors>({});
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [addressBeforeEdit, setAddressBeforeEdit] = useState<string>('');
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [saveAddressChoice, setSaveAddressChoice] = useState<boolean>(false);

    const fieldRefs = useRef<Record<keyof CheckoutFormValues, HTMLElement | null>>({
        name: null,
        phone: null,
        address: null,
        slot: null,
        paymentMethod: null,
        instructions: null,
    });

    const setFormAndDraft = useCallback(
        (nextForm: CheckoutFormValues) => {
            setForm(nextForm);
            updateCheckoutDraft({ form: nextForm });
        },
        [updateCheckoutDraft]
    );

    const registerField = <T extends HTMLElement>(field: keyof CheckoutFormValues) => (node: T | null) => {
        fieldRefs.current[field] = node;
    };

    const handleBlur = (field: keyof CheckoutFormValues) => () => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const { fieldErrors } = validateCheckoutFields(form);
        const fieldError = fieldErrors[field];
        setErrors((prev) => {
            if (!fieldError && !prev[field]) return prev;
            if (!fieldError && prev[field]) {
                const next = { ...prev };
                delete next[field];
                return next;
            }
            if (fieldError === prev[field]) return prev;
            return { ...prev, [field]: fieldError };
        });
    };

    const handleChange = (field: keyof CheckoutFormValues) => (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const nextValue = event.target.value;
        const nextForm: CheckoutFormValues = { ...form, [field]: nextValue };

        setFormAndDraft(nextForm);

        setErrors((prev) => {
            if (!prev[field]) return prev;
            const { fieldErrors } = validateCheckoutFields(nextForm);
            const nextCode = fieldErrors[field];
            if (!nextCode && prev[field]) {
                const next = { ...prev };
                delete next[field];
                return next;
            }
            if (nextCode === prev[field]) return prev;
            return { ...prev, [field]: nextCode };
        });
    };

    const focusField = (field: keyof CheckoutFormValues) => {
        const node = fieldRefs.current[field];
        if (!node) return;
        const prefersReducedMotion =
            typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        node.scrollIntoView({ block: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        window.requestAnimationFrame(() => {
            if ('focus' in node && typeof (node as HTMLElement).focus === 'function') {
                (node as HTMLElement).focus({ preventScroll: true });
            }
        });
    };

    const handleSubmit = async () => {
        const prepared = prepareOrderPayload(form, cart.cartItems);

        if (!prepared.ok) {
            const fieldErrors = prepared.fieldErrors ?? {};
            const invalidFields = Object.keys(fieldErrors) as Array<keyof CheckoutFormValues>;
            if (invalidFields.length > 0) {
                setTouched((prev) => {
                    const next = { ...prev };
                    invalidFields.forEach((field) => { next[field] = true; });
                    return next;
                });
                setErrors((prev) => {
                    const next = { ...prev };
                    invalidFields.forEach((field) => {
                        const code = fieldErrors[field];
                        if (code) next[field] = code;
                        else if (next[field]) delete next[field];
                    });
                    return next;
                });
                focusField(invalidFields[0]);
            }
            return;
        }

        try {
            const result = await submitOrder(prepared.normalizedForm);
            if (result) {
                const clearedForm = createEmptyCheckoutForm();
                setForm(clearedForm);
                setTouched(createInitialTouchedState());
                setErrors({});
                resetCheckoutDraft();
                navigate('/checkout/success', { state: { order: result } });
            }
        } catch {
            // submitOrder surfaces errors via toast notifications.
        }
    };

    const resolveErrorMessage = (code?: CheckoutFieldErrors[keyof CheckoutFormValues]) => {
        if (!code) return undefined;
        if (code === 'invalidPhone') return t('checkout.validation.invalidPhone');
        return t('checkout.forms.requiredMessage');
    };

    const nameError = touched.name ? resolveErrorMessage(errors.name) : undefined;
    const phoneError = touched.phone ? resolveErrorMessage(errors.phone) : undefined;
    const addressError = touched.address ? resolveErrorMessage(errors.address) : undefined;
    const slotError = touched.slot ? resolveErrorMessage(errors.slot) : undefined;
    const paymentError = touched.paymentMethod ? resolveErrorMessage(errors.paymentMethod) : undefined;

    useEffect(() => {
        setForm((current) => (current === checkoutDraft.form ? current : checkoutDraft.form));
    }, [checkoutDraft.form]);

    useEffect(() => {
        if (!user) return;

        setForm((current) => {
            const next: CheckoutFormValues = { ...current };
            let changed = false;

            if (!next.name) {
                const userName = user.fullName || user.displayName || user.phone || '';
                if (userName) {
                    next.name = userName;
                    changed = true;
                }
            }

            if (!next.phone && user.phone) {
                next.phone = user.phone;
                changed = true;
            }

            if (!next.address && user.primaryAddress) {
                const formatted = formatAddressSnapshot(user.primaryAddress);
                if (formatted) {
                    next.address = formatted;
                    changed = true;
                }
            }

            if (!changed) return current;
            setFormAndDraft(next);
            return next;
        });

        // Select default address when available
        if (!selectedAddressId && addresses.length > 0) {
            const defaultAddr = addresses.find((addr) => addr.isDefault) ?? addresses[0];
            setSelectedAddressId(defaultAddr.id);
            const formatted = formatAddressSnapshot(defaultAddr);
            if (formatted && !form.address) {
                const nextForm = { ...form, address: formatted };
                setFormAndDraft(nextForm);
            }
        }
    }, [addresses, form.address, selectedAddressId, setFormAndDraft, user]);

    const startEditAddress = () => {
        setAddressBeforeEdit(form.address);
        setIsEditingAddress(true);
        setSelectedAddressId(null);
    };

    const cancelEditAddress = () => {
        const nextForm = { ...form, address: addressBeforeEdit };
        setFormAndDraft(nextForm);
        setErrors((prev) => {
            const next = { ...prev };
            delete next.address;
            return next;
        });
        setTouched((prev) => ({ ...prev, address: false }));
        setIsEditingAddress(false);
    };

    const saveAddress = () => {
        handleBlur('address')();
        setIsEditingAddress(false);
    };

    const handleSelectSavedAddress = (id: string) => {
        const address = addresses.find((addr) => addr.id === id);
        setSelectedAddressId(id);
        setIsEditingAddress(false);
        if (address) {
            const formatted = formatAddressSnapshot(address);
            const nextForm = { ...form, address: formatted };
            setFormAndDraft(nextForm);
        }
    };

    return (
        <PageSection
            title={t('checkout.title')}
            description="Review your items and enter delivery details to place your order."
            className="pb-28 md:pb-16"
            spacing="compact"
        >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
                {/* Left Column: Forms */}
                <div className="space-y-6">
                    {/* Delivery Details */}
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
                                    <textarea
                                        ref={registerField<HTMLTextAreaElement>('address')}
                                        value={form.address}
                                        onChange={handleChange('address')}
                                        onBlur={handleBlur('address')}
                                        autoComplete="street-address"
                                        className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${addressError
                                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
                                                : 'border-emerald-200'
                                            }`}
                                        rows={3}
                                        placeholder={t('checkout.forms.addressPlaceholder')}
                                        required
                                        aria-invalid={Boolean(addressError)}
                                    />
                                    {addressError && (
                                        <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{addressError}</p>
                                    )}
                                </label>
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
                                        <textarea
                                            ref={registerField<HTMLTextAreaElement>('address')}
                                            value={form.address}
                                            onChange={handleChange('address')}
                                            onBlur={handleBlur('address')}
                                            autoComplete="street-address"
                                            className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950 ${addressError
                                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
                                                    : 'border-emerald-200'
                                                }`}
                                            rows={3}
                                            placeholder={t('checkout.forms.addressPlaceholder')}
                                            required
                                            aria-invalid={Boolean(addressError)}
                                        />
                                        {addressError && (
                                            <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{addressError}</p>
                                        )}
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

                    {/* Payment & Slot */}
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
                </div>

                {/* Right Column: Cart Summary */}
                <aside className="space-y-6">
                    <div className="rounded-3xl border border-brand-500/20 bg-gradient-to-br from-white via-white to-brand-50/60 p-6 shadow-2xl shadow-brand-900/10 dark:border-brand-700/30 dark:from-slate-900 dark:via-slate-900 dark:to-brand-900/20 lg:sticky lg:top-28">
                        <div className="flex items-center gap-3 mb-6">
                            <ShoppingBag className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            <h3 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">
                                Your Order
                            </h3>
                        </div>

                        <div className="max-h-[40vh] overflow-y-auto pr-2 -mr-2 custom-scrollbar">
                            <CartItemList items={cart.cartItems} onUpdateQuantity={cart.updateQuantity} />
                        </div>

                        <div className="mt-6 space-y-3 border-t border-emerald-100 pt-6 dark:border-emerald-900">
                            <div className="flex items-center justify-between text-base font-semibold text-emerald-900 dark:text-brand-100">
                                <span>{t('cart.subtotal')}</span>
                                <span>{formatCurrency(cart.cartTotal)}</span>
                            </div>
                            <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <Truck className="h-4 w-4 text-brand-500" />
                                {t('cart.deliveryNote')}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!cart.hasItems || isSubmitting}
                            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60 uppercase tracking-wide"
                        >
                            {isSubmitting ? t('checkout.aside.submitting') : 'Place Order'}
                            {!isSubmitting && <ChevronRight className="h-5 w-5" />}
                        </button>

                        <p className="mt-4 text-xs text-center text-slate-500 dark:text-slate-400">
                            {t('checkout.aside.callout', { phone: '+91 98765 43210' })}
                        </p>
                    </div>
                </aside>
            </div>

            <MobileStickyAction
                onClick={handleSubmit}
                disabled={!cart.hasItems || isSubmitting}
                label={isSubmitting ? t('checkout.aside.submitting') : 'Place Order'}
                icon={!isSubmitting ? <ChevronRight className="h-5 w-5" /> : undefined}
                buttonClassName="uppercase tracking-wide"
                helperText={t('cart.stickySummary', { count: cart.cartItems.reduce((sum, i) => sum + i.quantity, 0), total: formatCurrency(cart.cartTotal) })}
                badge={cart.cartItems.reduce((sum, i) => sum + i.quantity, 0) || undefined}
            />
        </PageSection>
    );
}

export default CartCheckoutPage;
