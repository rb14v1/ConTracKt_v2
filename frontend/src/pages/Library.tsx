// src/pages/Library.tsx
import React, { useState } from 'react';
import { IconButton, Button, CircularProgress } from '@mui/material';
import { OpenInNew, Description, CheckBox, CheckBoxOutlineBlank, Close, FilterList } from '@mui/icons-material';
import { useDocuments } from '../hooks/useDocuments'; // Custom Hook
import { Pagination } from '../components/Pagination'; // New Component
import type { Document } from '../api/types';

interface Props {
  isOpen?: boolean; 
  onClose?: () => void;
  mode?: 'view' | 'select';
  onSelectionConfirm?: (selectedDocs: Document[]) => void; 
}

export const Library: React.FC<Props> = ({ 
  isOpen = true, 
  onClose, 
  mode = 'view', 
  onSelectionConfirm 
}) => {
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Use our new hook for data management (Lazy Loading integrated)
  const { documents, loading, page, setPage, totalPages } = useDocuments(filter, isOpen);

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (onSelectionConfirm) {
      const selectedDocs = documents.filter(doc => selectedIds.includes(doc.id));
      onSelectionConfirm(selectedDocs);
    }
    onClose?.();
  };

  if (!isOpen) return null;

  const containerClasses = mode === 'select'
    ? "fixed top-[72px] bottom-0 left-0 right-0 z-40 bg-[#F9FAFB] border-t border-gray-200 shadow-2xl flex flex-col animate-in slide-in-from-bottom-2 font-sans"
    : "h-full w-full bg-[#F9FAFB] flex flex-col font-sans";

  return (
    <div className={containerClasses}>
      
      {/* --- Header --- */}
      <div className="bg-white px-8 py-5 flex justify-between items-center shadow-sm border-b border-gray-200 shrink-0">
        
        <div className="flex items-center gap-4 w-1/3">
          <div className={`p-2.5 rounded-xl ${mode === 'select' ? 'bg-teal-50' : 'bg-gray-50'}`}>
            <Description className={`!w-5 !h-5 ${mode === 'select' ? 'text-[#21b0be]' : 'text-gray-600'}`} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              {mode === 'select' ? 'Select Context' : 'Contract Library'}
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {mode === 'select' ? 'Choose contracts to analyze' : 'Manage your uploaded documents'}
            </p>
          </div>
        </div>

        {/* Center: Professional Filter */}
        <div className="flex justify-center w-1/3">
          <div className="relative group w-64">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FilterList className="!w-4 !h-4" />
            </div>
            {/* Keeping Native Select to preserve exact Tailwind layout without MUI Popover overrides */}
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm font-medium border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#21b0be]/20 focus:border-[#21b0be] bg-white text-gray-700 appearance-none cursor-pointer hover:border-gray-300 transition-colors"
            >
              <option value="all">All Contracts</option>
              <option value="employee_contracts">Employee Contracts</option>
              <option value="nda">NDAs</option>
              <option value="loan_agreements">Loan Agreements</option>
              <option value="general">General / Others</option>
            </select>
          </div>
        </div>
        
        {/* Right: Actions */}
        <div className="flex justify-end w-1/3 gap-3">
          {mode === 'select' && (
            <>
              <Button 
                onClick={handleConfirm}
                variant="contained"
                className="!bg-[#21b0be] !text-white !px-5 !py-2 !rounded-lg !text-sm !font-bold !shadow-sm hover:!bg-[#1da1ad] hover:!shadow-md !transition-all active:!scale-95 !normal-case"
              >
                Confirm Selection ({selectedIds.length})
              </Button>
              <IconButton 
                onClick={onClose} 
                className="!p-2 !text-gray-400 hover:!text-gray-600 hover:!bg-gray-100 !rounded-lg !transition-colors"
              >
                 <Close className="!w-5 !h-5" />
              </IconButton>
            </>
          )}
        </div>
      </div>

      {/* --- Table Content --- */}
      <div className="flex-1 overflow-auto p-6 md:p-8 flex flex-col">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-6xl mx-auto w-full flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
              <CircularProgress size={32} className="!text-[#21b0be]" />
              <p className="text-sm font-medium text-gray-500">Retrieving contracts...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 border-b border-gray-100">
                  <tr>
                    <th className="py-4 px-6 w-16 text-center">
                      {mode === 'select' && "#"}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Document Name</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Upload Date</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {documents.length === 0 ? (
                     <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">No documents found.</td></tr>
                  ) : documents.map((doc) => {
                    const isSelected = selectedIds.includes(doc.id);
                    return (
                      <tr 
                        key={doc.id} 
                        className={`transition-colors duration-150 group ${isSelected ? 'bg-teal-50/30' : 'hover:bg-gray-50'} ${mode === 'select' ? 'cursor-pointer select-none' : ''}`}
                        onClick={() => mode === 'select' && toggleSelection(doc.id)}
                      >
                        <td className="py-4 px-6 text-center">
                          {mode === 'select' && (
                            isSelected 
                              ? <CheckBox className="!w-5 !h-5 !text-[#21b0be]" />
                              : <CheckBoxOutlineBlank className="!w-5 !h-5 !text-gray-300 group-hover:!text-gray-400" />
                          )}
                        </td>
                        <td className={`py-4 px-6 text-sm font-semibold ${isSelected ? 'text-[#21b0be]' : 'text-gray-700'}`}>
                          {doc.title}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 capitalize">
                            {doc.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500 font-mono">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            href={doc.file_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            endIcon={<OpenInNew className="!w-3.5 !h-3.5" />}
                            className="!inline-flex !items-center !gap-1.5 !text-gray-500 hover:!text-[#21b0be] !px-3 !py-1.5 !rounded-md !font-medium !text-xs !transition-colors !normal-case"
                          >
                            Open Contract
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* --- Pagination Footer --- */}
          {!loading && (
             <Pagination 
               currentPage={page}
               totalPages={totalPages}
               onPageChange={setPage}
               isLoading={loading}
             />
          )}
        </div>
      </div>
    </div>
  );
};