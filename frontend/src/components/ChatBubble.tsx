// src/components/ChatBubble.tsx
import React, { useState } from 'react';
import { Bot, User, FileText, ExternalLink, Quote, ChevronDown, ChevronUp, Sparkles, Activity } from 'lucide-react';
import type { Message, Source } from '../api/types';
import { clsx } from 'clsx';

// --- SUB-COMPONENT: Single Source Block ---
const SourceBlock = ({ title, content, source }: { title: string, content: string, source?: Source }) => {
  const [showSnippet, setShowSnippet] = useState(false);
  const [showReason, setShowReason] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:border-teal-200 group">

      {/* 1. Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Document Link */}
        <a
          href={source?.file_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            "flex items-center gap-2 font-bold text-sm transition-colors",
            source?.file_url ? "text-teal-700 hover:text-teal-900 hover:underline" : "text-gray-700"
          )}
        >
          <div className="bg-white border border-gray-200 p-1.5 rounded-md shadow-sm group-hover:border-teal-200 group-hover:bg-teal-50 transition-colors">
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <span>{title}</span>
          {source?.file_url && <ExternalLink className="w-3 h-3 opacity-40 hover:opacity-100" />}
        </a>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">

          {/* Button A: WHY? (Only if reason exists) */}
          {source?.reason && (
            <button
              onClick={() => { setShowReason(!showReason); setShowSnippet(false); }}
              className={clsx(
                "flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1.5 rounded-md transition-all border shadow-sm",
                showReason
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              )}
            >
              <Sparkles className="w-3 h-3" />
              <span>Why?</span>
            </button>
          )}

          {/* Button B: EVIDENCE */}
          {source?.snippet && (
            <button
              onClick={() => { setShowSnippet(!showSnippet); setShowReason(false); }}
              className={clsx(
                "flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1.5 rounded-md transition-all border shadow-sm",
                showSnippet
                  ? "bg-teal-50 text-teal-700 border-teal-200 ring-1 ring-teal-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-600"
              )}
            >
              {showSnippet ? "Hide Text" : "View Text"}
              {showSnippet ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* 2. PANEL A: AI Reasoning Card (The Actual Why) */}
      {showReason && source?.reason && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="rounded-lg p-3 border border-indigo-100 bg-indigo-50/50 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-xs uppercase tracking-wide text-indigo-700 opacity-90">
              <Activity className="w-3.5 h-3.5" />
              Match Analysis
            </div>
            <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">
              {source.reason}
            </p>
            {/* Decoration */}
            <div className="absolute -right-4 -bottom-4 opacity-5 transform rotate-12 text-indigo-600">
              <Sparkles className="w-16 h-16" />
            </div>
          </div>
        </div>
      )}

      {/* 3. PANEL B: Evidence Snippet */}
      {showSnippet && source?.snippet && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 shadow-inner relative">
            <div className="flex items-center gap-2 mb-2 text-teal-600 font-semibold uppercase tracking-wider text-[10px]">
              <Quote className="w-3 h-3" />
              Raw Document Text
            </div>
            <div className="pl-2 border-l-2 border-slate-300 ml-1">
              <p className="italic leading-relaxed font-mono text-[11px] text-slate-700">
                "...{source.snippet}..."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. The Answer Text */}
      <div className="pl-3 border-l-2 border-teal-500/20 ml-1">
        <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
          {content}
        </p>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
interface Props {
  message: Message;
}

export const ChatBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';

  const findSource = (title: string, sources?: Source[]): Source | undefined => {
    if (!sources) return undefined;

    return sources.find(s =>
      s.title.trim().toLowerCase() === title.trim().toLowerCase() ||
      s.title.includes(title) ||
      title.includes(s.title)
    );
  };


  const renderContent = (text: string, sources?: Source[]) => {
    if (!text.includes('### SOURCE:')) {
      return <p className="whitespace-pre-wrap">{text}</p>;
    }
    const parts = text.split('### SOURCE:').filter(part => part.trim());

    return (
      <div className="space-y-6">
        {parts.map((part, idx) => {
          const [titleLine, ...contentLines] = part.split('\n');
          const cleanTitle = titleLine.trim().replace(/[\[\]]/g, '');
          const content = contentLines.join('\n').trim();
          const source = findSource(cleanTitle, sources);

          return (
            <SourceBlock
              key={idx}
              title={cleanTitle}
              content={content}
              source={source}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={clsx("flex gap-4 mb-8", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={clsx(
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border",
        isUser ? "bg-teal-700 border-teal-800" : "bg-white border-gray-200"
      )}>
        {isUser ? <User className="text-white w-5 h-5" /> : <Bot className="text-teal-600 w-5 h-5" />}
      </div>

      <div className={clsx(
        "max-w-[95%] md:max-w-[85%] rounded-xl p-5 text-sm leading-relaxed shadow-sm",
        isUser
          ? "bg-teal-700 text-white"
          : "bg-white text-gray-800 border border-gray-200"
      )}>
        {renderContent(message.content, message.sources)}
      </div>
    </div>
  );
};