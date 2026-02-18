import React from 'react';
import { IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  isLoading = false 
}) => {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6 border-t border-gray-200 bg-white">
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 font-sans">
            Showing page <span className="font-bold text-gray-900">{currentPage}</span> of{' '}
            <span className="font-bold text-gray-900">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <IconButton
              onClick={handlePrev}
              disabled={currentPage === 1 || isLoading}
              className={`!rounded-l-md !rounded-r-none !border !border-gray-300 !bg-white !p-2 ${
                currentPage === 1 ? '!text-gray-300' : '!text-gray-500 hover:!bg-gray-50'
              }`}
            >
              <ChevronLeft className="!h-5 !w-5" />
            </IconButton>
            
            {/* Simple Page Indicator */}
            <div className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 font-sans">
               {isLoading ? '...' : currentPage}
            </div>

            <IconButton
              onClick={handleNext}
              disabled={currentPage === totalPages || isLoading}
              className={`!rounded-r-md !rounded-l-none !border !border-gray-300 !bg-white !p-2 ${
                currentPage === totalPages ? '!text-gray-300' : '!text-gray-500 hover:!bg-gray-50'
              }`}
            >
              <ChevronRight className="!h-5 !w-5" />
            </IconButton>
          </nav>
        </div>
      </div>
    </div>
  );
};