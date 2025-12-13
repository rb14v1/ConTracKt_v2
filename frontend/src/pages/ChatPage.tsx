import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2, ArrowLeft, Paperclip, PanelLeftClose, PanelLeftOpen, Bot, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { ChatBubble } from '../components/ChatBubble';
import { uploadFile } from '../api/client';
import toast, { Toaster } from 'react-hot-toast';
import { clsx } from 'clsx';

export const ChatPage = () => {
    const { messages, loading, handleSend } = useChat();
    const [input, setInput] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const onSend = () => {
        if (!input.trim()) return;
        handleSend(input);
        setInput('');
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const toastId = toast.loading("Uploading document...");

        try {
            await uploadFile(file);
            toast.success("Document added to knowledge base", { id: toastId });
        } catch (err) {
            toast.error("Upload failed", { id: toastId });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
            <Toaster position="top-center" />

            {/* --- SIDEBAR --- */}
            <div className={clsx(
                "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-20 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
                isSidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full opacity-0 overflow-hidden"
            )}>
                <div className="p-5 flex flex-col h-full min-w-[18rem]"> {/* min-w fixes content squashing during transition */}

                    {/* Logo Area */}
                    <div className="flex items-center gap-3 mb-8 px-2 mt-2">
                        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-md">
                            <Bot className="text-white w-5 h-5" />
                        </div>
                        <h1 className="font-bold text-xl text-gray-800 tracking-tight">ConTrackt</h1>
                    </div>

                    {/* New Chat / Upload Action */}
                    <div className="mb-6">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 bg-gray-50 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 text-gray-600 p-4 rounded-xl transition-all text-sm font-medium group"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-colors" />
                            )}
                            <span>New Document</span>
                        </button>
                    </div>

                    {/* Sidebar Footer */}
                    <div className="mt-auto pt-6 border-t border-gray-100 space-y-4">
                        <button onClick={() => navigate('/')} className="flex items-center gap-3 text-sm text-gray-500 hover:text-teal-700 transition w-full px-2 py-2 rounded-lg hover:bg-gray-50">
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Home</span>
                        </button>
                        <div className="text-[10px] text-center text-gray-300 py-2">
                            Enterprise v1.0 • Secure S3
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CHAT AREA --- */}
            <div className="flex-1 flex flex-col relative w-full h-full bg-gray-50/50">

                {/* Header */}
                <div className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/80 flex items-center px-6 justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-teal-600 transition"
                            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                        >
                            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                        </button>
                        <span className="font-semibold text-gray-700 tracking-tight">Workspace</span>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-start pb-4">
                        {messages.map((msg) => (
                            <ChatBubble key={msg.id} message={msg} />
                        ))}

                        {loading && (
                            <div className="flex gap-4 mb-8 animate-pulse">
                                <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Loader2 className="text-teal-600 w-4 h-4 animate-spin" />
                                </div>
                                <div className="flex items-center text-sm text-gray-400">
                                    Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                </div>

                {/* Floating Input Area */}
                <div className="p-4 pb-6">
                    <div className="max-w-3xl mx-auto relative">

                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf"
                            onChange={handleUpload}
                        />

                        {/* Input Card - Soft Shape & Teal Border */}
                        <div className="bg-white rounded-[26px] shadow-lg shadow-gray-200/40 border border-gray-200 flex items-end p-1.5 gap-2 transition-all duration-200 focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-500/10">

                            {/* Attachment Button - Circle Shape */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-10 h-10 rounded-full text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors flex items-center justify-center flex-shrink-0"
                                title="Upload PDF"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>

                            {/* Text Input - Compact Height */}
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        onSend();
                                    }
                                }}
                                placeholder="Ask a question..."
                                className="flex-1 max-h-32 min-h-[44px] py-2.5 bg-transparent border-none outline-none focus:ring-0 text-gray-600 placeholder-gray-400 resize-none text-sm leading-relaxed"
                                disabled={loading}
                                rows={1}
                            />

                            {/* Send Button - Soft Pill Shape */}
                            <button
                                onClick={onSend}
                                disabled={loading || !input.trim()}
                                className={`
                  h-10 px-5 rounded-full font-medium transition-all duration-200 flex items-center justify-center shadow-sm
                  ${input.trim()
                                        ? 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-600/20'
                                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'}
                `}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Disclaimer */}
                        <p className="text-center text-[10px] text-gray-400 mt-2.5">
                            ConTrackt AI can make mistakes. Please verify important information.
                        </p>
                    </div>
                </div>      </div>
        </div>
    );
};