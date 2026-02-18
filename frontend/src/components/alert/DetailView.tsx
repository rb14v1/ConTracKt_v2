import { Button } from '@mui/material';
import { CalendarToday, Description, OpenInNew } from '@mui/icons-material';
import { clsx } from 'clsx';
import type { Alert } from '../../api/types';

interface AlertDetailViewProps {
    selected: Alert;
    theme: any;
    badgeLabel: string;
    actionTitle: string;
    actionText: string;
}

export const AlertDetailView = ({ selected, theme, badgeLabel, actionTitle, actionText }: AlertDetailViewProps) => (
    <div className="animate-in fade-in duration-300">
        {/* Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2 font-sans">
                        {selected.title}
                    </h2>
                    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border font-sans", theme.badge)}>
                        {badgeLabel}
                    </span>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                    <div>
                        <div className={clsx("text-3xl font-bold tracking-tight font-sans", theme.daysText)}>
                            {selected.days_remaining}
                        </div>
                        <div className="text-xs text-gray-400 uppercase font-bold tracking-wider font-sans">Days Left</div>
                    </div>

                    {selected.file_url && (
                        <Button
                            href={selected.file_url}
                            target="_blank"
                            rel="noreferrer"
                            variant="text"
                            startIcon={<OpenInNew className="!w-3 !h-3" />}
                            className="!inline-flex !items-center !gap-1.5 !text-xs !font-bold !text-[#21b0be] hover:!text-[#188f9b] !bg-cyan-50 hover:!bg-cyan-100 !px-3 !py-1.5 !rounded-md !transition-colors !mt-1 !normal-case"
                        >
                            View Contract
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mt-6 pt-6 border-t border-gray-100 font-sans">
                <div className="flex items-center gap-2 text-gray-600">
                    <CalendarToday className="!w-4 !h-4 !text-[#21b0be]" />
                    <span>Expires: <span className="font-medium text-gray-900">{selected.expiry_date}</span></span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Description className="!w-4 !h-4 !text-[#21b0be]" />
                    <span className="capitalize">Type: <span className="font-medium text-gray-900">{selected.category.replace('_', ' ')}</span></span>
                </div>
            </div>
        </div>

        {/* Action Block */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 font-sans">{actionTitle}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6 font-sans">{actionText}</p>
        </div>
    </div>
);