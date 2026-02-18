import { IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface ListPaginationProps {
    page: number;
    totalPages: number;
    onNext: () => void;
    onPrev: () => void;
    loading?: boolean;
}

export const ListPagination = ({ 
    page, 
    totalPages, 
    onNext, 
    onPrev,
    loading = false 
}: ListPaginationProps) => {
    // Hide if only 1 page
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 px-2">
            <IconButton
                onClick={onPrev}
                disabled={page === 1 || loading}
                className="!p-2 !text-gray-500 hover:!text-[#21b0be] hover:!bg-cyan-50 !rounded-lg disabled:!opacity-30 disabled:hover:!bg-transparent disabled:hover:!text-gray-500 !transition-all"
                aria-label="Previous page"
            >
                <ChevronLeft className="!w-5 !h-5" />
            </IconButton>

            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans">
                Page {page} of {totalPages}
            </span>

            <IconButton
                onClick={onNext}
                disabled={page === totalPages || loading}
                className="!p-2 !text-gray-500 hover:!text-[#21b0be] hover:!bg-cyan-50 !rounded-lg disabled:!opacity-30 disabled:hover:!bg-transparent disabled:hover:!text-gray-500 !transition-all"
                aria-label="Next page"
            >
                <ChevronRight className="!w-5 !h-5" />
            </IconButton>
        </div>
    );
};