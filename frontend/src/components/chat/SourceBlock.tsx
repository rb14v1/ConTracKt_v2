import { useState } from 'react';
import { Button } from '@mui/material';
import { Description, OpenInNew, AutoAwesome, ExpandMore, ExpandLess, Analytics, FormatQuote } from '@mui/icons-material';
import { clsx } from 'clsx';
import type { Source } from '../../api/types';

interface SourceBlockProps {
  title: string;
  content: string;
  source?: Source;
}

export const SourceBlock = ({ title, content, source }: SourceBlockProps) => {
  const [showSnippet, setShowSnippet] = useState(false);
  const [showReason, setShowReason] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 transition-all hover:border-[#21b0be]/50 hover:shadow-sm group mt-2 font-sans">

      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <a
          href={source?.file_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => !source?.file_url && e.preventDefault()}
          className={clsx(
            "flex items-center gap-2 font-bold text-sm transition-colors decoration-0",
            source?.file_url ? "text-gray-700 hover:text-[#21b0be]" : "text-gray-700"
          )}
        >
          <div className="bg-white border border-gray-200 p-1.5 rounded-md shadow-sm group-hover:border-[#21b0be] group-hover:text-[#21b0be] transition-colors text-gray-400 flex items-center justify-center">
            <Description className="!w-4 !h-4" />
          </div>
          <span>{title}</span>
          {source?.file_url && <OpenInNew className="!w-3 !h-3 opacity-40 hover:opacity-100" />}
        </a>

        {/* Toggle Buttons */}
        <div className="flex items-center gap-2">
          {source?.reason && (
            <Button
              onClick={() => { setShowReason(!showReason); setShowSnippet(false); }}
              variant="outlined"
              size="small"
              startIcon={<AutoAwesome className="!w-3 !h-3" />}
              className={clsx(
                "!flex !items-center !gap-1.5 !text-[10px] !uppercase !font-bold !tracking-wider !px-2.5 !py-1.5 !rounded-md !transition-all !shadow-sm !border !min-w-0",
                showReason
                  ? "!bg-teal-50 !text-[#21b0be] !border-[#21b0be] ring-1 ring-[#21b0be]/20"
                  : "!bg-white !text-gray-500 !border-gray-200 hover:!border-[#21b0be] hover:!text-[#21b0be]"
              )}
            >
              Context
            </Button>
          )}

          {source?.snippet && (
            <Button
              onClick={() => { setShowSnippet(!showSnippet); setShowReason(false); }}
              variant="outlined"
              size="small"
              endIcon={showSnippet ? <ExpandLess className="!w-3 !h-3" /> : <ExpandMore className="!w-3 !h-3" />}
              className={clsx(
                "!flex !items-center !gap-1.5 !text-[10px] !uppercase !font-bold !tracking-wider !px-2.5 !py-1.5 !rounded-md !transition-all !shadow-sm !border !min-w-0",
                showSnippet
                  ? "!bg-teal-50 !text-[#21b0be] !border-[#21b0be] ring-1 ring-[#21b0be]/20"
                  : "!bg-white !text-gray-500 !border-gray-200 hover:!border-[#21b0be] hover:!text-[#21b0be]"
              )}
            >
              {showSnippet ? "Hide Text" : "Excerpt"}
            </Button>
          )}
        </div>
      </div>

      {/* Logic Panels */}
      {showReason && source?.reason && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="rounded-lg p-3 border border-teal-100 bg-teal-50/30 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-xs uppercase tracking-wide text-[#21b0be] opacity-90">
              <Analytics className="!w-3.5 !h-3.5" />
              Match Analysis
            </div>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">{source.reason}</p>
          </div>
        </div>
      )}

      {showSnippet && source?.snippet && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600 shadow-inner relative">
            <div className="flex items-center gap-2 mb-2 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
              <FormatQuote className="!w-3 !h-3" />
              Raw Document Text
            </div>
            <div className="pl-2 border-l-2 border-[#21b0be] ml-1">
              <p className="italic leading-relaxed font-mono text-[11px] text-gray-600">"...{source.snippet}..."</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="pl-3 border-l-2 border-gray-200 hover:border-[#21b0be] transition-colors ml-1">
        <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">{content}</p>
      </div>
    </div>
  );
};