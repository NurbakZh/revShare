import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeType = 'dark' | 'light';
export type UserRole = 'investor' | 'business';

interface IAppStore {
    // Theme
    fromSystem: boolean;
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
    setFromSystem: (fromSystem: boolean) => void;

    // User state
    role: UserRole;
    isConnected: boolean;
    hasBusiness: boolean;
    setRole: (role: UserRole) => void;
    setIsConnected: (isConnected: boolean) => void;
    setHasBusiness: (hasBusiness: boolean) => void;
}

export const useAppStore = create<IAppStore>()(
    persist(
        (set) => ({
            // Theme initial
            fromSystem: true,
            theme: 'light',
            setTheme: (theme) =>
                set(() => ({
                    theme,
                    fromSystem: false,
                })),
            setFromSystem: (fromSystem) =>
                set(() => ({
                    fromSystem,
                })),

            // User states
            role: 'investor',
            isConnected: false,
            hasBusiness: false,
            setRole: (role) => set(() => ({ role })),
            setIsConnected: (isConnected) => set(() => ({ isConnected })),
            setHasBusiness: (hasBusiness) => set(() => ({ hasBusiness })),
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
