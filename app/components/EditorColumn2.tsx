import React from 'react';
import { SimpleEditor } from '@/app/components/tiptap/tiptap-templates/simple/simple-editor';

const EditorColumn: React.FC = () => {
    return (
        <div className="h-full p-4 sm:p-6 bg-card border-l border-border rtl:border-r rtl:border-l-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <SimpleEditor />
        </div>
    );
};

export default EditorColumn;
