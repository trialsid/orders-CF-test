import React, { useEffect, useMemo, useState } from 'react';
import { Home, Pencil, Plus, Trash2, ShieldCheck, LogOut } from 'lucide-react';
import PageSection from '../components/PageSection';
import { useAccountData } from '../hooks/useAccount';
import { useAuth } from '../context/AuthContext';
import { useTranslations } from '../i18n/i18n';
import type { UserAddress } from '../types';

const EMPTY_ADDRESS: Partial<UserAddress> = {
  label: '',
  contactName: '',
  phone: '',
  line1: '',
  line2: '',
  area: '',
  city: '',
  state: '',
  postalCode: '',
  landmark: '',
  isDefault: false,
};

function AccountPage(): JSX.Element {
  const { t } = useTranslations();
  const { revokeSessions } = useAuth();
  const {
    profile,
    addresses,
    status,
    error,
    updateProfile,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAccountData();

  const [profileForm, setProfileForm] = useState({ fullName: '', displayName: '' });
  const [profileMessage, setProfileMessage] = useState<string>();
  const [profileSaving, setProfileSaving] = useState(false);

  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [addressMessage, setAddressMessage] = useState<string>();
  const [addressSaving, setAddressSaving] = useState(false);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.fullName ?? '',
        displayName: profile.displayName ?? '',
      });
    }
  }, [profile]);

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage(undefined);
    setProfileSaving(true);
    try {
      await updateProfile(profileForm);
      setProfileMessage(t('account.profileUpdated'));
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t('account.genericError');
      setProfileMessage(message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRevokeSessions = async () => {
    if (window.confirm("Are you sure you want to log out of all devices? This will sign you out immediately.")) {
      try {
        await revokeSessions();
      } catch (err) {
        alert("Failed to revoke sessions.");
      }
    }
  };

  const openAddressForm = (address?: UserAddress) => {
    setAddressMessage(undefined);
    if (address) {
      setAddressForm({
        ...address,
        label: address.label ?? '',
        contactName: address.contactName ?? '',
        phone: address.phone ?? '',
        line1: address.line1 ?? '',
        line2: address.line2 ?? '',
        area: address.area ?? '',
        city: address.city ?? '',
        state: address.state ?? '',
        postalCode: address.postalCode ?? '',
        landmark: address.landmark ?? '',
        isDefault: address.isDefault,
      });
      setEditingAddressId(address.id);
    } else {
      setAddressForm(EMPTY_ADDRESS);
      setEditingAddressId(null);
    }
    setIsAddressFormOpen(true);
  };

  const closeAddressForm = () => {
    setIsAddressFormOpen(false);
    setEditingAddressId(null);
    setAddressForm(EMPTY_ADDRESS);
  };

  const handleAddressSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddressMessage(undefined);
    if (!addressForm.line1?.trim()) {
      setAddressMessage(t('account.addressForm.line1Required'));
      return;
    }

    setAddressSaving(true);
    try {
      if (editingAddressId) {
        await updateAddress({ ...addressForm, id: editingAddressId });
        setAddressMessage(t('account.addressUpdated'));
      } else {
        await createAddress(addressForm);
        setAddressMessage(t('account.addressCreated'));
      }
      closeAddressForm();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t('account.genericError');
      setAddressMessage(message);
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (address: UserAddress) => {
    if (!window.confirm(t('account.confirmDelete'))) {
      return;
    }
    try {
      await deleteAddress(address.id);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : t('account.genericError');
      setAddressMessage(message);
    }
  };

  const sortedAddresses = useMemo(
    () => [...addresses].sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1)),
    [addresses]
  );
  const defaultAddress = sortedAddresses.find((addr) => addr.isDefault) ?? sortedAddresses[0];

  const renderAddressCard = (address: UserAddress) => (
    <article
      key={address.id}
      className={`rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
        address.isDefault
          ? 'border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-800 dark:from-emerald-950/40 dark:to-slate-950/60'
          : 'border-emerald-100/70 bg-white/95 dark:border-emerald-900/60 dark:bg-slate-950/60'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            {address.label || t('account.addressForm.homeLabel')}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">{address.contactName || profile?.displayName}</p>
          {address.phone && <p className="text-xs text-slate-500 dark:text-slate-300">{address.phone}</p>}
        </div>
        {address.isDefault ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:bg-emerald-900/50 dark:text-emerald-100">
            <ShieldCheck className="h-4 w-4" />
            {t('account.defaultBadge')}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
            {address.city || address.state || 'Address'}
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-200">
        <p className="flex items-start gap-2">
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          <span>
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ''}
            {address.area ? `, ${address.area}` : ''}
          </span>
        </p>
        <p className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden />
          <span>
            {[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}
          </span>
        </p>
        {address.landmark && (
          <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-200" aria-hidden />
            <span>{t('account.landmarkLabel', { landmark: address.landmark })}</span>
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {!address.isDefault && (
          <button
            type="button"
            onClick={() => setDefaultAddress(address.id).catch((err) => setAddressMessage(err instanceof Error ? err.message : t('account.genericError')))}
            className="rounded-full border border-emerald-200/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:text-emerald-200"
          >
            {t('account.setDefault')}
          </button>
        )}
        <button
          type="button"
          onClick={() => openAddressForm(address)}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:text-emerald-200"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t('account.edit')}
        </button>
        <button
          type="button"
          onClick={() => handleDeleteAddress(address)}
          className="inline-flex items-center gap-1 rounded-full border border-rose-200/70 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:text-rose-800 dark:border-rose-900/60 dark:text-rose-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t('account.delete')}
        </button>
      </div>
    </article>
  );

  return (
    <PageSection
      title={t('account.title')}
      description={t('account.description')}
      spacing="compact"
      contentClassName="space-y-8"
      layout="split"
    >
      {error && (
        <div className="rounded-2xl border border-rose-200/60 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/30 dark:text-rose-100">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-200 via-emerald-100 to-teal-100 p-[1px] shadow-lg dark:from-emerald-800 dark:via-emerald-700 dark:to-teal-700">
        <div className="flex flex-col gap-4 rounded-[22px] bg-gradient-to-br from-white via-emerald-50/80 to-white/90 p-6 text-emerald-900 dark:from-emerald-950/80 dark:via-emerald-900/70 dark:to-emerald-900/40 dark:text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-100/80">
                {t('account.profileEyebrow')}
              </p>
              <p className="text-2xl font-semibold text-emerald-950 dark:text-white">
                {profile?.fullName || profile?.displayName || t('account.profileTitle')}
              </p>
              <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-100/80">{profile?.phone ? `+${profile.phone}` : t('account.profileHelp', { phone: '' })}</p>
              {defaultAddress && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100/70 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-white/10 dark:text-emerald-50">
                  <ShieldCheck className="h-4 w-4" />
                  {defaultAddress.label || t('account.addressForm.homeLabel')} • {defaultAddress.city || defaultAddress.state || defaultAddress.line1}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openAddressForm()}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 dark:bg-white/15 dark:hover:bg-white/25 dark:focus:ring-white/30"
              >
                <Plus className="h-4 w-4" />
                {t('account.addAddress')}
              </button>
              <button
                type="button"
                onClick={handleRevokeSessions}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-white dark:border-white/30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-200/70 dark:focus:ring-white/30"
              >
                <LogOut className="h-4 w-4" />
                Revoke sessions
              </button>
            </div>
          </div>
          <div className="grid gap-3 text-xs md:grid-cols-3">
            <div className="rounded-2xl bg-white/60 px-3 py-2 text-emerald-900 shadow-sm dark:bg-white/10 dark:text-white">
              <p className="text-emerald-800/80 text-[11px] uppercase tracking-wide dark:text-emerald-100/70">Addresses</p>
              <p className="text-lg font-semibold">{addresses.length || 0}</p>
            </div>
            <div className="rounded-2xl bg-white/60 px-3 py-2 text-emerald-900 shadow-sm dark:bg-white/10 dark:text-white">
              <p className="text-emerald-800/80 text-[11px] uppercase tracking-wide dark:text-emerald-100/70">Default</p>
              <p className="text-sm font-semibold leading-tight">{defaultAddress ? defaultAddress.label || defaultAddress.line1 : 'None set'}</p>
            </div>
            <div className="rounded-2xl bg-white/60 px-3 py-2 text-emerald-900 shadow-sm dark:bg-white/10 dark:text-white">
              <p className="text-emerald-800/80 text-[11px] uppercase tracking-wide dark:text-emerald-100/70">Status</p>
              <p className="text-sm font-semibold leading-tight">{status === 'loading' ? t('account.loading') : 'Active'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-emerald-100/70 bg-white/95 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/70">
        <header className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">
              {t('account.profileEyebrow')}
            </p>
            <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">{t('account.profileTitle')}</p>
          </div>
        </header>
        <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{t('account.fullNameLabel')}</span>
            <input
              type="text"
              value={profileForm.fullName}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-4 py-2 text-emerald-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
              placeholder={t('account.fullNamePlaceholder')}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{t('account.displayNameLabel')}</span>
            <input
              type="text"
              value={profileForm.displayName}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-4 py-2 text-emerald-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
              placeholder={t('account.displayNamePlaceholder')}
            />
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-300">{t('account.profileHelp', { phone: profile?.phone ?? '' })}</p>
          {profileMessage && (
            <p className="text-sm text-emerald-600 dark:text-emerald-300">{profileMessage}</p>
          )}
          <button
            type="submit"
            className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-60"
            disabled={profileSaving}
          >
            {profileSaving ? t('account.saving') : t('account.saveProfile')}
          </button>
        </form>
      </section>

        <section className="rounded-3xl border border-emerald-100/70 bg-white/95 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/70">
        <header className="flex items-center gap-3">
          <div className="rounded-2xl bg-rose-100 p-3 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
             <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-200">
              Security
            </p>
            <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">Session Management</p>
          </div>
        </header>
        <div className="mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                If you suspect your account is compromised or you forgot to sign out on a public device, you can revoke all active sessions.
            </p>
            <button
              type="button"
              onClick={handleRevokeSessions}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-200 dark:hover:bg-rose-900/30"
            >
              <LogOut className="h-4 w-4" />
              Revoke all sessions
            </button>
        </div>
      </section>
      </div>

      <section className="rounded-3xl border border-emerald-100/70 bg-white/95 p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/70">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">
              {t('account.addressEyebrow')}
            </p>
            <p className="text-lg font-semibold text-emerald-950 dark:text-brand-100">{t('account.addressTitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => openAddressForm()}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-900/60 dark:text-emerald-100"
          >
            <Plus className="h-4 w-4" />
            {t('account.addAddress')}
          </button>
        </header>

        {addressMessage && (
          <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-300">{addressMessage}</p>
        )}

        {sortedAddresses.length === 0 && status === 'success' && (
          <p className="mt-4 rounded-2xl border border-dashed border-emerald-200/70 p-4 text-sm text-slate-600 dark:border-emerald-900/60 dark:text-slate-300">
            {t('account.noAddresses')}
          </p>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {sortedAddresses.map((address) => renderAddressCard(address))}
        </div>

        {isAddressFormOpen && (
          <form onSubmit={handleAddressSubmit} className="mt-6 space-y-4 rounded-2xl border border-emerald-100/70 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-900/20">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                {editingAddressId ? t('account.editAddressTitle') : t('account.newAddressTitle')}
              </p>
              <button
                type="button"
                onClick={closeAddressForm}
                className="text-xs font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
              >
                {t('account.cancel')}
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">{t('account.addressForm.label')}</span>
                <input
                  type="text"
                  value={addressForm.label ?? ''}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, label: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-3 py-2 text-emerald-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                />
              </label>
              <label className="text-sm">
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">{t('account.addressForm.contactName')}</span>
                <input
                  type="text"
                  value={addressForm.contactName ?? ''}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, contactName: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-3 py-2 text-emerald-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                />
              </label>
              <label className="text-sm">
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">{t('account.addressForm.phone')}</span>
                <input
                  type="tel"
                  value={addressForm.phone ?? ''}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-3 py-2 text-emerald-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">{t('account.addressForm.line1')}</span>
                <input
                  type="text"
                  required
                  value={addressForm.line1 ?? ''}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, line1: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-3 py-2 text-emerald-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">{t('account.addressForm.line2')}</span>
                <input
                  type="text"
                  value={addressForm.line2 ?? ''}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, line2: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-3 py-2 text-emerald-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                />
              </label>
              <label className="text-sm">
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">{t('account.addressForm.area')}</span>
                <input
                  type="text"
                  value={addressForm.area ?? ''}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, area: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-3 py-2 text-emerald-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                />
              </label>
              <label className="text-sm">
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">{t('account.addressForm.city')}</span>
                <input
                  type="text"
                  value={addressForm.city ?? ''}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, city: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-3 py-2 text-emerald-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                />
              </label>
              <label className="text-sm">
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">{t('account.addressForm.state')}</span>
                <input
                  type="text"
                  value={addressForm.state ?? ''}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, state: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-3 py-2 text-emerald-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                />
              </label>
              <label className="text-sm">
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">{t('account.addressForm.postalCode')}</span>
                <input
                  type="text"
                  value={addressForm.postalCode ?? ''}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, postalCode: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-3 py-2 text-emerald-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">{t('account.addressForm.landmark')}</span>
                <input
                  type="text"
                  value={addressForm.landmark ?? ''}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, landmark: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-emerald-200/70 bg-white px-3 py-2 text-emerald-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-100"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                <input
                  type="checkbox"
                  checked={Boolean(addressForm.isDefault)}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
                  className="h-4 w-4 rounded border-emerald-300 text-brand-500 focus:ring-brand-200 dark:border-emerald-700 dark:bg-slate-900"
                />
                {t('account.addressForm.makeDefault')}
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-60"
                disabled={addressSaving}
              >
                {addressSaving ? t('account.saving') : t('account.saveAddress')}
              </button>
              <button
                type="button"
                onClick={closeAddressForm}
                className="rounded-2xl border border-emerald-200/70 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-900/60 dark:text-emerald-200"
              >
                {t('account.cancel')}
              </button>
            </div>
          </form>
        )}
      </section>

      {status === 'loading' && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-300">{t('account.loading')}</p>
      )}
    </PageSection>
  );
}

export default AccountPage;
