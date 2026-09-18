'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Direction, I18nContextValue, Locale } from './types';
import { en } from './locales/en';
import { ar } from './locales/ar';

const DICTIONARIES = { en, ar };

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale = 'en' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Initialize from cookie or localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('stocky_locale') as Locale | null;
      if (stored === 'en' || stored === 'ar') {
        setLocaleState(stored);
        document.documentElement.lang = stored;
        document.documentElement.dir = stored === 'ar' ? 'rtl' : 'ltr';
        return;
      }
      // Check cookies
      const match = document.cookie.match(/(?:^|;\s*)stocky_locale=([^;]+)/);
      if (match && (match[1] === 'en' || match[1] === 'ar')) {
        const cookieLocale = match[1] as Locale;
        setLocaleState(cookieLocale);
        document.documentElement.lang = cookieLocale;
        document.documentElement.dir = cookieLocale === 'ar' ? 'rtl' : 'ltr';
      }
    } catch {
      // Fallback gracefully in restricted environments
    }
  }, []);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    try {
      localStorage.setItem('stocky_locale', nextLocale);
      document.cookie = `stocky_locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = nextLocale;
      document.documentElement.dir = nextLocale === 'ar' ? 'rtl' : 'ltr';
    } catch {
      // Ignore storage errors
    }
  };

  const dir: Direction = locale === 'ar' ? 'rtl' : 'ltr';
  const isRtl = locale === 'ar';

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>): string => {
      const parts = key.split('.');
      const currentDict = DICTIONARIES[locale] || DICTIONARIES.en;
      const fallbackDict = DICTIONARIES.en;

      let value: any = currentDict;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          value = undefined;
          break;
        }
      }

      // Fallback to English dictionary if missing in active dictionary
      if (value === undefined) {
        let fallbackValue: any = fallbackDict;
        for (const part of parts) {
          if (fallbackValue && typeof fallbackValue === 'object' && part in fallbackValue) {
            fallbackValue = fallbackValue[part];
          } else {
            fallbackValue = undefined;
            break;
          }
        }
        value = fallbackValue;
      }

      if (typeof value !== 'string') {
        return key;
      }

      if (!params) {
        return value;
      }

      return Object.entries(params).reduce((acc, [paramKey, paramVal]) => {
        return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      }, value);
    };
  }, [locale]);

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      dir,
      isRtl,
      t,
    }),
    [locale, dir, isRtl, t]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      locale: 'en',
      setLocale: () => {},
      dir: 'ltr',
      isRtl: false,
      t: (key: string) => key,
    };
  }
  return context;
}
