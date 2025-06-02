import React from 'react';

const EditorColumn: React.FC = () => {
    return (
        <div className="h-full p-4 sm:p-6 bg-card border-l border-border rtl:border-r rtl:border-l-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <h2 className="text-card-foreground text-xl sm:text-2xl font-semibold mb-4">עורך תוכן</h2>
            <div className="p-4 rounded-lg bg-background min-h-[200px] border border-border">
                <p className="text-foreground/70 text-sm">כאן יוצג תוכן לעריכה או מידע נוסף.</p>
                <textarea
                    className="w-full mt-4 p-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none text-sm"
                    rows="'5'"
                    defaultValue="אפשר להתחיל לכתוב כאן..."
                    aria-label="Content editor"
                ></textarea>
            </div>
        </div>
    );
};

export default EditorColumn;
