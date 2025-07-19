'use client';

import React from 'react';

const TopBar: React.FC = () => {
    return (
        <div className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 z-50">
            <h1 className="text-foreground font-semibold text-lg">
                בניה ירוקה בעידן הבינה המלאכותית
            </h1>
            <div className="flex items-center space-x-4">
                {/* Space for future non-auth actions */}
            </div>
        </div>
    );
};

export default TopBar;
