import React from 'react';
import { Icon, assistantData } from './chatAppHelpersAndData';
import { SidebarProps } from '../types/chat';

const Sidebar: React.FC<SidebarProps> = ({ activeThreadId, setActiveThreadId, onNewChat, threads, setThreads }) => {
    const handleThreadSelect = (threadId: string) => setActiveThreadId(threadId);
    const handleNewChat = () => {
        const newThread = { id: `thread_${Date.now()}`, title: 'שיחה חדשה #' + (threads.length + 1) };
        setThreads(prevThreads => [newThread, ...prevThreads]);
        setActiveThreadId(newThread.id);
        onNewChat(newThread.id);
    };
    const handleDeleteThread = (e: React.MouseEvent, threadIdToDelete: string) => {
        e.stopPropagation();
        const confirmDelete = window.confirm("האם אתה בטוח שברצונך למחוק שיחה זו?");
        if (confirmDelete) {
            setThreads(prevThreads => prevThreads.filter(thread => thread.id !== threadIdToDelete));
            if (activeThreadId === threadIdToDelete) {
                const remainingThreads = threads.filter(t => t.id !== threadIdToDelete);
                setActiveThreadId(remainingThreads.length > 0 ? remainingThreads[0].id : null);
            }
        }
    };
    const handleEditThread = (e: React.MouseEvent, threadIdToEdit: string) => {
        e.stopPropagation();
        const currentThread = threads.find(t => t.id === threadIdToEdit);
        const newTitle = window.prompt("עדכן כותרת שיחה:", currentThread?.title);
        if (newTitle && newTitle.trim() !== "") {
            setThreads(prevThreads =>
                prevThreads.map(thread =>
                    thread.id === threadIdToEdit ? { ...thread, title: newTitle.trim() } : thread
                )
            );
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
                className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 text-sm sm:text-base"
            >
                <Icon name="plusSquare" className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>צ'אט חדש</span>
            </button>

            <div className="flex-grow space-y-1.5 overflow-y-auto pr-1 rtl:pl-1 rtl:pr-0">
                <h3 className="text-card-foreground font-medium text-xs sm:text-sm mb-2 px-1">היסטוריית שיחות</h3>
                {threads.length > 0 ? threads.map(thread => (
                    <div
                        key={thread.id}
                        onClick={() => handleThreadSelect(thread.id)}
                        className={`p-2 sm:p-2.5 rounded-md cursor-pointer group ${
                            activeThreadId === thread.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground/80 hover:bg-muted/80 hover:text-card-foreground'
                        }`}
                    >
                        <div className="flex justify-between items-center">
                            <p className={`text-xs sm:text-sm truncate ${activeThreadId === thread.id ? 'text-primary-foreground' : 'group-hover:text-card-foreground'}`}>{thread.title}</p>
                            <div className="flex space-x-1 rtl:space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleEditThread(e, thread.id)} className={`p-1 rounded hover:bg-muted/50 ${activeThreadId === thread.id ? 'text-primary-foreground hover:bg-primary/80' : 'text-foreground/70'}`} aria-label="Edit thread title">
                                    <Icon name="edit3" className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
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
                <button className="w-full flex items-center space-x-2 rtl:space-x-reverse py-1.5 sm:py-2 px-2 sm:px-3 rounded-md text-card-foreground hover:bg-muted">
                    <Icon name="settings" className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">הגדרות</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
