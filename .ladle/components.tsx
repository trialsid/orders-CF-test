import React, { useEffect } from 'react';
import type { GlobalProvider } from '@ladle/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationContext, TRANSLATIONS, translate, type Locale } from '../src/i18n/i18n';
import { AuthContext } from '../src/context/AuthContext';
import '../src/index.css';

export const Provider: GlobalProvider = ({ children, globalState }) => {
  const [locale, setLocale] = React.useState<Locale>('en');

  // Handle dark mode
  useEffect(() => {
    const isDark = globalState.theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [globalState.theme]);

  const translationValue = {
    locale,
    setLocale,
    t: (path: string, params?: any) => translate(TRANSLATIONS[locale], path, params),
    dictionary: TRANSLATIONS[locale],
  };

  const authValue = {
    user: null,
    token: null,
    status: 'ready' as const,
    authError: null,
    isAuthenticating: false,
    login: async () => { console.log('Mock login'); return { id: '1', phone: '123' } as any; },
    register: async () => { console.log('Mock register'); return { id: '1', phone: '123' } as any; },
    logout: () => console.log('Mock logout'),
    revokeSessions: async () => console.log('Mock revoke'),
    refreshSession: async () => null,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <TranslationContext.Provider value={translationValue}>
        <MemoryRouter>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
            {children}
          </div>
        </MemoryRouter>
      </TranslationContext.Provider>
    </AuthContext.Provider>
  );
};