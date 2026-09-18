export type Locale = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: Direction;
  isRtl: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}
