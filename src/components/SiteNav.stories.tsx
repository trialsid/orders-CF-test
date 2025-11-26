import type { Story } from '@ladle/react';
import { action } from '@ladle/react';
import React, { useEffect } from 'react';
import SiteNav from './SiteNav';
import { AuthContext } from '../context/AuthContext';
import { AuthUser } from '../types';

const commonProps = {
    theme: 'light' as const,
    onToggleTheme: action('onToggleTheme'),
};

interface SiteNavArgs {
    cartCount: number;
}

export const Guest: Story<SiteNavArgs> = ({ cartCount }) => (
    <SiteNav {...commonProps} cartCount={cartCount} />
);

Guest.args = {
    cartCount: 2,
};
Guest.argTypes = {
    cartCount: { control: { type: 'range', min: 0, max: 20 } }
};

const mockUser: AuthUser = {
    id: '1',
    phone: '9876543210',
    role: 'customer',
    status: 'active',
    displayName: 'Surya',
    fullName: 'Surya Reddy',
};

const loggedInAuthContextValue = {
    user: mockUser,
    token: 'mock-token',
    status: 'ready' as const,
    authError: null,
    isAuthenticating: false,
    login: async () => mockUser,
    register: async () => mockUser,
    logout: action('logout'),
    revokeSessions: async () => {},
    refreshSession: async () => null,
};

interface LoggedInArgs extends SiteNavArgs {
    displayName: string;
    phone: string;
}

export const LoggedIn: Story<LoggedInArgs> = ({ cartCount, displayName, phone }) => (
    <AuthContext.Provider value={{
        ...loggedInAuthContextValue,
        user: { ...mockUser, displayName, phone }
    }}>
        <SiteNav {...commonProps} cartCount={cartCount} />
    </AuthContext.Provider>
);

LoggedIn.args = {
    cartCount: 5,
    displayName: 'Surya Reddy',
    phone: '9876543210',
};

export const MobileMenuOpen: Story = () => {
    useEffect(() => {
        // Simulate a click on the mobile menu toggle button after a short delay
        const timer = setTimeout(() => {
            // The mobile menu button has a class 'md:hidden' and aria-label 'Toggle menu'
            const button = document.querySelector('button[aria-label="Toggle menu"]');
            if (button instanceof HTMLElement) {
                button.click();
            }
        }, 100); // Small delay to ensure component is rendered
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{ height: '600px', width: '375px', border: '1px solid #ccc', overflow: 'auto' }}>
            <SiteNav {...commonProps} />
        </div>
    );
};

export const UtilityMenuOpen: Story = () => {
    useEffect(() => {
        // Simulate a click on the utility menu toggle button after a short delay
        const timer = setTimeout(() => {
            // The utility menu button for logged in user has a span with userDisplayName or text 'Account'
            // Or the button itself has aria-haspopup="menu"
            const button = document.querySelector('button[aria-haspopup="menu"]');
            if (button instanceof HTMLElement) {
                button.click();
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AuthContext.Provider value={loggedInAuthContextValue}>
            <div style={{ height: '600px', width: '1024px', border: '1px solid #ccc', overflow: 'auto' }}>
                <SiteNav {...commonProps} cartCount={5} />
            </div>
        </AuthContext.Provider>
    );
};
