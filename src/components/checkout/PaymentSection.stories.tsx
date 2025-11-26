import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import { PaymentSection } from './PaymentSection';
import { CheckoutFormValues } from '../../types';

const defaultForm: CheckoutFormValues = {
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

export const Default: Story = () => {
    const [form, setForm] = useState(defaultForm);
    
    return (
        <div className="max-w-2xl mx-auto p-4">
            <PaymentSection
                form={form}
                touched={{}}
                errors={{}}
                registerField={() => () => {}}
                handleChange={(field) => (e) => setForm({ ...form, [field]: e.target.value })}
                handleBlur={() => () => {}}
            />
        </div>
    );
};

export const WithErrors: Story = () => (
    <div className="max-w-2xl mx-auto p-4">
        <PaymentSection
            form={defaultForm}
            touched={{ slot: true, paymentMethod: true }}
            errors={{ slot: 'required', paymentMethod: 'required' }}
            registerField={() => () => {}}
            handleChange={() => () => {}}
            handleBlur={() => () => {}}
        />
    </div>
);
