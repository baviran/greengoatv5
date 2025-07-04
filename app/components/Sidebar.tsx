import React from 'react';
import { Icon } from '@/app/components/icons';
import { assistantData } from './chatAppHelpersAndData';
import { useAuthenticatedChatStore } from '../lib/store/chatStore';
import { useAuthContext } from '@/context/auth-context';
import { AuthGuard } from './auth/AuthGuard';

const Sidebar: React.FC = () => {
    const { 
        threads, 
        activeThreadId, 
        setActiveThread,
        deleteThread, 
        createNewThread,
        isLoading
    } = useAuthenticatedChatStore();
    
    const { user } = useAuthContext();

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

            <AuthGuard 
                fallback={
                    <div className="flex items-center justify-center py-4">
                        <p className="text-foreground/70 text-xs text-center">
                            התחבר כדי לראות את השיחות שלך
                        </p>
                    </div>
                }
            >
                <button
                    onClick={handleNewChat}
                    disabled={isLoading || !user}
                    className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors duration-150 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    {isLoading ? (
                        <Icon name="loader2" className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                        <Icon name="plusSquare" className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                    <span>{isLoading ? 'יוצר שיחה...' : 'צ\'אט חדש'}</span>
                </button>

                <div className="flex-grow space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    {threads.length === 0 ? (
                        <p className="text-foreground/50 text-xs text-center py-4">
                            אין שיחות עדיין.<br />התחל שיחה חדשה!
                        </p>
                    ) : (
                        threads.map((thread) => (
                            <div
                                key={thread.id}
                                onClick={() => handleThreadSelect(thread.id)}
                                className={`group cursor-pointer p-2 sm:p-3 rounded-lg border transition-all duration-150 ${
                                    activeThreadId === thread.id
                                        ? 'bg-accent text-white border-accent shadow-md'
                                        : 'bg-background border-border hover:bg-muted hover:border-muted-foreground/20'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-grow min-w-0 mr-2 rtl:ml-2 rtl:mr-0">
                                        <h3 className="text-sm font-medium truncate leading-tight">
                                            {thread.title}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteThread(e, thread.id)}
                                        className={`flex-shrink-0 p-1 rounded transition-colors duration-150 ${
                                            activeThreadId === thread.id
                                                ? 'text-white/80 hover:text-white hover:bg-white/10'
                                                : 'text-foreground/40 hover:text-foreground/70 hover:bg-destructive/10'
                                        }`}
                                        aria-label="Delete thread"
                                    >
                                        <Icon name="trash2" className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </AuthGuard>
        </div>
    );
};

export default Sidebar;
