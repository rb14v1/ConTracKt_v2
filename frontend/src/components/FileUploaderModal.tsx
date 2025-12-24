// src/components/FileUploaderModal.tsx
import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { uploadFile } from '../api/client';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (fileName: string) => void;
}

export const FileUploaderModal: React.FC<Props> = ({ isOpen, onClose, onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('general');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading("Uploading document...");

    try {
      await uploadFile(file, category);
      toast.success("Uploaded successfully!", { id: toastId });
      onUploadComplete(file.name); // Pass name back for system msg
      handleClose();
    } catch (error: any) {
      console.error(error);
      toast.error("Upload failed.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setCategory('general');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative scale-100 animate-in zoom-in-95 duration-200">
        
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-[#212121] mb-1">Add Knowledge</h2>
        <p className="text-sm text-gray-500 mb-6">Upload a contract to analyze.</p>

        {/* File Drop Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-5 group
            ${file ? 'border-[#21b0be] bg-teal-50/50' : 'border-gray-200 hover:border-[#21b0be] hover:bg-gray-50'}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          
          {file ? (
            <div className="flex flex-col items-center text-[#21b0be]">
              <FileText className="w-10 h-10 mb-2" />
              <span className="font-semibold text-sm truncate max-w-[200px] text-gray-800">{file.name}</span>
              <span className="text-xs text-teal-600 mt-1 font-medium">Click to change file</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-400 group-hover:text-[#21b0be] transition-colors">
              <Upload className="w-10 h-10 mb-2" />
              <span className="font-medium text-sm text-gray-600">Click to select PDF</span>
            </div>
          )}
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">Document Category</label>
          <div className="relative">
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#21b0be]/50 appearance-none cursor-pointer"
            >
              <option value="general">General / Others</option>
              <option value="employee_contracts">Employee Contract</option>
              <option value="nda">Non-Disclosure Agreement (NDA)</option>
              <option value="loan_agreements">Loan Agreement</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2
            ${!file || uploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#21b0be] hover:bg-[#159da9] hover:shadow-md hover:-translate-y-0.5'}
          `}
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          {uploading ? 'Uploading...' : 'Confirm Upload'}
        </button>

      </div>
    </div>
  );
};