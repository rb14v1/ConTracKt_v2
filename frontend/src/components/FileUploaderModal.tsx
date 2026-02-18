// src/components/FileUploaderModal.tsx
import React, { useState, useRef } from 'react';
import { Dialog, IconButton, Button, CircularProgress } from '@mui/material';
import { Close, CloudUploadOutlined, DescriptionOutlined, CheckCircle, ArrowDropDown } from '@mui/icons-material';
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

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading("Uploading document...");

    try {
      await uploadFile(file, category);
      toast.success("Uploaded successfully!", { id: toastId });
      onUploadComplete(file.name); 
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
    <Dialog 
      open={isOpen} 
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        className: "!rounded-2xl !p-6 !m-4 !w-full !max-w-md",
        style: { borderRadius: '1rem' } // Ensure border radius sticks
      }}
    >
        <IconButton 
          onClick={handleClose} 
          className="!absolute !top-4 !right-4 !text-gray-400 hover:!text-red-500 !transition-colors"
        >
          <Close className="!w-5 !h-5" />
        </IconButton>

        <h2 className="text-xl font-bold text-[#212121] mb-1 font-sans">Add Knowledge</h2>
        <p className="text-sm text-gray-500 mb-6 font-sans">Upload a contract to analyze.</p>

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
              <DescriptionOutlined className="!w-10 !h-10 mb-2" />
              <span className="font-semibold text-sm truncate max-w-[200px] text-gray-800 font-sans">{file.name}</span>
              <span className="text-xs text-teal-600 mt-1 font-medium font-sans">Click to change file</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-400 group-hover:text-[#21b0be] transition-colors">
              <CloudUploadOutlined className="!w-10 !h-10 mb-2" />
              <span className="font-medium text-sm text-gray-600 font-sans">Click to select PDF</span>
            </div>
          )}
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide font-sans">Document Category</label>
          <div className="relative">
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#21b0be]/50 appearance-none cursor-pointer font-sans"
            >
              <option value="general">General / Others</option>
              <option value="employee_contracts">Employee Contract</option>
              <option value="nda">Non-Disclosure Agreement (NDA)</option>
              <option value="loan_agreements">Loan Agreement</option>
            </select>
            <ArrowDropDown className="!absolute !right-3 !top-1/2 !transform !-translate-y-1/2 pointer-events-none !text-gray-400" />
          </div>
        </div>

        {/* Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          variant="contained"
          fullWidth
          className={`!py-3.5 !rounded-xl !font-bold !normal-case !shadow-sm !transition-all !flex !items-center !justify-center !gap-2
            ${!file || uploading ? '!bg-gray-200 !text-gray-400' : '!bg-[#21b0be] hover:!bg-[#159da9] hover:!shadow-md hover:!-translate-y-0.5'}
          `}
          startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle className="!w-5 !h-5" />}
        >
          {uploading ? 'Uploading...' : 'Confirm Upload'}
        </Button>
    </Dialog>
  );
};