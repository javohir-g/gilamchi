import { uzLatn, TranslationKeys } from './uz-latn';
import { uzCyrl } from './uz-cyrl';

export type Language = 'uz-latn' | 'uz-cyrl';

const translations: Record<Language, TranslationKeys> = {
    'uz-latn': uzLatn,
    'uz-cyrl': uzCyrl,
};

let currentLanguage: Language = 'uz-latn';

// Initialize from localStorage
if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'uz-latn' || saved === 'uz-cyrl')) {
        currentLanguage = saved;
    }
}

export function setLanguage(lang: Language) {
    currentLanguage = lang;
    if (typeof window !== 'undefined') {
        localStorage.setItem('language', lang);
    }
}

export function getLanguage(): Language {
    return currentLanguage;
}

export function t(key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let value: any = translations[currentLanguage];

    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            return key; // Return key if translation not found
        }
    }

    if (typeof value !== 'string') return key;

    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            value = (value as string).replace(`{${k}}`, String(v));
        });
    }

    return value;
}

export { uzLatn, uzCyrl };
