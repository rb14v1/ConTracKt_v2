import { IconButton, Button } from '@mui/material';
import { ViewSidebar, FolderOpen, FilterList, Close } from '@mui/icons-material';
import { clsx } from 'clsx';
import type { Document } from '../../api/types';

interface HeaderProps {
    isSidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
    selectedDocs: Document[];
    categoryFilter: string;
    onCategoryChange: (cat: string) => void;
    onClearCategory: () => void;
    onOpenDocModal: () => void;
    onClearSelection: () => void;
}

export const Header = ({
    isSidebarOpen,
    setSidebarOpen,
    selectedDocs,
    categoryFilter,
    onCategoryChange,
    onClearCategory,
    onOpenDocModal,
    onClearSelection
}: HeaderProps) => {
    return (
        <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white z-20 shadow-sm font-sans">
            {/* Left: Sidebar Toggle & Title */}
            <div className="flex items-center gap-3">
                {!isSidebarOpen && (
                    <IconButton
                        onClick={() => setSidebarOpen(true)}
                        className="!p-2 !text-gray-400 hover:!text-[#21b0be] hover:!bg-teal-50 !rounded-lg !transition-all"
                    >
                        <ViewSidebar className="!w-4 !h-4" />
                    </IconButton>
                )}
                <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="font-bold text-gray-800 tracking-tight">Chat Analysis</span>
                    {selectedDocs.length > 0 ? (
                        <span className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full border border-teal-100 font-medium animate-in fade-in">
                            <FolderOpen className="!w-3 !h-3" />
                            {selectedDocs.length} Contracts
                        </span>
                    ) : (
                        categoryFilter !== 'All Contracts' && (
                            <span className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full border border-teal-100 font-medium animate-in fade-in">
                                <FilterList className="!w-3 !h-3" />
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
                    <Button
                        onClick={onOpenDocModal}
                        startIcon={<FolderOpen className="!w-3.5 !h-3.5" />}
                        className={clsx(
                            "!flex !items-center !gap-2 !px-3 !py-1.5 !rounded-md !text-xs !font-medium !transition-all !border !shadow-sm !normal-case",
                            selectedDocs.length > 0
                                ? "!bg-teal-50 !border-[#21b0be] !text-teal-700 !pr-8"
                                : "!bg-white !border-gray-200 !text-gray-600 hover:!border-[#21b0be] hover:!text-[#21b0be]"
                        )}
                    >
                        {selectedDocs.length > 0 ? `${selectedDocs.length} Selected` : 'Select Contracts'}
                    </Button>
                    {selectedDocs.length > 0 && (
                        <IconButton
                            onClick={(e) => { e.stopPropagation(); onClearSelection(); }}
                            size="small"
                            className="!absolute !right-1 !top-1/2 !-translate-y-1/2 !p-1 !text-teal-400 hover:!text-red-500 !transition-colors"
                        >
                            <Close className="!w-3 !h-3" />
                        </IconButton>
                    )}
                </div>

                {/* 2. Category Dropdown */}
                <div className={clsx("relative", selectedDocs.length > 0 && "opacity-40 pointer-events-none")}>
                    <div className="relative">
                        <select
                            value={categoryFilter}
                            onChange={(e) => onCategoryChange(e.target.value)}
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
                        {categoryFilter !== 'All Contracts' ? (
                            <IconButton
                                onClick={(e) => { e.stopPropagation(); onClearCategory(); }}
                                className="!absolute !right-2 !top-1/2 !-translate-y-1/2 !p-0.5 !text-teal-400 hover:!text-red-500 hover:!bg-red-50 !rounded-full !transition-colors !z-10"
                            >
                                <Close className="!w-3 !h-3" />
                            </IconButton>
                        ) : (
                            <FilterList className="!w-3 !h-3 !text-gray-400 !absolute !right-2.5 !top-1/2 !-translate-y-1/2 pointer-events-none" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};