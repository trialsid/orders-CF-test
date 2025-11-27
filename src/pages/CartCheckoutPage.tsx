import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PageSection from '../components/PageSection';
import MobileStickyAction from '../components/MobileStickyAction';
import { AddressForm } from '../components/checkout/AddressForm';
import { PaymentSection } from '../components/checkout/PaymentSection';
import { OrderSummary } from '../components/checkout/OrderSummary';
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
    formatAddressSnapshot,
} from '../utils/checkout';

type TouchedState = Record<keyof CheckoutFormValues, boolean>;

const createInitialTouchedState = (): TouchedState => ({
    name: false,
    phone: false,
    address: false,
    addressLine2: false,
    area: false,
    city: false,
    state: false,
    postalCode: false,
    landmark: false,
    slot: false,
    paymentMethod: false,
    instructions: false,
});

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
    const { addresses } = useAccountData();
    const { t } = useTranslations();
    const navigate = useNavigate();
    const location = useLocation();
    const [stickyHeight, setStickyHeight] = useState(0);

    const [form, setForm] = useState<CheckoutFormValues>(() => ({
        ...createEmptyCheckoutForm(),
        ...checkoutDraft.form,
    }));
    const [touched, setTouched] = useState<TouchedState>(() => createInitialTouchedState());
    const [errors, setErrors] = useState<CheckoutFieldErrors>({});
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [addressBeforeEdit, setAddressBeforeEdit] = useState<CheckoutFormValues | null>(null);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [saveAddressChoice, setSaveAddressChoice] = useState<boolean>(false);

    const fieldRefs = useRef<Record<keyof CheckoutFormValues, HTMLElement | null>>({
        name: null,
        phone: null,
        address: null,
        addressLine2: null,
        area: null,
        city: null,
        state: null,
        postalCode: null,
        landmark: null,
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
        const prepared = prepareOrderPayload(form, cart.cartItems, { saveAddress: saveAddressChoice });

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
            const result = await submitOrder(prepared.normalizedForm, { saveAddress: saveAddressChoice });
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

    useEffect(() => {
        setForm((current) => {
            // Merge to ensure newly added fields always exist.
            const next = { ...createEmptyCheckoutForm(), ...checkoutDraft.form };
            return JSON.stringify(current) === JSON.stringify(next) ? current : next;
        });
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

            const primary = user.primaryAddress;
            if (primary) {
                if (!next.address && primary.line1) {
                    next.address = primary.line1;
                    changed = true;
                }
                if (!next.addressLine2 && primary.line2) {
                    next.addressLine2 = primary.line2;
                    changed = true;
                }
                if (!next.area && primary.area) {
                    next.area = primary.area;
                    changed = true;
                }
                if (!next.city && primary.city) {
                    next.city = primary.city;
                    changed = true;
                }
                if (!next.state && primary.state) {
                    next.state = primary.state;
                    changed = true;
                }
                if (!next.postalCode && primary.postalCode) {
                    next.postalCode = primary.postalCode;
                    changed = true;
                }
                if (!next.landmark && primary.landmark) {
                    next.landmark = primary.landmark;
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
            if (!form.address && defaultAddr.line1) {
                const nextForm: CheckoutFormValues = {
                    ...form,
                    address: defaultAddr.line1 ?? '',
                    addressLine2: defaultAddr.line2 ?? '',
                    area: defaultAddr.area ?? '',
                    city: defaultAddr.city ?? '',
                    state: defaultAddr.state ?? '',
                    postalCode: defaultAddr.postalCode ?? '',
                    landmark: defaultAddr.landmark ?? '',
                };
                setFormAndDraft(nextForm);
            }
        }
    }, [addresses, form, selectedAddressId, setFormAndDraft, user]);

    // Effect to reset local form state when the user changes (login/logout)
    useEffect(() => {
        setForm(createEmptyCheckoutForm());
        setTouched(createInitialTouchedState());
        setErrors({});
        setSelectedAddressId(null);
        setIsEditingAddress(false);
        setSaveAddressChoice(false);
        setAddressBeforeEdit(null);
    }, [user]);

    const startEditAddress = () => {
        setAddressBeforeEdit(form);
        setIsEditingAddress(true);
        setSelectedAddressId(null);
    };

    const cancelEditAddress = () => {
        const nextForm = addressBeforeEdit ?? form;
        setFormAndDraft(nextForm);
        setErrors((prev) => {
            const next = { ...prev };
            delete next.address;
            delete next.city;
            delete next.postalCode;
            return next;
        });
        setTouched((prev) => ({ ...prev, address: false, city: false, postalCode: false }));
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
            const nextForm: CheckoutFormValues = {
                ...form,
                address: address.line1 ?? '',
                addressLine2: address.line2 ?? '',
                area: address.area ?? '',
                city: address.city ?? '',
                state: address.state ?? '',
                postalCode: address.postalCode ?? '',
                landmark: address.landmark ?? '',
            };
            setFormAndDraft(nextForm);
        }
    };

    return (
        <PageSection
            title={t('checkout.title')}
            description="Review your items and enter delivery details to place your order."
            className="md:pb-16"
            paddingBottom={stickyHeight ? stickyHeight + 20 : undefined}
            spacing="compact"
        >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
                {/* Left Column: Forms */}
                <div className="space-y-6">
                    <AddressForm
                        form={form}
                        touched={touched}
                        errors={errors}
                        user={user}
                        addresses={addresses}
                        isEditingAddress={isEditingAddress}
                        selectedAddressId={selectedAddressId}
                        saveAddressChoice={saveAddressChoice}
                        registerField={registerField}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                        startEditAddress={startEditAddress}
                        cancelEditAddress={cancelEditAddress}
                        saveAddress={saveAddress}
                        setSaveAddressChoice={setSaveAddressChoice}
                        handleSelectSavedAddress={handleSelectSavedAddress}
                    />

                    <PaymentSection
                        form={form}
                        touched={touched}
                        errors={errors}
                        registerField={registerField}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                    />
                </div>

                {/* Right Column: Cart Summary */}
                <aside className="space-y-6">
                    <OrderSummary
                        cartItems={cart.cartItems}
                        cartTotal={cart.cartTotal}
                        hasItems={cart.hasItems}
                        isSubmitting={isSubmitting}
                        user={user}
                        updateQuantity={cart.updateQuantity}
                        onSubmit={handleSubmit}
                        onLoginRedirect={() => navigate('/auth/login', { state: { from: location.pathname } })}
                    />
                </aside>
            </div>

            <MobileStickyAction
                onClick={user ? handleSubmit : () => navigate('/auth/login', { state: { from: location.pathname } })}
                disabled={!cart.hasItems || isSubmitting}
                label={
                    isSubmitting
                        ? t('checkout.aside.submitting')
                        : user
                            ? t('checkout.placeOrder')
                            : t('checkout.signInToPlaceOrder')
                }
                icon={!isSubmitting ? <ChevronRight className="h-5 w-5" /> : undefined}
                buttonClassName="uppercase tracking-wide"
                helperText={t('cart.stickySummary', { count: cart.cartItems.reduce((sum, i) => sum + i.quantity, 0), total: formatCurrency(cart.cartTotal) })}
                badge={cart.cartItems.reduce((sum, i) => sum + i.quantity, 0) || undefined}
                onHeightChange={setStickyHeight}
            />
        </PageSection>
    );
}

export default CartCheckoutPage;
