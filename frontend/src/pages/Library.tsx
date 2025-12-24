// src/pages/Library.tsx
import React, { useState, useEffect } from 'react';
import { ExternalLink, Loader2, FileText, CheckSquare, Square, X } from 'lucide-react';
import { fetchDocuments } from '../api/client';
import type { Document } from '../api/types';

interface Props {
  // If true, we handle layout. If false, parent handles layout.
  // When used as a page, isOpen is always true.
  isOpen?: boolean; 
  onClose?: () => void;
  mode?: 'view' | 'select';
  onSelectionConfirm?: (selectedDocs: Document[]) => void; 
}

export const Library: React.FC<Props> = ({ isOpen = true, onClose, mode = 'view', onSelectionConfirm }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadDocs();
      if (mode === 'select') setSelectedIds([]);
    }
  }, [isOpen, filter, mode]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const categoryToSend = filter === 'all' ? undefined : filter;
      const data = await fetchDocuments(categoryToSend);
      setDocuments(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

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

  // LAYOUT LOGIC:
  // If mode is 'select', strictly use fixed modal positioning.
  // If mode is 'view', assume it's a page and fill the container.
  const containerClasses = mode === 'select'
    ? "fixed top-[72px] bottom-0 left-0 right-0 z-40 bg-[#F5F5F5] border-t border-gray-200 shadow-2xl flex flex-col animate-in slide-in-from-bottom-2"
    : "h-full w-full bg-[#F5F5F5] flex flex-col"; // Simple flex fill for Page mode

  return (
    <div className={containerClasses}>
      
      {/* --- Header --- */}
      <div className="bg-white px-8 py-4 flex justify-between items-center shadow-sm border-b border-gray-200 relative shrink-0">
        
        <div className="flex items-center gap-3 w-1/3">
          <div className="bg-teal-50 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-[#21b0be]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight">
              {mode === 'select' ? 'Select Context' : 'Contract Library'}
            </h1>
            <p className="text-xs text-gray-400">
              {mode === 'select' ? 'Select specific contracts for analysis' : 'View and manage uploaded contracts'}
            </p>
          </div>
        </div>

        {/* Center: Filter */}
        <div className="flex justify-center w-1/3">
          <div className="relative group w-64">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full p-2 pl-4 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#21b0be] focus:border-[#21b0be] bg-gray-50 text-gray-700 appearance-none cursor-pointer hover:border-[#21b0be] transition-colors font-medium text-center"
            >
              <option value="all">📂 All Contracts</option>
              <option value="employee_contracts">👔 Employee Contracts</option>
              <option value="nda">🔒 NDAs</option>
              <option value="loan_agreements">💰 Loan Agreements</option>
              <option value="general">📄 General / Others</option>
            </select>
          </div>
        </div>
        
        {/* Right: Actions */}
        <div className="flex justify-end w-1/3 gap-3">
          {mode === 'select' && (
            <>
              <button 
                onClick={handleConfirm}
                className="bg-[#21b0be] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#159da9] transition-all border border-teal-600"
              >
                Confirm ({selectedIds.length})
              </button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                 <X className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- Table Content --- */}
      <div className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-6xl mx-auto">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 text-[#21b0be] animate-spin" />
              <p className="text-sm">Retrieving contracts...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 w-12 text-center">
                    {mode === 'select' && "#"}
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 pb-20 block md:table-row-group">
                {documents.map((doc) => {
                  const isSelected = selectedIds.includes(doc.id);
                  return (
                    <tr 
                      key={doc.id} 
                      className={`transition-colors group ${isSelected ? 'bg-teal-50/40' : 'hover:bg-gray-50'} ${mode === 'select' ? 'cursor-pointer' : ''}`}
                      onClick={() => mode === 'select' && toggleSelection(doc.id)}
                    >
                      <td className="py-3 px-6 text-center">
                        {mode === 'select' && (
                          isSelected 
                            ? <CheckSquare className="w-5 h-5 text-[#21b0be]" />
                            : <Square className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
                        )}
                      </td>
                      <td className={`py-3 px-6 text-sm font-semibold ${isSelected ? 'text-[#21b0be]' : 'text-gray-700'}`}>{doc.title}</td>
                      <td className="py-3 px-6 text-sm text-gray-500 capitalize">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[11px] font-medium border border-gray-200">
                          {doc.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-500 font-mono">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <a 
                          href={doc.file_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-md font-medium text-xs hover:bg-[#21b0be] hover:text-white hover:border-[#21b0be] transition-all shadow-sm"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="h-24 w-full"></div>
      </div>
    </div>
  );
};