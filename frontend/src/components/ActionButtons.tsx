import React from 'react';
import { Bell, Clock } from 'lucide-react';

// --- Notification Button ---
interface NotifBtnProps {
  count: number;
  onClick: () => void;
}

export const NotificationButton: React.FC<NotifBtnProps> = ({ count, onClick }) => (
  <button 
    onClick={onClick}
    className="relative p-3 bg-white rounded-full shadow-sm border border-gray-100 group transition-all hover:-translate-y-0.5 hover:shadow-md"
    title="Critical Alerts"
  >
    <Bell className="w-5 h-5 text-gray-500 group-hover:text-[#21b0be] transition-colors" />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </button>
);

// --- Reminder Button ---
interface ReminderBtnProps {
  count: number;
  onClick: () => void;
}

export const ReminderButton: React.FC<ReminderBtnProps> = ({ count, onClick }) => (
  <button 
    onClick={onClick}
    className="relative p-3 bg-white rounded-full shadow-sm border border-gray-100 group transition-all hover:-translate-y-0.5 hover:shadow-md"
    title="Upcoming Reminders"
  >
    <Clock className="w-5 h-5 text-gray-500 group-hover:text-[#21b0be] transition-colors" />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-400 text-[10px] font-bold text-white border-2 border-white">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </button>
);