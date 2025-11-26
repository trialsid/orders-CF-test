import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import { AddressForm } from './AddressForm';
import { CheckoutFormValues, AuthUser } from '../../types';

const emptyForm: CheckoutFormValues = {
  name: '',
  phone: '',
  address: '',
  addressLine2: '',
  area: '',
  city: '',
  state: '',
  postalCode: '',
  landmark: '',
  slot: '',
  paymentMethod: '',
  instructions: '',
};

const filledForm: CheckoutFormValues = {
  name: 'John Doe',
  phone: '9876543210',
  address: '123 Main St',
  addressLine2: 'Apt 4B',
  area: 'Downtown',
  city: 'Gadwal',
  state: 'Telangana',
  postalCode: '509125',
  landmark: 'Near Temple',
  slot: '11:30 AM',
  paymentMethod: 'Cash on delivery',
  instructions: 'Leave at door',
};

const mockUser: AuthUser = {
  id: '1',
  phone: '9876543210',
  role: 'customer',
  status: 'active',
  displayName: 'John Doe',
};

export const Guest: Story = () => {
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState<Record<keyof CheckoutFormValues, boolean>>({} as any);

  const handleChange = (field: keyof CheckoutFormValues) => (e: any) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleBlur = (field: keyof CheckoutFormValues) => () => {
    setTouched({ ...touched, [field]: true });
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <AddressForm
        form={form}
        touched={touched}
        errors={{}}
        user={null}
        addresses={[]}
        isEditingAddress={false}
        selectedAddressId={null}
        saveAddressChoice={false}
        registerField={() => () => {}}
        handleChange={handleChange}
        handleBlur={handleBlur}
        startEditAddress={() => {}}
        cancelEditAddress={() => {}}
        saveAddress={() => {}}
        setSaveAddressChoice={() => {}}
        handleSelectSavedAddress={() => {}}
      />
    </div>
  );
};

export const Authenticated: Story = () => {
    const [isEditing, setIsEditing] = useState(false);
    return (
        <div className="max-w-2xl mx-auto p-4">
            <AddressForm
                form={filledForm}
                touched={{}}
                errors={{}}
                user={mockUser}
                addresses={[{ id: 'addr1', label: 'Home', line1: '123 Main St', city: 'Gadwal', postalCode: '509125', isDefault: true }]}
                isEditingAddress={isEditing}
                selectedAddressId={'addr1'}
                saveAddressChoice={false}
                registerField={() => () => {}}
                handleChange={() => () => {}}
                handleBlur={() => () => {}}
                startEditAddress={() => setIsEditing(true)}
                cancelEditAddress={() => setIsEditing(false)}
                saveAddress={() => setIsEditing(false)}
                setSaveAddressChoice={() => {}}
                handleSelectSavedAddress={() => {}}
            />
        </div>
    );
};

export const WithErrors: Story = () => (
    <div className="max-w-2xl mx-auto p-4">
        <AddressForm
            form={emptyForm}
            touched={{ name: true, phone: true, address: true }}
            errors={{ name: 'required', phone: 'invalidPhone', address: 'required' }}
            user={null}
            addresses={[]}
            isEditingAddress={false}
            selectedAddressId={null}
            saveAddressChoice={false}
            registerField={() => () => {}}
            handleChange={() => () => {}}
            handleBlur={() => () => {}}
            startEditAddress={() => {}}
            cancelEditAddress={() => {}}
            saveAddress={() => {}}
            setSaveAddressChoice={() => {}}
            handleSelectSavedAddress={() => {}}
        />
    </div>
);
