'use client';

import React from 'react';
import { useTranslation, type Locale } from '@/lib/i18n';
import { GlobeIcon } from '@stocky/icons';

export interface LanguageSwitcherProps {
  variant?: 'segmented' | 'compact' | 'drawerItem' | 'sidebar';
  className?: string;
}

export function LanguageSwitcher({
  variant = 'segmented',
  className = '',
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation();

  const handleSelect = (newLocale: Locale) => {
    if (newLocale !== locale) {
      setLocale(newLocale);
    }
  };

  if (variant === 'sidebar') {
    return (
      <div className={`stocky-sidebar-language-control ${className}`}>
        {/* Collapsed view: compact 36px icon button fitting the 56px collapsed rail */}
        <button
          type="button"
          onClick={() => handleSelect(locale === 'en' ? 'ar' : 'en')}
          className="stocky-sidebar-language-collapsed"
          aria-label={t('language.switchLanguage')}
          title={locale === 'en' ? 'تغيير اللغة إلى العربية' : 'Switch to English'}
        >
          <GlobeIcon size={15} />
          <span className="stocky-sidebar-language-collapsed-badge">
            {locale === 'en' ? 'AR' : 'EN'}
          </span>
        </button>

        {/* Expanded view: full segmented toggle */}
        <div className="stocky-sidebar-language-expanded">
          <button
            type="button"
            onClick={() => handleSelect('en')}
            className={`stocky-sidebar-lang-btn ${
              locale === 'en' ? 'stocky-sidebar-lang-btn--active' : ''
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleSelect('ar')}
            className={`stocky-sidebar-lang-btn font-cairo ${
              locale === 'ar' ? 'stocky-sidebar-lang-btn--active' : ''
            }`}
          >
            العربية
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'drawerItem') {
    return (
      <div className={`w-full p-3.5 rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget flex items-center justify-between gap-3 shadow-2xs ${className}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-text-main shrink-0">
            <GlobeIcon size={16} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-stocky-text-main">
              {t('language.currentLanguage')}
            </span>
            <span className="text-[10px] text-stocky-text-sub">
              {locale === 'ar' ? 'اللغة العربية (Arabic)' : 'English (الإنجليزية)'}
            </span>
          </div>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center rounded-lg bg-stocky-bg-global p-1 border border-stocky-border-subtle/80 text-xs select-none">
          <button
            type="button"
            onClick={() => handleSelect('en')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              locale === 'en'
                ? 'bg-stocky-bg-widget text-stocky-text-main shadow-xs font-semibold'
                : 'text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => handleSelect('ar')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium font-cairo transition-all cursor-pointer ${
              locale === 'ar'
                ? 'bg-stocky-bg-widget text-stocky-text-main shadow-xs font-semibold'
                : 'text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            عربي
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => handleSelect(locale === 'en' ? 'ar' : 'en')}
        className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget hover:bg-stocky-bg-global text-xs font-medium text-stocky-text-main transition-colors cursor-pointer ${className}`}
        aria-label={t('language.switchLanguage')}
        title={t('language.switchLanguage')}
      >
        <GlobeIcon size={13} className="text-stocky-text-sub" />
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${locale === 'en' ? 'font-cairo' : ''}`}>
          {locale === 'en' ? 'عربي' : 'EN'}
        </span>
      </button>
    );
  }

  // Default: Segmented
  return (
    <div
      className={`inline-flex items-center rounded-full bg-stocky-bg-global p-0.5 border border-stocky-border-subtle text-xs select-none ${className}`}
    >
      <button
        type="button"
        onClick={() => handleSelect('en')}
        className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
          locale === 'en'
            ? 'bg-stocky-bg-widget text-stocky-text-main shadow-xs font-semibold'
            : 'text-stocky-text-sub hover:text-stocky-text-main'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => handleSelect('ar')}
        className={`px-3 py-1 rounded-full text-[11px] font-medium font-cairo transition-all cursor-pointer ${
          locale === 'ar'
            ? 'bg-stocky-bg-widget text-stocky-text-main shadow-xs font-semibold'
            : 'text-stocky-text-sub hover:text-stocky-text-main'
        }`}
      >
        العربية
      </button>
    </div>
  );
}
