import React from 'react';
import Sidebar from './Sidebar';
import ChatColumn from './ChatColumn';
import EditorColumn from './EditorColumn';

const Main: React.FC = () => {
    return (
        <div className={`pt-16 flex h-screen`}>
            <Sidebar />
            <main className="flex-grow flex mr-64 sm:mr-72 rtl:ml-0 rtl:mr-0 ml-0 sm:ml-0 rtl:mr-64 rtl:sm:mr-72">
                <div className="w-full md:w-1/2 h-full">
                    <ChatColumn />
                </div>
                <div className="hidden md:block w-1/2 h-full">
                    <EditorColumn />
                </div>
            </main>
        </div>
    );
};

export default Main;
