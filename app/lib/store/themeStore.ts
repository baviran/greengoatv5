import { create } from "zustand";

type ThemeStore = {
    value: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;
    toggleTheme: () => void;
    initializeTheme: () => void;
}

const getStoredTheme = (): 'dark' | 'light' => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme');
    return stored === 'dark' ? 'dark' : 'light';
};

const saveTheme = (theme: 'dark' | 'light') => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
    }
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
    value: 'light',
    
    setTheme: (theme: 'dark' | 'light') => {
        saveTheme(theme);
        set({ value: theme });
    },
    
    toggleTheme: () => {
        const currentTheme = get().value;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        saveTheme(newTheme);
        set({ value: newTheme });
    },
    
    initializeTheme: () => {
        const storedTheme = getStoredTheme();
        set({ value: storedTheme });
    }
}));