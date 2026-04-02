import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeType = 'dark' | 'light';

interface IThemeStore {
    fromSystem: boolean;
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
    setFromSystem: (fromSystem: boolean) => void;
}

export const useThemeStore = create<IThemeStore>()(
    persist(
        (set) => ({
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
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
