import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, setLanguage as setI18nLanguage, getLanguage, t } from '../../i18n';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(getLanguage());

    const changeLanguage = (lang: Language) => {
        setLanguageState(lang);
        setI18nLanguage(lang);
        // Force re-render
        window.dispatchEvent(new Event('languagechange'));
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
}
