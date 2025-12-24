// src/layout/MainLayout.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NotificationButton, ReminderButton } from '../components/ActionButtons';
import { SettingsButton } from '../components/SettingsModal'; // Kept Settings as modal
import { useAlerts } from '../hooks/useAlerts';
import { Home } from 'lucide-react';

// Import your logos
import versionLogo from "../assets/Version1.png";
import contracttLogo from "../assets/ConTracKt.png";

interface LayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<LayoutProps> = ({ children }) => {

    const location = useLocation();
    const navigate = useNavigate();
    const isWelcomePage = location.pathname === '/';

    // Poll for alert counts (Lightweight)
    const { alerts } = useAlerts();

    const criticalCount = alerts.filter(a => a.days_remaining <= 20).length;
    const reminderCount = alerts.filter(
        a => a.days_remaining > 20 && a.days_remaining <= 60
    ).length;


    return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col relative font-sans text-[#212121] overflow-hidden">

            {/* ================= HEADER ================= */}
            <header className="flex justify-between items-center px-8 py-3 bg-[#F5F5F5]/90 backdrop-blur-sm z-50 border-b border-gray-200/50 sticky top-0 h-[72px]">
                {/* Left: Logos + Home Button */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <img src={versionLogo} alt="Version 1" className="h-8 w-auto object-contain" />
                    </div>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                        <img src={contracttLogo} alt="ConTrackt" className="h-7 w-auto object-contain" />
                    </div>

                    {/* HOME BUTTON (Global) */}
                    {!isWelcomePage && (
                        <>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 bg-white rounded-full text-gray-500 hover:text-[#21b0be] hover:bg-teal-50 shadow-sm border border-gray-200 transition-all hover:-translate-y-0.5"
                                title="Go to Home"
                            >
                                <Home className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>

                {/* Right: Actions (Navigation to Pages) */}
                <div className="flex items-center gap-4">
                    <NotificationButton
                        count={criticalCount}
                        onClick={() => navigate('/alerts')}
                    />
                    <ReminderButton
                        count={reminderCount}
                        onClick={() => navigate('/reminders')}
                    />
                </div>
            </header>

            {/* ================= MAIN CONTENT ================= */}
            <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
                {children}
            </main>

            {/* ================= SLIM FOOTER ================= */}
            <footer className="w-full py-2 bg-white border-t border-gray-200 z-50 shrink-0">
                <div className="max-w-screen-2xl mx-auto px-8 flex justify-between items-center relative">
                    <div className="flex items-center">
                        <SettingsButton />
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 text-[11px] text-gray-400 font-medium">
                        © 2025 ConTrackt. All rights reserved.
                    </div>
                    <div className="w-[100px]"></div>
                </div>
            </footer>
        </div>
    );
};