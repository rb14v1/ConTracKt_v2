import { IconButton, InputBase } from '@mui/material';
import { Send, Upload } from '@mui/icons-material';
import { clsx } from 'clsx';
import type { Document } from '../../api/types';

interface InputProps {
    input: string;
    setInput: (v: string) => void;
    onSend: () => void;
    loading: boolean;
    selectedDocs: Document[];
    onOpenUpload: () => void;
}

export const Input = ({ input, setInput, onSend, loading, selectedDocs, onOpenUpload }: InputProps) => {
    return (
        <div className="absolute bottom-1 left-0 right-0 px-4 z-20 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-2 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-[#21b0be] transition-all">
                    
                    <IconButton
                        onClick={onOpenUpload}
                        className="!p-2.5 !text-gray-400 hover:!text-[#21b0be] hover:!bg-teal-50 !rounded-full !transition-all"
                        title="Upload new contract"
                    >
                        <Upload className="!w-4 !h-4" />
                    </IconButton>

                    <InputBase
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSend()}
                        placeholder={selectedDocs.length > 0 ? "Ask about selected contracts..." : "Ask about a contract..."}
                        className="flex-1 !bg-transparent !text-gray-700 !text-sm !h-10 !px-2"
                        disabled={loading}
                        inputProps={{
                            className: "placeholder:text-gray-400"
                        }}
                    />

                    <IconButton
                        onClick={onSend}
                        disabled={loading || !input.trim()}
                        className={clsx(
                            "!p-2.5 !rounded-full !transition-all !duration-200 !flex !items-center !justify-center",
                            input.trim()
                                ? "!bg-[#21b0be] !text-white hover:!bg-[#159da9] !shadow-md transform hover:scale-105"
                                : "!bg-gray-100 !text-gray-300 cursor-not-allowed"
                        )}
                    >
                        <Send className="!w-4 !h-4" />
                    </IconButton>
                </div>
                <p className="text-center text-[10px] text-gray-400 mt-2 font-medium tracking-wide">
                    ConTrackt AI can make mistakes. Verify critical info.
                </p>
            </div>
        </div>
    );
};