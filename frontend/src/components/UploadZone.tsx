import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle } from 'lucide-react';
import { uploadFile } from '../api/client';

export const UploadZone = () => {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setStatus('uploading');
    try {
      await uploadFile(e.target.files[0]);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000); // Reset after 3s
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="mb-6">
      <label className={`
        flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors
        ${status === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-blue-50 hover:border-blue-400'}
      `}>
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {status === 'uploading' ? (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          ) : status === 'success' ? (
            <div className="text-center text-green-600">
              <CheckCircle className="w-8 h-8 mx-auto mb-1" />
              <span className="text-xs font-semibold">Uploaded!</span>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 text-gray-400 mb-1" />
              <p className="text-xs text-gray-500 font-medium">Upload PDF</p>
            </>
          )}
        </div>
        <input type="file" className="hidden" accept=".pdf" onChange={handleUpload} disabled={status === 'uploading'} />
      </label>
    </div>
  );
};