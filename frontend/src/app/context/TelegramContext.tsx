import React, { createContext, useContext, useEffect, useState } from 'react';

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        query_id?: string;
        user?: TelegramUser;
        receiver?: TelegramUser;
        start_param?: string;
        auth_date?: string;
        hash?: string;
    };
    ready: () => void;
    expand: () => void;
    close: () => void;
    headerColor: string;
    backgroundColor: string;
    MainButton: {
        text: string;
        color: string;
        textColor: string;
        isVisible: boolean;
        isActive: boolean;
        show: () => void;
        hide: () => void;
        enable: () => void;
        disable: () => void;
        onClick: (cb: () => void) => void;
        offClick: (cb: () => void) => void;
    };
}

declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
    }
}

interface TelegramContextType {
    webApp: TelegramWebApp | null;
    user: TelegramUser | null;
    startParam: string | null;
    isReady: boolean;
}

const TelegramContext = createContext<TelegramContextType>({
    webApp: null,
    user: null,
    startParam: null,
    isReady: false,
});

export const useTelegram = () => useContext(TelegramContext);

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.ready();
            tg.expand();
            setWebApp(tg);
            setIsReady(true);
        }
    }, []);

    const value = {
        webApp: webApp || null,
        user: webApp?.initDataUnsafe?.user || null,
        startParam: webApp?.initDataUnsafe?.start_param || null,
        isReady,
    };

    return (
        <TelegramContext.Provider value={value}>
            {children}
        </TelegramContext.Provider>
    );
};
