import { SmartToy, Person, InfoOutlined } from '@mui/icons-material';
import type { Message, Source } from '../../api/types';
import { clsx } from 'clsx';
import { SourceBlock } from './SourceBlock';

interface Props {
  message: Message;
}

export const ResponseBubble = ({ message }: Props) => {
  const isUser = message.role === 'user';
  const isSystem = message.content.startsWith('SYSTEM_UPDATE:');

  // --- RENDERER: System Updates ---
  if (isSystem) {
    const cleanText = message.content.replace('SYSTEM_UPDATE:', '').replace(/\*\*/g, '').trim();
    return (
      <div className="flex justify-center my-4 w-full animate-in fade-in zoom-in-95 duration-300 font-sans">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full shadow-sm">
            <InfoOutlined className="!w-3.5 !h-3.5 !text-[#21b0be]" />
            <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase">
                {cleanText}
            </span>
        </div>
      </div>
    );
  }

  // --- HELPER: Find Source ---
  const findSource = (title: string, sources?: Source[]): Source | undefined => {
    if (!sources) return undefined;
    return sources.find(s => s.title.includes(title) || title.includes(s.title));
  };

  // --- RENDERER: Content Splitter ---
  const renderContent = (text: string, sources?: Source[]) => {
    if (!text.includes('### SOURCE:')) {
      return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
    }
    
    const parts = text.split('### SOURCE:').filter(part => part.trim());

    return (
      <div className="space-y-4">
        {parts.map((part, idx) => {
          const [titleLine, ...contentLines] = part.split('\n');
          const cleanTitle = titleLine.trim().replace(/[\[\]]/g, '');
          const content = contentLines.join('\n').trim();
          const source = findSource(cleanTitle, sources);
          
          return <SourceBlock key={idx} title={cleanTitle} content={content} source={source} />;
        })}
      </div>
    );
  };

  return (
    <div className={clsx("flex gap-3 mb-6 font-sans", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={clsx(
        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-all",
        isUser ? "bg-[#21b0be] text-white shadow-md" : "bg-white border border-gray-200 text-[#21b0be]"
      )}>
        {isUser ? <Person className="!w-5 !h-5" /> : <SmartToy className="!w-5 !h-5" />}
      </div>

      <div className={clsx(
        "max-w-[85%] lg:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm shadow-sm transition-all",
        isUser
          ? "bg-[#21b0be] text-white rounded-tr-none shadow-md"
          : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
      )}>
        {renderContent(message.content, message.sources)}
      </div>
    </div>
  );
};