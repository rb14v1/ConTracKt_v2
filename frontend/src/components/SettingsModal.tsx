// src/components/Modals.tsx
import { useState } from 'react';
import { Dialog, IconButton, Button } from '@mui/material';
import { Close, Settings as SettingsIcon, InfoOutlined } from '@mui/icons-material';

// ==========================================
// SETTINGS BUTTON + MODAL (Only one left)
// ==========================================
export const SettingsButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="text"
        startIcon={<SettingsIcon className="!w-4 !h-4" />}
        className="!flex !items-center !gap-2 !bg-white !px-4 !py-2 !rounded-full !shadow-sm !border !border-gray-200 !text-gray-600 hover:!text-[#21b0be] !text-sm !font-semibold !normal-case !transition-all hover:!shadow-md"
      >
        Settings and Help
      </Button>

      <Dialog 
        open={isOpen} 
        onClose={() => setIsOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
            className: "!rounded-2xl !p-6 !w-full !max-w-lg",
            style: { borderRadius: '1rem' }
        }}
      >
         <IconButton 
            onClick={() => setIsOpen(false)} 
            className="!absolute !top-4 !right-4 !text-gray-400 hover:!text-gray-600"
         >
           <Close className="!w-5 !h-5" />
         </IconButton>
         
         <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 font-sans">
           <InfoOutlined className="!w-5 !h-5 !text-[#21b0be]" /> Help & Instructions
         </h2>

         <div className="space-y-4 text-sm text-gray-600 leading-relaxed font-sans">
           <p>Welcome to <strong>ConTrackt AI</strong>. Here is how to use the system:</p>
           <ul className="space-y-2 list-disc pl-5">
             <li><strong>New Chat:</strong> Click "Start Chatting" to query your knowledge base.</li>
             <li><strong>Alerts & Reminders:</strong> Click the Bell or Clock icons in the header to view critical contract deadlines.</li>
             <li><strong>Contract Library:</strong> Access the full list of contracts via the Welcome page.</li>
           </ul>
           <p className="text-xs text-gray-400 pt-4 border-t border-gray-100 font-sans">
             Version 1.0.3 • Enterprise Edition
           </p>
         </div>
      </Dialog>
    </>
  );
};