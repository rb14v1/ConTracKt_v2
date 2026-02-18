import { useEffect, useRef, useState } from 'react';
import { CircularProgress, IconButton, Button } from '@mui/material';
import { MenuOpen, DriveFileRenameOutline } from '@mui/icons-material';
import { useChat } from '../hooks/useChat';
import { ResponseBubble } from '../components/chat/ResponseBubble';
import { MainLayout } from '../layout/MainLayout';
import { Library } from './Library';
import { FileUploaderModal } from '../components/FileUploaderModal';
import { Header } from '../components/chat/Header'; 
import { Input } from '../components/chat/Input';   
import toast, { Toaster } from 'react-hot-toast';
import { clsx } from 'clsx';
import type { Document } from '../api/types';

// We use !important to override react-hot-toast's default inline styles
const TOAST_CLASS = "!bg-white !text-gray-700 !border !border-gray-200 !shadow-md !rounded-lg !text-[13px] !font-medium";

export const Chats = () => {
    const { messages, loading, handleSend, addSystemMessage, resetChat } = useChat();
    const [input, setInput] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    // UI State
    const [categoryFilter, setCategoryFilter] = useState('All Contracts');
    const [selectedDocs, setSelectedDocs] = useState<Document[]>([]);

    // Modals
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Send Logic
    const onSend = () => {
        if (!input.trim()) return;

        const catMap: Record<string, string> = {
            'All Contracts': 'all',
            'Employee Contracts': 'employee_contracts',
            'NDAs': 'nda',
            'Loan Agreements': 'loan_agreements',
            'General': 'general'
        };
        const apiCategory = catMap[categoryFilter] || 'all';

        const docIds = selectedDocs.map(d => d.id);
        const finalDocIds = docIds.length > 0 ? docIds : undefined;
        const finalCategory = docIds.length > 0 ? undefined : apiCategory;

        handleSend(input, finalCategory, finalDocIds);
        setInput('');
    };

    // --- SMART ACTIONS ---
    const handleCategoryChange = (newCat: string) => {
        setCategoryFilter(newCat);
        setSelectedDocs([]);
        const msg = newCat === 'All Contracts' ? "Context reset: Searching All Contracts" : `Filter active: ${newCat}`;
        addSystemMessage(msg);
        toast.success(msg, { icon: '🔍', className: TOAST_CLASS });
    };

    const handleClearSelection = () => {
        setSelectedDocs([]);
        addSystemMessage("Selection cleared. Reverted to global search.");
        toast.success("Selection cleared", { className: TOAST_CLASS });
    };

    const handleDocSelection = (docs: Document[]) => {
        setSelectedDocs(docs);
        setIsDocModalOpen(false);
        if (docs.length === 0) return;

        const names = docs.slice(0, 2).map(d => d.title).join(', ');
        const remaining = docs.length > 2 ? ` + ${docs.length - 2} more` : '';
        const msg = `Context locked to ${docs.length} Contracts: ${names}${remaining}`;
        addSystemMessage(msg);
        toast.success(`${docs.length} Contracts selected`, { icon: '📂', className: TOAST_CLASS });
    };

    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-80px)] bg-white overflow-hidden relative font-sans">
                {/* Apply global toast styles here */}
                <Toaster position="top-center" toastOptions={{ duration: 3000, className: TOAST_CLASS }} />

                {/* --- SIDEBAR --- */}
                <div className={clsx(
                    "bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-30",
                    isSidebarOpen ? "w-[260px] min-w-[260px]" : "w-0 overflow-hidden"
                )}>
                    <div className="p-4 flex flex-col h-full w-[260px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Menu</h2>
                            <IconButton 
                                onClick={() => setSidebarOpen(false)} 
                                className="!p-1 !text-gray-400 hover:!text-[#21b0be] !transition-colors"
                            >
                                <MenuOpen className="!w-4 !h-4" />
                            </IconButton>
                        </div>
                        <Button
                            onClick={() => {
                                resetChat();
                                setInput('');
                                setCategoryFilter('All Contracts');
                                setSelectedDocs([]);
                                addSystemMessage("New chat started.");
                                toast.success("New chat started", { className: TOAST_CLASS });
                            }}
                            variant="contained"
                            startIcon={<DriveFileRenameOutline className="!w-4 !h-4" />}
                            className="!bg-[#21b0be] hover:!bg-[#159da9] !text-white !rounded-lg !p-2.5 !flex !items-center !justify-center !gap-2 !font-medium !shadow-sm !transition-all !mb-6 !mx-1 !text-sm !normal-case"
                        >
                            New Chat
                        </Button>
                    </div>
                </div>

                {/* --- MAIN AREA --- */}
                <div className="flex-1 flex flex-col relative w-full h-full bg-white transition-all">

                    {/* 1. Header Component */}
                    <Header
                        isSidebarOpen={isSidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                        selectedDocs={selectedDocs}
                        categoryFilter={categoryFilter}
                        onCategoryChange={handleCategoryChange}
                        onClearCategory={() => handleCategoryChange('All Contracts')}
                        onOpenDocModal={() => setIsDocModalOpen(true)}
                        onClearSelection={handleClearSelection}
                    />

                    {/* 2. Chat Stream */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth pb-20 bg-white">
                        <div className="max-w-6xl mx-auto w-full">
                            {messages.slice(1).map((msg) => (
                                <ResponseBubble key={msg.id} message={msg} />
                            ))}
                            {loading && (
                                <div className="flex justify-center mt-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-teal-100 rounded-full shadow-sm text-[#21b0be] text-xs font-medium animate-pulse">
                                        <CircularProgress size={14} className="!text-[#21b0be]" />
                                        <span>Analyzing contracts...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                    </div>

                    {/* 3. Input Component */}
                    <Input
                        input={input}
                        setInput={setInput}
                        onSend={onSend}
                        loading={loading}
                        selectedDocs={selectedDocs}
                        onOpenUpload={() => setIsUploadModalOpen(true)}
                    />
                </div>
            </div>

            {/* Modals */}
            <Library
                isOpen={isDocModalOpen}
                onClose={() => setIsDocModalOpen(false)}
                mode="select"
                onSelectionConfirm={handleDocSelection}
            />

            <FileUploaderModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadComplete={(name) => {
                    addSystemMessage(`Index updated: ${name} added.`);
                    toast.success("Contract uploaded successfully", { className: TOAST_CLASS });
                }}
            />
        </MainLayout>
    );
};