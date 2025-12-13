import React from 'react';
import { Bot, User, FileText, ExternalLink, ArrowRight } from 'lucide-react';
import type{ Message, Source } from '../api/types';
import { clsx } from 'clsx';

interface Props {
  message: Message;
}

export const ChatBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';

  // --- Helper to find URL for a specific title ---
  const findSourceUrl = (title: string, sources?: Source[]) => {
    if (!sources) return null;
    // Try exact match or partial match
    const match = sources.find(s => 
      s.title.trim().toLowerCase() === title.trim().toLowerCase() ||
      s.title.includes(title) || 
      title.includes(s.title)
    );
    return match?.file_url;
  };

  // --- Parser Component ---
  const renderContent = (text: string, sources?: Source[]) => {
    // 1. If text doesn't have our special marker, return plain text
    if (!text.includes('### SOURCE:')) {
      return <p className="whitespace-pre-wrap">{text}</p>;
    }

    // 2. Split by the marker
    const parts = text.split('### SOURCE:').filter(part => part.trim());

    return (
      <div className="space-y-6">
        {parts.map((part, idx) => {
          // Extract Title (first line) and Content (rest)
          const [titleLine, ...contentLines] = part.split('\n');
          const cleanTitle = titleLine.trim().replace(/[\[\]]/g, ''); // Remove brackets if any
          const content = contentLines.join('\n').trim();
          const fileUrl = findSourceUrl(cleanTitle, sources);

          return (
            <div key={idx} className="flex flex-col gap-2">
              {/* -> Name of Doc (Hyperlinked) */}
              <a 
                href={fileUrl || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className={clsx(
                  "flex items-center gap-2 font-semibold text-sm w-fit transition-colors",
                  fileUrl ? "text-teal-600 hover:text-teal-800 hover:underline" : "text-gray-700 cursor-default"
                )}
              >
                <ArrowRight className="w-4 h-4" />
                <FileText className="w-4 h-4" />
                {cleanTitle}
                {fileUrl && <ExternalLink className="w-3 h-3 opacity-50" />}
              </a>

              {/* --> Answer */}
              <div className="pl-6 border-l-2 border-gray-100 ml-2">
                 <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                   {content}
                 </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={clsx("flex gap-4 mb-8", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={clsx(
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border",
        isUser ? "bg-teal-700 border-teal-800" : "bg-white border-gray-200"
      )}>
        {isUser ? <User className="text-white w-5 h-5" /> : <Bot className="text-teal-600 w-5 h-5" />}
      </div>

      {/* Message Body */}
      <div className={clsx(
        "max-w-[85%] rounded-xl p-5 text-sm leading-relaxed shadow-sm",
        isUser 
          ? "bg-teal-700 text-white" 
          : "bg-white text-gray-800 border border-gray-200"
      )}>
        
        {/* Render Parsed Content */}
        {renderContent(message.content, message.sources)}

        {/* Fallback Citation Footer (Optional, good to keep for backup) */}
        {!isUser && message.sources && !message.content.includes('### SOURCE:') && (
          <div className="mt-4 pt-3 border-t border-gray-100">
             <p className="text-xs font-bold text-gray-400 uppercase mb-2">Sources Referenced</p>
             <div className="flex flex-wrap gap-2">
               {message.sources.map((src, i) => (
                 <a key={i} href={src.file_url || '#'} target="_blank" className="text-xs text-teal-600 hover:underline flex items-center gap-1 bg-teal-50 px-2 py-1 rounded">
                   <FileText className="w-3 h-3"/> {src.title} (Pg {src.page})
                 </a>
               ))}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};