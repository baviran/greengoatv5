import React from 'react';
import { Icon, assistantData } from './chatAppHelpersAndData';
import { useChatStore } from '../lib/store/chatStore';

const Sidebar: React.FC = () => {
    const { 
        threads, 
        activeThreadId, 
        setActiveThread, 
        updateThread, 
        deleteThread, 
        createNewThread,
        isLoading
    } = useChatStore();

    const handleThreadSelect = (threadId: string) => setActiveThread(threadId);
    
    const handleNewChat = async () => {
        await createNewThread();
    };
    
    const handleDeleteThread = async (e: React.MouseEvent, threadIdToDelete: string) => {
        e.stopPropagation();
        const confirmDelete = window.confirm("האם אתה בטוח שברצונך למחוק שיחה זו?");
        if (confirmDelete) {
            deleteThread(threadIdToDelete);
        }
    };


    return (
        <div className="fixed top-16 bottom-0 right-0 w-64 sm:w-72 bg-card border-l border-border flex flex-col p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                    <div className="p-1.5 sm:p-2 rounded-full bg-primary">
                        <Icon name="bot" className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                    </div>
                    <h2 className="text-card-foreground font-semibold text-sm sm:text-md">{assistantData.name}</h2>
                </div>
                <p className="text-foreground/70 text-xs mb-1">ID: {assistantData.id}</p>
                <p className="text-foreground/70 text-xs">{assistantData.description}</p>
            </div>

            <button
                onClick={handleNewChat}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors duration-150 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
                {isLoading ? (
                    <Icon name="loader2" className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                    <Icon name="plusSquare" className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span>{isLoading ? 'יוצר שיחה...' : 'צ\'אט חדש'}</span>
            </button>

            <div className="flex-grow space-y-1.5 overflow-y-auto pr-1 rtl:pl-1 rtl:pr-0">
                <h3 className="text-card-foreground font-medium text-xs sm:text-sm mb-2 px-1">היסטוריית שיחות</h3>
                {threads.length > 0 ? threads.map(thread => (
                    <div
                        key={thread.id}
                        onClick={() => handleThreadSelect(thread.id)}
                        className={`p-2 sm:p-2.5 rounded-md cursor-pointer group ${
                            activeThreadId === thread.id
                                ? 'bg-accent text-white'
                                : 'bg-muted text-foreground/80 hover:bg-muted/80 hover:text-card-foreground'
                        }`}
                    >
                        <div className="flex justify-between items-center">
                            <p className={`text-xs sm:text-sm truncate ${activeThreadId === thread.id ? 'text-white' : 'group-hover:text-card-foreground'}`}>{thread.title}</p>
                            <div className="flex space-x-1 rtl:space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleDeleteThread(e, thread.id)} className="p-1 rounded text-red-500 hover:bg-red-500/10" aria-label="Delete thread">
                                    <Icon name="trash2" className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <p className="text-foreground/70 text-xs sm:text-sm text-center py-4">לא נמצאו שיחות.</p>
                )}
            </div>

            <div className="mt-auto pt-3 sm:pt-4 border-t border-border">
                <span className="text-xs sm:text-sm">כל הזכויות שמורות</span>
            </div>
        </div>
    );
};

export default Sidebar;
