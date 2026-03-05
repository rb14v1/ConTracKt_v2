import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { CloudUpload, DriveFileRenameOutline, Description } from "@mui/icons-material"; 
import { MainLayout } from "../layout/MainLayout";
import { FileUploaderModal } from "../components/FileUploaderModal";
import toast, { Toaster } from "react-hot-toast";

export const Welcome = () => {
  const navigate = useNavigate();
  const [displayedText, setDisplayedText] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false); // State for the modal
  
  const tagline = "Quick Contract Insight";

  useEffect(() => {
    let i = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const type = () => {
      if (i <= tagline.length) {
        setDisplayedText(tagline.slice(0, i));
        i++;
        timeoutId = setTimeout(type, 100);
      } else {
        timeoutId = setTimeout(() => {
          i = 0;
          type();
        }, 2000);
      }
    };

    type();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [tagline]);

  return (
    <MainLayout>
      {/* Toast Notification Provider */}
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      <div className="flex-1 flex flex-col items-center justify-center text-center -mt-10 h-full animate-in fade-in duration-500 font-sans">

        <h1 className="text-5xl font-bold text-[#21b0be] mb-6 drop-shadow-sm select-none">
          Welcomes
        </h1>

        <div className="text-xl text-[#757575] font-mono mb-12 min-h-[32px] border-r-4 border-[#7E57C2] pr-2 animate-pulse select-none">
          {displayedText}
        </div>

        {/* --- ACTION BUTTONS --- */}
        <div className="flex flex-wrap justify-center gap-5 z-20 relative px-4">
          
          {/* 1. Upload (Primary Action) */}
          <Button
            onClick={() => setIsUploadOpen(true)}
            variant="contained"
            startIcon={<CloudUpload className="!w-5 !h-5" />}
            className="!flex !items-center !gap-2 !bg-[#21b0be] hover:!bg-[#159da9] !text-white !px-6 !py-3.5 !rounded-xl !font-bold !text-lg !shadow-lg hover:!-translate-y-1 !transition-all active:!scale-95 !cursor-pointer !normal-case"
          >
            Upload Contract
          </Button>

          {/* 2. Chat */}
          <Button
            onClick={() => navigate("/chat")}
            variant="contained"
            startIcon={<DriveFileRenameOutline className="!w-5 !h-5" />}
            className="!flex !items-center !gap-2 !bg-[#21b0be] hover:!bg-[#159da9] !text-white !px-6 !py-3.5 !rounded-xl !font-bold !text-lg !shadow-lg hover:!-translate-y-1 !transition-all active:!scale-95 !cursor-pointer !normal-case"
          >
            Start Chatting
          </Button>

          {/* 3. Library */}
          <Button
            onClick={() => navigate("/library")}
            variant="contained"
            startIcon={<Description className="!w-5 !h-5" />}
            className="!flex !items-center !gap-2 !bg-[#21b0be] hover:!bg-[#159da9] !text-white !px-6 !py-3.5 !rounded-xl !font-bold !text-lg !shadow-lg hover:!-translate-y-1 !transition-all active:!scale-95 !cursor-pointer !normal-case"
          >
            View Contracts
          </Button>
        </div>
      </div>

      {/* --- UPLOAD MODAL --- */}
      <FileUploaderModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={(name) => {
           // We show a toast here, and user stays on Welcome page 
           toast.success(`${name} added to library!`);
        }}
      />
    </MainLayout>
  );
};

export default Welcome;