import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeType = 'dark' | 'light'
export type UserRole = 'investor' | 'business'

interface IAppStore {
    fromSystem: boolean
    theme: ThemeType
    setTheme: (theme: ThemeType) => void
    setFromSystem: (fromSystem: boolean) => void
    role: UserRole
    hasBusiness: boolean
    setRole: (role: UserRole) => void
    setHasBusiness: (hasBusiness: boolean) => void
}

export const useAppStore = create<IAppStore>()(
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
            role: 'investor',
            hasBusiness: false,
            setRole: (role) => set(() => ({ role })),
            setHasBusiness: (hasBusiness) => set(() => ({ hasBusiness })),
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => localStorage),
        },
    ),
)
