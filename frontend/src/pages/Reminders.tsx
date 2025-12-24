// src/pages/Reminders.tsx
import { useState, useEffect } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { useAlerts } from '../hooks/useAlerts';
import type { Alert } from '../api/types';
import { Clock, Calendar, FileText, CheckCircle2, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

export const Reminders = () => {
  const [selected, setSelected] = useState<Alert | null>(null);
  const { alerts: allAlerts, loading } = useAlerts();

  // Filter for reminders (21-60 days)
  const alerts = allAlerts.filter(
    a => a.days_remaining > 20 && a.days_remaining <= 60
  );

  useEffect(() => {
    if (alerts.length > 0 && !selected) {
      setSelected(alerts[0]);
    }
  }, [alerts, selected]);

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-72px)] bg-gray-50 font-sans">

        {/* --- LEFT PANEL: Detailed View --- */}
        <div className="flex-[2] bg-white border-r border-gray-200 p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-2">
              <span className="bg-orange-100 p-2 rounded-lg text-orange-600">
                <Clock className="w-6 h-6" />
              </span>
              Upcoming Renewals
            </h1>
            <p className="text-sm text-gray-500 mb-8 ml-12">
              Contracts expiring in 21-60 days. Plan ahead.
            </p>

            {selected ? (
              <div className="animate-in fade-in duration-300">
                {/* Header Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                        {selected.title}
                      </h2>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                        Upcoming Reminder
                      </span>
                    </div>
                    
                    {/* Header Right Side: Days + Link */}
                    <div className="text-right flex flex-col items-end gap-2">
                      <div>
                        <div className="text-3xl font-bold text-orange-500 tracking-tight">
                            {selected.days_remaining}
                        </div>
                        <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Days Left</div>
                      </div>
                      
                      {/* --- ADDED: Header View Contract Button --- */}
                      {selected.file_url && (
                        <a 
                          href={selected.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#21b0be] hover:text-[#188f9b] bg-cyan-50 px-3 py-1.5 rounded-md transition-colors mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Contract</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-[#21b0be]" />
                      <span>Expires: <span className="font-medium text-gray-900">{selected.expiry_date}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-4 h-4 text-[#21b0be]" />
                      <span className="capitalize">Type: <span className="font-medium text-gray-900">{selected.category.replace('_', ' ')}</span></span>
                    </div>
                  </div>
                </div>

                {/* Action Block */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Early Warning</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    You have over 3 weeks before this contract expires. Now is a good time to review performance metrics and decide on renewal terms.
                  </p>
                  
                  {/* Big Action Button (Secondary location) */}
                  {selected.file_url && (
                    <div className="flex gap-3">
                      <a
                        href={selected.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-[#21b0be] hover:bg-[#159da9] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Contract PDF
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <CheckCircle2 className="w-16 h-16 mb-4 opacity-20" />
                <p>Select a reminder to view details.</p>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT PANEL: List View --- */}
        <div className="flex-1 bg-gray-50/50 border-l border-gray-200 overflow-y-auto min-w-[320px]">
          <div className="p-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
              Upcoming ({alerts.length})
            </h3>
            <div className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => setSelected(alert)}
                  className={clsx(
                    "p-4 rounded-xl border cursor-pointer transition-all group relative overflow-hidden",
                    selected?.id === alert.id
                      ? "bg-white border-orange-200 shadow-md ring-1 ring-orange-100"
                      : "bg-white border-gray-200 hover:border-orange-200 hover:shadow-sm"
                  )}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-300" />

                  <div className="pl-3">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={clsx("font-bold text-sm line-clamp-1", selected?.id === alert.id ? "text-gray-900" : "text-gray-700")}>
                        {alert.title}
                      </h4>
                      
                      <div className="flex items-center gap-2 ml-2">
                        {/* --- ADDED: List Item PDF Icon Button --- */}
                        {alert.file_url && (
                          <a
                            href={alert.file_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()} 
                            className="text-gray-400 hover:text-[#21b0be] hover:bg-cyan-50 p-1.5 rounded-md transition-all"
                            title="Open Contract PDF"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {alert.days_remaining}d
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Due {alert.expiry_date}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {alerts.length === 0 && !loading && (
                <div className="text-center py-10 text-gray-400 text-sm">No upcoming reminders.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};