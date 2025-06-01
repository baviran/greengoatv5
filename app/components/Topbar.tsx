import React from 'react';
import { Icon } from './chatAppHelpersAndData'; // Assuming Icon is in a separate file or defined above
import { TopBarProps } from '../types/chat';

const TopBar: React.FC<TopBarProps> = ({ isDarkMode, toggleDarkMode }) => {
    return (
        <div className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 z-50">
            <h1 className="text-foreground font-semibold text-lg">
                פלטפורמת צ'אט מתקדמת
            </h1>
            <button
                onClick={toggleDarkMode}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="p-2 rounded-md text-foreground hover:bg-muted"
            >
                {/* Icons might need specific colors if not inheriting correctly or if --foreground is too dark/light for them */}
                {isDarkMode ? <Icon name="sun" className="w-6 h-6 text-yellow-400" /> : <Icon name="moon" className="w-6 h-6 text-slate-700" />}
            </button>
        </div>
    );
};

export default TopBar;
