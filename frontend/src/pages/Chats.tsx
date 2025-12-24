// src/pages/Chats.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Paperclip, PanelLeftClose, PanelLeftOpen, Plus, FolderOpen, X, Filter } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { ChatBubble } from '../components/ChatBubble';
import { MainLayout } from '../layout/MainLayout';
import { Library } from './Library';
import { FileUploaderModal } from '../components/FileUploaderModal';
import toast, { Toaster } from 'react-hot-toast';
import { clsx } from 'clsx';
import type { Document } from '../api/types';

// --- Reusable Clean Toast Style ---
const toastStyle = {
    borderRadius: '8px',
    background: '#fff',
    color: '#374151',
    border: '1px solid #E5E7EB',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    fontSize: '13px',
    fontWeight: '500'
};

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

        const msg = newCat === 'All Contracts'
            ? "Context reset: Searching All Contracts"
            : `Filter active: ${newCat}`;

        addSystemMessage(msg);
        toast.success(msg, { icon: '🔍', style: toastStyle });
    };

    const clearCategory = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (categoryFilter !== 'All Contracts') {
            handleCategoryChange('All Contracts');
        }
    };

    const clearSelection = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedDocs([]);
        addSystemMessage("Selection cleared. Reverted to global search.");
        toast.success("Selection cleared", { style: toastStyle });
    };

    const handleDocSelection = (docs: Document[]) => {
        setSelectedDocs(docs);
        setIsDocModalOpen(false);

        if (docs.length === 0) return;

        const names = docs.slice(0, 2).map(d => d.title).join(', ');
        const remaining = docs.length > 2 ? ` + ${docs.length - 2} more` : '';
        const docLabel = docs.length === 1 ? 'Contract' : 'Contracts';

        const msg = `Context locked to ${docs.length} ${docLabel}: ${names}${remaining}`;

        addSystemMessage(msg);
        toast.success(`${docs.length} Contracts selected`, { icon: '📂', style: toastStyle });
    };

    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-80px)] bg-white overflow-hidden relative font-sans">
                <Toaster
                    position="top-center"
                    toastOptions={{ duration: 3000, style: toastStyle }}
                />

                {/* --- SIDEBAR --- */}
                <div className={clsx(
                    "bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-30",
                    isSidebarOpen ? "w-[260px] min-w-[260px]" : "w-0 overflow-hidden"
                )}>
                    <div className="p-4 flex flex-col h-full w-[260px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Menu</h2>
                            <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400 hover:text-[#21b0be] transition-colors">
                                <PanelLeftClose className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                resetChat();
                                setInput('');
                                setCategoryFilter('All Contracts');
                                setSelectedDocs([]);
                                addSystemMessage("New chat started.");
                                toast.success("New chat started", { style: toastStyle });
                            }}

                            className="bg-[#21b0be] hover:bg-[#159da9] text-white rounded-lg p-2.5 flex items-center justify-center gap-2 font-medium shadow-sm transition-all mb-6 mx-1 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Chat</span>
                        </button>
                    </div>
                </div>

                {/* --- MAIN AREA --- */}
                <div className="flex-1 flex flex-col relative w-full h-full bg-white transition-all">

                    {/* Header (Top Bar) */}
                    <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white z-20 shadow-sm">

                        {/* Left: Sidebar Toggle & Title */}
                        <div className="flex items-center gap-3">
                            {!isSidebarOpen && (
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="p-2 text-gray-400 hover:text-[#21b0be] hover:bg-teal-50 rounded-lg transition-all"
                                >
                                    <PanelLeftOpen className="w-4 h-4" />
                                </button>
                            )}
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="font-bold text-gray-800 tracking-tight">Chat Analysis</span>
                                {/* Context Breadcrumb */}
                                {selectedDocs.length > 0 ? (
                                    <span className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full border border-teal-100 font-medium animate-in fade-in">
                                        <FolderOpen className="w-3 h-3" />
                                        {selectedDocs.length} Contracts
                                    </span>
                                ) : (
                                    categoryFilter !== 'All Contracts' && (
                                        // FIXED: Was indigo, now pure teal
                                        <span className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full border border-teal-100 font-medium animate-in fade-in">
                                            <Filter className="w-3 h-3" />
                                            {categoryFilter}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Right: Context Controls */}
                        <div className="flex gap-2 items-center">

                            {/* 1. Document Selector Button */}
                            <div className="relative group">
                                <button
                                    onClick={() => setIsDocModalOpen(true)}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all border shadow-sm",
                                        selectedDocs.length > 0
                                            ? "bg-teal-50 border-[#21b0be] text-teal-700 pr-8"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-[#21b0be] hover:text-[#21b0be]"
                                    )}
                                >
                                    <FolderOpen className="w-3.5 h-3.5" />
                                    {selectedDocs.length > 0 ? `${selectedDocs.length} Selected` : 'Select Contracts'}
                                </button>
                                {/* Clear Selection X */}
                                {selectedDocs.length > 0 && (
                                    <button
                                        onClick={clearSelection}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-teal-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {/* 2. Category Dropdown */}
                            <div className={clsx("relative", selectedDocs.length > 0 && "opacity-40 pointer-events-none")}>
                                <div className="relative">
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        // FIXED: Styling now strictly uses teal/gray. Added accent-teal-600 for browser support.
                                        className={clsx(
                                            "appearance-none bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-md pl-3 pr-8 py-1.5 shadow-sm focus:outline-none focus:border-[#21b0be] focus:ring-1 focus:ring-[#21b0be] cursor-pointer min-w-[130px] transition-all accent-[#21b0be]",
                                            categoryFilter !== 'All Contracts' && "border-teal-200 text-teal-700 bg-teal-50/30"
                                        )}
                                    >
                                        <option>All Contracts</option>
                                        <option>General</option>
                                        <option>Employee Contracts</option>
                                        <option>NDAs</option>
                                        <option>Loan Agreements</option>
                                    </select>

                                    {/* Clear Category X */}
                                    {categoryFilter !== 'All Contracts' ? (
                                        <button
                                            onClick={clearCategory}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-teal-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    ) : (
                                        <Filter className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Stream */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth pb-32 bg-white">
                        <div className="max-w-6xl mx-auto w-full">
                            {messages.slice(1).map((msg) => (
                                <ChatBubble key={msg.id} message={msg} />
                            ))}
                            {loading && (
                                <div className="flex justify-center mt-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-teal-100 rounded-full shadow-sm text-[#21b0be] text-xs font-medium animate-pulse">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Analyzing contracts...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                    </div>

                    {/* --- INPUT AREA --- */}
                    <div className="absolute bottom-6 left-0 right-0 px-4 z-20">
                        <div className="max-w-6xl mx-auto">
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-2 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-[#21b0be] transition-all">

                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="p-2.5 text-gray-400 hover:text-[#21b0be] hover:bg-teal-50 rounded-full transition-all"
                                >
                                    <Paperclip className="w-4 h-4" />
                                </button>

                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onSend()}
                                    placeholder={selectedDocs.length > 0 ? "Ask about selected contracts..." : "Ask about a contract..."}
                                    className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-sm h-10 px-2"
                                    disabled={loading}
                                />

                                <button
                                    onClick={onSend}
                                    disabled={loading || !input.trim()}
                                    className={clsx(
                                        "p-2.5 rounded-full transition-all duration-200 flex items-center justify-center",
                                        input.trim()
                                            ? "bg-[#21b0be] text-white hover:bg-[#159da9] shadow-md transform hover:scale-105"
                                            : "bg-gray-100 text-gray-300 cursor-not-allowed"
                                    )}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-center text-[10px] text-gray-400 mt-2 font-medium tracking-wide">
                                ConTrackt AI can make mistakes. Verify critical info.
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* MODALS */}
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
                    toast.success("Contract uploaded successfully", { style: toastStyle });
                }}
            />
        </MainLayout>
    );
};