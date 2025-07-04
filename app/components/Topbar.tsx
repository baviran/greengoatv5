import React from 'react';
import { Icon } from '@/app/components/icons';
import { useThemeStore } from '../lib/store/themeStore';

const TopBar: React.FC = () => {
    const { value: theme, toggleTheme } = useThemeStore();
    const isDarkMode = theme === 'dark';

    return (
        <div className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 z-50">
            <h1 className="text-foreground font-semibold text-lg">
                בניה ירוקה בעידן הבינה המלאכותית
            </h1>
            <button
                onClick={toggleTheme}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="p-2 rounded-md text-foreground hover:bg-muted"
            >
                {isDarkMode ? <Icon name="sun" className="w-6 h-6 text-yellow-400" /> : <Icon name="moon" className="w-6 h-6 text-slate-700" />}
            </button>
        </div>
    );
};

export default TopBar;
