// src/pages/Welcome.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../layout/MainLayout";

export const Welcome = () => {
  const navigate = useNavigate();
  const [displayedText, setDisplayedText] = useState("");
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
      <div className="flex-1 flex flex-col items-center justify-center text-center -mt-10 h-full">

        <h1 className="text-5xl font-bold text-[#21b0be] mb-6 drop-shadow-sm select-none">
          Welcome
        </h1>

        <div className="text-xl text-[#757575] font-mono mb-12 min-h-[32px] border-r-4 border-[#7E57C2] pr-2 animate-pulse select-none">
          {displayedText}
        </div>

        <div className="flex gap-6 z-20 relative">
          <button
            onClick={() => navigate("/chat")}
            className="bg-[#21b0be] hover:bg-[#159da9] text-white px-8 py-3.5 rounded-xl font-bold text-lg shadow-lg hover:-translate-y-1 transition-all active:scale-95 cursor-pointer"
          >
            Start Chatting
          </button>

          <button
            onClick={() => navigate("/library")}
            className="bg-[#21b0be] hover:bg-[#159da9] text-white px-8 py-3.5 rounded-xl font-bold text-lg shadow-lg hover:-translate-y-1 transition-all active:scale-95 cursor-pointer"
          >
            View all Contracts
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Welcome;